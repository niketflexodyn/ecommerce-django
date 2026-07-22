import { useLocation, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;
  const total = location.state?.total;

  return (
    <div className="page-container font-body py-12">
      <div className="mx-auto max-w-md text-center">
        {/* Success icon */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100">
          <svg className="size-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <h1 className="font-display mt-6 text-3xl font-bold text-slate-900">
          Order Placed!
        </h1>

        <p className="mt-3 text-slate-600">
          Your order has been placed successfully.
        </p>

        {orderNumber && (
          <p className="mt-2 text-sm text-slate-500">
            Order #{orderNumber}
          </p>
        )}

        {total && (
          <p className="mt-1 text-lg font-semibold text-plum-950">
            ₹{Number(total).toLocaleString()}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/"
            className="inline-block rounded-xl bg-gold-500 px-6 py-3 font-semibold text-plum-950 transition hover:opacity-90"
          >
            Continue Shopping
          </Link>
          <Link
            to="/orders"
            className="inline-block rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}