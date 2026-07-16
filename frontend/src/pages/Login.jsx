import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const roleConfig = {
  admin: {
    title: 'Admin Login',
    subtitle: 'Manage products, orders, and inventory',
    accent: 'from-indigo-600 to-violet-700',
    button: 'bg-indigo-600 hover:bg-indigo-500',
  },
  customer: {
    title: 'Customer Login',
    subtitle: 'Shop, track orders, and save favorites',
    accent: 'from-emerald-600 to-teal-700',
    button: 'bg-emerald-600 hover:bg-emerald-500',
  },
}

export default function Login() {
  const { role } = useParams()
  const config = roleConfig[role] ?? roleConfig.customer
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(`Login as ${role}:`, { email, password })
  }

  return (
    <div className="page-container py-10 sm:py-16">
      <div className="card mx-auto max-w-4xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className={`bg-gradient-to-br ${config.accent} p-8 text-white sm:p-10`}>
            <p className="text-sm font-medium uppercase tracking-wider text-white/70">MyStore</p>
            <h1 className="mt-4 text-3xl font-bold">{config.title}</h1>
            <p className="mt-3 text-white/80">{config.subtitle}</p>
            <ul className="mt-8 space-y-3 text-sm text-white/90">
              <li>• Secure sign-in</li>
              <li>• Order history</li>
              <li>• Personalized experience</li>
            </ul>
          </div>

          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className={`btn-primary w-full ${config.button}`}>
                Sign in as {role === 'admin' ? 'Admin' : 'Customer'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {role === 'admin' ? (
                <>Shopping? <Link to="/login/customer" className="font-medium text-indigo-600">Customer login</Link></>
              ) : (
                <>Store owner? <Link to="/login/admin" className="font-medium text-indigo-600">Admin login</Link></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
