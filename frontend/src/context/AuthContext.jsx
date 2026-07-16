import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const BASE_URL = import.meta.env.VITE_DJANGO_URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [tokens, setTokens] = useState(() => {
    const access = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    return access && refresh ? { access, refresh } : null
  })
  const [loading, setLoading] = useState(true)

  // Fetch user profile when tokens exist
  useEffect(() => {
    if (tokens?.access) {
      fetch(`${BASE_URL}/api/profile/`, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch profile')
          return res.json()
        })
        .then((data) => {
          setUser(data)
          setLoading(false)
        })
        .catch(() => {
          // Token might be expired, try refresh
          if (tokens.refresh) {
            refreshTokens(tokens.refresh)
              .then((newTokens) => {
                if (newTokens) {
                  setTokens(newTokens)
                  localStorage.setItem('access_token', newTokens.access)
                  localStorage.setItem('refresh_token', newTokens.refresh)
                } else {
                  logout()
                }
              })
              .catch(() => logout())
          } else {
            logout()
          }
          setLoading(false)
        })
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [tokens?.access])

  const refreshTokens = async (refreshToken) => {
    try {
      const res = await fetch(`${BASE_URL}/api/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (!res.ok) return null
      const data = await res.json()
      return { access: data.access, refresh: refreshToken }
    } catch {
      return null
    }
  }

  const login = async (username, password) => {
    const res = await fetch(`${BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.detail || 'Invalid username or password')
    }

    const data = await res.json()
    const newTokens = {
      access: data.access,
      refresh: data.refresh,
    }
    setTokens(newTokens)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const res = await fetch(`${BASE_URL}/api/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(
        typeof data === 'string'
          ? data
          : Object.values(data).flat().join(' ')
      )
    }

    // Do NOT auto-login — user must sign in manually
    return true
  }

  const logout = () => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  return (
    <AuthContext.Provider
      value={{ user, tokens, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)