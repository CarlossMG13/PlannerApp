import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: eventId } = await params;
  if (!CUID_REGEX.test(eventId)) return badRequest("ID de evento inválido");

  let body: { plannerId?: unknown; isLead?: unknown };
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  const { plannerId, isLead = false } = body;

  if (!plannerId || typeof plannerId !== "string") return badRequest("plannerId es requerido");
  if (!CUID_REGEX.test(plannerId)) return badRequest("plannerId inválido");

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, clientProfile: { select: { id: true } } },
    });
    if (!user) return unauthorized();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { clientId: true },
    });
    if (!event) return notFound("Evento no encontrado");

    const isOwner = user.clientProfile?.id === event.clientId;
    if (!isOwner && user.role !== "ADMIN") return forbidden();

    const planner = await prisma.plannerProfile.findUnique({ where: { id: plannerId } });
    if (!planner) return notFound("Planner no encontrado");

    const entry = await prisma.eventPlanner.create({
      data: { eventId, plannerId, isLead: Boolean(isLead) },
      include: {
        planner: {
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
      },
    });

    return ok({ eventPlanner: entry }, 201);
  } catch (err: any) {
    if (err.code === "P2002") return badRequest("Este planner ya está asignado al evento");
    console.error("[POST /api/events/:id/planners]", err.message);
    return serverError();
  }
}
