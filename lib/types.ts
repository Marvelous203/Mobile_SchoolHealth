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

// Đơn thuốc
interface Medicines {
 id: string
 name: string
 description: string
 dosage: string
 sideEffects: string
 createdAt: string
 updatedAt: string
}
interface MedicineRequest {
  id: string
  studentId: string
  medicineName: string
  dosage: string
  frequency: number
  interval: number
  method: 'oral' | 'topical' | 'eye_drops' | 'injection' | 'inhaler'
  startDate: string
  endDate: string
  currentCondition: string
  sideEffects?: string
  notes?: string
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected'
  createdAt: string
  updatedAt: string
}

// Lịch uống thuốc
interface MedicineSchedule {
  id: string
  requestId: string
  studentId: string
  scheduledTime: string
  status: 'pending' | 'completed' | 'missed'
  notes?: string
  administeredBy?: string
  administeredAt?: string
}

// Hồ sơ sức khỏe
interface HealthRecords {
  userId: string
  studentId: string
  // Thông tin cơ bản đã có trong Student interface
  
  // Tiền sử y tế
  allergies: string[]
  pastTreatments: string[]
  chronicDiseases: string[]
  vision: string
  hearing: string
  // Thông tin sức khỏe
  vaccinationHistory: string[]

}
interface MedicineSubmission {
 parentId: string,
  studentId: string,
  medicineId: string,
  dosage: string,
  usageInstructions: string,
  startDate: string,
  endDate: string
}
interface MedicalSupplies {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  createdAt: string
  updatedAt: string
}
interface MedicalEvents {
  id: string
  studentId: string
  eventName: string
  description: string
  actionTaken: string
  medicinesId: string[]
  medicalSuppliesId: string[]
  status?: string
  notes: string
  createdAt: string
  updatedAt: string
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
interface MecicalCheckEvents {
  id: string
  gradeId: string
  eventName: string
}