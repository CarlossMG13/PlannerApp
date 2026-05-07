import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest, serverError } from "@/lib/responses";
import { TOOL_DEFINITIONS, executeTool, ProfileCard } from "@/lib/assistant-tools";

// ─── Rate limiting (in-memory, resets on deploy) ─────────────────────────────
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const hits = (rateLimitMap.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) return false;
  hits.push(now);
  rateLimitMap.set(userId, hits);
  return true;
}

// ─── System prompts by role ───────────────────────────────────────────────────
function buildSystemPrompt(role: string, userName: string, preferences: Record<string, unknown> = {}) {
  const roleObjective: Record<string, string> = {
    PLANNER: "encontrar y cotizar proveedores para sus eventos, y gestionar la planificación operativa",
    CLIENT:  "encontrar al planner ideal y entender sus opciones según presupuesto y tipo de evento",
    VENDOR:  "optimizar su agenda, pricing y calidad de servicio basándose en su historial de Plania",
  };

  const objective = roleObjective[role] ?? roleObjective.CLIENT;
  const roleName = { PLANNER: "planners", CLIENT: "clientes", VENDOR: "proveedores" }[role] ?? "usuarios";

  const prefLines = Object.keys(preferences).length > 0
    ? `- Preferencias guardadas: ${JSON.stringify(preferences)}`
    : "";

  return `Eres el asistente de Plania, una plataforma de gestión de eventos en México.
Ayudas a ${roleName} a ${objective}.

Contexto del usuario:
- Nombre: ${userName}
- Rol: ${role}
- Zona horaria: America/Mexico_City
${prefLines}

Instrucciones:
- Responde siempre en español, tono profesional pero cercano.
- Sé conciso. Máximo 2 oraciones de texto + resultados estructurados.
- Si el usuario no provee suficiente información para hacer una búsqueda, pregunta SOLO lo estrictamente necesario (1 pregunta a la vez).
- No inventes datos. Si un tool call devuelve lista vacía, dilo claramente y sugiere ampliar los criterios.
- Nunca expongas IDs internos, SQL ni detalles técnicos de la base de datos.
- No hagas más de 2 tool calls por turno de conversación.
- Cuando uses searchPlanners o searchVendors y haya resultados, escribe SOLO: 1 oración de intro (ej. "Encontré 2 planners que se ajustan a tu perfil:") y 1-2 oraciones de cierre o sugerencia. NO listes los campos con bullets — la app los muestra como tarjetas visuales automáticamente.
- Si la pregunta está fuera del scope de Plania, redirige: "Soy el asistente de Plania — puedo ayudarte a encontrar proveedores o planners para tu evento."`;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[assistant] ANTHROPIC_API_KEY no configurada");
    return serverError("El asistente no está disponible en este momento");
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) return unauthorized();

  if (!checkRateLimit(clerkId)) {
    return new Response(JSON.stringify({ error: "Has alcanzado el límite de consultas por hora. Intenta más tarde." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { messages?: unknown; eventId?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return badRequest("messages es requerido");
  }

  const messages = body.messages as Array<{ role: "user" | "assistant"; content: string }>;
  if (messages.length > 20) return badRequest("Demasiados mensajes en el historial");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      name: true,
      role: true,
      vendorProfile: { select: { id: true } },
    },
  });
  if (!user) return unauthorized();

  const systemPrompt = buildSystemPrompt(user.role, user.name);

  const startedAt = Date.now();
  let toolsCalledCount = 0;
  let toolsCalled: string[] = [];
  const collectedCards: ProfileCard[] = [];

  try {
    const anthropic = new Anthropic({ apiKey });

    let currentMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // If eventId provided, append context hint as system info
    if (body.eventId) {
      const lastUser = currentMessages[currentMessages.length - 1];
      if (lastUser?.role === "user" && typeof lastUser.content === "string") {
        lastUser.content = `[Contexto: el usuario está viendo el evento ID ${body.eventId}]\n${lastUser.content}`;
      }
    }

    let response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      tools: TOOL_DEFINITIONS as unknown as Anthropic.Messages.Tool[],
      messages: currentMessages,
    });

    // Tool call loop — max 2 tool calls per turn
    while (response.stop_reason === "tool_use" && toolsCalledCount < 2) {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        toolsCalledCount++;
        toolsCalled.push(block.name);
        const result = await executeTool(block.name, block.input as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result.display });
        if (result.cards) collectedCards.push(...result.cards);
      }

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];

      response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS as unknown as Anthropic.Messages.Tool[],
        messages: currentMessages,
      });
    }

    const finalText = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // Structured logging (no message content for privacy)
    console.log(JSON.stringify({
      event: "assistant_query",
      userId: user.id,
      role: user.role,
      queryLength: messages[messages.length - 1]?.content?.length ?? 0,
      toolsCalled,
      responseLength: finalText.length,
      latencyMs: Date.now() - startedAt,
      model: "claude-haiku-4-5-20251001",
    }));

    return ok({
      message: finalText,
      cards: collectedCards.length > 0 ? collectedCards : undefined,
    });
  } catch (err) {
    console.error("[assistant/chat]", (err as Error).message);
    return serverError();
  }
}
