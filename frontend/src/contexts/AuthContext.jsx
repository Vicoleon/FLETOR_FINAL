import { useState, useEffect, createContext, useContext } from 'react'
import { API_BASE_URL } from '../config/api'

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
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
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
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: 'An unexpected error occurred.' };
    }
  };

  const recoverPasswordOnScreen = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, recovered_password: data.recovered_password, message: data.message };
      } else {
        return { success: false, error: data.error || 'Password recovery failed' };
      }
    } catch (error) {
      console.error("Password recovery error:", error);
      return { success: false, error: 'An unexpected error occurred during password recovery.' };
    }
  };

  const resetPasswordOnScreen = async (email, new_password) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password-on-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Password reset failed' };
      }
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, error: 'An unexpected error occurred during password reset.' };
    }
  };

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
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
    recoverPasswordOnScreen,
    resetPasswordOnScreen,
    API_BASE_URL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

