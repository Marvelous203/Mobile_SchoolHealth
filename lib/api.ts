// This is the API service for the School Health Manager app
// Updated to use real API endpoints

// Get API URL from environment variables
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { getAuthHeaders } from './auth';
import {
    CreateHealthRecordRequest,
    CreateHealthRecordResponse,
    HealthCheckResult,
    HealthRecordDetailResponse,
    HealthRecordSearchParams,
    HealthRecordSearchResponse,
    MedicalEvent,
    MedicalEventSearchParams,
    MedicalEventSearchResponse,
    MedicalIncident,
    MedicineSubmission,
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

// Add these interfaces after other interface definitions but before the api object

// Password change interfaces
export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    success: boolean;
    message?: string;
    data?: {
        email: string;
    };
}

// Forgot password interfaces
export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    success: boolean;
    message?: string;
    data?: {
        email: string;
    };
}

// Reset password interfaces
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message?: string;
    data?: {
        email: string;
    };
}

// API methods
export const api = {
    // Expose apiCall for direct usage
    apiCall,

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
            console.log('✏️ Updating user profile for ID:', userId);
            console.log('📝 Update data:', userData);
            
            const response = await apiCall(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            console.log('✅ User profile updated:', response);
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
            console.log(`📚 Fetching student profile for ID: ${studentId}`);
            const response = await apiCall(`/students/${studentId}`);
            
            // If student has classId, fetch class information
            if (response.data?.classId) {
                try {
                    // Simplified URL without unnecessary fields
                    const classResponse = await apiCall(`/classes/${response.data.classId}`);
                    if (classResponse.data) {
                        response.data.classInfo = {
                            _id: classResponse.data._id,
                            name: classResponse.data.name,
                            isDeleted: classResponse.data.isDeleted
                        };
                    }
                } catch (classError) {
                    console.warn(`⚠️ Failed to fetch class info for ID ${response.data.classId}:`, classError);
                }
            }
            
            // Log detailed information about class data
            if (response.data) {
                console.log('📋 Student data details:', {
                    id: response.data._id,
                    name: response.data.fullName,
                    classId: response.data.classId,
                    hasClassInfo: !!response.data.classInfo,
                    classInfo: response.data.classInfo
                });
            }
            
            return response;
        } catch (error) {
            console.error('❌ Get student by ID error:', error);
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


// Removed old searchVaccineEvents - replaced with new version below

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

    // Appointment methods
    createAppointment: async (request: CreateAppointmentRequest): Promise<CreateAppointmentResponse> => {
        try {
            console.log('📅 Creating appointment:', request);
            const response = await apiCall('/appointments', {
                method: 'POST',
                body: JSON.stringify(request)
            });
            console.log('✅ Appointment created:', response);
            return response;
        } catch (error) {
            console.error('❌ Create appointment error:', error);
            throw error;
        }
    },

    searchAppointments: async (params: AppointmentSearchParams): Promise<AppointmentSearchResponse> => {
        try {
            console.log('🔍 Searching appointments with params:', params);
            
            // Validate required parentId
            if (!params.parentId) {
                throw new Error('ParentId is required for searching appointments');
            }

            // Build base endpoint with pagination
            const endpoint = `/appointments/search/${params.pageNum}/${params.pageSize}`;
            
            // Build query params starting with parentId
            const queryParams = new URLSearchParams();
            queryParams.append('parentId', params.parentId);
            
            // Add optional filters
            if (params.status) queryParams.append('status', params.status);
            if (params.type) queryParams.append('type', params.type);
            if (params.query) queryParams.append('query', params.query);
            
            const url = `${endpoint}?${queryParams.toString()}`;
            console.log('📍 Final URL:', url);

            const response = await apiCall(url);
            console.log('✅ Appointments search response:', response);
            
            return response;
        } catch (error) {
            console.error('❌ Search appointments error:', error);
            throw error;
        }
    },

    getAppointmentById: async (appointmentId: string): Promise<AppointmentDetailResponse> => {
        try {
            console.log('📋 Getting appointment detail for ID:', appointmentId);
            
            const response = await apiCall(`/appointments/${appointmentId}`, {
                method: 'GET'
            });
            
            console.log('📅 Appointment detail response:', response);
            return response;
        } catch (error) {
            console.error('❌ Get appointment detail error:', error);
            throw error;
        }
    },

    updateAppointment: async (appointmentId: string, request: UpdateAppointmentRequest): Promise<UpdateAppointmentResponse> => {
        try {
            console.log('📝 Updating appointment:', appointmentId, request);
            
            const response = await apiCall(`/appointments/${appointmentId}/approve`, {
                method: 'PATCH',
                body: JSON.stringify(request)
            });
            
            console.log('✅ Appointment updated:', response);
            return response;
        } catch (error) {
            console.error('❌ Update appointment error:', error);
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

    // Search classes
    searchClasses: async (params: { pageNum: number; pageSize: number; schoolYear?: string; query?: string }) => {
        try {
            const queryParams = new URLSearchParams({
                pageNum: params.pageNum.toString(),
                pageSize: params.pageSize.toString(),
                ...(params.schoolYear && { schoolYear: params.schoolYear }),
                ...(params.query && { query: params.query })
            })
            console.log('🔍 Searching classes with params:', params)
            
            const response = await apiCall(`/classes/search?${queryParams}`)
            console.log('✅ Classes search result:', response)
            return response
        } catch (error) {
            console.error('❌ Search classes error:', error)
            throw error
        }
    },

    // Search grades
    searchGrades: async (params: { pageNum: number; pageSize: number; query?: string }) => {
        try {
            const queryParams = new URLSearchParams({
                pageNum: params.pageNum.toString(),
                pageSize: params.pageSize.toString(),
                ...(params.query && { query: params.query })
            })
            console.log('🔍 Searching grades with params:', params)
            
            const response = await apiCall(`/grades/search?${queryParams}`)
            console.log('✅ Grades search result:', response)
            return response
        } catch (error) {
            console.error('❌ Search grades error:', error)
            throw error
        }
    },

    // Search grades filtered by parent's students
    searchGradesForParent: async (params: { pageNum: number; pageSize: number; query?: string }) => {
        try {
            // Get all grades first
            const allGradesResponse = await apiCall(`/grades/search?pageNum=1&pageSize=50`)
            
            // Get parent's student grades
            let parentStudentGradeIds: string[] = []
            
            try {
                const token = await AsyncStorage.getItem('token')
                if (token) {
                    const userProfileResponse = await apiCall('/users/profile', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                    
                    if (userProfileResponse.data && userProfileResponse.data.studentIds && userProfileResponse.data.studentIds.length > 0) {
                        console.log('🔍 Getting grades for parent students:', userProfileResponse.data.studentIds)
                        
                        // Get each student's grade
                        for (const studentId of userProfileResponse.data.studentIds) {
                            try {
                                const studentResponse = await apiCall(`/users/${studentId}`, {
                                    method: 'GET',
                                    headers: {
                                        Authorization: `Bearer ${token}`
                                    }
                                })
                                
                                if (studentResponse.data && studentResponse.data.classId) {
                                    // Find which grade contains this class
                                    if (allGradesResponse.pageData) {
                                        for (const grade of allGradesResponse.pageData) {
                                            if (grade.classIds && grade.classIds.includes(studentResponse.data.classId)) {
                                                if (!parentStudentGradeIds.includes(grade._id)) {
                                                    parentStudentGradeIds.push(grade._id)
                                                }
                                                break
                                            }
                                            if (grade.classes && grade.classes.length > 0) {
                                                const foundInClasses = grade.classes.find((cls: any) => cls._id === studentResponse.data.classId)
                                                if (foundInClasses && !parentStudentGradeIds.includes(grade._id)) {
                                                    parentStudentGradeIds.push(grade._id)
                                                    break
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (studentError) {
                                console.warn(`⚠️ Could not get student ${studentId}:`, studentError)
                            }
                        }
                    }
                }
            } catch (profileError) {
                console.warn('⚠️ Could not get parent profile:', profileError)
            }

            // Filter grades to only include those with parent's students
            let filteredGrades = []
            if (allGradesResponse.pageData && parentStudentGradeIds.length > 0) {
                filteredGrades = allGradesResponse.pageData.filter((grade: any) => 
                    parentStudentGradeIds.includes(grade._id)
                )
            }

            console.log('🎯 Filtered grades for parent:', filteredGrades.map((g: any) => g.name))
            
            return {
                pageData: filteredGrades,
                pageInfo: {
                    pageNum: params.pageNum,
                    pageSize: params.pageSize,
                    totalItems: filteredGrades.length,
                    totalPages: Math.ceil(filteredGrades.length / params.pageSize)
                }
            }
        } catch (error) {
            console.error('❌ Search grades for parent error:', error)
            throw error
        }
    },

    // Search vaccine events
    searchVaccineEvents: async (params: { pageNum: number; pageSize: number; gradeId?: string; schoolYear?: string; query?: string }) => {
        try {
            // Get parent's student grade IDs efficiently
            const studentGradeIds = await getParentStudentGradeIds()
            
            // Use the new API format (similar to health check events)
            const queryParams = new URLSearchParams({
                pageNum: params.pageNum.toString(),
                pageSize: params.pageSize.toString()
            })
            
            if (params.schoolYear) {
                queryParams.append('schoolYear', params.schoolYear)
            }
            if (params.gradeId) {
                queryParams.append('gradeId', params.gradeId)
            }
            if (params.query) {
                queryParams.append('query', params.query)
            }
            
            // Add studentGradeIds to filter events for parent's children
            if (studentGradeIds.length > 0 && !params.gradeId) {
                // If no specific gradeId is requested, include all grades of parent's children
                studentGradeIds.forEach(gradeId => {
                    queryParams.append('gradeId', gradeId)
                })
            }
            
            // Try multiple endpoint patterns since we're not sure which one works
            const endpointsToTry = [
                `/vaccine-events/search`,
                `/vaccine-events/search/${params.pageNum}/${params.pageSize}`,
                `/vaccine-events`
            ];
            
            console.log('🔍 Searching vaccine events with params:', params)
            console.log('👥 Student grade IDs found for vaccines:', studentGradeIds)
            
            for (const endpoint of endpointsToTry) {
                try {
                    const url = `${endpoint}?${queryParams.toString()}`;
                    console.log('🔍 Trying vaccine events URL:', url);
                    
                    const response = await apiCall(url);
                    if (response && response.pageData !== undefined) {
                        console.log('✅ Vaccine events search result:', response);
                        return response;
                    }
                } catch (endpointError) {
                    console.log(`❌ Failed vaccine events endpoint ${endpoint}:`, endpointError);
                    // Continue to next endpoint
                }
            }
            
            // If all endpoints fail, return empty result
            console.log('⚠️ All vaccine events endpoints failed, returning empty result');
            return {
                pageData: [],
                pageInfo: {
                    pageNum: params.pageNum,
                    pageSize: params.pageSize,
                    totalItems: 0,
                    totalPages: 0
                }
            };
        } catch (error) {
            console.error('❌ Search vaccine events error:', error)
            throw error
        }
    },

    // Search vaccine registrations
    searchVaccineRegistrations: async (params: { 
        pageNum: number; 
        pageSize: number; 
        studentId?: string; 
        parentId?: string;
        schoolYear?: string;
        status?: "pending" | "approved" | "rejected";
    }) => {
        try {
            // Get current user profile to extract parentId and studentIds if not provided
            let finalParams = { ...params }
            
            if (!finalParams.parentId) {
                try {
                    const token = await AsyncStorage.getItem('token')
                    if (token) {
                        const userProfileResponse = await apiCall('/users/profile', {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        })
                        
                        console.log('✅ Parent profile loaded for vaccine registrations:', userProfileResponse.data)
                        
                        if (userProfileResponse.data && userProfileResponse.data._id) {
                            finalParams.parentId = userProfileResponse.data._id
                            console.log('🔍 Using parentId from profile:', finalParams.parentId)
                        }
                    }
                } catch (profileError) {
                    console.warn('⚠️ Could not get user profile for parentId:', profileError)
                }
            }
            
            // Try multiple endpoint patterns
            const endpointsToTry = [
                `/vaccine-registration/search`,
                `/vaccine-registration/search/${finalParams.pageNum}/${finalParams.pageSize}`,
                `/vaccine-registration`
            ];
            
            const queryParams = new URLSearchParams({
                pageNum: finalParams.pageNum.toString(),
                pageSize: finalParams.pageSize.toString(),
                ...(finalParams.studentId && { studentId: finalParams.studentId }),
                ...(finalParams.parentId && { parentId: finalParams.parentId }),
                ...(finalParams.schoolYear && { schoolYear: finalParams.schoolYear }),
                ...(finalParams.status && { status: finalParams.status })
            });
            
            for (const endpoint of endpointsToTry) {
                try {
                    const url = `${endpoint}?${queryParams.toString()}`;
                    console.log('🔍 Trying vaccine registrations URL:', url);
                    
                    const response = await apiCall(url);
                    if (response && response.pageData !== undefined) {
                        console.log('✅ Vaccine registrations search result:', response);
                        return response;
                    }
                } catch (endpointError) {
                    console.log(`❌ Failed endpoint ${endpoint}:`, endpointError);
                    // Continue to next endpoint
                }
            }
            
            // If all endpoints fail, return empty result
            console.log('⚠️ All vaccine registration endpoints failed, returning empty result');
            return {
                pageData: [],
                pageInfo: {
                    pageNum: finalParams.pageNum,
                    pageSize: finalParams.pageSize,
                    totalItems: 0,
                    totalPages: 0
                }
            };
        } catch (error) {
            console.error('❌ Search vaccine registrations error:', error)
            // Return empty result instead of throwing error
            return {
                pageData: [],
                pageInfo: {
                    pageNum: params.pageNum,
                    pageSize: params.pageSize,
                    totalItems: 0,
                    totalPages: 0
                }
            }
        }
    },

    // Get vaccine event detail
    getVaccineEventDetail: async (eventId: string) => {
        try {
            console.log('🔍 Getting vaccine event detail for:', eventId)
            
            const response = await apiCall(`/vaccine-events/${eventId}`)
            console.log('✅ Vaccine event detail result:', response)
            return response
        } catch (error) {
            console.error('❌ Get vaccine event detail error:', error)
            throw error
        }
    },

    // Create vaccine registration
    createVaccineRegistration: async (data: {
        parentId: string;
        studentId: string;
        eventId: string;
        status: "pending" | "approved" | "rejected";
        schoolYear: string;
        cancellationReason?: string;
        note?: string;
    }) => {
        try {
            console.log('📝 Creating vaccine registration:', data)
            
            const response = await apiCall(`/vaccine-registration/create`, {
                method: 'POST',
                body: JSON.stringify(data)
            })
            
            console.log('✅ Vaccine registration created:', response)
            return response
        } catch (error) {
            console.error('❌ Create vaccine registration error:', error)
            throw error
        }
    },

    // Get vaccine registration detail
    getVaccineRegistrationDetail: async (registrationId: string) => {
        try {
            console.log('🔍 Getting vaccine registration detail for:', registrationId)
            
            const response = await apiCall(`/vaccine-registration/${registrationId}`)
            console.log('✅ Vaccine registration detail result:', response)
            return response
        } catch (error) {
            console.error('❌ Get vaccine registration detail error:', error)
            throw error
        }
    },

    // Update vaccine registration status
    updateVaccineRegistrationStatus: async (registrationId: string, data: {
        status: "approved" | "rejected";
        consentDate?: string;
        cancellationReason?: string;
        notes?: string;
    }) => {
        try {
            console.log('📝 Updating vaccine registration status:', registrationId, data)
            
            const response = await apiCall(`/vaccine-registration/${registrationId}/status`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            })
            
            console.log('✅ Vaccine registration status updated:', response)
            return response
        } catch (error) {
            console.error('❌ Update vaccine registration status error:', error)
            throw error
        }
    },

    // Health Check Events API
    searchHealthCheckEvents: async (params: { 
        pageNum: number; 
        pageSize: number; 
        gradeId?: string; 
        schoolYear?: string; 
        query?: string 
    }) => {
        try {
            // Get parent's student grade IDs efficiently
            const studentGradeIds = await getParentStudentGradeIds()
            
            // Use the new API format based on your curl example
            const queryParams = new URLSearchParams({
                pageNum: params.pageNum.toString(),
                pageSize: params.pageSize.toString()
            })
            
            if (params.schoolYear) {
                queryParams.append('schoolYear', params.schoolYear)
            }
            if (params.gradeId) {
                queryParams.append('gradeId', params.gradeId)
            }
            if (params.query) {
                queryParams.append('query', params.query)
            }
            
            // Add studentGradeIds to filter events for parent's children
            if (studentGradeIds.length > 0 && !params.gradeId) {
                // If no specific gradeId is requested, include all grades of parent's children
                studentGradeIds.forEach(gradeId => {
                    queryParams.append('gradeId', gradeId)
                })
            }
            
            const url = `/medical-check-events/search?${queryParams.toString()}`
            
            console.log('🔍 Searching health check events with URL:', url)
            console.log('🔍 Searching health check events with params:', params)
            console.log('👥 Student grade IDs found:', studentGradeIds)
            
            const response = await apiCall(url)
            console.log('✅ Health check events search result:', response)
            return response
        } catch (error) {
            console.error('❌ Search health check events error:', error)
            throw error
        }
    },

    // Get health check event detail
    getHealthCheckEventDetail: async (eventId: string) => {
        try {
            console.log('🔍 Getting health check event detail for:', eventId)
            
            const response = await apiCall(`/medical-check-events/${eventId}`)
            console.log('✅ Health check event detail result:', response)
            return response
        } catch (error) {
            console.error('❌ Get health check event detail error:', error)
            throw error
        }
    },

    // Health Check Registration API
    searchHealthCheckRegistrations: async (params: { 
        pageNum: number; 
        pageSize: number; 
        studentId?: string; 
        eventId?: string; 
        parentId?: string;
        status?: "pending" | "approved" | "rejected";
        schoolYear?: string;
    }) => {
        try {
            // Try multiple endpoint patterns since we're not sure which one works
            const endpointsToTry = [
                `/medical-check-registration/search/${params.pageNum}/${params.pageSize}`,
                `/medical-check-registration/search`,
                `/medical-check-registration`
            ];
            
            const queryParams = new URLSearchParams({
                pageNum: params.pageNum.toString(),
                pageSize: params.pageSize.toString(),
                ...(params.studentId && { studentId: params.studentId }),
                ...(params.eventId && { eventId: params.eventId }),
                ...(params.parentId && { parentId: params.parentId }),
                ...(params.status && { status: params.status }),
                ...(params.schoolYear && { schoolYear: params.schoolYear })
            });
            
            for (const endpoint of endpointsToTry) {
                try {
                    const url = `${endpoint}?${queryParams.toString()}`;
                    console.log('🔍 Trying health check registrations URL:', url);
                    
                    const response = await apiCall(url);
                    if (response && response.pageData !== undefined) {
                        console.log('✅ Health check registrations search result:', response);
                        return response;
                    }
                } catch (endpointError) {
                    console.log(`❌ Failed endpoint ${endpoint}:`, endpointError);
                    // Continue to next endpoint
                }
            }
            
            // If all endpoints fail, return empty result
            console.log('⚠️ All health check registration endpoints failed, returning empty result');
            return {
                pageData: [],
                pageInfo: {
                    pageNum: params.pageNum,
                    pageSize: params.pageSize,
                    totalItems: 0,
                    totalPages: 0
                }
            };
        } catch (error) {
            console.error('❌ Search health check registrations error:', error)
            // Return empty result instead of throwing error
            return {
                pageData: [],
                pageInfo: {
                    pageNum: params.pageNum,
                    pageSize: params.pageSize,
                    totalItems: 0,  // ✅ Thêm totalItems
                    totalPages: 0   // ✅ Thêm totalPages
                }
            }
        }
    },

    // Create health check registration
    createHealthCheckRegistration: async (data: {
        parentId: string;
        studentId: string;
        eventId: string;
        status: "pending" | "approved" | "rejected";
        schoolYear: string;
        cancellationReason?: string;
        notes?: string;
    }) => {
        try {
            console.log('📝 Creating health check registration:', data)
            
            const response = await apiCall(`/medical-check-registration/create`, {
                method: 'POST',
                body: JSON.stringify(data)
            })
            
            console.log('✅ Health check registration created:', response)
            return response
        } catch (error) {
            console.error('❌ Create health check registration error:', error)
            throw error
        }
    },

    // Get health check registration detail
    getHealthCheckRegistrationDetail: async (registrationId: string) => {
        try {
            console.log('🔍 Getting health check registration detail for:', registrationId)
            
            const response = await apiCall(`/medical-check-registration/${registrationId}`)
            console.log('✅ Health check registration detail result:', response)
            return response
        } catch (error) {
            console.error('❌ Get health check registration detail error:', error)
            throw error
        }
    },

    // Update health check registration status
    updateHealthCheckRegistrationStatus: async (registrationId: string, data: {
        status: "approved" | "rejected";
        consentDate?: string;
        cancellationReason?: string;
        notes?: string;
    }) => {
        try {
            console.log('📝 Updating health check registration status:', registrationId, data)
            
            const response = await apiCall(`/medical-check-registration/${registrationId}/status`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            })
            
            console.log('✅ Health check registration status updated:', response)
            return response
        } catch (error) {
            console.error('❌ Update health check registration status error:', error)
            throw error
        }
    },

    // Change password
    changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
        try {
            console.log('🔐 Changing password...');
            const response = await apiCall('/users/change-password', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('✅ Password changed successfully');
            return response;
        } catch (error) {
            console.error('❌ Change password error:', error);
            throw error;
        }
    },

    // Forgot password - request reset
    forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
        try {
            console.log('📧 Requesting password reset for email:', data.email);
            const response = await apiCall('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('✅ Password reset email sent');
            return response;
        } catch (error) {
            console.error('❌ Forgot password error:', error);
            throw error;
        }
    },

    // Reset password with token
    resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
        try {
            console.log('🔐 Resetting password...');
            const response = await apiCall('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            console.log('✅ Password reset successfully');
            return response;
        } catch (error) {
            console.error('❌ Reset password error:', error);
            throw error;
        }
    },

    // Update student profile
    updateStudent: async (studentId: string, data: UpdateStudentRequest): Promise<UpdateStudentResponse> => {
        return apiCall(`/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
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
    className?: string
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

// Appointment interfaces
export interface Appointment {
    _id: string
    parentId: string
    studentId: string
    appointmentTime: string
    reason: string
    type: string
    note: string
    status: "pending" | "approved" | "completed" | "cancelled"
    student: {
        _id: string
        fullName: string
    }
    createdAt: string
}

export interface CreateAppointmentRequest {
    studentId: string
    appointmentTime: string
    reason: string
    type: string
    note: string
}

export interface CreateAppointmentResponse {
    success: boolean
    data?: Appointment
    message?: string
}

export interface AppointmentSearchParams {
    parentId?: string
    studentId?: string
    status?: string
    type?: string
    managerId?: string
    nurseId?: string
    query?: string
    pageNum: number
    pageSize: number
}

export interface AppointmentSearchResponse {
    pageData: Appointment[]
    pageInfo: {
        pageNum: number
        pageSize: number
        totalItems: number
        totalPages: number
    }
}

export interface AppointmentDetailResponse {
    success: boolean
    data: Appointment
    message?: string
}

export interface UpdateAppointmentRequest {
    status?: "approved" | "completed" | "cancelled"
    note?: string
}

export interface UpdateAppointmentResponse {
    success: boolean
    data?: Appointment
    message?: string
}

// Helper function to get parent's student grade IDs efficiently
export const getParentStudentGradeIds = async (): Promise<string[]> => {
    try {
        const token = await AsyncStorage.getItem('token')
        if (!token) return []

        // Get parent profile
        const userProfileResponse = await apiCall('/users/profile', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!userProfileResponse.data?.studentIds?.length) return []

        const studentGradeIds: string[] = []
        
        // Try to get grades from classes search first (since we see gradeId in classes)
        try {
            const classesResponse = await apiCall('/classes/search?pageNum=1&pageSize=100&schoolYear=2024-2025', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            
            console.log('📚 Classes search result:', classesResponse)
            
            if (classesResponse.pageData) {
                // Look for classes that contain our students
                for (const studentId of userProfileResponse.data.studentIds) {
                    for (const classItem of classesResponse.pageData) {
                        if (classItem.studentIds && classItem.studentIds.includes(studentId)) {
                            if (classItem.gradeId && !studentGradeIds.includes(classItem.gradeId)) {
                                studentGradeIds.push(classItem.gradeId)
                                console.log(`✅ Found student ${studentId} in class ${classItem.name} with gradeId: ${classItem.gradeId}`)
                            }
                        }
                    }
                }
                
                if (studentGradeIds.length > 0) {
                    console.log('🎯 Found grades via classes search:', studentGradeIds)
                    return studentGradeIds
                }
            }
        } catch (classesError) {
            console.warn('⚠️ Classes search failed, falling back to grades search:', classesError)
        }
        
        // Fallback: Get all grades once
        const gradesResponse = await apiCall('/grades/search?pageNum=1&pageSize=50', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (!gradesResponse.pageData) return []

        // Get each student's grade
        for (const studentId of userProfileResponse.data.studentIds) {
            try {
                // Try multiple endpoints to get student data
                let studentResponse: any = null
                const studentEndpoints = [`/users/${studentId}`, `/students/${studentId}`]
                
                for (const endpoint of studentEndpoints) {
                    try {
                        studentResponse = await apiCall(endpoint, {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        })
                        console.log(`📋 Student ${studentId} data from ${endpoint}:`, studentResponse.data)
                        if (studentResponse.data) break
                    } catch (endpointError) {
                        console.log(`❌ Failed student endpoint ${endpoint}:`, endpointError)
                    }
                }

                if (!studentResponse?.data) {
                    console.warn(`⚠️ Could not get student data for ${studentId}`)
                    continue
                }

                // First, try to get gradeId directly from student
                if (studentResponse.data?.gradeId) {
                    if (!studentGradeIds.includes(studentResponse.data.gradeId)) {
                        studentGradeIds.push(studentResponse.data.gradeId)
                        console.log(`👦 Student ${studentId} has direct gradeId: ${studentResponse.data.gradeId}`)
                    }
                }
                // If no direct gradeId, try to find via classId
                else if (studentResponse.data?.classId) {
                    console.log(`🔍 Looking for grade containing classId: ${studentResponse.data.classId}`)
                    
                    // Find which grade contains this class
                    for (const grade of gradesResponse.pageData) {
                        console.log(`🔍 Checking grade ${grade.name} (${grade._id}) with classIds:`, grade.classIds)
                        
                        if (grade.classIds?.includes(studentResponse.data.classId)) {
                            if (!studentGradeIds.includes(grade._id)) {
                                studentGradeIds.push(grade._id)
                                console.log(`✅ Found student ${studentId} in grade: ${grade.name} (${grade._id})`)
                            }
                            break
                        }
                        if (grade.classes?.length > 0) {
                            const foundInClasses = grade.classes.find((cls: any) => cls._id === studentResponse.data.classId)
                            if (foundInClasses && !studentGradeIds.includes(grade._id)) {
                                studentGradeIds.push(grade._id)
                                console.log(`✅ Found student ${studentId} in grade classes: ${grade.name} (${grade._id})`)
                                break
                            }
                        }
                    }
                }
            } catch (studentError) {
                console.warn(`⚠️ Could not get student ${studentId}:`, studentError)
            }
        }

        console.log('📊 Parent student grade IDs:', studentGradeIds)
        return studentGradeIds
    } catch (error) {
        console.error('❌ Get parent student grade IDs error:', error)
        return []
    }
}

// Remove duplicate interfaces - import from types.ts instead

export interface UpdateStudentRequest {
  fullName: string;
  gender: "male" | "female";
  dob: string;
  avatar?: string;
}

export interface UpdateStudentResponse {
  success: boolean;
  data?: Student;
  message?: string;
}




