//Login
interface LoginDTO {
  username: string
  password: string
}

interface LoginResponse {
  success: boolean
  message: string
  error?: string[]
}
// Thông tin học sinh
interface Students {
  id: string
  fullName: string
  isDeleted: boolean
  dob: string
  gender:'male' | 'female'
  classId: string
  avatar?: string
  studentCode: string
  studentIdCode: string
  parentId: string
  createdAt: string
  updatedAt: string
}
// Lớp học
interface Classes {
 id : string
 name: string
 isDeleted: boolean
 gradeId: string
 grade: Grades[]
 createdAt: string
 updatedAt: string

}
//Khoi
interface Grades {
  id: string
  name: string
  isDeleted: boolean
}



// Updated Medical Events interfaces
export interface MedicalEventStudent {
  _id: string
  fullName: string
  isDeleted: boolean
  gender: 'male' | 'female'
  dob: string
  classId: string
  avatar: string
  studentCode: string
  studentIdCode: string
  parents: {
    userId: string
    type: 'father' | 'mother'
  }[]
  createdAt: string
  updatedAt: string
  __v: number
  id: string
}

export interface MedicalEventSchoolNurse {
  _id: string
  password: string
  email: string
  fullName: string
  phone: string
  role: 'school-nurse'
  studentIds: string[]
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  __v: number
  image?: string
}

