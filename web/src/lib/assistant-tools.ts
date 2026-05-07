import { prisma } from "@/lib/prisma";

// ─── Tool Definitions for Claude ────────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: "searchVendors",
    description: "Busca proveedores disponibles según criterios del evento",
    input_schema: {
      type: "object" as const,
      properties: {
        capacity: { type: "integer", description: "Número de invitados" },
        budget: { type: "number", description: "Presupuesto total en MXN" },
        theme: { type: "string", description: "Tipo de evento: corporativo, boda, cumpleaños, etc." },
        category: { type: "string", description: "Categoría: catering, fotografía, música, etc." },
      },
      required: ["capacity", "budget"],
    },
  },
  {
    name: "searchPlanners",
    description: "Busca planners disponibles para el evento del cliente",
    input_schema: {
      type: "object" as const,
      properties: {
        eventType: { type: "string", description: "Tipo de evento: boda, corporativo, cumpleaños, etc." },
        guestCount: { type: "integer", description: "Número de invitados" },
        budget: { type: "number", description: "Presupuesto total en MXN" },
      },
      required: ["eventType", "guestCount", "budget"],
    },
  },
  {
    name: "getVendorHistory",
    description: "Obtiene historial de servicios y métricas del proveedor autenticado",
    input_schema: {
      type: "object" as const,
      properties: {
        vendorId: { type: "string", description: "ID del VendorProfile" },
      },
      required: ["vendorId"],
    },
  },
  {
    name: "projectRating",
    description: "Proyecta el rating del proveedor según distintas cargas semanales de eventos",
    input_schema: {
      type: "object" as const,
      properties: {
        vendorId: { type: "string" },
        weeklyLoad: {
          type: "array",
          items: { type: "integer" },
          description: "Cargas a proyectar, ej: [2, 3, 4, 5]",
        },
      },
      required: ["vendorId", "weeklyLoad"],
    },
  },
  {
    name: "getEventContext",
    description: "Obtiene el contexto del evento activo del usuario (tipo, invitados, presupuesto)",
    input_schema: {
      type: "object" as const,
      properties: {
        userId: { type: "string", description: "DB user id (not clerkId)" },
      },
      required: ["userId"],
    },
  },
] as const;

// ─── Tool Execution ──────────────────────────────────────────────────────────

function scoreVendor(budget: number, capacity: number, basePrice: number, experience: number): number {
  const priceRatio = basePrice / budget;
  const priceFit = priceRatio <= 0.5 ? 1 : Math.max(0, 1 - (priceRatio - 0.5) * 2);
  const expScore = Math.min(experience / 10, 1);
  return Math.round((priceFit * 0.6 + expScore * 0.4) * 100);
}

function scorePlanner(budget: number, guestCount: number, experience: number, budgetRange: string | null): number {
  let budgetFit = 0.5;
  if (budgetRange) {
    const [minStr, maxStr] = budgetRange.split("-");
    const min = parseInt(minStr ?? "0");
    const max = parseInt(maxStr ?? "999999");
    if (budget >= min && budget <= max) budgetFit = 1;
    else if (budget >= min * 0.8 && budget <= max * 1.2) budgetFit = 0.7;
  }
  const expScore = Math.min(experience / 10, 1);
  return Math.round((budgetFit * 0.5 + expScore * 0.5) * 100);
}

