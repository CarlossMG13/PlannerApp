import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/responses";

async function getOwnedService(userId: string, serviceId: string) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!vendor) return null;

  const service = await prisma.vendorService.findFirst({
    where: { id: serviceId, vendorId: vendor.id },
  });
  return service;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id } = await params;

  try {
    const service = await getOwnedService(userId, id);
    if (!service) return notFound("Servicio no encontrado");

    const body = await req.json();
    const { name, description, basePrice, currency } = body;

    const updated = await prisma.vendorService.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice }),
        ...(currency !== undefined && { currency }),
      },
      select: { id: true, name: true, description: true, basePrice: true, currency: true },
    });

    return ok({ service: updated });
  } catch (err) {
    console.error("[PATCH /api/vendors/me/services/:id]", (err as Error).message);
    return serverError();
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id } = await params;

  try {
    const service = await getOwnedService(userId, id);
    if (!service) return notFound("Servicio no encontrado");

    await prisma.vendorService.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/vendors/me/services/:id]", (err as Error).message);
    return serverError();
  }
}
