import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoData } from "@/lib/seed";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string; workerId?: string }>;
}) {
  await requireAuth();
  await ensureDemoData();

  const params = (await searchParams) ?? {};
  const currentDate = new Date();
  const selectedMonth = Number(params.month ?? String(currentDate.getMonth() + 1));
  const selectedYear = Number(params.year ?? String(currentDate.getFullYear()));

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const [workers, monthlyRecords] = await Promise.all([
    prisma.worker.findMany({ orderBy: { name: "asc" } }),
    prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        worker: true,
      },
      orderBy: {
        date: "asc",
      },
    }),
  ]);

  const workerSummaries = new Map<
    string,
    {
      worker: (typeof workers)[number];
      present: number;
      absent: number;
      leave: number;
      totalBoards: number;
      totalWeight: number;
    }
  >();

  for (const worker of workers) {
    workerSummaries.set(worker.id, {
      worker,
      present: 0,
      absent: 0,
      leave: 0,
      totalBoards: 0,
      totalWeight: 0,
    });
  }

  let companyBoards = 0;
  let companyWeight = 0;
  let totalPresentDays = 0;

  for (const record of monthlyRecords) {
    const summary = workerSummaries.get(record.workerId);
    if (!summary) continue;

    summary.totalBoards += record.boardsCarried;
    summary.totalWeight += record.weightCarriedKg;
    companyBoards += record.boardsCarried;
    companyWeight += record.weightCarriedKg;

    if (record.attendanceStatus === "PRESENT") {
      summary.present += 1;
      totalPresentDays += 1;
    } else if (record.attendanceStatus === "ABSENT") {
      summary.absent += 1;
    } else if (record.attendanceStatus === "LEAVE") {
      summary.leave += 1;
    }
  }

  const rows = Array.from(workerSummaries.values()).sort((a, b) => a.worker.name.localeCompare(b.worker.name));
  const selectedWorkerId = params.workerId ?? rows[0]?.worker.id ?? "";
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) ?? rows[0]?.worker ?? null;

  const detailRecords = selectedWorker
    ? monthlyRecords.filter((record) => record.workerId === selectedWorker.id)
    : [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Monthly Reports</h3>
              <p className="text-sm text-slate-600">Automatic aggregation from the daily attendance records.</p>
            </div>
            <form method="get" className="flex flex-wrap gap-2">
              <select
                name="month"
                defaultValue={String(selectedMonth)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2024, index, 1))}
                  </option>
                ))}
              </select>
              <select
                name="year"
                defaultValue={String(selectedYear)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
                Refresh
              </button>
            </form>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Workers</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{workers.length}</div>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Present Days</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{totalPresentDays}</div>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Boards</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(companyBoards)}</div>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Weight</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(companyWeight)} kg</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 text-xl font-bold text-slate-900">
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthStart)}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-3 font-semibold">Worker</th>
                  <th className="px-3 py-3 font-semibold">Present Days</th>
                  <th className="px-3 py-3 font-semibold">Absent Days</th>
                  <th className="px-3 py-3 font-semibold">Leave Days</th>
                  <th className="px-3 py-3 font-semibold">Total Boards</th>
                  <th className="px-3 py-3 font-semibold">Total Weight</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.worker.id} className="border-t border-slate-200">
                    <td className="px-3 py-3">
                      <Link href={`/reports?month=${selectedMonth}&year=${selectedYear}&workerId=${row.worker.id}`} className="font-semibold text-sky-700 hover:underline">
                        {row.worker.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{row.present}</td>
                    <td className="px-3 py-3">{row.absent}</td>
                    <td className="px-3 py-3">{row.leave}</td>
                    <td className="px-3 py-3">{formatNumber(row.totalBoards)}</td>
                    <td className="px-3 py-3">{formatNumber(row.totalWeight)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedWorker ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-xl font-bold text-slate-900">
              {selectedWorker.name} — {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthStart)}
            </h4>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Attendance</th>
                    <th className="px-3 py-3 font-semibold">Boards</th>
                    <th className="px-3 py-3 font-semibold">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                        No attendance records found for this worker this month.
                      </td>
                    </tr>
                  ) : (
                    detailRecords.map((record) => (
                      <tr key={record.id} className="border-t border-slate-200">
                        <td className="px-3 py-3">{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(record.date)}</td>
                        <td className="px-3 py-3">{record.attendanceStatus}</td>
                        <td className="px-3 py-3">{formatNumber(record.boardsCarried)}</td>
                        <td className="px-3 py-3">{formatNumber(record.weightCarriedKg)} kg</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Present</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{workerSummaries.get(selectedWorker.id)?.present ?? 0} days</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Absent</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{workerSummaries.get(selectedWorker.id)?.absent ?? 0} days</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Leave</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{workerSummaries.get(selectedWorker.id)?.leave ?? 0} days</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Boards</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{formatNumber(workerSummaries.get(selectedWorker.id)?.totalBoards ?? 0)}</div>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-slate-100 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Weight</div>
              <div className="mt-2 text-xl font-bold text-slate-900">{formatNumber(workerSummaries.get(selectedWorker.id)?.totalWeight ?? 0)} kg</div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
