import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/auth";

export default async function SettingsPage() {
  await requireAuth();

  return (
    <AppShell>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-900">Settings</h3>
        <p className="mt-4 text-slate-600">
          This core SRO version keeps settings intentionally minimal. The architecture is ready for future expansions such as payroll, multi-location support, or additional owner roles.
        </p>
      </div>
    </AppShell>
  );
}