export interface MedicalEventMedicine {
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

export interface MedicalEventSupply {
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

export interface MedicalEvent {
  _id: string
  studentId: string
  schoolNurseId: string
  eventName: string
  description: string
  actionTaken: string
  medicinesId: string[]
  medicalSuppliesId: string[]
  severityLevel: 'Critical' | 'Moderate' | 'Mild'
  status: 'monitoring' | 'transferred' | 'resolved' | 'pending'
  leaveMethod: 'parent_pickup' | 'ambulance' | 'self_discharge' | 'none'
  images: string[]
  notes: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  __v: number
  parent: any
  student: MedicalEventStudent
  schoolNurse: MedicalEventSchoolNurse
  medicines: MedicalEventMedicine[]
  medicalSupplies: MedicalEventSupply[]
  medicinesUsed: MedicalEventMedicine[]
  medicalSuppliesUsed: MedicalEventSupply[]
  id: string
  // Legacy field for backward compatibility
  isSerious?: boolean
}

export interface MedicalEventSearchParams {
  query?: string
  studentId?: string
  userId?: string
  severityLevel?: string
  status?: string
  pageNum: number
  pageSize: number
  // Legacy field for backward compatibility
  isSerious?: boolean
}

export interface MedicalEventSearchResponse {
  pageData: MedicalEvent[]
  pageInfo: {
    pageNum: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface MedicalEventDetailResponse {
  success: boolean
  data: MedicalEvent
  message?: string
}
interface VaccineEvents {
 id: string
 title: string
 description: string
 vaccineName: string
startDate: string
 endDate: string
 status?: string
 location: string
}
interface VaccineRegistration {
  id: string
  studentId: string
  parentId: string
  eventId: string
  status: string
  canvellationReason?: string
  note: string
}
interface VaccineAppointment {
  id: string
  studentId: string
  parentId: string
  eventId: string
  status?: string
  checkedBy: string
  bloodPressure: string
  isEligible: boolean
  reasonIfInEligible: string
  note: string
}

// Vaccine Appointment Result interfaces
export interface VaccineAppointmentStudent {
  _id: string
  fullName: string
  isDeleted: boolean
  gender: 'male' | 'female'
  dob: string
  parents: {
    type: 'father' | 'mother'
    email: string
    userId?: string
  }[]
  classId: string
  avatar: string
  studentCode: string
  studentIdCode: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface VaccineAppointmentEvent {
  _id: string
  title: string
  gradeId: string
  isDeleted: boolean
  description: string
  vaccineName: string
  location: string
  provider: string
  startRegistrationDate: string
  endRegistrationDate: string
  eventDate: string
  status: 'ongoing' | 'completed' | 'cancelled'
  schoolYear: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface VaccineAppointmentResult {
  _id: string
  studentId: string
  eventId: string
  isEligible: boolean
  isDeleted: boolean
  status: 'pending' | 'completed' | 'cancelled'
  schoolYear: string
  postVaccinationStatus: 'not_checked' | 'normal' | 'adverse_reaction'
  createdAt: string
  updatedAt: string
  __v: number
  student: VaccineAppointmentStudent
  event: VaccineAppointmentEvent
}

export interface VaccineAppointmentSearchParams {
  studentId?: string
  schoolYear?: string
  pageNum: number
  pageSize: number
}

export interface VaccineAppointmentSearchResponse {
  pageData: VaccineAppointmentResult[]
  pageInfo: {
    pageNum: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}
interface MecicalCheckEvents {
  id: string
  gradeId: string
  eventName: string
}
// Health Records interfaces
export interface HealthRecord {
  _id: string
  studentId: string
  studentName: string
  chronicDiseases: string[]
  allergies: string[]
  pastTreatments: string[]
  vision: string
  hearing: string
  vaccinationHistory: string[]
  schoolYear: string
  height: string
  weight: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface HealthRecordSearchParams {
  query?: string
  studentId?: string
  schoolYear?: string
  pageNum: number
  pageSize: number
}

export interface HealthRecordSearchResponse {
  pageData: HealthRecord[]
  pageInfo: {
      pageNum: number
      pageSize: number
      totalItems: number
      totalPages: number
  }
}

export interface HealthRecordDetailResponse {
  success: boolean
  data: HealthRecord
  message?: string
}

export interface CreateHealthRecordRequest {
    studentId: string
    chronicDiseases: string[]
    allergies: string[]
    pastTreatments: string[]
    vision: string
    hearing: string
    vaccinationHistory: string[]
    schoolYear: string
    height: string
    weight: string
}

export interface CreateHealthRecordResponse {
    success: boolean
    data?: {
        _id: string
        studentId: string
        studentName: string
        chronicDiseases: string[]
        allergies: string[]
        pastTreatments: string[]
        vision: string
        hearing: string
        vaccinationHistory: string[]
        schoolYear: string
        height: string
        weight: string
        createdAt: string
        updatedAt: string
        __v: number
    }
    message?: string
}
export interface MedicineSubmission {
  _id: string
  parentId: string
  studentId: string
  schoolNurseId: string
  medicines: Medicine[]
  status: "pending" | "approved" | "completed"
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  __v: number
}
// Thêm interface mới cho medicine submission detail
export interface MedicineSubmissionDetailResponse {
  success: boolean
  data: {
    _id: string
    parent: {
      _id: string
      email: string
      fullName: string
      phone: string
      role: string
    }
    student: {
      _id: string
      fullName: string
      studentCode: string
      studentIdCode: string
      gender: string
      dob: string
      classId: {
        _id: string
        name: string
        schoolYear: string
      }
    }
    schoolNurse: {
      _id: string
      email: string
      fullName: string
      phone: string
      role: string
    }
    medicines: {
      name: string
      dosage: string
      usageInstructions: string
      quantity: number
      timesPerDay: number
      timeSlots: string[]
      note: string
      reason: string
      slotStatus: {
        time: string
        status: "taken" | "missed" | "pending"
        _id: string
        image?: string
        note?: string
      }[]
      _id: string
      createdAt: string
      updatedAt: string
    }[]
    status: "pending" | "approved" | "completed"
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    __v: number
  }
}
// Thêm method mới vào object api
export interface MedicineSubmissionSearchParams {
  parentId?: string
  studentId?: string
  status?: 'pending' | 'approved' | 'completed'
  query?: string
  pageNum: number
  pageSize: number
}

export interface MedicineSubmissionSearchResponse {
  pageData: MedicineSubmission[]
  pageInfo: {
    pageNum: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

// Cập nhật interface MedicineSubmission để phù hợp với API response
export interface Medicine {
  _id: string
  name: string
  dosage: string
  usageInstructions: string
  quantity: number
  timesPerDay: number
  timeSlots: string[]
  note: string
  reason: string
  createdAt: string
  updatedAt: string
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

// Health Check Event Types
export interface HealthCheckEvent {
  _id: string
  eventName: string
  gradeId: string
  description: string
  location: string
  startRegistrationDate: string
  endRegistrationDate: string
  eventDate: string
  schoolYear: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface HealthCheckEventSearchParams {
  pageNum: number
  pageSize: number
  gradeId?: string
  schoolYear?: string
  query?: string
}

export interface HealthCheckEventSearchResponse {
  pageData: HealthCheckEvent[]
  pageInfo: {
    pageNum: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface HealthCheckEventDetailResponse {
  success: boolean
  data: HealthCheckEvent
  message?: string
}

// Health Check Registration Types
export interface HealthCheckRegistration {
  _id: string
  studentId: string
  parentId: string
  eventId: string
  status: "pending" | "approved" | "rejected"
  registrationDate: string
  schoolYear: string
  consentDate?: string
  cancellationReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface CreateHealthCheckRegistrationRequest {
  parentId: string
  studentId: string
  eventId: string
  status: "pending" | "approved" | "rejected"
  schoolYear: string
  cancellationReason?: string
  notes?: string
}

export interface CreateHealthCheckRegistrationResponse {
  success: boolean
  data?: HealthCheckRegistration
  message?: string
}

export interface HealthCheckRegistrationSearchParams {
  pageNum: number
  pageSize: number
  studentId?: string
  eventId?: string
  parentId?: string
  status?: "pending" | "approved" | "rejected"
  schoolYear?: string
}

export interface HealthCheckRegistrationSearchResponse {
  pageData: HealthCheckRegistration[]
  pageInfo: {
    pageNum: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface HealthCheckRegistrationDetailResponse {
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

export interface HealthCheckRegistrationUpdateRequest {
  status: "approved" | "rejected"
  consentDate?: string
  cancellationReason?: string
  notes?: string
}

export interface HealthCheckRegistrationUpdateResponse {
  success: boolean
  data?: any
  message?: string
}

// Existing MedicalIncident interface
export interface MedicalIncident {
  id: string
  studentId: string
  type: "fever" | "fall" | "injury" | "other"
  description: string
  treatment: string
  date: string
  nurseId: string
}

export interface VaccineEvent {
  _id: string
  eventName: string
  description: string
  vaccineName: string
  location: string
  startRegistrationDate: string
  endRegistrationDate: string
  eventDate: string
  status: "pending" | "approved" | "cancelled" | "rejected" | "completed"
  createdAt: string
  updatedAt: string
}

// Vaccine Registration Search interfaces
export interface VaccineRegistrationSearchParams {
  pageNum: number
  pageSize: number
  studentId?: string
  parentId?: string
  schoolYear?: string
  status?: "pending" | "approved" | "rejected"
}

export interface VaccineRegistrationSearchResponse {
  pageData: VaccineRegistrationDetail[]
  pageInfo: {
    pageNum: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface VaccineRegistrationDetail {
  _id: string
  studentId: string
  parentId: string
  eventId: string
  status: "pending" | "approved" | "rejected"
  studentName: string
  parentName: string
  eventName?: string
  vaccineName?: string
  consentDate?: string
  cancellationReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
// Thêm interface cho MedicineSubmission với thông tin học sinh
// export interface MedicineSubmissionWithStudent extends MedicineSubmission {
//   student?: {
//     _id: string
//     fullName: string
//     studentCode: string
//     classId?: {
//       _id: string
//       name: string
//       schoolYear: string
//     }
//   }
// }