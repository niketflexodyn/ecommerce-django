export default function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold font-display text-plum-950">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}