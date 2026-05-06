import { prisma } from "@/lib/prisma";

const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Clientes",
  PLANNER: "Planners",
  VENDOR: "Proveedores",
  ADMIN: "Admins",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function AdminDashboard() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [totalUsers, usersByRole, totalEvents, eventsByStatus, newUsersLastWeek] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
      prisma.event.count(),
      prisma.event.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

  const metricCards = [
    {
      label: "Total usuarios",
      value: totalUsers,
      color: "bg-indigo-50 text-indigo-700",
      icon: "👥",
    },
    {
      label: "Total eventos",
      value: totalEvents,
      color: "bg-emerald-50 text-emerald-700",
      icon: "🗓",
    },
    {
      label: "Nuevos (7 días)",
      value: newUsersLastWeek,
      color: "bg-amber-50 text-amber-700",
      icon: "🆕",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Dashboard</h2>

      {/* Top metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {metricCards.map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <span className="text-3xl">{m.icon}</span>
            <div>
              <p className="text-sm text-gray-500 font-semibold">{m.label}</p>
              <p className="text-3xl font-extrabold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Users by role */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-bold text-gray-800 mb-4">
            Usuarios por rol
          </h3>
          <div className="space-y-3">
            {usersByRole.map((r) => (
              <div key={r.role} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {ROLE_LABEL[r.role] ?? r.role}
                </span>
                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                  {r._count.role}
                </span>
              </div>
            ))}
            {usersByRole.length === 0 && (
              <p className="text-sm text-gray-400">Sin usuarios registrados</p>
            )}
          </div>
        </div>

        {/* Events by status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-bold text-gray-800 mb-4">
            Eventos por status
          </h3>
          <div className="space-y-3">
            {eventsByStatus.map((e) => (
              <div key={e.status} className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABEL[e.status] ?? e.status}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {e._count.status}
                </span>
              </div>
            ))}
            {eventsByStatus.length === 0 && (
              <p className="text-sm text-gray-400">Sin eventos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
