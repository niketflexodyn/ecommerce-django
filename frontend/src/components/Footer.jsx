import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="page-container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600">
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
                M
              </span>
              MyStore
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Quality products, fast delivery, and a smooth shopping experience.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/" className="hover:text-indigo-600">All Products</Link></li>
              <li><Link to="/cart" className="hover:text-indigo-600">Cart</Link></li>
              <li><Link to="/search" className="hover:text-indigo-600">Search</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/login/customer" className="hover:text-indigo-600">Customer Login</Link></li>
              <li><Link to="/login/admin" className="hover:text-indigo-600">Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>Free shipping over ₹999</li>
              <li>Easy returns within 7 days</li>
              <li>support@mystore.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} MyStore. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
