import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Workers", href: "/workers" },
  { label: "Daily Attendance", href: "/attendance" },
  { label: "Monthly Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 p-4 lg:p-6">
        <aside className="hidden w-72 shrink-0 rounded-3xl bg-slate-900 p-5 text-slate-100 lg:block">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.25em] text-sky-300">SRO</div>
            <h1 className="mt-2 text-2xl font-bold">Workforce</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-800 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in</div>
            <div className="mt-2 font-semibold">{user.name}</div>
            <div className="text-sm text-slate-300">{user.email}</div>
          </div>

          <form action={logoutAction} className="mt-10">
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-400"
            >
              Logout
            </button>
          </form>
        </aside>

        <main className="min-w-0 flex-1 rounded-3xl bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200 lg:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">SRO</div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Workforce Management</h2>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100">
                {user.name}
              </div>
              <form action={logoutAction}>
                <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium">
                  Logout
                </button>
              </form>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
