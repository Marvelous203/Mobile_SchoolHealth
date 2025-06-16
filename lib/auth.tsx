"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { jwtDecode } from "jwt-decode"

// Get API URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// Login response interface
export interface LoginResponse {
    success: boolean
    data: string // JWT token
    message?: string
}

// Register interfaces
export interface StudentParent {
    studentCode: string
    type: "father" | "mother" | "guardian"
}

export interface RegisterRequest {
    password: string
    email: string
    image?: string
    fullName: string
    phone: string
    role: "admin" | "parent" | "student" | "nurse"
    isDeleted?: boolean
    studentParents?: StudentParent[]
}

export interface RegisterResponse {
    success: boolean
    message: string
    data?: any
    errors?: any[] // Add this for validation errors
}

// Helper function to make API calls for auth
const authApiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    console.log('🔄 Auth API Call:', {
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body as string) : null
    })
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      } as HeadersInit,
    });
    
    console.log('📡 Auth API Response Status:', response.status, response.statusText)
    
    // Always try to parse response body
    const responseData = await response.json().catch(() => null)
    
    console.log('📦 Auth API Response Data:', responseData)
    
    if (!response.ok) {
      // Create error with server message if available
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      
      if (responseData && responseData.message) {
        errorMessage = responseData.message
      }
      
      console.error('❌ Auth API Error:', {
        status: response.status,
        message: errorMessage,
        data: responseData
      })
      
      const error = new Error(errorMessage)
      // Attach the full error response for detailed handling
      ;(error as any).response = {
        status: response.status,
        data: responseData
      }
      throw error
    }
    
    console.log('✅ Auth API Success:', responseData)
    return responseData
  } catch (error: any) {
    console.error('🚨 Auth API Call Error:', error)
    
    // If it's already our custom error, re-throw it
    if (error.response) {
      throw error
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message === 'Network request failed') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.')
    }
    
    // Re-throw other errors
    throw error
  }
};

// Auth API methods
export const authApi = {
  // Authentication with real API
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('🔐 Starting login process for:', email)
      
      const response = await authApiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      console.log('🎯 Login API Response:', response)
      return response;
    } catch (error) {
      console.error('💥 Login error:', error);
      throw error; // Re-throw the original error instead of creating a new one
    }
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      console.log('📝 Starting registration process for:', userData.email)
      console.log('📋 Registration data:', {
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        role: userData.role,
        studentParents: userData.studentParents
      })
      
      const response = await authApiCall('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      console.log('🎯 Register API Response:', response)
      return response;
    } catch (error: any) {
      console.error('💥 Register error:', error)
      console.error('Register error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      })
      
      // Re-throw the original error to preserve server messages
      throw error;
    }
  },
};

// Define the shape of our auth context
interface AuthContextType {
  user: User | null
  isLoading: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getUserProfile: (userId: string) => Promise<UserProfile> // Add this
  refreshUserProfile: () => Promise<void> // Add this
}

// User type
interface User {
  id: string
  email: string
  role: "parent" | "student" | "nurse"
  name: string
}

// JWT payload interface
interface JWTPayload {
  id: string
  email: string
  role: "parent" | "student" | "nurse"
  name: string
  exp: number
  iat: number
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('🔍 Loading user from storage...')
        const storedToken = await AsyncStorage.getItem("jwt_token")
        
        if (storedToken) {
          console.log('📱 Found stored token:', storedToken.substring(0, 20) + '...')
          
          // Verify token is not expired
          const decoded = jwtDecode<JWTPayload>(storedToken)
          console.log('🔓 Decoded token:', decoded)
          
          const currentTime = Date.now() / 1000
          
          if (decoded.exp > currentTime) {
            // Token is valid
            console.log('✅ Token is valid, setting user')
            setToken(storedToken)
            setUser({
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
              name: decoded.name
            })
          } else {
            // Token expired, remove it
            console.log('⏰ Token expired, removing from storage')
            await AsyncStorage.removeItem("jwt_token")
          }
        } else {
          console.log('📭 No stored token found')
        }
      } catch (error) {
        console.error("❌ Failed to load user from storage", error)
        // If token is invalid, remove it
        await AsyncStorage.removeItem("jwt_token")
      } finally {
        setIsLoading(false)
        console.log('🏁 User loading complete')
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    console.log('🚀 Login function called with email:', email)
    setIsLoading(true)
    
    try {
      // Call auth API
      const response = await authApi.login(email, password)
      console.log('📨 Login response received:', response)
      
      if (response.success && response.data) {
        const jwtToken = response.data
        console.log('🎫 JWT Token received:', jwtToken.substring(0, 20) + '...')
        
        // Decode JWT to get user info
        const decoded = jwtDecode<JWTPayload>(jwtToken)
        console.log('🔍 Decoded JWT payload:', decoded)
        
        const userData: User = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name
        }
        console.log('👤 User data created:', userData)

        // Save token to storage
        await AsyncStorage.setItem("jwt_token", jwtToken)
        console.log('💾 Token saved to storage')
        
        // Update state
        setToken(jwtToken)
        setUser(userData)
        console.log('🔄 State updated with user and token')

        // Navigate based on role
        console.log('🧭 Navigating based on role:', userData.role)
        if (userData.role === "parent") {
          router.replace("/(tabs)/(parent)/home")
        } else if (userData.role === "student") {
          router.replace("/(tabs)/(student)/home")
        } else if (userData.role === "nurse") {
          router.replace("/(tabs)/(nurse)/home")
        }
      } else {
        console.error('❌ Login failed: Invalid response structure', response)
        throw new Error("Login failed: Invalid response")
      }
    } catch (error) {
      console.error("💥 Login failed with error:", error)
      throw error
    } finally {
      setIsLoading(false)
      console.log('🏁 Login process complete')
    }
  }

  // Logout function
  const logout = async () => {
    console.log('🚪 Logout function called')
    setIsLoading(true)
    
    try {
      await AsyncStorage.removeItem("jwt_token")
      console.log('🗑️ Token removed from storage')
      
      setUser(null)
      setToken(null)
      console.log('🔄 State cleared')
      
      router.replace("/(tabs)/(auth)/login")
      console.log('🧭 Navigated to login page')
    } catch (error) {
      console.error("❌ Logout failed", error)
    } finally {
      setIsLoading(false)
      console.log('🏁 Logout process complete')
    }
  }

  // Get user profile by ID
  const getUserProfile = async (userId: string): Promise<UserProfile> => {
    try {
      console.log('🔍 Getting user profile for ID:', userId)
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user profile')
      }
      
      console.log('✅ User profile retrieved:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ Get user profile error:', error)
      throw error
    }
  }

  // Refresh current user profile
  const refreshUserProfile = async () => {
    if (!user?.id || !token) return
    
    try {
      console.log('🔄 Refreshing user profile...')
      const profileData = await getUserProfile(user.id)
      
      // Update user state with fresh data
      setUser({
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        name: profileData.fullName
      })
      
      console.log('✅ User profile refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh user profile:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      token, 
      login, 
      logout, 
      getUserProfile, 
      refreshUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Helper function to get auth headers for API calls
export const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("jwt_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}
