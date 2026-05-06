import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, serverError } from "@/lib/responses";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  try {
    const vendors = await prisma.vendorProfile.findMany({
      where: categoryId ? { categoryId } : undefined,
      select: {
        id: true,
        businessName: true,
        bio: true,
        rating: true,
        category: { select: { id: true, name: true, icon: true } },
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            currency: true,
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { businessName: "asc" },
    });

    return ok({ vendors });
  } catch (err) {
    console.error("[GET /api/vendors]", (err as Error).message);
    return serverError();
  }
}
