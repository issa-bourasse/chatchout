import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, createContext, useContext, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Signup from './components/Signup'
import ChatApp from './components/ChatApp'
import VideoCall from './components/VideoCall'
import QueryProvider from './context/QueryProvider'
import { SocketProvider } from './context/SocketContext'
import { StreamVideoProvider } from './context/StreamVideoContext'
import { authAPI, setAuthToken, setUser, getAuthToken, getUser } from './services/api'

// Auth Context
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getUser())
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated on app start
  useEffect(() => {
    const token = getAuthToken()
    if (token && !user) {
      // Verify token with server
      authAPI.getMe()
        .then(response => {
          setUserState(response.data.user)
          setUser(response.data.user)
        })
        .catch(() => {
          // Token is invalid
          logout()
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user: userData } = response.data

      setAuthToken(token)
      setUser(userData)
      setUserState(userData)

      return { success: true, user: userData }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const signup = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { token, user: newUser } = response.data

      setAuthToken(token)
      setUser(newUser)
      setUserState(newUser)

      return { success: true, user: newUser }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setAuthToken(null)
      setUser(null)
      setUserState(null)
    }
  }

  const updateUser = (updatedUser) => {
    setUserState(updatedUser)
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      signup,
      updateUser,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>
          <StreamVideoProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatApp />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video-call/:callType/:callId"
                  element={
                    <ProtectedRoute>
                      <VideoCall />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </StreamVideoProvider>
      </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
