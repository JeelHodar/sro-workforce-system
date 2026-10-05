import { saveAttendanceAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoData } from "@/lib/seed";

function toDateString(date: Date) {
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60 * 1000);
  return normalized.toISOString().slice(0, 10);
}

const attendanceOptions = ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"];

export default async function AttendancePage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; saved?: string }>;
}) {
  await requireAuth();
  await ensureDemoData();

  const params = (await searchParams) ?? {};
  const selectedDate = params.date ?? toDateString(new Date());
  const recordDate = new Date(`${selectedDate}T00:00:00`);

  const workers = await prisma.worker.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  const records = await prisma.attendanceRecord.findMany({
    where: { date: recordDate },
  });

  const recordMap = new Map(records.map((record) => [record.workerId, record]));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Daily Attendance</h3>
              <p className="text-sm text-slate-600">Select a date to review or update daily workload entries.</p>
            </div>

            <form method="get" className="flex items-center gap-2">
              <label htmlFor="date" className="text-sm font-medium text-slate-700">
                Select Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={selectedDate}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
              />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
                Load
              </button>
            </form>
          </div>

          {params.saved === "1" ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Attendance saved successfully.
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {workers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              No active workers available for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Worker</th>
                    <th className="px-3 py-3 font-semibold">Attendance</th>
                    <th className="px-3 py-3 font-semibold">Boards</th>
                    <th className="px-3 py-3 font-semibold">Weight (kg)</th>
                    <th className="px-3 py-3 font-semibold">Notes</th>
                    <th className="px-3 py-3 font-semibold">Save</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => {
                    const record = recordMap.get(worker.id);
                    const currentStatus = record?.attendanceStatus ?? "PRESENT";
                    const currentBoards = record?.boardsCarried ?? 0;
                    const currentWeight = record?.weightCarriedKg ?? 0;

                    return (
                      <tr key={worker.id} className="border-t border-slate-200 align-top">
                        <td className="px-3 py-3 font-medium text-slate-800">
                          <div>{worker.name}</div>
                          <div className="text-xs text-slate-500">{worker.workerCode}</div>
                        </td>
                        <td className="px-3 py-3">
                          <form action={saveAttendanceAction} className="space-y-3">
                            <input type="hidden" name="workerId" value={worker.id} />
                            <input type="hidden" name="date" value={selectedDate} />
                            <input type="hidden" name="recordId" value={record?.id ?? ""} />
                            <select
                              name="attendanceStatus"
                              defaultValue={currentStatus}
                              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:bg-white"
                            >
                              {attendanceOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <div className="flex flex-col gap-2">
                              <input
                                type="number"
                                name="boardsCarried"
                                min={0}
                                step={1}
                                defaultValue={currentBoards}
                                className="w-28 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:bg-white"
                              />
                              <input
                                type="number"
                                name="weightCarriedKg"
                                min={0}
                                step={0.1}
                                defaultValue={currentWeight}
                                className="w-28 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:bg-white"
                              />
                            </div>
                            <textarea
                              name="notes"
                              defaultValue={record?.notes ?? ""}
                              rows={2}
                              placeholder="Optional notes"
                              className="w-56 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:bg-white"
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-sky-600 px-3 py-2 font-medium text-white hover:bg-sky-500"
                            >
                              Save
                            </button>
                          </form>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-slate-500">—</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-slate-500">—</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-slate-500">—</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-slate-500">—</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
