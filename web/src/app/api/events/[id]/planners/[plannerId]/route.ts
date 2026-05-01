import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; plannerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: eventId, plannerId } = await params;
  if (!CUID_REGEX.test(eventId)) return badRequest("ID de evento inválido");
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

    await prisma.eventPlanner.delete({
      where: { eventId_plannerId: { eventId, plannerId } },
    });

    return ok({ message: "Planner desvinculado del evento" });
  } catch (err: any) {
    if (err.code === "P2025") return notFound("Asignación no encontrada");
    console.error("[DELETE /api/events/:id/planners/:plannerId]", err.message);
    return serverError();
  }
}
