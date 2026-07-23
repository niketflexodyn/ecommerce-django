// Horizontal shipping/delivery stepper driven by the ETA milestone dates
// that the backend snapshots onto the Order at checkout
// (shipping_eta, dispatch_eta, out_for_delivery_eta, estimated_delivery).
//
// It is intentionally date-driven rather than status-driven: the current stage
// is derived by comparing today's date to each milestone date. This keeps the
// UI correct even for orders whose `status` string doesn't match the lifecycle
// (e.g. legacy "successful" orders).

const STAGES = [
  { key: 'placed', label: 'Placed', dateField: 'created_at' },
  { key: 'shipping', label: 'Shipping', dateField: 'shipping_eta' },
  { key: 'dispatched', label: 'Dispatched', dateField: 'dispatch_eta' },
  { key: 'out_for_delivery', label: 'Out for Delivery', dateField: 'out_for_delivery_eta' },
  { key: 'delivered', label: 'Delivered', dateField: 'estimated_delivery' },
];

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const CheckIcon = () => (
  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

export default function DeliveryTimeline({ order, cancelled = false }) {
  if (!order) return null;

  const hasTimeline =
    order.estimated_delivery ||
    order.shipping_eta ||
    order.dispatch_eta ||
    order.out_for_delivery_eta;

  if (!hasTimeline) {
    return (
      <p className="text-xs text-slate-400">
        Shipping timeline not available for this order.
      </p>
    );
  }

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        Order cancelled
      </div>
    );
  }

  const today = startOfDay(new Date());

  const stages = STAGES.map((s) => ({ ...s, date: toDate(order[s.dateField]) }));

  // A stage is "done" once its milestone date has passed.
  const states = stages.map((s) => {
    if (!s.date) return 'upcoming';
    return today >= startOfDay(s.date) ? 'done' : 'upcoming';
  });

  // The current stage is the first one not yet done.
  let currentIdx = states.findIndex((st) => st === 'upcoming');
  if (currentIdx === -1) currentIdx = stages.length - 1; // all done → delivered
  if (states[currentIdx] === 'upcoming') states[currentIdx] = 'current';

  return (
    <div className="w-full">
      <div className="flex w-full items-start">
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          const st = states[i];

          const circleClasses = {
            done: 'bg-emerald-500 text-white ring-emerald-500',
            current: 'bg-gold-500 text-plum-950 ring-gold-500',
            upcoming: 'bg-white text-slate-400 ring-slate-200',
          }[st];

          return (
            <div key={s.key} className="flex items-start">
              <div className="flex w-16 shrink-0 flex-col items-center">
                <div
                  className={`flex size-8 items-center justify-center rounded-full ring-2 ${circleClasses} ${
                    st === 'current' ? 'animate-pulse' : ''
                  }`}
                >
                  {st === 'done' ? (
                    <CheckIcon />
                  ) : st === 'current' ? (
                    <span className="size-2.5 rounded-full bg-plum-950" />
                  ) : (
                    <span className="text-xs font-semibold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-1.5 text-center text-[11px] font-semibold leading-tight ${
                    st === 'upcoming' ? 'text-slate-400' : 'text-slate-700'
                  }`}
                >
                  {s.label}
                </span>
                {s.date ? (
                  <span className="mt-0.5 text-[10px] text-slate-400">{fmtDate(s.date)}</span>
                ) : (
                  <span className="mt-0.5 text-[10px] text-slate-300">—</span>
                )}
              </div>

              {!isLast && (
                <div
                  className={`mt-4 h-0.5 flex-1 min-w-[6px] rounded-full ${
                    st === 'done' ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Estimated delivery:{' '}
        <span className="font-semibold text-plum-950">
          {stages[4].date ? fmtDate(stages[4].date) : '—'}
        </span>
      </p>
    </div>
  );
}