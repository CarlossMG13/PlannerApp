import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/lib/responses";

async function getVendorProfile(userId: string) {
  return prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true, categoryId: true },
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const vendor = await getVendorProfile(userId);
    if (!vendor) return forbidden("No eres un proveedor");

    const services = await prisma.vendorService.findMany({
      where: { vendorId: vendor.id },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        currency: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok({ services });
  } catch (err) {
    console.error("[GET /api/vendors/me/services]", (err as Error).message);
    return serverError();
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const vendor = await getVendorProfile(userId);
    if (!vendor) return forbidden("No eres un proveedor");

    const body = await req.json();
    const { name, description, basePrice, currency = "MXN", categoryId } = body;

    if (!name || basePrice == null) return badRequest("name y basePrice son requeridos");

    const service = await prisma.vendorService.create({
      data: {
        vendorId: vendor.id,
        categoryId: categoryId ?? vendor.categoryId,
        name,
        description: description ?? null,
        basePrice,
        currency,
      },
      select: { id: true, name: true, description: true, basePrice: true, currency: true },
    });

    return ok({ service }, 201);
  } catch (err) {
    console.error("[POST /api/vendors/me/services]", (err as Error).message);
    return serverError();
  }
}
