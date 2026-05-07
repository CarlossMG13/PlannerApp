import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

async function resolveAccess(clerkId: string, eventId: string) {
  const [user, event] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
        vendorProfile: { select: { id: true } },
      },
    }),
    prisma.event.findUnique({
      where: { id: eventId },
      select: {
        clientId: true,
        planners: { select: { plannerId: true } },
        vendors: { select: { vendorId: true } },
      },
    }),
  ]);

  if (!user || !event) return null;

  const isOwner = user.clientProfile?.id === event.clientId;
  const isPlanner =
    user.plannerProfile != null &&
    event.planners.some((p) => p.plannerId === user.plannerProfile!.id);
  const isVendor =
    user.vendorProfile != null &&
    event.vendors.some((v) => v.vendorId === user.vendorProfile!.id);
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isPlanner && !isVendor && !isAdmin) return null;
  return { user, event, isVendor };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: eventId } = await params;
  if (!CUID_REGEX.test(eventId)) return badRequest("ID de evento inválido");

  try {
    const access = await resolveAccess(userId, eventId);
    if (!access) return forbidden();

    const tasks = await prisma.task.findMany({
      where: {
        eventId,
        // Vendors only see their own assigned tasks
        ...(access.isVendor ? { assignedToId: access.user.id } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        priority: true,
        createdAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
    });

    return ok({ tasks });
  } catch (err) {
    console.error("[GET /api/events/:id/tasks]", (err as Error).message);
    return serverError();
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: eventId } = await params;
  if (!CUID_REGEX.test(eventId)) return badRequest("ID de evento inválido");

  let body: { title?: unknown; description?: unknown; priority?: unknown; dueDate?: unknown; assignedToId?: unknown };
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  const { title, description, priority = "MEDIUM", dueDate, assignedToId } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return badRequest("El título es requerido");
  }
  if (typeof priority !== "string" || !(VALID_PRIORITIES as readonly string[]).includes(priority)) {
    return badRequest("Prioridad inválida");
  }
  if (assignedToId !== undefined && (typeof assignedToId !== "string" || !assignedToId)) {
    return badRequest("assignedToId inválido");
  }

  let parsedDate: Date | undefined;
  if (dueDate !== undefined) {
    if (typeof dueDate !== "string") return badRequest("Fecha inválida");
    parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) return badRequest("Fecha inválida");
  }

  try {
    const access = await resolveAccess(userId, eventId);
    if (!access) return forbidden();

    const task = await prisma.task.create({
      data: {
        eventId,
        title: title.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        priority: priority as (typeof VALID_PRIORITIES)[number],
        dueDate: parsedDate,
        assignedToId: typeof assignedToId === "string" ? assignedToId : null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        priority: true,
        createdAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return ok({ task }, 201);
  } catch (err) {
    console.error("[POST /api/events/:id/tasks]", (err as Error).message);
    return serverError();
  }
}