export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const truncate = (obj: unknown) => {
    const str = JSON.stringify(obj);
    return str.length > 2400 ? str.slice(0, 2400) + "…" : str;
  };

  try {
    if (name === "searchVendors") {
      const { capacity, budget, theme, category } = input as {
        capacity: number; budget: number; theme?: string; category?: string;
      };

      const vendors = await prisma.vendorProfile.findMany({
        where: category
          ? { category: { name: { contains: category, mode: "insensitive" } } }
          : undefined,
        select: {
          id: true,
          businessName: true,
          bio: true,
          rating: true,
          category: { select: { name: true } },
          services: {
            select: { name: true, basePrice: true, currency: true },
            orderBy: { basePrice: "asc" },
            take: 1,
          },
          _count: { select: { events: true } },
        },
        take: 10,
      });

      const results = vendors
        .filter((v) => v.services.length > 0)
        .map((v) => {
          const svc = v.services[0];
          const price = Number(svc.basePrice);
          const score = scoreVendor(budget, capacity, price, v._count.events);
          return { score, vendor: v, price };
        })
        .filter((r) => r.score >= 40)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ score, vendor, price }) => ({
          businessName: vendor.businessName,
          category: vendor.category.name,
          rating: vendor.rating ?? "Sin calificar",
          matchScore: `${score}%`,
          estimatedPrice: `$${price.toLocaleString("es-MX")} MXN`,
          bio: vendor.bio?.slice(0, 100),
        }));

      return truncate({ found: results.length, vendors: results, criteria: { capacity, budget, theme } });
    }

    if (name === "searchPlanners") {
      const { eventType, guestCount, budget } = input as {
        eventType: string; guestCount: number; budget: number;
      };

      const planners = await prisma.plannerProfile.findMany({
        where: {
          specialties: { hasSome: [eventType, eventType.toLowerCase()] },
        },
        select: {
          id: true,
          businessName: true,
          bio: true,
          experience: true,
          rating: true,
          budgetRange: true,
          specialties: true,
          coverageCities: true,
        },
        take: 12,
      });

      const all = await (planners.length < 3
        ? prisma.plannerProfile.findMany({
            select: {
              id: true,
              businessName: true,
              bio: true,
              experience: true,
              rating: true,
              budgetRange: true,
              specialties: true,
              coverageCities: true,
            },
            take: 12,
          })
        : Promise.resolve(planners));

      const results = all
        .map((p) => ({
          score: scorePlanner(budget, guestCount, p.experience ?? 0, p.budgetRange ?? null),
          planner: p,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ score, planner }) => ({
          name: planner.businessName ?? "Sin nombre",
          matchScore: `${score}%`,
          experience: planner.experience ? `${planner.experience} años` : "N/D",
          rating: planner.rating ?? "Sin calificar",
          specialties: planner.specialties.slice(0, 3),
          cities: planner.coverageCities.slice(0, 2),
          bio: planner.bio?.slice(0, 100),
        }));

      return truncate({ found: results.length, planners: results, criteria: { eventType, guestCount, budget } });
    }

    if (name === "getVendorHistory") {
      const { vendorId } = input as { vendorId: string };
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        select: {
          businessName: true,
          rating: true,
          _count: { select: { events: true, services: true } },
          events: {
            select: { status: true },
            take: 20,
          },
        },
      });
      if (!vendor) return JSON.stringify({ error: "Proveedor no encontrado" });

      const confirmed = vendor.events.filter((e) => e.status === "CONFIRMED").length;
      const pending = vendor.events.filter((e) => e.status === "PENDING").length;

      return truncate({
        businessName: vendor.businessName,
        totalEvents: vendor._count.events,
        confirmedEvents: confirmed,
        pendingEvents: pending,
        totalServices: vendor._count.services,
        currentRating: vendor.rating ?? "Sin calificaciones aún",
      });
    }

    if (name === "projectRating") {
      const { weeklyLoad } = input as { weeklyLoad: number[] };
      // Formula: base 5.0, -0.15 per event over 2/week, floor 2.5
      const projections = weeklyLoad.map((load) => {
        const penalty = Math.max(0, load - 2) * 0.15;
        const rating = Math.max(2.5, parseFloat((5.0 - penalty).toFixed(1)));
        return { eventsPerWeek: load, projectedRating: `${rating}★` };
      });

      const sweet = projections.reduce((best, p) => {
        const r = parseFloat(p.projectedRating);
        const prev = parseFloat(best.projectedRating);
        return r >= 4.5 && p.eventsPerWeek > best.eventsPerWeek ? p : best;
      }, projections[0]);

      return truncate({
        projections,
        recommendation: `Carga óptima: ${sweet?.eventsPerWeek} eventos/semana (${sweet?.projectedRating})`,
      });
    }

    if (name === "getEventContext") {
      const { userId } = input as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          clientProfile: {
            select: {
              events: {
                where: { status: { in: ["ACTIVE", "IN_PROGRESS"] } },
                orderBy: { eventDate: "asc" },
                take: 1,
                select: {
                  title: true,
                  type: true,
                  eventDate: true,
                  guestCount: true,
                  totalBudget: true,
                  currency: true,
                  status: true,
                },
              },
            },
          },
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              category: { select: { name: true } },
              _count: { select: { events: true } },
            },
          },
        },
      });

      if (!user) return JSON.stringify({ error: "Usuario no encontrado" });

      const event = user.clientProfile?.events[0];
      if (!event && user.role !== "VENDOR") return JSON.stringify({ message: "Sin eventos activos" });

      if (user.role === "VENDOR" && user.vendorProfile) {
        return truncate({
          role: "VENDOR",
          vendorId: user.vendorProfile.id,
          businessName: user.vendorProfile.businessName,
          category: user.vendorProfile.category.name,
          totalEvents: user.vendorProfile._count.events,
        });
      }

      return truncate({
        role: user.role,
        event: event ? {
          title: event.title,
          type: event.type,
          date: event.eventDate,
          guestCount: event.guestCount,
          budget: `${event.totalBudget} ${event.currency}`,
          status: event.status,
        } : null,
      });
    }

    return JSON.stringify({ error: `Tool desconocido: ${name}` });
  } catch (err) {
    console.error(`[tool:${name}]`, (err as Error).message);
    return JSON.stringify({ error: "Error al ejecutar la consulta" });
  }
}
