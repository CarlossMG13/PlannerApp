import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, name: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acceso denegado</h1>
          <p className="text-gray-500 mt-2">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-lg font-extrabold text-gray-900">PlannerApp</h1>
          <p className="text-xs text-gray-400 mt-0.5">Panel Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>📊</span> Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>👥</span> Usuarios
          </Link>
          <Link
            href="/admin/events"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>🗓</span> Eventos
          </Link>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 truncate">
            {user.name ?? "Admin"}
          </p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
