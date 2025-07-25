"use client"

import { api, getCurrentUserId } from "@/lib/api"
import type { VaccineEvent, VaccineRegistrationDetail, VaccineRegistrationSearchResponse } from "@/lib/types"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { formatDate, formatTime } from "../../../../lib/utils"

const { width } = Dimensions.get("window")

// Type definitions
interface VaccinationSession {
  name: string
  date: string
}

interface VaccinationHistory {
  name: string
  date: string
}

interface Student {
  _id: string
  fullName: string
  classId?: string
  avatar?: string
}

type TabType = "events" | "registrations" | "history"

const EmptyUpcoming = () => (
  <View style={styles.modernEmptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="calendar-outline" size={48} color="#6366f1" />
    </View>
    <Text style={styles.emptyTitle}>Chưa có sự kiện sắp tới</Text>
    <Text style={styles.emptySubtitle}>Các sự kiện tiêm chủng sẽ xuất hiện tại đây khi có thông báo mới</Text>
  </View>
)

const EmptyEvents = () => (
  <View style={styles.modernEmptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="calendar-outline" size={48} color="#6366f1" />
    </View>
    <Text style={styles.emptyTitle}>Chưa có sự kiện tiêm chủng</Text>
    <Text style={styles.emptySubtitle}>Các sự kiện tiêm chủng sẽ xuất hiện tại đây khi có thông báo mới</Text>
  </View>
)

const EmptyHistory = () => (
  <View style={styles.modernEmptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="time-outline" size={48} color="#6366f1" />
    </View>
    <Text style={styles.emptyTitle}>Chưa có lịch sử tiêm chủng</Text>
    <Text style={styles.emptySubtitle}>Lịch sử tiêm chủng của học sinh sẽ được hiển thị tại đây</Text>
  </View>
)

export default function VaccinationsScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [vaccineEvents, setVaccineEvents] = useState<VaccineEvent[]>([])
  const [vaccinationSessions, setVaccinationSessions] = useState<VaccinationSession[]>([])
  const [vaccinationHistory, setVaccinationHistory] = useState<VaccinationHistory[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<TabType>("events")
  const [isSchoolYearCollapsed, setIsSchoolYearCollapsed] = useState(true)
  const [isStudentCollapsed, setIsStudentCollapsed] = useState(true)
  const [vaccineRegistrations, setVaccineRegistrations] = useState<VaccineRegistrationDetail[]>([])
  const [registrationCurrentPage, setRegistrationCurrentPage] = useState<number>(1)
  const [registrationTotalPages, setRegistrationTotalPages] = useState<number>(1)
  const [selectedRegistrationStatus, setSelectedRegistrationStatus] = useState<"pending" | "approved" | "rejected" | "all">("all")
  const [eventDetails, setEventDetails] = useState<{[key: string]: any}>({})
  const [eventsCache, setEventsCache] = useState<{[key: string]: VaccineEvent}>({})
  const router = useRouter()

  // Animation values
  const [schoolYearAnimation] = useState(new Animated.Value(0))
  const [studentAnimation] = useState(new Animated.Value(0))

  // School Year Selection
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("2025-2026")
  const [availableSchoolYears] = useState<string[]>(["2025-2026", "2026-2027", "2027-2028"])

  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const loadStudents = async () => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      const userResponse = await api.getUserProfile(userId)
      if (userResponse.success && userResponse.data.studentIds) {
        const studentPromises = userResponse.data.studentIds.map((id: string) => api.getStudentProfile(id))

        const studentResponses = await Promise.all(studentPromises)
        const loadedStudents = studentResponses.filter((res) => res.success).map((res) => res.data)

        setStudents(loadedStudents)
        if (loadedStudents.length === 1) {
          setSelectedStudent(loadedStudents[0])
        }
      }
    } catch (error) {
      console.error("Failed to load students:", error)
    }
  }

  const loadData = async (page = 1, refresh = false): Promise<void> => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      // Load vaccine events from new API with retry mechanism
      try {
        const eventsResponse = await api.searchVaccineEvents({
          pageNum: page,
          pageSize: 10,
          schoolYear: selectedSchoolYear,
        })

        if (refresh || page === 1) {
        setVaccineEvents(eventsResponse.pageData || [])
      } else {
        setVaccineEvents((prev) => [...prev, ...(eventsResponse.pageData || [])])
      }
      
      // Tạo cache events từ search results
      const newEventsCache: {[key: string]: VaccineEvent} = {}
      ;(eventsResponse.pageData || []).forEach((event: VaccineEvent) => {
        newEventsCache[event._id] = event
      })
      
      setEventsCache(prev => ({
        ...prev,
        ...newEventsCache
      }))
      
      setCurrentPage(eventsResponse.pageInfo?.pageNum || 1)
      setTotalPages(eventsResponse.pageInfo?.totalPages || 1)
      } catch (apiError) {
        console.warn("API call failed, using fallback data:", apiError)
        if (refresh || page === 1) {
          setVaccineEvents([])
        }
        setCurrentPage(1)
        setTotalPages(1)
      }

      // Load existing vaccination sessions
      try {
        const sessions = await api.getVaccinationSessions()
        setVaccinationSessions(sessions)
      } catch (error) {
        console.log("No vaccination sessions available:", error)
        setVaccinationSessions([])
      }

      // Load vaccination history only if student is selected
      if (selectedStudent) {
        try {
          const history = await api.getVaccinationHistory(selectedStudent._id)
          setVaccinationHistory(history)
        } catch (error) {
          console.log("No vaccination history available:", error)
          setVaccinationHistory([])
        }
      } else {
        setVaccinationHistory([])
      }
    } catch (error) {
      console.error("Failed to load vaccination data", error)
      setVaccineEvents([])
      setVaccinationSessions([])
      setVaccinationHistory([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadVaccineRegistrations = async (page: number = 1, refresh: boolean = false): Promise<void> => {
    try {
      setIsLoading(true)
      if (refresh) {
        setIsRefreshing(true)
        // Clear data immediately when refreshing
        setVaccineRegistrations([])
      }

      const params: any = {
        parentId: await getCurrentUserId(),
        pageNum: page,
        pageSize: 10,
        schoolYear: selectedSchoolYear,
      }

      // Thêm studentId nếu đã chọn học sinh
      if (selectedStudent) {
        params.studentId = selectedStudent._id
      }

      // Thêm status filter nếu không phải "all"
      if (selectedRegistrationStatus !== "all") {
        params.status = selectedRegistrationStatus
      }

      console.log('🔍 Loading vaccine registrations with params:', params)
      console.log('📊 Current filter status:', selectedRegistrationStatus)
      console.log('🔄 Page:', page, 'Refresh:', refresh)

      const registrationsResponse: VaccineRegistrationSearchResponse = await api.searchVaccineRegistrations(params)

      console.log('✅ API Response:', registrationsResponse)
      console.log('📋 Returned registrations:', registrationsResponse.pageData?.length || 0)
      
      // Debug: Log status của từng registration
      registrationsResponse.pageData?.forEach((reg, index) => {
        console.log(`Registration ${index + 1}: ID=${reg._id}, Status=${reg.status}, Expected=${selectedRegistrationStatus}`)
      })

      // Since we're sending the status filter to the API, we should trust the API response
      // No need for client-side filtering unless there's a specific reason
      const responseData = registrationsResponse.pageData || []
      
      console.log('🔍 API returned data length:', responseData.length)
      
      if (refresh || page === 1) {
        setVaccineRegistrations(responseData)
      } else {
        setVaccineRegistrations(prev => [...prev, ...responseData])
      }
      
      setRegistrationCurrentPage(registrationsResponse.pageInfo?.pageNum || 1)
      setRegistrationTotalPages(registrationsResponse.pageInfo?.totalPages || 1)

      // Sử dụng events cache thay vì gọi API
      const eventDetailsUpdate: {[key: string]: any} = {}
      responseData.forEach(reg => {
        if (reg.eventId && eventsCache[reg.eventId]) {
          eventDetailsUpdate[reg.eventId] = eventsCache[reg.eventId]
        }
      })
      
      setEventDetails(prev => ({
        ...prev,
        ...eventDetailsUpdate
      }))
      
    } catch (error) {
      console.error("Failed to load vaccine registrations:", error)
      setVaccineRegistrations([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadMoreData = (): void => {
    if (currentPage < totalPages && !isLoading) {
      loadData(currentPage + 1, false)
    }
  }

  const refreshData = (): void => {
    loadData(1, true)
    loadVaccineRegistrations(1, true)
  }

  // Reset when school year changes
  const handleSchoolYearChange = (schoolYear: string): void => {
    setSelectedSchoolYear(schoolYear)
    setVaccineEvents([])
    setCurrentPage(1)
    setTotalPages(1)
    // Load data for new school year
    loadData(1, true)
  }

  // Animation functions
  const toggleSchoolYear = () => {
    const toValue = isSchoolYearCollapsed ? 1 : 0
    setIsSchoolYearCollapsed(!isSchoolYearCollapsed)

    Animated.timing(schoolYearAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }

  const toggleStudent = () => {
    const toValue = isStudentCollapsed ? 1 : 0
    setIsStudentCollapsed(!isStudentCollapsed)

    Animated.timing(studentAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    loadData()
    loadVaccineRegistrations()
  }, [selectedSchoolYear, selectedStudent, selectedRegistrationStatus])

  // Helper functions - Calculate status based on dates
  const getEventStatus = (event: VaccineEvent): string => {
    // Sử dụng status từ API
    return event.status || "completed";
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "upcoming":
        return {
          color: "#6366f1",
          bgColor: "#f0f0ff",
          text: "Sắp mở đăng ký",
          icon: "time-outline",
        }
      case "ongoing":
        return {
          color: "#10b981",
          bgColor: "#f0fdf4",
          text: "Đang mở đăng ký",
          icon: "checkmark-circle-outline",
        }
      case "completed":
        return {
          color: "#6b7280",
          bgColor: "#f9fafb",
          text: "Đã hoàn thành",
          icon: "checkmark-done-outline",
        }
      case "cancelled":
        return {
          color: "#ef4444",
          bgColor: "#fef2f2",
          text: "Đã hủy",
          icon: "close-circle-outline",
        }
      default:
        return {
          color: "#f59e0b",
          bgColor: "#fffbeb",
          text: "Không xác định",
          icon: "help-circle-outline",
        }
    }
  }

  // const fetchEventDetail = async (eventId: string) => {
  //   if (!eventId || eventDetails[eventId]) return eventDetails[eventId]
  //   
  //   try {
  //     const response = await api.getVaccineEventDetail(eventId)
  //     if (response.success) {
  //       setEventDetails(prev => ({
  //         ...prev,
  //         [eventId]: response.data
  //       }))
  //       return response.data
  //     }
  //   } catch (error) {
  //     console.error(`Failed to fetch event detail for ${eventId}:`, error)
  //   }
  //   return null
  // }

  const handleEventPress = (eventId: string): void => {
    if (!selectedStudent) {
      Alert.alert("Thông báo", "Vui lòng chọn học sinh trước khi xem chi tiết sự kiện");
      return;
    }
    
    router.push({
      pathname: '/vaccinations/event-detail',
      params: {
        id: eventId,
        studentId: selectedStudent._id,
        studentName: selectedStudent.fullName
      }
    });
  }

  const renderRegistrationCard = (registration: VaccineRegistrationDetail) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case "pending":
          return {
            color: "#f59e0b",
            bgColor: "#fffbeb",
            text: "Chờ duyệt",
            icon: "time-outline",
          }
        case "approved":
          return {
            color: "#10b981",
            bgColor: "#f0fdf4",
            text: "Đã duyệt",
            icon: "checkmark-circle-outline",
          }
        case "rejected":
          return {
            color: "#ef4444",
            bgColor: "#fef2f2",
            text: "Từ chối",
            icon: "close-circle-outline",
          }
        default:
          return {
            color: "#6b7280",
            bgColor: "#f9fafb",
            text: "Không xác định",
            icon: "help-circle-outline",
          }
      }
    }

    const statusConfig = getStatusConfig(registration.status)
    // Get event info from the component-level state
    const eventInfo = eventDetails[registration.eventId]

    return (
      <TouchableOpacity
        key={registration._id}
        style={styles.modernEventCard}
        onPress={() => {
          router.push({
            pathname: "/(tabs)/(parent)/vaccinations/registration-detail",
            params: {
              id: registration._id,  // Đây phải là registration ID, không phải event ID
              studentId: registration.studentId,
            },
          })
        }}
        activeOpacity={0.7}
      >
        <View style={styles.eventCardHeader}>
          <View style={[styles.modernStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.modernStatusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
        </View>

        <View style={styles.eventCardBody}>
          {/* Display event name from fetched event details */}
          <Text style={styles.modernEventTitle} numberOfLines={2}>
            {eventInfo?.eventName || registration.eventName || "Sự kiện tiêm chủng"}
          </Text>

          <View style={styles.vaccineInfoContainer}>
            <View style={styles.vaccineIconBadge}>
              <Ionicons name="person" size={16} color="#6366f1" />
            </View>
            <Text style={styles.modernVaccineName}>{registration.studentName}</Text>
          </View>

          {/* Display vaccine name from event details if available */}
          {(eventInfo?.vaccineName || registration.vaccineName) && (
            <View style={styles.vaccineInfoContainer}>
              <View style={styles.vaccineIconBadge}>
                <Ionicons name="medical" size={16} color="#6366f1" />
              </View>
              <Text style={styles.modernVaccineName}>
                {eventInfo?.vaccineName || registration.vaccineName}
              </Text>
            </View>
          )}

          {/* Display event description if available */}
          {eventInfo?.description && (
            <Text style={styles.modernEventDescription} numberOfLines={2}>
              {eventInfo.description}
            </Text>
          )}
        </View>

        <View style={styles.modernEventDetails}>
          <View style={styles.modernDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.modernDetailText}>
              Đăng ký: {formatDate(registration.createdAt)}
            </Text>
          </View>

          {/* Display event date if available */}
          {eventInfo?.eventDate && (
            <View style={styles.modernDetailRow}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.modernDetailText}>
                Sự kiện: {formatDate(eventInfo.eventDate)} • {formatTime(eventInfo.eventDate)}
              </Text>
            </View>
          )}

          {/* Display event location if available */}
          {eventInfo?.location && (
            <View style={styles.modernDetailRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.modernDetailText} numberOfLines={1}>
                {eventInfo.location}
              </Text>
            </View>
          )}

          {registration.consentDate && (
            <View style={styles.modernDetailRow}>
              <Ionicons name="checkmark-outline" size={16} color="#6b7280" />
              <Text style={styles.modernDetailText}>
                Xác nhận: {formatDate(registration.consentDate)}
              </Text>
            </View>
          )}

          {registration.cancellationReason && (
            <View style={styles.modernDetailRow}>
              <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
              <Text style={styles.modernDetailText} numberOfLines={2}>
                Lý do: {registration.cancellationReason}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderStatusFilter = () => {
    const statusOptions = [
      { key: "all", label: "Tất cả", icon: "list-outline" },
      { key: "pending", label: "Chờ duyệt", icon: "time-outline" },
      { key: "approved", label: "Đã duyệt", icon: "checkmark-circle-outline" },
      { key: "rejected", label: "Từ chối", icon: "close-circle-outline" },
    ]

    const handleFilterChange = async (newStatus: string) => {
      console.log('🔄 Changing filter to:', newStatus)
      
      // Clear data immediately
      setVaccineRegistrations([])
      setRegistrationCurrentPage(1)
      
      // Update status state
      setSelectedRegistrationStatus(newStatus as any)
      
      // Call API with the new status directly
      try {
        setIsLoading(true)
        setIsRefreshing(true)
        
        const params: any = {
          parentId: await getCurrentUserId(),
          pageNum: 1,
          pageSize: 10,
          schoolYear: selectedSchoolYear,
        }
        
        if (selectedStudent) {
          params.studentId = selectedStudent._id
        }
        
        // Use the new status directly, not from state
        if (newStatus !== "all") {
          params.status = newStatus
        }
        
        console.log('🔍 Loading with correct params:', params)
        console.log('📊 New filter status:', newStatus)
        
        const registrationsResponse: VaccineRegistrationSearchResponse = await api.searchVaccineRegistrations(params)
        
        console.log('✅ API Response:', registrationsResponse)
        console.log('📋 Returned registrations:', registrationsResponse.pageData?.length || 0)
        
        // Debug: Log status của từng registration
        registrationsResponse.pageData?.forEach((reg, index) => {
          console.log(`Registration ${index + 1}: ID=${reg._id}, Status=${reg.status}, Expected=${newStatus}`)
        })
        
        // Since we're sending the status filter to the API, we should trust the API response
        const responseData = registrationsResponse.pageData || []
        
        console.log('🔍 API returned data length:', responseData.length)
        
        setVaccineRegistrations(responseData)
        setRegistrationCurrentPage(registrationsResponse.pageInfo?.pageNum || 1)
        setRegistrationTotalPages(registrationsResponse.pageInfo?.totalPages || 1)
        
        // Update event details cache
        const eventDetailsUpdate: {[key: string]: any} = {}
        responseData.forEach(reg => {
          if (reg.eventId && eventsCache[reg.eventId]) {
            eventDetailsUpdate[reg.eventId] = eventsCache[reg.eventId]
          }
        })
        
        setEventDetails(prev => ({
          ...prev,
          ...eventDetailsUpdate
        }))
        
      } catch (error) {
        console.error('Filter error:', error)
        setVaccineRegistrations([])
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilterContainer}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.statusFilterButton,
              selectedRegistrationStatus === option.key && styles.selectedStatusFilterButton,
            ]}
            onPress={() => handleFilterChange(option.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon as any}
              size={16}
              color={selectedRegistrationStatus === option.key ? "#6366f1" : "#9ca3af"}
            />
            <Text
              style={[
                styles.statusFilterText,
                selectedRegistrationStatus === option.key && styles.selectedStatusFilterText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )
  }

  // const handleRegisterPress = (): void => {
  //   if (!selectedStudent) {
  //     Alert.alert("Thông báo", "Vui lòng chọn học sinh trước khi đăng ký")
  //     return
  //   }
  //   router.push("/(tabs)/(parent)/vaccinations/registration")
  // }

  // Render header function
  const renderHeader = () => (
    <View style={styles.modernHeader}>
      
       <View style={styles.headerTop}>
        <TouchableOpacity style={styles.modernBackButton} onPress={() => router.push("/(tabs)/(parent)/health")}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerContent}>
        <View style={styles.modernHeaderIcon}>
          <Ionicons name="medical" size={32} color="#6366f1" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.modernTitle}>Tiêm chủng</Text>
          <Text style={styles.modernSubtitle}>Quản lý lịch tiêm chủng học sinh</Text>
        </View>
      </View>
    </View>
  )

  // Render school year selector
  const renderSchoolYearSelector = () => {
    const animatedHeight = schoolYearAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 80],
    })

    return (
      <View style={styles.modernSelectorContainer}>
        <TouchableOpacity style={styles.modernSelectorHeader} onPress={toggleSchoolYear} activeOpacity={0.7}>
          <View style={styles.selectorLeft}>
            <View style={styles.selectorIconContainer}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.selectorLabel}>Năm học</Text>
              <Text style={styles.selectorValue}>{selectedSchoolYear}</Text>
            </View>
          </View>
          <Ionicons name={isSchoolYearCollapsed ? "chevron-down" : "chevron-up"} size={20} color="#9ca3af" />
        </TouchableOpacity>

        <Animated.View style={[styles.selectorContent, { height: animatedHeight }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScrollContainer}
          >
            {availableSchoolYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.modernOptionCard, selectedSchoolYear === year && styles.selectedOptionCard]}
                onPress={() => {
                  handleSchoolYearChange(year)
                  toggleSchoolYear()
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={selectedSchoolYear === year ? "#6366f1" : "#9ca3af"}
                />
                <Text style={[styles.optionText, selectedSchoolYear === year && styles.selectedOptionText]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    )
  }

  // Add student selection render function
  const renderStudentSelection = () => {
    const animatedHeight = studentAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 80],
    })

    return (
      <View style={styles.modernSelectorContainer}>
        <TouchableOpacity style={styles.modernSelectorHeader} onPress={toggleStudent} activeOpacity={0.7}>
          <View style={styles.selectorLeft}>
            <View style={styles.selectorIconContainer}>
              <Ionicons name="person" size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.selectorLabel}>Học sinh</Text>
              <Text style={styles.selectorValue}>{selectedStudent ? selectedStudent.fullName : "Chọn học sinh"}</Text>
            </View>
          </View>
          <Ionicons name={isStudentCollapsed ? "chevron-down" : "chevron-up"} size={20} color="#9ca3af" />
        </TouchableOpacity>

        <Animated.View style={[styles.selectorContent, { height: animatedHeight }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorScrollContainer}
          >
            {students.map((student) => (
              <TouchableOpacity
                key={student._id}
                style={[styles.modernOptionCard, selectedStudent?._id === student._id && styles.selectedOptionCard]}
                onPress={() => {
                  setSelectedStudent(student)
                  toggleStudent()
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color={selectedStudent?._id === student._id ? "#6366f1" : "#9ca3af"}
                />
                <Text
                  style={[styles.optionText, selectedStudent?._id === student._id && styles.selectedOptionText]}
                  numberOfLines={1}
                >
                  {student.fullName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    )
  }

  // Render functions
  const renderEventCard = (event: VaccineEvent) => {
    const status = getEventStatus(event)
    const statusConfig = getStatusConfig(status)

    return (
      <TouchableOpacity
        key={event._id}
        style={styles.modernEventCard}
        onPress={() => handleEventPress(event._id)}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={styles.eventCardHeader}>
          <View style={[styles.modernStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.modernStatusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
        </View>

        {/* Main content */}
        <View style={styles.eventCardBody}>
          <Text style={styles.modernEventTitle} numberOfLines={2}>
            {event.eventName}
          </Text>

          <View style={styles.vaccineInfoContainer}>
            <View style={styles.vaccineIconBadge}>
              <Ionicons name="medical" size={16} color="#6366f1" />
            </View>
            <Text style={styles.modernVaccineName}>{event.vaccineName}</Text>
          </View>

          {event.description && (
            <Text style={styles.modernEventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
        </View>

        {/* Event details */}
        <View style={styles.modernEventDetails}>
          <View style={styles.modernDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.modernDetailText}>
              {formatDate(event.eventDate)} • {formatTime(event.eventDate)}
            </Text>
          </View>

          <View style={styles.modernDetailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.modernDetailText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>

          <View style={styles.modernDetailRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.modernDetailText}>
              Đăng ký: {formatDate(event.startRegistrationDate)} - {formatDate(event.endRegistrationDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderTabButton = (tabKey: TabType, title: string, icon: keyof typeof Ionicons.glyphMap, count?: number) => (
    <TouchableOpacity
      style={[styles.modernTabButton, activeTab === tabKey && styles.activeModernTabButton]}
      onPress={() => setActiveTab(tabKey)}
      activeOpacity={0.7}
    >
      <View style={styles.tabButtonContent}>
        <Ionicons name={icon} size={20} color={activeTab === tabKey ? "#6366f1" : "#9ca3af"} />
        <Text style={[styles.modernTabText, activeTab === tabKey && styles.activeModernTabText]}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  const renderSessionItem = ({ item }: { item: VaccinationSession }) => (
    <View style={styles.modernSessionCard}>
      <View style={styles.sessionCardHeader}>
        <View style={styles.sessionIconContainer}>
          <Ionicons name="medical-outline" size={20} color="#6366f1" />
        </View>
        <View style={styles.sessionCardContent}>
          <Text style={styles.modernSessionTitle}>{item.name}</Text>
          <Text style={styles.modernSessionDate}>{item.date}</Text>
        </View>
      </View>
    </View>
  )

  const renderHistoryItem = ({ item }: { item: VaccinationHistory }) => (
    <View style={styles.modernHistoryCard}>
      <View style={styles.historyCardHeader}>
        <View style={styles.historyIconContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
        </View>
        <View style={styles.historyCardContent}>
          <Text style={styles.modernHistoryTitle}>{item.name}</Text>
          <Text style={styles.modernHistoryDate}>{item.date}</Text>
        </View>
      </View>
    </View>
  )

  const upcomingEvents = vaccineEvents.filter((event) => new Date(event.eventDate) >= new Date())
  const pastEvents = vaccineEvents.filter((event) => new Date(event.eventDate) < new Date())

  // Thêm function để hiển thị số lượng theo từng status
  const getRegistrationCountByStatus = (status: string) => {
    if (status === "all") {
      return vaccineRegistrations.length
    }
    return vaccineRegistrations.filter(reg => reg.status === status).length
  }

  // Loading state
  if (isLoading && vaccineEvents.length === 0) {
    return (
      <SafeAreaView style={styles.modernLoadingContainer}>
        <View style={styles.modernLoadingContent}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="medical" size={48} color="#6366f1" />
          </View>
          <Text style={styles.modernLoadingText}>Đang tải thông tin tiêm chủng...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.modernContainer}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} tintColor="#6366f1" />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderSchoolYearSelector()}
        {renderStudentSelection()}

        <View style={styles.modernTabContainer}>
          {renderTabButton("events", "Sự kiện", "calendar-outline", vaccineEvents.length)}
          {renderTabButton("registrations", "Đăng ký", "document-text-outline", vaccineRegistrations.length)}
          {renderTabButton("history", "Lịch sử", "time-outline", vaccinationHistory.length)}
        </View>

        <View style={styles.modernContent}>
          {activeTab === "events" && (
            <View style={styles.eventsContainer}>
              {vaccineEvents.length > 0 ? (
                <View style={styles.modernSection}>
                  <View style={styles.modernSectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={styles.sectionIconContainer}>
                        <Ionicons name="calendar" size={24} color="#6366f1" />
                      </View>
                      <View>
                        <Text style={styles.modernSectionTitle}>Sự kiện tiêm chủng</Text>
                        <Text style={styles.modernSectionSubtitle}>
                          {vaccineEvents.length} sự kiện
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modernEventsList}>
                    {vaccineEvents.map(renderEventCard)}
                  </View>
                  
                  {currentPage < totalPages && (
                    <TouchableOpacity
                      style={styles.modernLoadMoreButton}
                      onPress={loadMoreData}
                      disabled={isLoading}
                    >
                      <Text style={styles.modernLoadMoreText}>
                        {isLoading ? "Đang tải..." : "Tải thêm"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <EmptyEvents />
              )}
            </View>
          )}

          {activeTab === "registrations" && (
            <View style={styles.registrationsContainer}>
              {renderStatusFilter()}
              
              {/* Thêm debug info */}
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>
                  Filter hiện tại: {selectedRegistrationStatus} | 
                  Tổng số: {vaccineRegistrations.length} đăng ký
                </Text>
              </View>
              
              {vaccineRegistrations.length > 0 ? (
                <View style={styles.modernSection}>
                  <View style={styles.modernSectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={styles.sectionIconContainer}>
                        <Ionicons name="document-text" size={24} color="#6366f1" />
                      </View>
                      <View>
                        <Text style={styles.modernSectionTitle}>Đăng ký tiêm chủng</Text>
                        <Text style={styles.modernSectionSubtitle}>
                          {vaccineRegistrations.length} đăng ký
                          {selectedRegistrationStatus !== "all" && ` (${selectedRegistrationStatus})`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modernEventsList}>
                    {vaccineRegistrations.map(renderRegistrationCard)}
                  </View>
                  
                  {registrationCurrentPage < registrationTotalPages && (
                    <TouchableOpacity
                      style={styles.modernLoadMoreButton}
                      onPress={() => loadVaccineRegistrations(registrationCurrentPage + 1, false)}
                      disabled={isLoading}
                    >
                      <Text style={styles.modernLoadMoreText}>
                        {isLoading ? "Đang tải..." : "Tải thêm"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.modernEmptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#6366f1" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {selectedRegistrationStatus === "all" 
                      ? "Chưa có đăng ký tiêm chủng" 
                      : `Chưa có đăng ký ${selectedRegistrationStatus === "pending" ? "chờ duyệt" : selectedRegistrationStatus === "approved" ? "đã duyệt" : "bị từ chối"}`
                    }
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {selectedRegistrationStatus === "all"
                      ? "Các đăng ký tiêm chủng của học sinh sẽ xuất hiện tại đây"
                      : "Thử chọn filter khác để xem các đăng ký khác"
                    }
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "history" && (
            <View style={styles.historyContainer}>
              {vaccinationHistory.length > 0 ? (
                <View style={styles.historyList}>
                  {vaccinationHistory.map((item, index) => (
                    <View key={`history-${index}`} style={styles.modernHistoryCard}>
                      <View style={styles.historyCardHeader}>
                        <View style={styles.historyIconContainer}>
                          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        </View>
                        <View style={styles.historyCardContent}>
                          <Text style={styles.modernHistoryTitle}>{item.name}</Text>
                          <Text style={styles.modernHistoryDate}>{item.date}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyHistory />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modernLoadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modernLoadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  modernLoadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  modernHeader: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modernBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modernAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  modernSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "400",
  },
  modernSelectorContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  modernSelectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  selectorLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "600",
  },
  selectorContent: {
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  selectorScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modernOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 120,
  },
  selectedOptionCard: {
    backgroundColor: "#f0f0ff",
    borderColor: "#6366f1",
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  selectedOptionText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  modernTabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modernTabButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeModernTabButton: {
    backgroundColor: "#f0f0ff",
  },
  tabButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modernTabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  activeModernTabText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  tabBadge: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modernContent: {
    marginTop: 20,
  },
  modernTabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modernListContainer: {
    paddingBottom: 20,
  },
  modernSection: {
    marginBottom: 32,
  },
  modernSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  modernSectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  modernEventCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  modernStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modernStatusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  eventCardBody: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modernEventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 24,
  },
  vaccineInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  vaccineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  modernVaccineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
  modernEventDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  modernEventDetails: {
    backgroundColor: "#f8fafc",
    padding: 20,
    gap: 12,
  },
  modernDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernDetailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  modernEmptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  modernSessionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionCardContent: {
    flex: 1,
  },
  modernSessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  modernSessionDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  modernHistoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyCardContent: {
    flex: 1,
  },
  modernHistoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  modernHistoryDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  // Legacy styles for compatibility
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "500",
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  schoolYearContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: -10,
  },
  schoolYearLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 10,
  },
  schoolYearScrollContainer: {
    paddingRight: 20,
  },
  schoolYearCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedSchoolYearCard: {
    backgroundColor: "#f0f0ff",
    borderColor: "#6366f1",
  },
  schoolYearText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  selectedSchoolYearText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: "#f0f0ff",
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  activeTabText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernCard: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vaccineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    lineHeight: 24,
  },
  vaccineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
    marginLeft: 6,
  },
  eventDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 18,
  },
  eventInfo: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },
  infoTextBold: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 22,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
  },
  dateBox: {
    flex: 1,
    alignItems: "center",
  },
  dateSeparator: {
    width: 2,
    height: 30,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  dateLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  timeValue: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  registerEventButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  registerEventButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  deadlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deadlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 4,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  sessionDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  historyDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  registerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  studentContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 10,
  },
  studentScrollContainer: {
    paddingRight: 20,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedStudentCard: {
    backgroundColor: "#f0f0ff",
    borderColor: "#6366f1",
  },
  studentName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  selectedStudentName: {
    color: "#6366f1",
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  eventCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  sectionToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  enhancedEventCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  eventCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  vaccineInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventDetails: {
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  pastEventCard: {
    opacity: 0.8,
  },
  eventHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  eventContent: {
    padding: 16,
    paddingTop: 12,
  },
  eventCardInfo: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
  },
  eventCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventCardInfoText: {
    flex: 1,
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },
  eventCardInfoTextBold: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 22,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  eventsContainer: {
    flex: 1,
  },
  sessionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sessionsList: {
    paddingTop: 10,
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyList: {
    paddingTop: 10,
  },
  registrationsContainer: {
    flex: 1,
  },
  statusFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  statusFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  selectedStatusFilterButton: {
    backgroundColor: "#f0f0ff",
    borderColor: "#6366f1",
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  selectedStatusFilterText: {
    color: "#6366f1",
  },
  modernEventsList: {
    paddingTop: 10,
  },
  modernLoadMoreButton: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  modernLoadMoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
  debugContainer: {
    backgroundColor: "#fff3cd",
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  debugText: {
    fontSize: 12,
    color: "#856404",
    fontWeight: "500",
  },
})
