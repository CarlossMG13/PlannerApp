import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id } = await params;

  if (!CUID_REGEX.test(id)) return badRequest("ID de evento inválido");

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
        vendorProfile: { select: { id: true } },
      },
    });

    if (!user) return notFound("Evento no encontrado");

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        planners: {
          include: {
            planner: {
              include: {
                user: { select: { name: true, avatarUrl: true } },
              },
            },
          },
        },
        vendors: {
          include: {
            vendor: {
              include: {
                user: { select: { name: true, avatarUrl: true } },
                category: { select: { name: true, icon: true } },
              },
            },
            service: { select: { name: true, basePrice: true, currency: true } },
          },
        },
        tasks: { orderBy: { dueDate: "asc" } },
        budgetItems: true,
        _count: { select: { documents: true } },
      },
    });

    const isClient = user.clientProfile?.id === event?.clientId;
    const isPlanner = event?.planners.some((p) => p.plannerId === user.plannerProfile?.id);
    const isVendor = event?.vendors.some((v) => v.vendorId === user.vendorProfile?.id);
    const isAdmin = user.role === "ADMIN";

    // Return 404 for both "not found" and "no access" to prevent IDOR enumeration
    if (!event || (!isClient && !isPlanner && !isVendor && !isAdmin)) {
      return notFound("Evento no encontrado");
    }

    return ok({ event });
  } catch (err) {
    console.error("[GET /api/events/:id] error:", (err as Error).message);
    return serverError();
  }
}
