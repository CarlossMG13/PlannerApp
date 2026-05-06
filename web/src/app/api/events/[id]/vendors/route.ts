import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;

async function resolveAccess(clerkId: string, eventId: string) {
  const [user, event] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId },
      select: {
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
      },
    }),
    prisma.event.findUnique({
      where: { id: eventId },
      select: { clientId: true, planners: { select: { plannerId: true } } },
    }),
  ]);

  if (!user || !event) return null;

  const isOwner = user.clientProfile?.id === event.clientId;
  const isPlanner =
    user.plannerProfile != null &&
    event.planners.some((p) => p.plannerId === user.plannerProfile!.id);
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isPlanner && !isAdmin) return null;
  return { user, event };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: eventId } = await params;
  if (!CUID_REGEX.test(eventId)) return badRequest("ID de evento inválido");

  try {
    const access = await resolveAccess(userId, eventId);
    if (!access) return forbidden();

    const vendors = await prisma.eventVendor.findMany({
      where: { eventId },
      select: {
        id: true,
        status: true,
        agreedPrice: true,
        notes: true,
        assignedAt: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: { select: { name: true, icon: true } },
          },
        },
        service: { select: { id: true, name: true, basePrice: true } },
      },
      orderBy: { assignedAt: "asc" },
    });

    return ok({ vendors });
  } catch (err) {
    console.error("[GET /api/events/:id/vendors]", (err as Error).message);
    return serverError();
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id: eventId } = await params;
  if (!CUID_REGEX.test(eventId)) return badRequest("ID de evento inválido");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body inválido");
  }

  const { vendorId, serviceId, agreedPrice, notes } = body;

  if (!vendorId || typeof vendorId !== "string" || !CUID_REGEX.test(vendorId)) {
    return badRequest("vendorId inválido");
  }
  if (serviceId !== undefined && (typeof serviceId !== "string" || !CUID_REGEX.test(serviceId))) {
    return badRequest("serviceId inválido");
  }

  let parsedPrice: number | undefined;
  if (agreedPrice !== undefined && agreedPrice !== null) {
    parsedPrice = Number(agreedPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) return badRequest("Precio inválido");
  }

  try {
    const access = await resolveAccess(userId, eventId);
    if (!access) return forbidden();

    const assignment = await prisma.eventVendor.create({
      data: {
        eventId,
        vendorId: vendorId as string,
        serviceId: (serviceId as string | undefined) ?? null,
        agreedPrice: parsedPrice,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      },
      select: {
        id: true,
        status: true,
        agreedPrice: true,
        notes: true,
        assignedAt: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: { select: { name: true, icon: true } },
          },
        },
        service: { select: { id: true, name: true, basePrice: true } },
      },
    });

    return ok({ assignment }, 201);
  } catch (err: any) {
    if (err.code === "P2002") return badRequest("Este proveedor ya está asignado al evento");
    console.error("[POST /api/events/:id/vendors]", err.message);
    return serverError();
  }
}
