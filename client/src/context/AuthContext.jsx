import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    
    if (token && username) {
      setUser({ token, username })
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await api.login({ username, password })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Giriş başarısız!')
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
    setUser({ token: data.token, username: data.username })
    return data
  }

  const register = async (username, password) => {
    const res = await api.register({ username, password })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Kayıt başarısız!')
    }

    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser(null)
  }

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${user?.token}`,
    'Content-Type': 'application/json'
  })

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getAuthHeader }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
