// This is a mock API service for the School Health Manager app
// In a real app, this would connect to your backend server

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
  
  // Mock data
  const mockStudents: Student[] = [
    {
      id: "1",
      name: "John Doe",
      class: "5A",
      dob: "2013-05-15",
      allergies: ["Peanuts", "Dust"],
      chronicDiseases: [],
      vision: "20/20",
      hearing: "Normal",
    },
    {
      id: "2",
      name: "Jane Smith",
      class: "5B",
      dob: "2013-08-22",
      allergies: [],
      chronicDiseases: ["Asthma"],
      vision: "20/40",
      hearing: "Normal",
    },
  ]
  
  const mockVaccinationSessions: VaccinationSession[] = [
    {
      id: "1",
      name: "Annual Flu Vaccination",
      date: "2023-10-15",
      description: "Seasonal influenza vaccination to protect against the most common flu strains expected this season.",
      status: "upcoming",
      details: [
        "Vaccine Type: Quadrivalent Influenza Vaccine",
        "Administration: Intramuscular injection",
        "Side Effects: May include soreness at injection site, low-grade fever, muscle aches",
        "Duration of Protection: Approximately one year",
      ],
      contraindications: [
        "Severe allergic reaction to previous flu vaccine",
        "Current moderate to severe illness with fever",
        "History of Guillain-Barré Syndrome",
      ],
    },
    {
      id: "2",
      name: "MMR Booster",
      date: "2023-11-10",
      description: "Measles, Mumps, and Rubella booster shot for continued immunity.",
      status: "upcoming",
      details: [
        "Vaccine Type: MMR (Measles, Mumps, Rubella)",
        "Administration: Subcutaneous injection",
        "Side Effects: May include fever, mild rash, swollen glands",
        "Duration of Protection: Long-term immunity",
      ],
      contraindications: ["Severe allergic reaction to previous MMR vaccine", "Pregnancy", "Weakened immune system"],
    },
  ]
  
  const mockHealthCheckSessions: HealthCheckSession[] = [
    {
      id: "1",
      name: "Annual Health Checkup",
      date: "2023-09-20",
      description: "Comprehensive health assessment including growth, vision, hearing, and general wellness.",
      status: "completed",
      checkItems: [
        "Height and weight measurement",
        "Vision screening",
        "Hearing test",
        "Blood pressure",
        "General physical examination",
      ],
    },
    {
      id: "2",
      name: "Dental Screening",
      date: "2023-11-05",
      description: "Basic dental examination to identify potential issues and promote oral hygiene.",
      status: "upcoming",
      checkItems: [
        "Dental caries check",
        "Gum health assessment",
        "Oral hygiene evaluation",
        "Orthodontic needs assessment",
      ],
    },
  ]
  
  // Mock medicine submissions data
  const mockMedicineSubmissions: MedicineSubmission[] = [
    {
      id: "1",
      studentId: "1",
      medicineName: "Paracetamol",
      dosage: "500mg",
      timesPerDay: 3,
      startDate: "2024-01-15",
      endDate: "2024-01-20",
      notes: "Take after meals",
      status: "pending"
    },
    {
      id: "2",
      studentId: "2",
      medicineName: "Ventolin",
      dosage: "2 puffs",
      timesPerDay: 2,
      startDate: "2024-01-10",
      endDate: "2024-02-10",
      notes: "As needed for asthma symptoms",
      status: "approved"
    }
  ]
  
  // Mock health check history data
  const mockHealthCheckHistory = [
    {
      id: "1",
      sessionId: "1",
      studentId: "1",
      date: "2023-09-20",
      height: 145,
      weight: 35.5,
      vision: "20/20",
      heartRate: 80,
      notes: "Normal growth and development",
      abnormal: false
    },
    {
      id: "2",
      sessionId: "2",
      studentId: "1",
      date: "2023-03-15",
      height: 142,
      weight: 33.2,
      vision: "20/20",
      heartRate: 82,
      notes: "Healthy checkup, no concerns",
      abnormal: false
    }
  ]
  
  // API methods
  export const api = {
    // Authentication
    login: async (email: string, password: string, role: string) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
  
      // Mock authentication - in a real app, this would validate credentials with a backend
      if (email && password) {
        return { success: true, role }
      }
      throw new Error("Invalid credentials")
    },
  
    // Student data
    getStudentProfile: async (studentId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const student = mockStudents.find((s) => s.id === studentId)
      if (student) return student
      throw new Error("Student not found")
    },
  
    updateStudentProfile: async (studentId: string, data: Partial<Student>) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true }
    },
  
    // Vaccination
    getVaccinationSessions: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      return mockVaccinationSessions
    },
  
    getVaccinationSession: async (sessionId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const session = mockVaccinationSessions.find((s) => s.id === sessionId)
      if (session) return session
      throw new Error("Vaccination session not found")
    },
  
    submitVaccinationConsent: async (data: Omit<VaccinationConsent, "id" | "status">) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true, id: "new-consent-id" }
    },
  
    // Health Checkups
    getHealthCheckSessions: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      return mockHealthCheckSessions
    },
  
    getHealthCheckSession: async (sessionId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const session = mockHealthCheckSessions.find((s) => s.id === sessionId)
      if (session) return session
      throw new Error("Health check session not found")
    },
  
    submitHealthCheckConsent: async (sessionId: string, studentId: string, consent: boolean) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true }
    },
  
    // Medicine submissions
    submitMedicine: async (data: Omit<MedicineSubmission, "id" | "status">) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true, id: "new-medicine-id" }
    },
  
    // Nurse functions
    recordMedicalIncident: async (data: Omit<MedicalIncident, "id">) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true, id: "new-incident-id" }
    },
  
    recordHealthCheckResult: async (data: Omit<HealthCheckResult, "id">) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true, id: "new-result-id" }
    },
  
    getMedicineSubmissions: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        data: mockMedicineSubmissions,
        status: 200,
        statusText: "OK"
      }
    },


    // Nurse functions
    getPendingMedicineSubmissions: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      return mockMedicineSubmissions.filter((submission) => submission.status === "pending")
    },
  async getVaccinationHistory(studentId: string) {
    // Mock data for vaccination history
    return [
      {
        id: "1",
        name: "MMR Vaccine",
        date: "2023-05-15",
        notes: "First dose completed. No adverse reactions.",
        status: "completed"
      },
      {
        id: "2",
        name: "Tetanus Booster",
        date: "2023-03-10",
        notes: "Routine booster shot administered successfully.",
        status: "completed"
      },
      {
        id: "3",
        name: "Hepatitis B",
        date: "2023-01-20",
        notes: "Final dose of the series completed.",
        status: "completed"
      }
    ]

  },
    getHealthCheckHistory: async (studentId: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Filter history for the specific student
      const studentHistory = mockHealthCheckHistory.filter(record => record.studentId === studentId)
      
      if (studentHistory.length === 0) {
        return []
      }
      
      return studentHistory
    },
}
  