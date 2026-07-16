import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import SearchDropdown from './SearchDropdown'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const fontDisplay = { fontFamily: "'Playfair Display', serif" }
const fontBody = { fontFamily: "'Jost', sans-serif" }

function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  )
}

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function CartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.936-4.708 2.436-7.18.075-.37-.221-.7-.598-.7H5.106M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  )
}

function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.596a3.5 3.5 0 0 0-5.964 0M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 9.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

const ROLE_LABELS = {
  customer: 'Customer',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

const navLinks = [
  { name: 'Shop', to: '/' },
]

export default function Navbar() {
  const { cartItems } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
    setMobileOpen(false)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
    clearSearch()
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinkClasses = ({ isActive }) =>
    `relative text-sm font-medium whitespace-nowrap py-1 transition-colors ${
      isActive ? 'text-[#2A1A2C]' : 'text-slate-600 hover:text-[#2A1A2C]'
    } after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#E8C766] after:transition-all ${
      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    }`

  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg transition-shadow duration-300${scrolled ? ' shadow-md' : ''}`}
      style={fontBody}
    >
      <nav className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Link to="/" className="group/logo flex items-center gap-2 shrink-0">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-sm font-black text-[#2A1A2C] group-hover/logo:scale-110 transition-transform"
            style={{ backgroundColor: '#E8C766' }}
          >
            M
          </span>
          <span className="text-xl font-bold text-[#2A1A2C] group-hover/logo:tracking-wide transition-[letter-spacing] duration-300" style={fontDisplay}>
            MyStore
          </span>
        </Link>

        {/* Center: Nav links, truly centered */}
        <div className="hidden md:flex md:items-center md:justify-center md:gap-10">
          {navLinks.map((link) => (
            <NavLink key={link.name} to={link.to} className={navLinkClasses} end={link.to === '/'}>
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Right: Search + Cart + Auth */}
        <div className="hidden md:flex md:items-center md:gap-3 shrink-0">
          <form onSubmit={handleSearchSubmit} className="w-60 lg:w-72">
            <div className="group relative">
              <SearchIcon className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-[#C9A227]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-slate-200 bg-slate-100 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C766]/50 focus:border-[#C9A227] focus:bg-white transition-colors"
              />
              <SearchDropdown query={searchQuery} onSelect={clearSearch} />
            </div>
          </form>

          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-[#2A1A2C] active:bg-slate-200 transition-colors"
          >
            <CartIcon className="size-5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-[#2A1A2C] ring-2 ring-white"
                style={{ backgroundColor: '#E8C766' }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            /* Logged in: user menu */
            <Menu as="div" className="relative shrink-0">
              <MenuButton
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap"
                style={{ backgroundColor: '#2A1A2C' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3D2136')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2A1A2C')}
              >
                <UserIcon className="size-4" />
                {user.first_name || user.username}
                <ChevronDownIcon className="size-4" />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-slate-200 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <div className="p-1">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-[#E8C766]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6d1f]">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <MenuItem>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#FBF6F0] data-focus:bg-[#FBF6F0]"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                        </svg>
                        Dashboard
                      </Link>
                    </MenuItem>
                  )}
                  <MenuItem>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#FBF6F0] data-focus:bg-[#FBF6F0]"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m3 6.75h.008v.008H12v-.008ZM12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                      </svg>
                      My Orders
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 data-focus:bg-red-50"
                    >
                      <LogoutIcon className="size-4" />
                      Sign out
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          ) : (
            /* Not logged in: login dropdown */
            <Menu as="div" className="relative shrink-0">
              <MenuButton
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap"
                style={{ backgroundColor: '#2A1A2C' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3D2136')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2A1A2C')}
              >
                Login
                <ChevronDownIcon className="size-4" />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-slate-200 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <div className="p-1">
                  <MenuItem>
                    <Link
                      to="/login"
                      className="block rounded-lg px-4 py-3 hover:bg-[#FBF6F0] data-focus:bg-[#FBF6F0]"
                    >
                      <span className="block text-sm font-semibold text-slate-900">Sign In</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Login to your account</span>
                    </Link>
                  </MenuItem>
                  <div className="border-t border-slate-100 my-1" />
                  <MenuItem>
                    <Link
                      to="/register"
                      className="block rounded-lg px-4 py-3 hover:bg-[#FBF6F0] data-focus:bg-[#FBF6F0]"
                    >
                      <span className="block text-sm font-semibold text-[#8a6d1f]">Create an account</span>
                      <span className="block text-xs text-slate-500 mt-0.5">Customer &amp; Admin signup</span>
                    </Link>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="md:hidden col-start-3 flex items-center justify-self-end gap-1">
          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="relative flex size-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <CartIcon className="size-5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none text-[#2A1A2C] ring-2 ring-white"
                style={{ backgroundColor: '#E8C766' }}
              >
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
          </button>
        </div>
      </nav>

      {/* Search bar - mobile, its own full-width row, always visible */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2.5">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-slate-200 bg-slate-100 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C766]/50 focus:border-[#C9A227] focus:bg-white transition-colors"
          />
          <SearchDropdown query={searchQuery} onSelect={clearSearch} />
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden border-t border-slate-200 transition-[max-height] duration-300 ease-in-out ${
          mobileOpen ? 'max-h-[500px]' : 'max-h-0 border-t-0'
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#FBF6F0] text-[#2A1A2C]' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-3 mt-3 border-t border-slate-200">
            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-[#E8C766]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6d1f]">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#2A1A2C] hover:bg-[#FBF6F0]"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                    </svg>
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                  My Orders
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogoutIcon className="size-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[#8a6d1f] hover:bg-[#FBF6F0]"
                >
                  Create an account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}