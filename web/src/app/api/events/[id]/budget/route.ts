import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/lib/responses";

const CUID_REGEX = /^c[a-z0-9]{24}$/i;
const VALID_STATUSES = ["ESTIMATED", "CONFIRMED", "PAID"] as const;

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

    const [items, event] = await Promise.all([
      prisma.budgetItem.findMany({
        where: { eventId },
        select: {
          id: true,
          category: true,
          description: true,
          estimatedAmount: true,
          actualAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.event.findUnique({
        where: { id: eventId },
        select: { totalBudget: true, currency: true },
      }),
    ]);

    const totalEstimated = items.reduce(
      (sum, i) => sum + Number(i.estimatedAmount),
      0
    );
    const totalActual = items.reduce(
      (sum, i) => sum + Number(i.actualAmount ?? 0),
      0
    );

    return ok({
      items,
      summary: {
        totalBudget: event?.totalBudget ? Number(event.totalBudget) : null,
        currency: event?.currency ?? "MXN",
        totalEstimated,
        totalActual,
      },
    });
  } catch (err) {
    console.error("[GET /api/events/:id/budget]", (err as Error).message);
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

  const { category, description, estimatedAmount, status = "ESTIMATED" } = body;

  if (!category || typeof category !== "string" || !category.trim()) {
    return badRequest("La categoría es requerida");
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return badRequest("La descripción es requerida");
  }
  if (
    estimatedAmount === undefined ||
    estimatedAmount === null ||
    isNaN(Number(estimatedAmount)) ||
    Number(estimatedAmount) < 0
  ) {
    return badRequest("El monto estimado es requerido y debe ser positivo");
  }
  if (
    typeof status !== "string" ||
    !(VALID_STATUSES as readonly string[]).includes(status)
  ) {
    return badRequest("Status inválido");
  }

  try {
    const access = await resolveAccess(userId, eventId);
    if (!access) return forbidden();

    const item = await prisma.budgetItem.create({
      data: {
        eventId,
        category: category.trim(),
        description: description.trim(),
        estimatedAmount: Number(estimatedAmount),
        status: status as (typeof VALID_STATUSES)[number],
      },
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

    return ok({ item }, 201);
  } catch (err) {
    console.error("[POST /api/events/:id/budget]", (err as Error).message);
    return serverError();
  }
}
