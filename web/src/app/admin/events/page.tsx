import { prisma } from "@/lib/prisma";

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

const TYPE_LABEL: Record<string, string> = {
  WEDDING: "Boda",
  CORPORATE: "Corporativo",
  BIRTHDAY: "Cumpleaños",
  SOCIAL: "Social",
  OTHER: "Otro",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const VALID_STATUSES = ["DRAFT", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const where =
    status && VALID_STATUSES.includes(status) ? { status: status as any } : undefined;

  const events = await prisma.event.findMany({
    where,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      eventDate: true,
      client: {
        select: { user: { select: { name: true, email: true } } },
      },
      planners: {
        select: { planner: { select: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { eventDate: "asc" },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Eventos</h2>
      <p className="text-sm text-gray-500 mb-6">{events.length} eventos encontrados</p>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <a
          href="/admin/events"
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
            !status
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          Todos
        </a>
        {VALID_STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/events?status=${s}`}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              status === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {STATUS_LABEL[s]}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Evento
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Cliente
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Planner
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Fecha evento
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => {
              const plannerName =
                e.planners[0]?.planner?.user?.name ?? "—";
              return (
                <tr
                  key={e.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 ${
                    i === events.length - 1 ? "border-none" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-400">{TYPE_LABEL[e.type] ?? e.type}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {e.client?.user?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{plannerName}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(e.eventDate).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  Sin eventos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
