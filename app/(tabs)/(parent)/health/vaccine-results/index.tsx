"use client"

import { searchVaccineAppointments, getCurrentUserId, api } from "@/lib/api"
import { VaccineAppointmentResult } from "@/lib/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

export default function VaccineResultsScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [vaccineResults, setVaccineResults] = useState<VaccineAppointmentResult[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("2025-2026")
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [showStudentPicker, setShowStudentPicker] = useState(false)
  
  // Generate school years from 2025-2026 onwards
  const generateSchoolYears = () => {
    const currentYear = new Date().getFullYear()
    const startYear = Math.max(2025, currentYear)
    const years = []
    for (let i = 0; i < 10; i++) {
      const year = startYear + i
      years.push(`${year}-${year + 1}`)
    }
    return years
  }
  
  const availableSchoolYears = generateSchoolYears()

  useEffect(() => {
    loadVaccineResults()
  }, [])
  
  useEffect(() => {
    if (selectedSchoolYear) {
      loadVaccineResults()
    }
  }, [selectedSchoolYear])
  
  useEffect(() => {
    if (selectedStudentId) {
      loadVaccineResults()
    }
  }, [selectedStudentId])

  const loadVaccineResults = async () => {
    try {
      setIsLoading(true)

      // Get current user
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)
      
      if (!userId) {
        Alert.alert("Lỗi", "Không thể xác định user hiện tại")
        return
      }

      // Get user profile to get studentIds
      const userProfileResponse = await api.getUserProfile(userId)
      
      if (!userProfileResponse.success || !userProfileResponse.data.studentIds || userProfileResponse.data.studentIds.length === 0) {
        console.log('⚠️ No studentIds found in user profile')
        setVaccineResults([])
        return
      }

      // Load student details if not already loaded
      if (students.length === 0) {
        const studentDetails = []
        for (const studentId of userProfileResponse.data.studentIds) {
          try {
            const studentResponse = await api.getStudentById(studentId)
            if (studentResponse && studentResponse.data) {
              studentDetails.push(studentResponse.data)
            }
          } catch (error) {
            console.error(`Failed to load student ${studentId}:`, error)
          }
        }
        setStudents(studentDetails)
        
        // If multiple students, set first one as default if no selection
        if (studentDetails.length > 1 && !selectedStudentId) {
          setSelectedStudentId(studentDetails[0]._id)
          return // Will trigger useEffect to reload
        } else if (studentDetails.length === 1 && !selectedStudentId) {
          setSelectedStudentId(studentDetails[0]._id)
        }
      }

      const allVaccineResults: VaccineAppointmentResult[] = []
      const studentIdsToLoad = selectedStudentId ? [selectedStudentId] : userProfileResponse.data.studentIds

      // Load vaccine appointment results
      for (const studentId of studentIdsToLoad) {
        console.log('🔍 Loading vaccine results for student:', studentId)
        
        const response = await searchVaccineAppointments({
          pageNum: 1,
          pageSize: 10,
          studentId: studentId,
          schoolYear: selectedSchoolYear,
        })

        if (response && response.pageData) {
          allVaccineResults.push(...response.pageData)
          console.log(`✅ Found ${response.pageData.length} vaccine results for student ${studentId}`)
        }
      }

      setVaccineResults(allVaccineResults)
      console.log('✅ Total vaccine results loaded:', allVaccineResults.length)
    } catch (error) {
      console.error('Failed to load vaccine results:', error)
      Alert.alert("Lỗi", "Không thể tải kết quả vaccine")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadVaccineResults()
    setIsRefreshing(false)
  }

  const getEligibilityConfig = (isEligible: boolean) => {
    return isEligible
      ? {
          color: "#10b981",
          bgColor: "#f0fdf4",
          text: "Đủ điều kiện",
          icon: "checkmark-circle",
        }
      : {
          color: "#ef4444",
          bgColor: "#fef2f2",
          text: "Không đủ điều kiện",
          icon: "close-circle",
        }
  }

  const getAppointmentStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
      case "đã lên lịch":
        return {
          color: "#3b82f6",
          bgColor: "#eff6ff",
          text: "Đã lên lịch",
          icon: "calendar",
        }
      case "completed":
      case "hoàn thành":
        return {
          color: "#10b981",
          bgColor: "#f0fdf4",
          text: "Hoàn thành",
          icon: "checkmark-circle",
        }
      case "cancelled":
      case "đã hủy":
        return {
          color: "#ef4444",
          bgColor: "#fef2f2",
          text: "Đã hủy",
          icon: "close-circle",
        }
      case "pending":
      case "chờ xử lý":
        return {
          color: "#f59e0b",
          bgColor: "#fffbeb",
          text: "Chờ xử lý",
          icon: "time-outline",
        }
      default:
        return {
          color: "#6b7280",
          bgColor: "#f9fafb",
          text: status || "Không xác định",
          icon: "help-circle",
        }
    }
  }

  const renderVaccineResultItem = ({ item }: { item: VaccineAppointmentResult }) => {
    const eligibilityConfig = getEligibilityConfig(item.isEligible)
    const statusConfig = getAppointmentStatusConfig(item.status)

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => router.push(`/health/vaccine-results/detail?id=${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={20} color="#6366f1" />
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{item.student?.fullName || "Học sinh"}</Text>
              <Text style={styles.studentCode}>{item.student?.studentCode || ""}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: eligibilityConfig.bgColor }]}>
            <Ionicons name={eligibilityConfig.icon as any} size={12} color={eligibilityConfig.color} />
            <Text style={[styles.statusText, { color: eligibilityConfig.color }]}>
              {eligibilityConfig.text}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.eventInfo}>
            <Ionicons name="medical-outline" size={16} color="#6b7280" />
            <Text style={styles.eventName}>{item.event?.title || "Sự kiện vaccine"}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={[styles.appointmentStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
              <Text style={[styles.appointmentStatusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>

          <View style={styles.schoolYearInfo}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.schoolYearText}>Năm học: {item.schoolYear}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Đang tải kết quả vaccine...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kết quả Vaccine</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} activeOpacity={0.7}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* School Year Selector */}
        <TouchableOpacity 
          style={styles.yearSelector} 
          onPress={() => setShowYearPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.yearSelectorContent}>
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={styles.yearSelectorText}>Năm học: {selectedSchoolYear}</Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        {/* Student Selector - Only show if multiple students */}
        {students.length > 1 && (
          <TouchableOpacity 
            style={styles.studentSelector} 
            onPress={() => setShowStudentPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.studentSelectorContent}>
              <Ionicons name="person-outline" size={16} color="#fff" />
              <Text style={styles.studentSelectorText}>
                Học sinh: {students.find(s => s._id === selectedStudentId)?.fullName || "Chọn học sinh"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
        
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{vaccineResults.length}</Text>
            <Text style={styles.statLabel}>Tổng kết quả</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {vaccineResults.filter(item => item.isEligible).length}
            </Text>
            <Text style={styles.statLabel}>Đủ điều kiện</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {vaccineResults.filter(item => item.status === "completed").length}
            </Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      {vaccineResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="medical-outline" size={64} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có kết quả vaccine</Text>
          <Text style={styles.emptyText}>
            Hiện tại chưa có kết quả vaccine nào được ghi nhận.
          </Text>
        </View>
      ) : (
        <FlatList
          data={vaccineResults}
          renderItem={renderVaccineResultItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
        />
      )}
      
      {/* School Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn năm học</Text>
              <TouchableOpacity 
                onPress={() => setShowYearPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.yearList}>
              {availableSchoolYears.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    selectedSchoolYear === year && styles.yearOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedSchoolYear(year)
                    setShowYearPicker(false)
                  }}
                >
                  <Text style={[
                    styles.yearOptionText,
                    selectedSchoolYear === year && styles.yearOptionTextSelected
                  ]}>
                    {year}
                  </Text>
                  {selectedSchoolYear === year && (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Student Picker Modal */}
      <Modal
        visible={showStudentPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStudentPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn học sinh</Text>
              <TouchableOpacity 
                onPress={() => setShowStudentPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.yearList}>
              {students.map((student) => (
                <TouchableOpacity
                  key={student._id}
                  style={[
                    styles.yearOption,
                    selectedStudentId === student._id && styles.yearOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedStudentId(student._id)
                    setShowStudentPicker(false)
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="person" size={20} color={selectedStudentId === student._id ? "#6366f1" : "#6b7280"} style={{ marginRight: 12 }} />
                    <View>
                      <Text style={[
                        styles.yearOptionText,
                        selectedStudentId === student._id && styles.yearOptionTextSelected
                      ]}>
                        {student.fullName}
                      </Text>
                      {student.studentCode && (
                        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                          {student.studentCode}
                        </Text>
                      )}
                    </View>
                  </View>
                  {selectedStudentId === student._id && (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  studentCode: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  cardContent: {
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventName: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  appointmentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  schoolYearInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  schoolYearText: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 4,
  },
  cardFooter: {
    alignItems: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  yearSelector: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  yearSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  yearSelectorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  yearList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  yearOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  yearOptionSelected: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  yearOptionText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  yearOptionTextSelected: {
    color: "#6366f1",
    fontWeight: "600",
  },
  studentSelector: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  studentSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  studentSelectorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 8,
    flex: 1,
    textAlign: "center",
  },
})