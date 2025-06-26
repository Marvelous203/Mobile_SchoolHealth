// This is the API service for the School Health Manager app
// Updated to use real API endpoints

// Get API URL from environment variables
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { getAuthHeaders } from './auth';
import {
    CreateHealthRecordRequest,
    CreateHealthRecordResponse,
    HealthRecordDetailResponse,
    HealthRecordSearchParams,
    HealthRecordSearchResponse,
    MedicalEvent,
    MedicalEventSearchParams,
    MedicalEventSearchResponse,
    MedicineSubmissionDetailResponse,
    MedicineSubmissionSearchParams,
    MedicineSubmissionSearchResponse
} from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// JWT payload interface for decoding token
interface JWTPayload {
  userId: string
  email: string
  role: string
  exp: number
  iat: number
}

// Helper function to get current user ID from stored token
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('jwt_token')
    if (!token) {
      console.log('❌ No token found in storage')
      return null
    }
    
    const decoded = jwtDecode<JWTPayload>(token)
    console.log('🔍 Decoded token for userId:', decoded)
    
    // Check if token is expired
    const currentTime = Date.now() / 1000
    if (decoded.exp <= currentTime) {
      console.log('⏰ Token expired')
      return null
    }
    
    return decoded.userId || null
  } catch (error) {
    console.error('❌ Error getting current user ID:', error)
    return null
  }
}

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

// Types (Student interface moved to bottom to avoid duplicates)

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
    _id: string
    email: string
    fullName: string
    phone: string
    role:"parent" | "student" | "nurse"
    image?: string
    isDeleted?: boolean
    studentParents?: StudentParent[]
    studentIds?: string[]
    createdAt?: string
    updatedAt?: string
}

export interface GetUserProfileResponse {
    success: boolean
    message: string
    data: UserProfile
}


