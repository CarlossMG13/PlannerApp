import { prisma } from "@/lib/prisma";

const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Cliente",
  PLANNER: "Planner",
  VENDOR: "Proveedor",
  ADMIN: "Admin",
};

const ROLE_COLOR: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-700",
  PLANNER: "bg-purple-100 text-purple-700",
  VENDOR: "bg-orange-100 text-orange-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  const where = role && ["CLIENT", "PLANNER", "VENDOR", "ADMIN"].includes(role)
    ? { role: role as any }
    : undefined;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      clientProfile: { select: { id: true } },
      plannerProfile: { select: { id: true } },
      vendorProfile: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const roles = ["CLIENT", "PLANNER", "VENDOR", "ADMIN"];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Usuarios</h2>
      <p className="text-sm text-gray-500 mb-6">{users.length} usuarios encontrados</p>

      {/* Role filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <a
          href="/admin/users"
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
            !role
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          Todos
        </a>
        {roles.map((r) => (
          <a
            key={r}
            href={`/admin/users?role=${r}`}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              role === r
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {ROLE_LABEL[r]}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Nombre
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Email
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Rol
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Perfil
              </th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Registro
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const hasProfile =
                u.clientProfile || u.plannerProfile || u.vendorProfile;
              return (
                <tr
                  key={u.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 ${
                    i === users.length - 1 ? "border-none" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-semibold text-gray-900">
                    {u.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold ${
                        hasProfile ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {hasProfile ? "Completo" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  Sin usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
