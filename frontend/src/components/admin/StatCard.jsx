export default function StatCard({
  label,
  value,
  icon,
  iconClass = 'text-plum-950',
  iconBgClass = 'bg-plum-950/10',
}) {
  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div
          className={`flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          <span className={iconClass}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-plum-950 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}