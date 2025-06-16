// This is the API service for the School Health Manager app
// Updated to use real API endpoints

// Get API URL from environment variables
import { getAuthHeaders } from './auth';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// Helper function to make API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const authHeaders = await getAuthHeaders()
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      } as HeadersInit,
    });
    
    // Always try to parse response body
    const responseData = await response.json().catch(() => null)
    
    if (!response.ok) {
      // Create error with server message if available
      let errorMessage = `API Error: ${response.status} ${response.statusText}`
      
      if (responseData && responseData.message) {
        errorMessage = responseData.message
      }
      
      const error = new Error(errorMessage)
      // Attach the full error response for detailed handling
      ;(error as any).response = {
        status: response.status,
        data: responseData
      }
      throw error
    }
    
    return responseData
  } catch (error: any) {
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

// Types
export interface Student {
    id: string
    name: string
    class: string
    dob: string
    allergies: string[]
    chronicDiseases: string[]
    vision: string
    hearing: string
}

export interface MedicineSubmission {
    id: string
    studentId: string
    medicineName: string
    dosage: string
    timesPerDay: number
    startDate: string
    endDate: string
    notes: string
    status: "pending" | "approved" | "completed"
}

export interface VaccinationSession {
    id: string
    name: string
    date: string
    description: string
    status: "upcoming" | "in-progress" | "completed"
    details: string[]
    contraindications: string[]
}

export interface VaccinationConsent {
    id: string
    sessionId: string
    studentId: string
    consent: boolean
    notes: string
    status: "pending" | "approved" | "completed"
}

export interface HealthCheckSession {
    id: string
    name: string
    date: string
    description: string
    status: "upcoming" | "in-progress" | "completed"
    checkItems: string[]
}

export interface HealthCheckResult {
    id: string
    sessionId: string
    studentId: string
    height: number
    weight: number
    vision: string
    heartRate: number
    notes: string
    abnormal: boolean
}

export interface MedicalIncident {
    id: string
    studentId: string
    type: "fever" | "fall" | "injury" | "other"
    description: string
    treatment: string
    date: string
    nurseId: string
}

// Login response interface
export interface LoginResponse {
    success: boolean
    data: string // JWT token
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

// User Profile interfaces
export interface UserProfile {
    id: string
    email: string
    fullName: string
    phone: string
    role: "admin" | "parent" | "student" | "nurse"
    image?: string
    isDeleted?: boolean
    studentParents?: StudentParent[]
    createdAt?: string
    updatedAt?: string
}

export interface GetUserProfileResponse {
    success: boolean
    message: string
    data: UserProfile
}

// API methods
export const api = {
    // Authentication with real API
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid credentials');
        }
    },

    // Register new user
    register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
        try {
            const response = await apiCall('/users/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            return response;
        } catch (error) {
            console.error('Register error:', error);
            throw new Error('Registration failed');
        }
    },

    // Student data
    getStudentProfile: async (studentId: string) => {
        return apiCall(`/students/${studentId}`);
    },

    updateStudentProfile: async (studentId: string, data: Partial<Student>) => {
        return apiCall(`/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Vaccination
    getVaccinationSessions: async () => {
        return apiCall('/vaccinations/sessions');
    },

    getVaccinationSession: async (sessionId: string) => {
        return apiCall(`/vaccinations/sessions/${sessionId}`);
    },

    submitVaccinationConsent: async (data: Omit<VaccinationConsent, "id" | "status">) => {
        return apiCall('/vaccinations/consent', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Health Checkups
    getHealthCheckSessions: async () => {
        return apiCall('/health-checks/sessions');
    },

    getHealthCheckSession: async (sessionId: string) => {
        return apiCall(`/health-checks/sessions/${sessionId}`);
    },

    submitHealthCheckConsent: async (sessionId: string, studentId: string, consent: boolean) => {
        return apiCall('/health-checks/consent', {
            method: 'POST',
            body: JSON.stringify({ sessionId, studentId, consent })
        });
    },

    // Medicine submissions
    submitMedicine: async (data: Omit<MedicineSubmission, "id" | "status">) => {
        return apiCall('/medicine/submissions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getMedicineSubmissions: async () => {
        return apiCall('/medicine/submissions');
    },

    // Nurse functions
    recordMedicalIncident: async (data: Omit<MedicalIncident, "id">) => {
        return apiCall('/medical-incidents', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    recordHealthCheckResult: async (data: Omit<HealthCheckResult, "id">) => {
        return apiCall('/health-checks/results', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getPendingMedicineSubmissions: async () => {
        return apiCall('/medicine/submissions?status=pending');
    },

    getVaccinationHistory: async (studentId: string) => {
        return apiCall(`/students/${studentId}/vaccination-history`);
    },

    getHealthCheckHistory: async (studentId: string) => {
        return apiCall(`/students/${studentId}/health-check-history`);
    },

    // User Profile - Get user by ID (works for all roles)
    getUserProfile: async (userId: string): Promise<GetUserProfileResponse> => {
        try {
            console.log('👤 Getting user profile for ID:', userId)
            
            const response = await apiCall(`/users/${userId}`, {
                method: 'GET'
            });
            
            console.log('📋 User profile response:', response)
            return response;
        } catch (error) {
            console.error('❌ Get user profile error:', error);
            throw error; // Re-throw to preserve server error messages
        }
    },

    // Get current user profile (using token)
    getCurrentUserProfile: async (): Promise<GetUserProfileResponse> => {
        try {
            console.log('👤 Getting current user profile from token')
            
            const response = await apiCall('/users/me', {
                method: 'GET'
            });
            
            console.log('📋 Current user profile response:', response)
            return response;
        } catch (error) {
            console.error('❌ Get current user profile error:', error);
            throw error;
        }
    },

    // Update user profile
    updateUserProfile: async (userId: string, userData: Partial<UserProfile>): Promise<GetUserProfileResponse> => {
        try {
            console.log('✏️ Updating user profile for ID:', userId)
            console.log('📝 Update data:', userData)
            
            const response = await apiCall(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            console.log('✅ User profile updated:', response)
            return response;
        } catch (error) {
            console.error('❌ Update user profile error:', error);
            throw error;
        }
    },

    // User profile methods
    getCurrentUser: async (): Promise<UserProfile> => {
        try {
            console.log('Fetching current user profile...');
            const response = await apiCall('/users');
            console.log('Current user profile response:', response);
            return response;
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    },

    getUserById: async (userId: string): Promise<UserProfile> => {
        try {
            console.log(`Fetching user profile for ID: ${userId}`);
            const response = await apiCall(`/users/${userId}`);
            console.log('User profile response:', response);
            return response;
        } catch (error) {
            console.error('Get user by ID error:', error);
            throw error;
        }
    },

    updateCurrentUser: async (userData: Partial<UserProfile>): Promise<UserProfile> => {
        try {
            console.log('Updating current user profile:', userData);
            const response = await apiCall('/users', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            console.log('Update user profile response:', response);
            return response;
        } catch (error) {
            console.error('Update current user error:', error);
            throw error;
        }
    },

    // Student methods
    getStudentById: async (studentId: string): Promise<any> => {
        try {
            console.log(`Fetching student profile for ID: ${studentId}`);
            const response = await apiCall(`/students/${studentId}`);
            console.log('Student profile response:', response);
            return response;
        } catch (error) {
            console.error('Get student by ID error:', error);
            throw error;
        }
    },
        // Blog methods
    searchBlogs: async (params: BlogSearchParams = {}): Promise<BlogSearchResponse> => {
        try {
            const queryParams = new URLSearchParams()
            
            if (params.query) queryParams.append('query', params.query)
            if (params.categoryId) queryParams.append('categoryId', params.categoryId)
            if (params.userId) queryParams.append('userId', params.userId)
            if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
            if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString())
            
            const endpoint = `/blogs/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`
            console.log('🔍 Searching blogs with endpoint:', endpoint)
            
            const response = await apiCall(endpoint, {
                method: 'GET'
            })
            
            console.log('📚 Blog search response:', response)
            return response
        } catch (error) {
            console.error('❌ Search blogs error:', error)
            throw error
        }
    },

    getBlogById: async (blogId: string): Promise<BlogDetailResponse> => {
        try {
            console.log('📖 Getting blog detail for ID:', blogId)
            
            const response = await apiCall(`/blogs/${blogId}`, {
                method: 'GET'
            })
            
            console.log('📄 Blog detail response:', response)
            return response
        } catch (error) {
            console.error('❌ Get blog detail error:', error)
            throw error
        }
    },

    // Comment methods
// Thêm method này vào object api
getCommentById: async (commentId: string): Promise<{ success: boolean; data: any; message?: string }> => {
    try {
        console.log('📝 Getting comment by ID:', commentId)
        
        const response = await apiCall(`/comments/${commentId}`, {
            method: 'GET'
        })
        
        console.log('📝 Comment response:', response)
        return response
    } catch (error) {
        console.error('❌ Get comment by ID error:', error)
        throw error
    }
},
searchVaccineEvents: async (pageNum: number = 1, pageSize: number = 10): Promise<VaccineEventSearchResponse> => {
    try {
        console.log(`🔍 Searching vaccine events - Page: ${pageNum}, Size: ${pageSize}`)
        
        const response = await apiCall(`/vaccine-events/search/${pageNum}/${pageSize}`, {
            method: 'GET'
        })
        
        console.log('💉 Vaccine events search response:', response)
        return response
    } catch (error) {
        console.error('❌ Search vaccine events error:', error)
        throw error
    }
},

getVaccineEventById: async (eventId: string): Promise<VaccineEventDetailResponse> => {
    try {
        console.log('📋 Getting vaccine event detail for ID:', eventId)
        
        const response = await apiCall(`/vaccine-events/${eventId}`, {
            method: 'GET'
        })
        
        console.log('💉 Vaccine event detail response:', response)
        return response
    } catch (error) {
        console.error('❌ Get vaccine event detail error:', error)
        throw error
    }
},



};

