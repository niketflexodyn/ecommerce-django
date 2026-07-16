import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import SearchDropdown from './SearchDropdown'
import { useCart } from '../context/CartContext'

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

const navLinks = [
  { name: 'Home', to: '/' },
  { name: 'About', to: '/about' },
  { name: 'Products', to: '/' },
]

const loginOptions = [
  { name: 'Admin', to: '/login/admin', description: 'Manage products & orders' },
  { name: 'Customer', to: '/login/customer', description: 'Shop & view your orders' },
]

export default function Navbar() {
  const { cartItems } = useCart()
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const navLinkClasses = ({ isActive }) =>
    `relative text-sm font-medium whitespace-nowrap py-1 transition-colors ${
      isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
    } after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-indigo-600 after:transition-all ${
      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    }`

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600 shrink-0">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-black">
            M
          </span>
          MyStore
        </Link>

        {/* Center: Nav links, truly centered */}
        <div className="hidden md:flex md:items-center md:justify-center md:gap-10">
          {navLinks.map((link) => (
            <NavLink key={link.name} to={link.to} className={navLinkClasses} end={link.to === '/'}>
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Right: Search + Cart + Login */}
        <div className="hidden md:flex md:items-center md:gap-3 shrink-0">
          <form onSubmit={handleSearchSubmit} className="w-52 lg:w-64">
            <div className="group relative">
              <SearchIcon className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-indigo-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-200 bg-gray-100 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-colors"
              />
              <SearchDropdown query={searchQuery} onSelect={clearSearch} />
            </div>
          </form>

          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-indigo-600 active:bg-gray-200 transition-colors"
          >
            <CartIcon className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <Menu as="div" className="relative shrink-0">
            <MenuButton className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors whitespace-nowrap">
              Login
              <ChevronDownIcon className="size-4" />
            </MenuButton>
            <MenuItems
              transition
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-gray-200 focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              <div className="p-1">
                {loginOptions.map((option) => (
                  <MenuItem key={option.name}>
                    <Link
                      to={option.to}
                      className="block rounded-lg px-4 py-3 hover:bg-gray-50 data-focus:bg-gray-50"
                    >
                      <span className="block text-sm font-semibold text-gray-900">{option.name}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
                    </Link>
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Menu>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="md:hidden col-start-3 flex items-center justify-self-end gap-1">
          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="relative flex size-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <CartIcon className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
          </button>
        </div>
      </nav>

      {/* Search bar - mobile, its own full-width row, always visible */}
      <div className="md:hidden border-t border-gray-100 px-4 py-2.5">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-gray-200 bg-gray-100 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-colors"
          />
          <SearchDropdown query={searchQuery} onSelect={clearSearch} />
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden border-t border-gray-200 transition-[max-height] duration-300 ease-in-out ${
          mobileOpen ? 'max-h-96' : 'max-h-0 border-t-0'
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
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-200">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Login as</p>
            {loginOptions.map((option) => (
              <Link
                key={option.name}
                to={option.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {option.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}