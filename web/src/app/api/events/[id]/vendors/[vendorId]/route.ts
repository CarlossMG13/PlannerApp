import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;
const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; vendorId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: eventId, vendorId } = await params;
  if (!CUID_REGEX.test(eventId)) return badRequest("ID de evento inválido");
  if (!CUID_REGEX.test(vendorId)) return badRequest("ID de proveedor inválido");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  try {
    const assignment = await prisma.eventVendor.findUnique({
      where: { eventId_vendorId: { eventId, vendorId } },
      select: {
        event: {
          select: {
            clientId: true,
            planners: { select: { plannerId: true } },
          },
        },
      },
    });
    if (!assignment) return notFound("Asignación no encontrada");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
      },
    });
    if (!user) return unauthorized();

    const isOwner = user.clientProfile?.id === assignment.event.clientId;
    const isPlanner =
      user.plannerProfile != null &&
      assignment.event.planners.some(
        (p) => p.plannerId === user.plannerProfile!.id
      );
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

    if ("agreedPrice" in body) {
      if (body.agreedPrice === null) {
        updateData.agreedPrice = null;
      } else {
        const price = Number(body.agreedPrice);
        if (isNaN(price) || price < 0) return badRequest("Precio inválido");
        updateData.agreedPrice = price;
      }
    }

    if ("notes" in body) {
      updateData.notes =
        typeof body.notes === "string" && body.notes.trim()
          ? body.notes.trim()
          : null;
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("Sin campos para actualizar");
    }

    const updated = await prisma.eventVendor.update({
      where: { eventId_vendorId: { eventId, vendorId } },
      data: updateData,
      select: {
        id: true,
        status: true,
        agreedPrice: true,
        notes: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    return ok({ assignment: updated });
  } catch (err: any) {
    if (err.code === "P2025") return notFound("Asignación no encontrada");
    console.error("[PATCH /api/events/:id/vendors/:vendorId]", err.message);
    return serverError();
  }
}
