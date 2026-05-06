import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;
const VALID_STATUSES = ["ESTIMATED", "CONFIRMED", "PAID"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: itemId } = await params;
  if (!CUID_REGEX.test(itemId)) return badRequest("ID de ítem inválido");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  try {
    const item = await prisma.budgetItem.findUnique({
      where: { id: itemId },
      select: {
        event: {
          select: {
            clientId: true,
            planners: { select: { plannerId: true } },
          },
        },
      },
    });
    if (!item) return notFound("Ítem no encontrado");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
      },
    });
    if (!user) return unauthorized();

    const isOwner = user.clientProfile?.id === item.event.clientId;
    const isPlanner =
      user.plannerProfile != null &&
      item.event.planners.some((p) => p.plannerId === user.plannerProfile!.id);
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isPlanner && !isAdmin) return forbidden();

    const updateData: Record<string, unknown> = {};

    if ("category" in body) {
      if (typeof body.category !== "string" || !body.category.trim()) {
        return badRequest("Categoría inválida");
      }
      updateData.category = body.category.trim();
    }

    if ("description" in body) {
      if (typeof body.description !== "string" || !body.description.trim()) {
        return badRequest("Descripción inválida");
      }
      updateData.description = body.description.trim();
    }

    if ("estimatedAmount" in body) {
      if (isNaN(Number(body.estimatedAmount)) || Number(body.estimatedAmount) < 0) {
        return badRequest("Monto estimado inválido");
      }
      updateData.estimatedAmount = Number(body.estimatedAmount);
    }

    if ("actualAmount" in body) {
      if (body.actualAmount === null) {
        updateData.actualAmount = null;
      } else if (!isNaN(Number(body.actualAmount)) && Number(body.actualAmount) >= 0) {
        updateData.actualAmount = Number(body.actualAmount);
      } else {
        return badRequest("Monto real inválido");
      }
    }

    if ("status" in body) {
      if (
        typeof body.status !== "string" ||
        !(VALID_STATUSES as readonly string[]).includes(body.status)
      ) {
        return badRequest("Status inválido");
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("Sin campos para actualizar");
    }

    const updated = await prisma.budgetItem.update({
      where: { id: itemId },
      data: updateData,
      select: {
        id: true,
        category: true,
        description: true,
        estimatedAmount: true,
        actualAmount: true,
        status: true,
        createdAt: true,
      },
    });

    return ok({ item: updated });
  } catch (err: any) {
    if (err.code === "P2025") return notFound("Ítem no encontrado");
    console.error("[PATCH /api/budget/:id]", err.message);
    return serverError();
  }
}