export interface MedicineItem {
    name: string
    dosage: string
    usageInstructions: string
    quantity: number
    timesPerDay: number
    timeSlots: string[]
    startDate: string
    endDate: string
    note: string
    reason: string
  }
  
  export interface CreateMedicineSubmissionRequest {
    parentId: string
    studentId: string
    schoolNurseId: string
    medicines: MedicineItem[]
  }
  
  export interface CreateMedicineSubmissionResponse {
    success: boolean
    data?: {
      id: string
      status: string
      createdAt: string
    }
    message?: string
  }
  // SchoolNurse interface moved to bottom to avoid duplicates
  
  export interface SchoolNurseSearchResponse {
    pageData: SchoolNurse[]
    pageInfo: {
      pageNum: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
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

    searchMedicineSubmissions: async (params: MedicineSubmissionSearchParams): Promise<MedicineSubmissionSearchResponse> => {
      try {
        const queryParams = new URLSearchParams()
        
        if (params.parentId) queryParams.append('parentId', params.parentId)
        if (params.studentId) queryParams.append('studentId', params.studentId)
        if (params.status) queryParams.append('status', params.status)
        if (params.query) queryParams.append('query', params.query)
        
        const endpoint = `/medicine-submissions/search/${params.pageNum}/${params.pageSize}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        console.log('🔍 Searching medicine submissions:', endpoint)
        
        const response = await apiCall(endpoint, {
          method: 'GET'
        })
        
        console.log('💊 Medicine submissions search response:', response)
        return response
      } catch (error) {
        console.error('❌ Search medicine submissions error:', error)
        throw error
      }
    },

    // Thêm method mới để lấy chi tiết medicine submission
    getMedicineSubmissionById: async (submissionId: string): Promise<MedicineSubmissionDetailResponse> => {
      try {
        console.log('📋 Getting medicine submission detail for ID:', submissionId)
        
        const response = await apiCall(`/medicine-submissions/${submissionId}`, {
          method: 'GET'
        })
        
        console.log('💊 Medicine submission detail response:', response)
        return response
      } catch (error) {
        console.error('❌ Get medicine submission detail error:', error)
        throw error
      }
    },
    
    // Giữ lại method cũ để tương thích ngược
    getMedicineSubmissions: async () => {
      return apiCall('/medicine/submissions')
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
    createComment: async (request: CreateCommentRequest): Promise<CreateCommentResponse> => {
        try {
            console.log('💬 Creating comment:', request)
            
            const response = await apiCall('/comments/create', {
                method: 'POST',
                body: JSON.stringify(request)
            })
            
            console.log('✅ Comment created:', response)
            return response
        } catch (error) {
            console.error('❌ Create comment error:', error)
            throw error
        }
    },

    getComments: async (blogId: string): Promise<GetCommentsResponse> => {
        try {
            console.log('📝 Getting comments for blog:', blogId)
            
            const response = await apiCall(`/comments/blog/${blogId}`, {
                method: 'GET'
            })
            
            console.log('💬 Comments response:', response)
            return response
        } catch (error) {
            console.error('❌ Get comments error:', error)
            throw error
        }
    },

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

    // Vaccine Registration methods
    getVaccineRegistrationById: async (registrationId: string): Promise<VaccineRegistrationDetailResponse> => {
        try {
            console.log('💉 Getting vaccine registration detail for ID:', registrationId)
            
            const response = await apiCall(`/vaccine-registration/${registrationId}`, {
                method: 'GET'
            })
            
            console.log('📋 Vaccine registration detail response:', response)
            return response
        } catch (error) {
            console.error('❌ Get vaccine registration detail error:', error)
            throw error
        }
    },

    updateVaccineRegistrationStatus: async (registrationId: string, updateData: VaccineRegistrationUpdateRequest): Promise<VaccineRegistrationUpdateResponse> => {
        try {
            console.log('🔄 Updating vaccine registration status:', registrationId, updateData)
            
            const response = await apiCall(`/vaccine-registration/${registrationId}/status`, {
                method: 'PATCH',
                body: JSON.stringify(updateData)
            })
            
            console.log('✅ Vaccine registration status updated:', response)
            return response
        } catch (error) {
            console.error('❌ Update vaccine registration status error:', error)
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

getVaccineEventById: async (eventId: string): Promise<VaccineEventDetailResponse

> => {
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


createMedicineSubmission: async (request: CreateMedicineSubmissionRequest): Promise<CreateMedicineSubmissionResponse> => {
    try {
      console.log('💊 Creating medicine submission:', request)
      
      const response = await apiCall('/medicine-submissions/create', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      
      console.log('✅ Medicine submission created:', response)
      return response
    } catch (error) {
      console.error('❌ Create medicine submission error:', error)
      throw error
    }
  },
  searchSchoolNurses: async (pageNum: number = 1, pageSize: number = 10, query?: string): Promise<SchoolNurseSearchResponse> => {
    try {
      let endpoint = `/users/search/${pageNum}/${pageSize}?role=school-nurse`
      if (query) {
        endpoint += `&query=${encodeURIComponent(query)}`
      }
      
      console.log('🔍 Searching school nurses:', endpoint)
      
      const response = await apiCall(endpoint, {
        method: 'GET'
      })
      
      console.log('👩‍⚕️ School nurses search response:', response)
      return response
    } catch (error) {
      console.error('❌ Search school nurses error:', error)
      throw error
    }
  },
      // Link students to parent
      linkStudents: async (studentParents: { studentCode: string; type: string }[]): Promise<any> => {
        try {
            console.log('Linking students to parent:', studentParents);
            const response = await apiCall('/users/link-students', {
                method: 'POST',
                body: JSON.stringify({ studentParents })
            });
            console.log('Link students response:', response);
            return response;
        } catch (error) {
            console.error('❌ Link students error:', error);
            throw error;
        }
    },

    // Health Records methods
    searchHealthRecords: async (params: HealthRecordSearchParams): Promise<HealthRecordSearchResponse> => {
        try {
            console.log('🔍 Searching health records:', params)
            
            const queryParams = new URLSearchParams()
            
            if (params.query) queryParams.append('query', params.query)
            if (params.studentId) queryParams.append('studentId', params.studentId)
            if (params.schoolYear) queryParams.append('schoolYear', params.schoolYear)
            
            const endpoint = `/health-records/search/${params.pageNum}/${params.pageSize}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
            console.log('🔍 Health records endpoint:', endpoint)
            
            const response = await apiCall(endpoint, {
                method: 'GET'
            })
            
            console.log('🏥 Health records search response:', response)
            return response
        } catch (error) {
            console.error('❌ Search health records error:', error)
            throw error
        }
    },

    createHealthRecord: async (healthRecordData: CreateHealthRecordRequest): Promise<CreateHealthRecordResponse> => {
        try {
            console.log('📝 Creating health record:', healthRecordData)
            
            const response = await apiCall('/health-records/create', {
                method: 'POST',
                body: JSON.stringify(healthRecordData)
            })
            
            console.log('✅ Health record created successfully:', response)
            return response
        } catch (error) {
            console.error('❌ Create health record error:', error)
            throw error
        }
    },

    getHealthRecordById: async (recordId: string): Promise<HealthRecordDetailResponse> => {
        try {
            console.log('📋 Getting health record detail for ID:', recordId)
            
            const response = await apiCall(`/health-records/${recordId}`, {
                method: 'GET'
            })
            
            console.log('🏥 Health record detail response:', response)
            return response
        } catch (error) {
            console.error('❌ Get health record detail error:', error)
            throw error
        }
    },

    // Medical Events methods
    searchMedicalEvents: async (params: MedicalEventSearchParams): Promise<MedicalEventSearchResponse> => {
        try {
            // Get current user profile to extract studentIds
            let finalParams = { ...params }
            
            // If no specific studentId is provided, get all studentIds from current user profile
            if (!finalParams.userId) {
                try {
                    const token = await AsyncStorage.getItem('token')
                    if (token) {
                        const userProfileResponse = await apiCall('/users/profile', {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        })
                        
                        console.log('👤 Current user profile for medical events:', userProfileResponse.data)
                        
                        if (userProfileResponse.data && userProfileResponse.data.studentIds && userProfileResponse.data.studentIds.length > 0) {
                            // Use the first studentId as default (or you can modify this logic as needed)
                            finalParams.userId = userProfileResponse.data.studentIds[0]
                            console.log('🎯 Using studentId from profile for medical events:', finalParams.userId)
                            console.log('📚 Available studentIds:', userProfileResponse.data.studentIds)
                        }
                    }
                } catch (profileError) {
                    console.warn('⚠️ Could not get user profile for studentIds:', profileError)
                    // Fallback to original logic if profile fetch fails
                    const currentUserId = await getCurrentUserId()
                    if (currentUserId) {
                        finalParams.userId = currentUserId
                        console.log('🔑 Fallback: using current userId for medical events:', currentUserId)
                    }
                }
            }
            
            // Try different endpoint format based on Swagger documentation
            const queryParams = new URLSearchParams()
            
            if (finalParams.query) queryParams.append('query', finalParams.query)
            if (finalParams.userId) queryParams.append('userId', finalParams.userId)
            if (finalParams.isSerious !== undefined) queryParams.append('isSerious', finalParams.isSerious.toString())
            
            // Try format from Swagger: /medical-events/search with query params including pageNum and pageSize
            const endpoint = `/medical-events/search?pageNum=${finalParams.pageNum}&pageSize=${finalParams.pageSize}${queryParams.toString() ? '&' + queryParams.toString() : ''}`
            console.log('🔍 Searching medical events:', endpoint)
            console.log('🌐 API_BASE_URL:', API_BASE_URL)
            console.log('🔗 Full URL:', `${API_BASE_URL}${endpoint}`)
            
            const response = await apiCall(endpoint, {
                method: 'GET'
            })
            
            console.log('🚨 Medical events search response:', response)
            return response
        } catch (error) {
            console.error('❌ Search medical events error:', error)
            throw error
        }
    },

    getMedicalEventById: async (eventId: string): Promise<{ success: boolean; data: MedicalEvent; message?: string }> => {
        try {
            console.log('📋 Getting medical event detail for ID:', eventId)
            
            const response = await apiCall(`/medical-events/${eventId}`, {
                method: 'GET'
            })
            
            console.log('🚨 Medical event detail response:', response)
            return response
        } catch (error) {
            console.error('❌ Get medical event detail error:', error)
            throw error
        }
    },

    // Medical Check Registration methods
    getMedicalCheckRegistrationById: async (registrationId: string): Promise<MedicalCheckRegistrationDetailResponse> => {
        try {
            console.log('🏥 Getting medical check registration detail for ID:', registrationId)
            
            const response = await apiCall(`/medical-check-registration/${registrationId}`, {
                method: 'GET'
            })
            
            console.log('📋 Medical check registration detail response:', response)
            return response
        } catch (error) {
            console.error('❌ Get medical check registration detail error:', error)
            throw error
        }
    },

    updateMedicalCheckRegistrationStatus: async (registrationId: string, updateData: MedicalCheckRegistrationUpdateRequest): Promise<MedicalCheckRegistrationUpdateResponse> => {
        try {
            console.log('🔄 Updating medical check registration status:', registrationId, updateData)
            
            const response = await apiCall(`/medical-check-registration/${registrationId}/status`, {
                method: 'PATCH',
                body: JSON.stringify(updateData)
            })
            
            console.log('✅ Medical check registration status updated:', response)
            return response
        } catch (error) {
            console.error('❌ Update medical check registration status error:', error)
            throw error
        }
    },

};

// Comments interfaces
export interface CreateCommentRequest {
    content: string
    blogId: string
    parentId: string
}

export interface CreateCommentResponse {
    success: boolean
    data?: {
        _id: string
        content: string
        blogId: string
        parentId: string
        createdAt: string
    }
    message?: string
}

export interface Comment {
    _id: string
    content: string
    blogId: string
    parentId: string
    parent: {
        _id: string
        fullName: string
        email: string
        image?: string
    }
    createdAt: string
    updatedAt: string
}

export interface GetCommentsResponse {
    success: boolean
    data: Comment[]
    message?: string
}

// Temporary interfaces for missing types
interface BlogSearchParams {
    query?: string
    categoryId?: string
    userId?: string
    pageSize?: number
    pageNum?: number
}

interface BlogSearchResponse {
    pageData: any[]
    pageInfo: {
        pageNum: number
        pageSize: number
        totalItems: number
        totalPages: number
    }
}

interface BlogDetailResponse {
    success: boolean
    data: any
    message?: string
}

interface VaccineEventSearchResponse {
    pageData: any[]
    pageInfo: {
        pageNum: number
        pageSize: number
        totalItems: number
        totalPages: number
    }
}

interface VaccineEventDetailResponse {
    success: boolean
    data: any
    message?: string
}

// Vaccine Registration interfaces
interface VaccineRegistrationDetailResponse {
    success: boolean
    data: {
        _id: string
        studentId: string
        parentId: string
        eventId: string
        status: "pending" | "approved" | "rejected"
        studentName: string
        parentName: string
        consentDate?: string
        notes?: string
        createdAt: string
        updatedAt: string
    }
    message?: string
}

interface VaccineRegistrationUpdateRequest {
    status: "approved" | "rejected"
    consentDate: string
    notes?: string
}

interface VaccineRegistrationUpdateResponse {
    success: boolean
    data?: any
    message?: string
}

// Medical Check Registration interfaces
interface MedicalCheckRegistrationDetailResponse {
    success: boolean
    data: {
        _id: string
        studentId: string
        parentId: string
        eventId: string
        status: "pending" | "approved" | "rejected"
        studentName: string
        parentName: string
        consentDate?: string
        cancellationReason?: string
        notes?: string
        createdAt: string
        updatedAt: string
    }
    message?: string
}

interface MedicalCheckRegistrationUpdateRequest {
    status: "approved" | "rejected"
    consentDate?: string
    cancellationReason?: string
    notes?: string
}

interface MedicalCheckRegistrationUpdateResponse {
    success: boolean
    data?: any
    message?: string
}

// Medical Events interfaces
export interface Medicine {
    _id: string
    name: string
    description: string
    dosage: string
    sideEffects: string
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    __v: number
}

export interface SchoolNurse {
    _id: string
    password: string
    email: string
    fullName: string
    phone: string
    role: string
    studentIds: string[]
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    __v: number
    image?: string
}

export interface Student {
    _id: string
    fullName: string
    isDeleted: boolean
    gender: 'male' | 'female'
    dob: string
    classId: string
    avatar: string
    studentCode: string
    parents: {
        userId: string
        type: 'father' | 'mother' | 'guardian'
    }[]
    createdAt: string
    updatedAt: string
    __v: number
}

export interface MedicalSupply {
    _id: string
    name: string
    description: string
    quantity: number
    unit: string
    expiryDate: string
    supplier: string
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    __v: number
}

// Remove duplicate interfaces - import from types.ts instead




