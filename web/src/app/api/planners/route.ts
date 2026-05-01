import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, serverError } from "@/lib/responses";

export async function GET(_req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const planners = await prisma.plannerProfile.findMany({
      select: {
        id: true,
        businessName: true,
        identityType: true,
        specialties: true,
        coverageCities: true,
        rating: true,
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { user: { name: "asc" } },
    });

    return ok({ planners });
  } catch (err) {
    console.error("[GET /api/planners]", (err as Error).message);
    return serverError();
  }
}
