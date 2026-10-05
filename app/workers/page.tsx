import Link from "next/link";

import { saveWorkerAction, toggleWorkerStatusAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoData } from "@/lib/seed";

function formatDate(date: Date | string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(date));
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string; error?: string; status?: string; q?: string }>;
}) {
  await requireAuth();
  await ensureDemoData();

  const params = (await searchParams) ?? {};
  const editId = params.edit ?? "";
  const filterStatus = params.status === "ACTIVE" || params.status === "INACTIVE" ? params.status : "ALL";
  const searchTerm = params.q ?? "";

  const editWorker = editId
    ? await prisma.worker.findUnique({ where: { id: editId } })
    : null;

  const workers = await prisma.worker.findMany({
    where: {
      ...(filterStatus !== "ALL" ? { status: filterStatus } : {}),
      ...(searchTerm
        ? {
            OR: [
              { name: { contains: searchTerm } },
              { workerCode: { contains: searchTerm } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  const errorMessage =
    params.error === "duplicate-worker-code"
      ? "Worker ID must be unique."
      : params.error === "invalid-worker"
        ? "Please check the worker form and try again."
        : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-2xl font-bold text-slate-900">Workers</h3>
            <div className="flex flex-wrap gap-2">
              <Link href="/workers" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                Clear filters
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <form method="get" className="md:col-span-2">
              <div className="flex gap-2">
                <input
                  name="q"
                  defaultValue={searchTerm}
                  placeholder="Search by name or worker ID"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
                />
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white">
                  Search
                </button>
              </div>
            </form>

            <form method="get" className="md:col-span-1">
              <select
                name="status"
                defaultValue={filterStatus}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="ALL">All workers</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </form>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-xl font-bold text-slate-900">
              {editWorker ? "Edit Worker" : "Add Worker"}
            </h4>

            {errorMessage ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <form action={saveWorkerAction} className="mt-4 space-y-4">
              {editWorker ? <input type="hidden" name="id" value={editWorker.id} /> : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Worker Name</label>
                <input
                  name="name"
                  defaultValue={editWorker?.name ?? ""}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Worker ID</label>
                <input
                  name="workerCode"
                  defaultValue={editWorker?.workerCode ?? ""}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  name="phone"
                  defaultValue={editWorker?.phone ?? ""}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Joining Date</label>
                <input
                  name="joiningDate"
                  type="date"
                  defaultValue={editWorker ? formatDate(editWorker.joiningDate).split("/").reverse().join("-") : ""}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select
                  name="status"
                  defaultValue={editWorker?.status ?? "ACTIVE"}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editWorker?.notes ?? ""}
                  rows={3}
                  placeholder="Optional notes"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-500"
              >
                {editWorker ? "Update Worker" : "Add Worker"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-xl font-bold text-slate-900">Worker List</h4>

            {workers.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                No workers match the current filters.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Name</th>
                      <th className="px-3 py-3 font-semibold">Worker ID</th>
                      <th className="px-3 py-3 font-semibold">Joining</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((worker) => (
                      <tr key={worker.id} className="border-t border-slate-200">
                        <td className="px-3 py-3 font-medium text-slate-800">{worker.name}</td>
                        <td className="px-3 py-3">{worker.workerCode}</td>
                        <td className="px-3 py-3">{formatDate(worker.joiningDate)}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${worker.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                            {worker.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/workers?edit=${worker.id}`} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">
                              Edit
                            </Link>
                            <form action={toggleWorkerStatusAction}>
                              <input type="hidden" name="workerId" value={worker.id} />
                              <input type="hidden" name="status" value={worker.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                              <button type="submit" className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white">
                                {worker.status === "ACTIVE" ? "Deactivate" : "Activate"}
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
