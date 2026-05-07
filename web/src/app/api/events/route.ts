import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/responses";
import type { Prisma } from "@prisma/client";

const EVENT_PAGE_SIZE = 50;

type EventListItem = Prisma.EventGetPayload<{
  select: {
    id: true;
    title: true;
    type: true;
    status: true;
    eventDate: true;
    venueName: true;
    guestCount: true;
    totalBudget: true;
    currency: true;
  };
}>;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

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

    if (!user) return notFound("Usuario no encontrado");

    let events: unknown[] = [];

    if (user.role === "CLIENT" && user.clientProfile) {
      events = await prisma.event.findMany({
        where: { clientId: user.clientProfile.id },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          eventDate: true,
          venueName: true,
          guestCount: true,
          totalBudget: true,
          currency: true,
          planners: {
            select: {
              isLead: true,
              planner: {
                select: { user: { select: { name: true, avatarUrl: true } } },
              },
            },
          },
          _count: { select: { tasks: true, vendors: true } },
        },
        orderBy: { eventDate: "asc" },
        take: EVENT_PAGE_SIZE,
      });
    } else if (user.role === "PLANNER" && user.plannerProfile) {
      events = await prisma.event.findMany({
        where: { planners: { some: { plannerId: user.plannerProfile.id } } },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          eventDate: true,
          venueName: true,
          guestCount: true,
          totalBudget: true,
          currency: true,
          client: {
            select: { user: { select: { name: true, avatarUrl: true } } },
          },
          _count: { select: { tasks: true } },
        },
        orderBy: { eventDate: "asc" },
        take: EVENT_PAGE_SIZE,
      });
    } else if (user.role === "VENDOR" && user.vendorProfile) {
      events = await prisma.event.findMany({
        where: { vendors: { some: { vendorId: user.vendorProfile.id } } },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          eventDate: true,
          venueName: true,
          guestCount: true,
          currency: true,
          client: {
            select: { user: { select: { name: true, avatarUrl: true } } },
          },
          vendors: {
            where: { vendorId: user.vendorProfile.id },
            select: { status: true, agreedPrice: true },
          },
        },
        orderBy: { eventDate: "asc" },
        take: EVENT_PAGE_SIZE,
      });
    }

    return ok({ events });
  } catch (err) {
    console.error("[GET /api/events] error:", (err as Error).message);
    return serverError();
  }
}

const VALID_TYPES = ["WEDDING", "CORPORATE", "BIRTHDAY", "SOCIAL", "OTHER"] as const;
type ValidType = (typeof VALID_TYPES)[number];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Cuerpo de solicitud inválido");

    const { title, type, eventDate, venueName, venueAddress, guestCount, totalBudget, currency } = body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return badRequest("El título es requerido (mínimo 2 caracteres)");
    }
    if (!type || !VALID_TYPES.includes(type as ValidType)) {
      return badRequest("Tipo de evento inválido");
    }
    if (!eventDate || isNaN(Date.parse(eventDate))) {
      return badRequest("Fecha de evento inválida");
    }
    const parsedDate = new Date(eventDate);
    if (parsedDate < new Date()) {
      return badRequest("La fecha del evento debe ser futura");
    }
    if (guestCount !== undefined && guestCount !== null) {
      const n = Number(guestCount);
      if (!Number.isInteger(n) || n < 1 || n > 100000) {
        return badRequest("Número de invitados inválido");
      }
    }
    if (totalBudget !== undefined && totalBudget !== null) {
      const b = Number(totalBudget);
      if (isNaN(b) || b < 0) {
        return badRequest("Presupuesto inválido");
      }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
      },
    });

    if (!user) return notFound("Usuario no encontrado");
    const isClient = user.role === "CLIENT" && !!user.clientProfile;
    const isPlanner = user.role === "PLANNER" && !!user.plannerProfile;
    if (!isClient && !isPlanner) {
      return forbidden("Solo clientes y planners pueden crear eventos");
    }

    const eventData = {
      title: title.trim(),
      type: type as ValidType,
      eventDate: parsedDate,
      status: "DRAFT" as const,
      clientId: isClient ? user.clientProfile!.id : null,
      venueName: venueName?.trim() || null,
      venueAddress: venueAddress?.trim() || null,
      guestCount: guestCount ? Number(guestCount) : null,
      totalBudget: totalBudget ? Number(totalBudget) : null,
      currency: typeof currency === "string" && currency.length === 3 ? currency.toUpperCase() : "MXN",
    };

    const event = await prisma.event.create({
      data: isPlanner
        ? {
            ...eventData,
            planners: {
              create: { plannerId: user.plannerProfile!.id, isLead: true },
            },
          }
        : eventData,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        eventDate: true,
        venueName: true,
        guestCount: true,
        totalBudget: true,
        currency: true,
      },
    });

    return ok({ event }, 201);
  } catch (err) {
    console.error("[POST /api/events] error:", (err as Error).message);
    return serverError();
  }
}
