import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const roleConfig = {
  admin: {
    title: 'Admin Login',
    subtitle: 'Sign in to manage your store',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-500',
  },
  customer: {
    title: 'Customer Login',
    subtitle: 'Sign in to shop and track orders',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500',
  },
}

export default function Login() {
  const { role } = useParams()
  const config = roleConfig[role] ?? roleConfig.customer
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Auth will be wired up later
    console.log(`Login as ${role}:`, { email, password })
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        <p className="text-gray-500 mt-1 mb-6">{config.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors ${config.buttonClass}`}
          >
            Sign in as {role === 'admin' ? 'Admin' : 'Customer'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {role === 'admin' ? (
            <>Shopping instead? <Link to="/login/customer" className="text-indigo-600 font-medium">Customer login</Link></>
          ) : (
            <>Store owner? <Link to="/login/admin" className="text-indigo-600 font-medium">Admin login</Link></>
          )}
        </p>
      </div>
    </div>
  )
}
