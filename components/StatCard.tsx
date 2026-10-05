type StatCardProps = {
  label: string;
  value: string;
  accent?: string;
};

export function StatCard({ label, value, accent = "bg-sky-500/10 text-sky-700" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${accent}`}>
        {label}
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
