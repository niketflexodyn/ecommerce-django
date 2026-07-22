import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      className="mt-auto bg-linear-to-br from-plum-950 via-plum-900 to-plum-800 text-white"
    >
      {/* Gold accent line */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="page-container font-body py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 text-lg font-bold">
              <span
                className="flex size-8 items-center justify-center rounded-lg bg-gold-500"
              >
                <svg className="size-4 text-plum-950" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21V7.5m0 0 6.75-3.75v13.5M13.5 7.5l-6.75-3.75v13.5M6.75 17.25l6.75 3.75 6.75-3.75" />
                </svg>
              </span>
              <span className="font-display text-xl text-white">
                Luxora
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Premium products, fast delivery, and a seamless shopping experience.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gold-500">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link to="/" className="transition hover:text-gold-500 hover:translate-x-1 inline-block">All Products</Link></li>
              <li><Link to="/cart" className="transition hover:text-gold-500 hover:translate-x-1 inline-block">Cart</Link></li>
              <li><Link to="/search" className="transition hover:text-gold-500 hover:translate-x-1 inline-block">Search</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gold-500">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link to="/login" className="transition hover:text-gold-500 hover:translate-x-1 inline-block">Login</Link></li>
              <li><Link to="/register" className="transition hover:text-gold-500 hover:translate-x-1 inline-block">Register</Link></li>
              <li><Link to="/orders" className="transition hover:text-gold-500 hover:translate-x-1 inline-block">My Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gold-500">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Free shipping over ₹50</li>
              <li>Easy returns within 30 days</li>
              <li>support@mystore.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gold-500/20 pt-6 text-center text-sm text-white/40">
          © {new Date().getFullYear()} Luxora. All rights reserved.
        </div>
      </div>
    </footer>
  )
}