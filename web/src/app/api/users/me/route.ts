import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, serverError } from "@/lib/responses";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        clientProfile: true,
        plannerProfile: true,
        vendorProfile: {
          include: { category: true },
        },
      },
    });

    if (!user) return notFound("Usuario no encontrado");

    const profile =
      user.clientProfile ?? user.plannerProfile ?? user.vendorProfile ?? null;

    return ok({ user, profile });
  } catch (err) {
    console.error("[users/me] Error:", err);
    return serverError();
  }
}
