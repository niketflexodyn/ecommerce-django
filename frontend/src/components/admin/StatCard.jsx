export default function StatCard({
  label,
  value,
  icon,
  iconClass = 'text-plum-950',
  iconBgClass = 'bg-plum-950/10',
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex items-center gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <span className={iconClass}>{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-plum-950">{value}</p>
        </div>
      </div>
    </div>
  );
}