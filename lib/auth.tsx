"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Define the shape of our auth context
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role: string) => Promise<void>
  logout: () => Promise<void>
}

// User type
interface User {
  id: string
  email: string
  role: "parent" | "student" | "nurse"
  name: string
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on app load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user")
        if (userJson) {
          const userData = JSON.parse(userJson)
          setUser(userData)
        }
      } catch (error) {
        console.error("Failed to load user from storage", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (email: string, password: string, role: string) => {
    setIsLoading(true)
    try {
      // In a real app, you would validate credentials with your API
      // For this example, we'll just create a mock user
      const mockUser: User = {
        id: "123",
        email,
        role: role as "parent" | "student" | "nurse",
        name: email.split("@")[0],
      }

      // Save to storage
      await AsyncStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)

      // Navigate based on role
      if (role === "parent") {
        router.replace("/(tabs)/(parent)/home")
      } else if (role === "student") {
        router.replace("/(tabs)/(student)/home")
      } else if (role === "nurse") {
        router.replace("/(tabs)/(nurse)/home")
      }
    } catch (error) {
      console.error("Login failed", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    setIsLoading(true)
    try {
      await AsyncStorage.removeItem("user")
      setUser(null)
      router.replace("/(tabs)/(auth)/login")
    } catch (error) {
      console.error("Logout failed", error)
    } finally {
      setIsLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
