import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, forbidden, serverError } from "@/lib/responses";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") return forbidden();

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      usersByRole,
      totalEvents,
      eventsByStatus,
      newUsersLastWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
      prisma.event.count(),
      prisma.event.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return ok({
      totalUsers,
      usersByRole: Object.fromEntries(
        usersByRole.map((r) => [r.role, r._count.role])
      ),
      totalEvents,
      eventsByStatus: Object.fromEntries(
        eventsByStatus.map((e) => [e.status, e._count.status])
      ),
      newUsersLastWeek,
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", (err as Error).message);
    return serverError();
  }
}
