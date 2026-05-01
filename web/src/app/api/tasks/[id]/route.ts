import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;
const VALID_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: taskId } = await params;
  if (!CUID_REGEX.test(taskId)) return badRequest("ID de tarea inválido");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        event: {
          select: {
            clientId: true,
            planners: { select: { plannerId: true } },
          },
        },
      },
    });
    if (!task) return notFound("Tarea no encontrada");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
      },
    });
    if (!user) return unauthorized();

    const isOwner = user.clientProfile?.id === task.event.clientId;
    const isPlanner =
      user.plannerProfile != null &&
      task.event.planners.some((p) => p.plannerId === user.plannerProfile!.id);
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isPlanner && !isAdmin) return forbidden();

    const updateData: Record<string, unknown> = {};

    if ("status" in body) {
      if (
        typeof body.status !== "string" ||
        !(VALID_STATUSES as readonly string[]).includes(body.status)
      ) {
        return badRequest("Status inválido");
      }
      updateData.status = body.status;
    }

    if ("title" in body) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return badRequest("Título inválido");
      }
      updateData.title = body.title.trim();
    }

    if ("description" in body) {
      updateData.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }

    if ("priority" in body) {
      if (
        typeof body.priority !== "string" ||
        !(VALID_PRIORITIES as readonly string[]).includes(body.priority)
      ) {
        return badRequest("Prioridad inválida");
      }
      updateData.priority = body.priority;
    }

    if ("dueDate" in body) {
      if (body.dueDate === null) {
        updateData.dueDate = null;
      } else if (typeof body.dueDate === "string") {
        const d = new Date(body.dueDate);
        if (isNaN(d.getTime())) return badRequest("Fecha inválida");
        updateData.dueDate = d;
      } else {
        return badRequest("Fecha inválida");
      }
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("Sin campos para actualizar");
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return ok({ task: updated });
  } catch (err: any) {
    if (err.code === "P2025") return notFound("Tarea no encontrada");
    console.error("[PATCH /api/tasks/:id]", err.message);
    return serverError();
  }
}
