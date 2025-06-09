import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = 'http://localhost:5000/api'

  useEffect(() => {
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchProfile = async () => {
    try {
      // First decode the token to check if user is admin
      const tokenPayload = token ? JSON.parse(atob(token.split('.')[1])) : null
      
      // If user is admin, skip profile fetch since admins don't have profiles
      if (tokenPayload && tokenPayload.user_type === 'admin') {
        // Keep existing user data if already set (from login)
        setLoading(false)
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.profile || userData)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {      
      // Add defensive programming for browser extension conflicts
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      const data = await response.json()

      if (response.ok) {
        const token = data.access_token || data.token
        setToken(token)
        setUser(data.user)
        localStorage.setItem('token', token)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      
      // Handle browser extension conflicts and network errors gracefully
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout - please try again' }
      }
      
      // Check if error is related to browser extensions
      if (error.message && error.message.includes('message channel')) {
        return { success: false, error: 'Browser extension conflict detected. Please try disabling extensions or use incognito mode.' }
      }
      
      console.error('Login error:', error)
      return { success: false, error: 'Network error - please check your connection and try again' }
    }
  }

  const register = async (userData) => {
    try {
      // Add defensive programming for browser extension conflicts
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (response.ok) {
        const token = data.access_token || data.token
        setToken(token)
        setUser(data.user)
        localStorage.setItem('token', token)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      // Handle browser extension conflicts and network errors gracefully
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout - please try again' }
      }
      
      // Check if error is related to browser extensions
      if (error.message && error.message.includes('message channel')) {
        return { success: false, error: 'Browser extension conflict detected. Please try disabling extensions or use incognito mode.' }
      }
      
      console.error('Registration error:', error)
      return { success: false, error: 'Network error - please check your connection and try again' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        // Refresh user data
        await fetchProfile()
        return { success: true }
      } else {
        const data = await response.json()
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    API_BASE_URL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

