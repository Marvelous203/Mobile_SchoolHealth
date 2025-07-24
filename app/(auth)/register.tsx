"use client"

import { authApi, type RegisterRequest } from "@/lib/auth"
import { Link, router } from "expo-router"
import { useState } from "react"
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { ScrollView, TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // For parent role - student relationships
  const [studentCode, setStudentCode] = useState("")
  const [parentType, setParentType] = useState<"father" | "mother" | "guardian">("father")

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự"
    }
    
    if (!/[A-Z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ cái viết hoa"
    }
    
    if (!/[a-z]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 chữ cái viết thường"
    }
    
    if (!/[0-9]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 số"
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*(),.?\":{}|<>)"
    }
    
    return null
  }

  const handleRegister = async () => {
    // Basic validation
    if (!name || !email || !password || !confirmPassword || !phone) {
      setError("Please fill in all fields")
      return
    }

    // Validate password strength
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate student code only for mother role
    if (parentType === "mother" && !studentCode) {
      setError("Please enter student code for mother registration")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Prepare registration data for parent
      const registerData: RegisterRequest = {
        password,
        email,
        fullName: name,
        phone,
        role: "parent", // Fixed as parent
        isDeleted: false,
        // Only include studentParents if studentCode is provided
        ...(studentCode && {
          studentParents: [{
            studentCode,
            type: parentType
          }]
        })
      }
      
      // Debug: Log the data being sent
      console.log('Sending registration data:', JSON.stringify(registerData, null, 2))

      // Call register API
      const response = await authApi.register(registerData)
      
      if (response.success) {
        Alert.alert(
          "Registration Successful", 
          response.message || "Your parent account has been created successfully. Please login.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login")
            }
          ]
        )
      } else {
        // Handle error response with message or errors array
        let errorMessage = response.message || "Registration failed"
        
        // If there are specific errors, show them
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          errorMessage = response.errors.map(error => {
            if (typeof error === 'object' && error.message) {
              return error.message
            }
            return error.toString()
          }).join(', ')
        }
        
        setError(errorMessage)
      }
    } catch (err: any) {
      console.log('=== REGISTER ERROR DEBUG ===')
      console.log('Error object:', err)
      console.log('Error message:', err.message)
      console.log('Error response:', err.response)
      console.log('Error response data:', err.response?.data)
      console.log('==========================')
      
      // Handle network or other errors
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại."
      
      console.error('Register error:', err)
      
      // Priority 1: Use the error message directly if it's from our API
      if (err.message && !err.message.includes('API Error:')) {
        errorMessage = err.message
      }
      // Priority 2: Check for detailed error response
      else if (err.response && err.response.data) {
        const errorData = err.response.data
        
        // Check if there's a message in the error response
        if (errorData.message) {
          errorMessage = errorData.message
        }
        
        // Check if there are errors array in the error response
        else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMessage = errorData.errors.map(error => {
            if (typeof error === 'object' && error.message) {
              return error.message
            }
            return error.toString()
          }).join('\n')
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: "https://via.placeholder.com/120" }} style={styles.logo} />
          <Text style={styles.title}>Parent Registration</Text>
          <Text style={styles.subtitle}>Join School Health Manager as a Parent</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Enter your full name" value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student Code {parentType === "mother" ? "*" : "(Optional)"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={parentType === "mother" 
                ? "Enter student code (required for mother)" 
                : "Enter student code (optional)"}
              value={studentCode}
              onChangeText={setStudentCode}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.roleSelector}>
            <Text style={styles.label}>Relationship:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, parentType === "father" && styles.selectedRole]}
                onPress={() => setParentType("father")}
              >
                <Text style={styles.roleText}>Father</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, parentType === "mother" && styles.selectedRole]}
                onPress={() => setParentType("mother")}
              >
                <Text style={styles.roleText}>Mother</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, parentType === "guardian" && styles.selectedRole]}
                onPress={() => setParentType("guardian")}
              >
                <Text style={styles.roleText}>Guardian</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? "Creating Account..." : "Register as Parent"}</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: "#ff4d4f",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  roleSelector: {
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedRole: {
    backgroundColor: "#e6f7ff",
    borderColor: "#1890ff",
  },
  roleText: {
    fontSize: 14,
  },
  button: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#bae7ff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#666",
  },
  loginLink: {
    color: "#1890ff",
    fontWeight: "600",
  },
})
