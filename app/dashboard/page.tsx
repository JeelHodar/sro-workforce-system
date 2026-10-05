import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoData } from "@/lib/seed";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function toDateString(date: Date) {
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60 * 1000);
  return normalized.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const user = await requireAuth();
  await ensureDemoData();

  const today = new Date();
  const todayDate = toDateString(today);
  const dateOnly = new Date(`${todayDate}T00:00:00`);

  const [activeWorkers, presentToday, absentToday, boardsToday, weightToday, todaysRecords] =
    await Promise.all([
      prisma.worker.count({ where: { status: "ACTIVE" } }),
      prisma.attendanceRecord.count({
        where: { date: dateOnly, attendanceStatus: "PRESENT" },
      }),
      prisma.attendanceRecord.count({
        where: { date: dateOnly, attendanceStatus: "ABSENT" },
      }),
      prisma.attendanceRecord.aggregate({
        where: { date: dateOnly },
        _sum: { boardsCarried: true },
      }),
      prisma.attendanceRecord.aggregate({
        where: { date: dateOnly },
        _sum: { weightCarriedKg: true },
      }),
      prisma.attendanceRecord.findMany({
        where: { date: dateOnly },
        include: { worker: { select: { id: true, name: true } } },
        orderBy: { worker: { name: "asc" } },
      }),
    ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Welcome back</p>
            <h3 className="text-2xl font-bold text-slate-900">{user.name}</h3>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            Today: {new Intl.DateTimeFormat("en-GB", { dateStyle: "full" }).format(today)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Active Workers" value={String(activeWorkers)} />
          <StatCard label="Present Today" value={String(presentToday)} accent="bg-emerald-500/10 text-emerald-700" />
          <StatCard label="Absent Today" value={String(absentToday)} accent="bg-rose-500/10 text-rose-700" />
          <StatCard label="Boards Today" value={formatNumber(boardsToday._sum.boardsCarried ?? 0)} accent="bg-violet-500/10 text-violet-700" />
          <StatCard label="Weight Today" value={`${formatNumber(Math.round(weightToday._sum.weightCarriedKg ?? 0))} kg`} accent="bg-amber-500/10 text-amber-700" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-xl font-bold text-slate-900">Today&apos;s Attendance</h4>
            <Link
              href={`/attendance?date=${todayDate}`}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Manage Today
            </Link>
          </div>

          {todaysRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              No attendance has been recorded for today yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Worker</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Boards</th>
                    <th className="px-3 py-3 font-semibold">Weight</th>
                    <th className="px-3 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysRecords.map((record) => (
                    <tr key={record.id} className="border-t border-slate-200">
                      <td className="px-3 py-3 font-medium text-slate-800">{record.worker.name}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                          {record.attendanceStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3">{formatNumber(record.boardsCarried)}</td>
                      <td className="px-3 py-3">{formatNumber(Math.round(record.weightCarriedKg))} kg</td>
                      <td className="px-3 py-3">
                        <Link href={`/attendance?date=${todayDate}`} className="text-sky-700 hover:underline">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
