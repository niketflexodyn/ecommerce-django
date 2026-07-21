import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import SearchDropdown from './SearchDropdown'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const fontDisplay = { fontFamily: "'Playfair Display', serif" }
const fontBody = { fontFamily: "'Jost', sans-serif" }

/* ─── SVG Icons ──────────────────────────────────────────────────── */

function MenuIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  )
}

function CloseIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronDownIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function SearchIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function CartIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.936-4.708 2.436-7.18.075-.37-.221-.7-.598-.7H5.106M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

function LogoutIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  )
}

function UserIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.596a3.5 3.5 0 0 0-5.964 0M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 9.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function OrdersIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  )
}

/* ─── Constants ──────────────────────────────────────────────────── */

const ROLE_LABELS = {
  customer: 'Customer',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

const NAV_LINKS = [
  { name: 'Home', to: '/#products' },
  { name: 'Shop', to: '/#products' },
  { name: 'New Arrivals', to: '/#products' },
]
/* ─── Component ─────────────────────────────────────────────────── */

export default function Navbar() {
  const { cartItems } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  /* track scroll for shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* close mobile menu on route change */
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
    closeMobile()
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    closeMobile()
  }

  const navLinkClass = ({ isActive }) =>
    `relative text-sm font-medium whitespace-nowrap py-1 transition-colors duration-200 ${
      isActive
        ? 'text-[#2A1A2C]'
        : 'text-slate-500 hover:text-[#2A1A2C]'
    } after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-[#E8C766] after:transition-all after:duration-200 ${
      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    }`

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-[box-shadow] duration-300 ${
        scrolled ? 'shadow-lg shadow-slate-900/5' : ''
      }`}
      style={fontBody}
    >
      {/* Subtle gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#E8C766]/60 to-transparent" />

      <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:gap-8 lg:px-8">
        {/* ── Logo ─────────────────────────────── */}
        <Link to="/" className="group/logo flex items-center gap-2 shrink-0">
          <span
            className="flex size-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover/logo:scale-110"
            style={{ backgroundColor: '#E8C766' }}
          >
            <svg className="size-5 text-[#2A1A2C]" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21V7.5m0 0 6.75-3.75v13.5M13.5 7.5l-6.75-3.75v13.5M6.75 17.25l6.75 3.75 6.75-3.75" />
            </svg>
          </span>
          <span
            className="text-xl font-bold text-[#2A1A2C] tracking-tight transition-[letter-spacing] duration-300 group-hover/logo:tracking-wide"
            style={fontDisplay}
          >
            Luxora
          </span>
        </Link>

        {/* ── Center: Nav Links ────────────────── */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center md:gap-8">
  {NAV_LINKS.map((link) => (
    <a
      key={link.name}
      href={link.to}
      className={typeof navLinkClass === 'function' ? navLinkClass({ isActive: false }) : navLinkClass}
    >
      {link.name}
    </a>
  ))}
</div>

        {/* ── Right: Search + Cart + Auth ──────── */}
        <div className="hidden md:flex md:items-center md:gap-3 shrink-0">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="w-56 lg:w-72">
            <div className="group relative">
              <SearchIcon className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 group-focus-within:text-[#C9A227]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C766]/40 focus:border-[#C9A227] focus:bg-white transition-all duration-200"
              />
              <SearchDropdown query={searchQuery} onSelect={() => setSearchQuery('')} />
            </div>
          </form>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#2A1A2C]"
          >
            <CartIcon className="size-[18px]" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-[#2A1A2C] ring-2 ring-white"
                style={{ backgroundColor: '#E8C766' }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          {user && (
            <Link
              to="/orders"
              aria-label="My Orders"
              title="My Orders"
              className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#2A1A2C]"
            >
              <OrdersIcon className="size-[18px]" />
            </Link>
          )}

          {user ? (
            <Menu as="div" className="relative shrink-0">
              <MenuButton className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 bg-[#2A1A2C] hover:bg-[#3D2136]">
                <UserIcon className="size-4" />
                {user.first_name || user.username}
                <ChevronDownIcon className="size-3.5" />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200/80 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                {/* User info */}
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-[#E8C766]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8a6d1f]">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>

                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <MenuItem>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-[#FBF6F0] data-[focus]:bg-[#FBF6F0]"
                    >
                      <svg className="size-4 text-[#8a6d1f]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                      </svg>
                      Dashboard
                    </Link>
                  </MenuItem>
                )}

                <MenuItem>
                  <Link
                    to="/orders"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-[#FBF6F0] data-[focus]:bg-[#FBF6F0]"
                  >
                    <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m3 6.75h.008v.008H12v-.008ZM12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
                    </svg>
                    My Orders
                  </Link>
                </MenuItem>

                <MenuItem>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-[#FBF6F0] data-[focus]:bg-[#FBF6F0]"
                  >
                    <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                    My Profile
                  </Link>
                </MenuItem>

                <div className="border-t border-slate-100 my-1" />

                <MenuItem>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 data-[focus]:bg-red-50"
                  >
                    <LogoutIcon className="size-4" />
                    Sign out
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          ) : (
            <Menu as="div" className="relative shrink-0">
              <MenuButton className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 bg-[#2A1A2C] hover:bg-[#3D2136]">
                Login
                <ChevronDownIcon className="size-3.5" />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200/80 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <MenuItem>
                  <Link
                    to="/login"
                    className="block rounded-lg px-4 py-3 transition-colors hover:bg-[#FBF6F0] data-[focus]:bg-[#FBF6F0]"
                  >
                    <span className="block text-sm font-semibold text-slate-900">Sign In</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Login to your account</span>
                  </Link>
                </MenuItem>
                <div className="border-t border-slate-100 my-1" />
                <MenuItem>
                  <Link
                    to="/register"
                    className="block rounded-lg px-4 py-3 transition-colors hover:bg-[#FBF6F0] data-[focus]:bg-[#FBF6F0]"
                  >
                    <span className="block text-sm font-semibold text-[#8a6d1f]">Create an account</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Customer &amp; Admin signup</span>
                  </Link>
                </MenuItem>
              </MenuItems>
            </Menu>
          )}
        </div>

        {/* ── Mobile: Cart + Hamburger ─────────── */}
       {/* ── Mobile: Cart + Hamburger ─────────── */}
<div className="md:hidden ml-auto flex items-center gap-1">
  <Link
    to="/cart"
    aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
    className="relative flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
  >
    <CartIcon className="size-5" />
    {cartCount > 0 && (
      <span
        className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-[#2A1A2C] ring-2 ring-white"
        style={{ backgroundColor: '#E8C766' }}
      >
        {cartCount}
      </span>
    )}
  </Link>
  <button
    type="button"
    className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100"
    onClick={() => setMobileOpen((v) => !v)}
    aria-label="Toggle menu"
    aria-expanded={mobileOpen}
  >
    {mobileOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
  </button>
</div>
      </nav>

      {/* ── Mobile Search Bar ─────────────────── */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2.5">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C766]/40 focus:border-[#C9A227] focus:bg-white transition-all duration-200"
          />
          <SearchDropdown query={searchQuery} onSelect={() => setSearchQuery('')} />
        </form>
      </div>

      {/* ── Mobile Menu ────────────────────────── */}
      <div
        className={`md:hidden overflow-hidden border-t border-slate-100 transition-[max-height] duration-300 ease-in-out ${
          mobileOpen ? 'max-h-[600px]' : 'max-h-0'
        }`}
      >
        <div className="px-4 py-4 space-y-1">
        {NAV_LINKS.map((link) => (
  <a
  key={link.name}
  href={link.to}
  onClick={closeMobile}
  className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-50 hover:text-[#2A1A2C]"
>
  {link.name}
</a>
))}

          <div className="border-t border-slate-100 pt-3 mt-3">
            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-[#E8C766]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8a6d1f]">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>

                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link
                    to="/dashboard"
                    onClick={closeMobile}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#2A1A2C] hover:bg-[#FBF6F0]"
                  >
                    <svg className="size-4 text-[#8a6d1f]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                    </svg>
                    Dashboard
                  </Link>
                )}

                <Link
                  to="/orders"
                  onClick={closeMobile}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m3 6.75h.008v.008H12v-.008ZM12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
                  </svg>
                  My Orders
                </Link>

                <Link
                  to="/profile"
                  onClick={closeMobile}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                  My Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogoutIcon className="size-4" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#8a6d1f] hover:bg-[#FBF6F0]"
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}