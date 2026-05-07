import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, serverError } from "@/lib/responses";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return unauthorized();

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        role: true,
        clientProfile: { select: { id: true } },
        plannerProfile: { select: { id: true } },
      },
    });
    if (!user) return unauthorized();

    let eventIds: string[] = [];

    if (user.role === "CLIENT" && user.clientProfile) {
      const events = await prisma.event.findMany({
        where: {
          clientId: user.clientProfile.id,
          status: { in: ["ACTIVE", "IN_PROGRESS"] },
        },
        select: { id: true, title: true },
      });
      eventIds = events.map((e) => e.id);
    } else if (user.role === "PLANNER" && user.plannerProfile) {
      const plannerEvents = await prisma.eventPlanner.findMany({
        where: { plannerId: user.plannerProfile.id },
        select: {
          event: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });
      eventIds = plannerEvents
        .filter((ep) => ["ACTIVE", "IN_PROGRESS"].includes(ep.event.status))
        .map((ep) => ep.event.id);
    }

    if (eventIds.length === 0) return ok({ tasks: [] });

    const tasks = await prisma.task.findMany({
      where: {
        eventId: { in: eventIds },
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        event: { select: { id: true, title: true } },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
      ],
      take: 8,
    });

    return ok({ tasks });
  } catch (err) {
    console.error("[GET /api/tasks/upcoming]", (err as Error).message);
    return serverError();
  }
}
