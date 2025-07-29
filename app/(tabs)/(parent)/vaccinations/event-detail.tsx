"use client"

import { api, getCurrentUserId } from "@/lib/api"
import { useAuth, checkUserPermission, showPermissionDeniedAlert } from "@/lib/auth"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

interface VaccineEvent {
  _id: string
  title: string
  gradeId: string
  description: string
  vaccineName: string
  location: string
  startRegistrationDate: string
  endRegistrationDate: string
  eventDate: string
  schoolYear: string
  createdAt: string
  updatedAt: string
  __v: number
  status?: "upcoming" | "ongoing" | "completed" | "closed"
}

interface Student {
  _id: string
  fullName: string
  classId?: string
  avatar?: string
}

interface VaccineRegistration {
  _id: string
  studentId: string
  parentId: string
  eventId: string
  status: "pending" | "approved" | "rejected"
  registrationDate: string
  schoolYear: string
  notes?: string
  cancellationReason?: string
}

export default function VaccineEventDetailScreen() {
  const { id, studentId, studentName } = useLocalSearchParams()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [eventData, setEventData] = useState<VaccineEvent | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consent, setConsent] = useState<boolean | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [existingRegistration, setExistingRegistration] = useState<VaccineRegistration | null>(null)
  const [scrollY] = useState(new Animated.Value(0))

  // Add debug logging at the top of component
  useEffect(() => {
    console.log('=== EVENT DETAIL COMPONENT MOUNTED ===')
    console.log('Event ID:', id)
    console.log('Student ID:', studentId)
    console.log('Student Name:', studentName)
    console.log('=========================================')
  }, [])

  // Validate required parameters
  useEffect(() => {
    if (!id || id === "undefined" || Array.isArray(id)) {
      console.error("Invalid event ID:", id)
      Alert.alert("Lỗi", "ID sự kiện không hợp lệ. Vui lòng thử lại.", [{ text: "OK", onPress: () => router.back() }])
      return
    }

    if (!studentId || studentId === "undefined" || Array.isArray(studentId)) {
      console.error("Invalid student ID:", studentId)
      Alert.alert("Lỗi", "ID học sinh không hợp lệ. Vui lòng thử lại.", [{ text: "OK", onPress: () => router.back() }])
      return
    }

    loadInitialData()
  }, [id, studentId])

  const loadInitialData = async () => {
    try {
      // Validate ID format before making API call
      if (!id || typeof id !== "string" || id.trim() === "" || id === "undefined") {
        throw new Error("Invalid event ID provided")
      }

      setIsLoading(true)
      console.log("Loading event with ID:", id)

      // Load event data with proper error handling
      const response = await api.getVaccineEventDetail(id as string)

      if (!response || !response.data) {
        throw new Error("No event data received from server")
      }

      setEventData(response.data)
      console.log('=== EVENT DATA LOADED ===')
      console.log('Event:', response.data.title)
      console.log('Start Reg:', response.data.startRegistrationDate)
      console.log('End Reg:', response.data.endRegistrationDate)
      console.log('==========================')
      console.log("Event data loaded successfully:", response.data.title)

      // Get current user
      const userId = await getCurrentUserId()
      if (!userId) {
        console.warn("No user ID found")
        return
      }
      setCurrentUserId(userId)

      // Check if registration exists
      if (userId && studentId && typeof studentId === "string" && studentId !== "undefined") {
        try {
          const registrationResponse = await api.searchVaccineRegistrations({
            pageNum: 1,
            pageSize: 10,
            parentId: userId,
            studentId: studentId as string,
          })

          if (registrationResponse.pageData && registrationResponse.pageData.length > 0) {
            // ✅ Filter theo eventId ở client-side
            const eventRegistration = registrationResponse.pageData.find(
              reg => reg.eventId === id
            )
            
            if (eventRegistration) {
              setExistingRegistration(eventRegistration)
              console.log('=== EXISTING REGISTRATION FOUND ===')
              console.log('Registration Status:', eventRegistration.status)
              console.log('Registration ID:', eventRegistration._id)
              console.log('====================================')
            } else {
              console.log('=== NO EXISTING REGISTRATION FOR THIS EVENT ===')
            }
          } else {
            console.log('=== NO EXISTING REGISTRATION ===')
          }
        } catch (error) {
          console.error("Failed to check existing registration", error)
          // Don't throw here, just log the error
        }
      }
    } catch (error: any) {
      console.error("Failed to load event data", error)

      let errorMessage = "Không thể tải thông tin sự kiện tiêm chủng"

      if (error.message?.includes("Cast to ObjectId failed")) {
        errorMessage = "ID sự kiện không đúng định dạng. Vui lòng kiểm tra lại."
      } else if (error.message?.includes("Invalid event ID")) {
        errorMessage = "ID sự kiện không hợp lệ. Vui lòng thử lại."
      } else if (error.message?.includes("No event data received")) {
        errorMessage = "Không tìm thấy thông tin sự kiện. Sự kiện có thể đã bị xóa."
      }

      Alert.alert("Lỗi", errorMessage, [{ text: "OK", onPress: () => router.back() }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadInitialData()
    setIsRefreshing(false)
  }

  const handleRegister = () => {
    // Reset form states
    setConsent(null)
    setRejectionReason("")
    setShowConsentModal(true)
  }

  const handleSubmitRegistration = async () => {
    // Check user permission first
    if (!checkUserPermission(user)) {
      showPermissionDeniedAlert()
      return
    }

    // Validate all required parameters
    if (!currentUserId || !studentId || !eventData || !id) {
      Alert.alert("Lỗi", "Thiếu thông tin cần thiết để đăng ký")
      return
    }

    if (typeof studentId !== "string" || studentId === "undefined" || studentId.trim() === "") {
      Alert.alert("Lỗi", "ID học sinh không hợp lệ")
      return
    }

    if (typeof id !== "string" || id === "undefined" || id.trim() === "") {
      Alert.alert("Lỗi", "ID sự kiện không hợp lệ")
      return
    }

    if (consent === null) {
      Alert.alert("Lỗi", "Vui lòng chọn đồng ý hoặc từ chối")
      return
    }

    if (consent === false && !rejectionReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do từ chối")
      return
    }

    setIsProcessing(true)

    const registrationData = {
      parentId: currentUserId,
      studentId: studentId as string,
      eventId: eventData._id,
      status: consent ? ("pending" as const) : ("rejected" as const),
      schoolYear: eventData.schoolYear,
      note: consent ? "Đồng ý đăng ký tiêm chủng từ ứng dụng di động" : rejectionReason,
      cancellationReason: consent ? undefined : rejectionReason,
    }

    try {
      console.log("Submitting registration with data:", registrationData)
      const response = await api.createVaccineRegistration(registrationData)
      console.log("✅ Registration created:", response)

      setShowConsentModal(false)
      setExistingRegistration(response.data)

      const message = consent
        ? "Đăng ký tiêm chủng thành công! Chờ phê duyệt từ nhà trường."
        : "Đã ghi nhận từ chối tham gia tiêm chủng."

      Alert.alert("Thành công", message)
    } catch (error: any) {
      console.error("❌ Registration error:", error)

      let errorMessage = "Không thể xử lý đăng ký. Vui lòng thử lại."

      if (error.message && error.message.includes("đã tồn tại")) {
        errorMessage = "Học sinh này đã có đăng ký cho sự kiện này rồi."
        setShowConsentModal(false)
      } else if (error.message?.includes("Cast to ObjectId failed")) {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng thử lại."
      }

      Alert.alert("Thông báo", errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const renderConsentModal = () => (
    <Modal
      visible={showConsentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowConsentModal(false)}
    >
      <View style={styles.modernModalOverlay}>
        <View style={styles.modernModalContent}>
          {/* Modal Handle */}
          <View style={styles.modalHandle} />

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="medical" size={32} color="#6366f1" />
              </View>
              <Text style={styles.modernModalTitle}>Đăng ký tiêm chủng</Text>
              <Text style={styles.modalSubtitle}>Xác nhận thông tin đăng ký</Text>
            </View>

            <View style={styles.modalInfoSection}>
              <View style={styles.modernModalSection}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Học sinh</Text>
                    <Text style={styles.modalInfoValue}>{studentName}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modernModalSection}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Sự kiện</Text>
                    <Text style={styles.modalInfoValue}>{eventData?.title}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modernModalSection}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="medical-outline" size={20} color="#6b7280" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Vaccine</Text>
                    <Text style={styles.modalInfoValue}>{eventData?.vaccineName}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.consentSection}>
              <Text style={styles.modernConsentQuestion}>Bạn có đồng ý cho con tham gia tiêm chủng không?</Text>

              <View style={styles.modernConsentButtons}>
                <TouchableOpacity
                  style={[styles.modernConsentButton, consent === true && styles.selectedAgreeButton]}
                  onPress={() => {
                    setConsent(true)
                    setRejectionReason("")
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.consentButtonContent}>
                    <View
                      style={[
                        styles.consentIconContainer,
                        { backgroundColor: consent === true ? "#10b981" : "#f3f4f6" },
                      ]}
                    >
                      <Ionicons name="checkmark" size={20} color={consent === true ? "#fff" : "#9ca3af"} />
                    </View>
                    <Text style={[styles.modernConsentButtonText, consent === true && styles.selectedConsentText]}>
                      Đồng ý
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modernConsentButton, consent === false && styles.selectedRejectButton]}
                  onPress={() => setConsent(false)}
                  activeOpacity={0.7}
                >
                  <View style={styles.consentButtonContent}>
                    <View
                      style={[
                        styles.consentIconContainer,
                        { backgroundColor: consent === false ? "#ef4444" : "#f3f4f6" },
                      ]}
                    >
                      <Ionicons name="close" size={20} color={consent === false ? "#fff" : "#9ca3af"} />
                    </View>
                    <Text style={[styles.modernConsentButtonText, consent === false && styles.selectedConsentText]}>
                      Từ chối
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {consent === false && (
              <View style={styles.modernReasonSection}>
                <Text style={styles.modernReasonLabel}>Lý do từ chối *</Text>
                <TextInput
                  style={styles.modernReasonInput}
                  placeholder="Nhập lý do từ chối tham gia tiêm chủng..."
                  placeholderTextColor="#9ca3af"
                  multiline={true}
                  numberOfLines={4}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>{rejectionReason.length}/500</Text>
              </View>
            )}
          </ScrollView>

          {/* Fixed Bottom Buttons */}
          <View style={styles.modalBottomSection}>
            <View style={styles.modernModalButtons}>
              <TouchableOpacity
                style={styles.modernModalCancelButton}
                onPress={() => setShowConsentModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modernModalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modernModalSubmitButton, isProcessing && styles.disabledButton]}
                onPress={handleSubmitRegistration}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name={consent === true ? "checkmark-circle" : consent === false ? "close-circle" : "send"}
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.modernModalSubmitText}>
                      {consent === true ? "Đăng ký" : consent === false ? "Gửi từ chối" : "Xác nhận"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "upcoming":
        return {
          color: "#6366f1",
          bgColor: "#f0f0ff",
          text: "Sắp diễn ra",
          icon: "time-outline",
        }
      case "ongoing":
        return {
          color: "#10b981",
          bgColor: "#f0fdf4",
          text: "Đang diễn ra",
          icon: "play-circle-outline",
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

  // Add this function to check registration time
  const canRegister = (event: VaccineEvent | null): boolean => {
    if (!event) return false

    const now = new Date()
    const startReg = new Date(event.startRegistrationDate)
    const endReg = new Date(event.endRegistrationDate)

    // Thêm debug logs
    console.log('=== DEBUG REGISTRATION TIME ===')
    console.log('Current time:', now.toISOString())
    console.log('Start registration:', startReg.toISOString())
    console.log('End registration:', endReg.toISOString())
    console.log('Can register:', now >= startReg && now <= endReg)
    console.log('existingRegistration:', existingRegistration)
    console.log('===============================')

    return now >= startReg && now <= endReg
  }

  // Add this function to get registration status message
  const getRegistrationStatusMessage = (event: VaccineEvent | null): string => {
    if (!event) return ""

    const now = new Date()
    const startReg = new Date(event.startRegistrationDate)
    const endReg = new Date(event.endRegistrationDate)

    if (now < startReg) {
      return "Chưa đến thời gian đăng ký"
    } else if (now > endReg) {
      return "Đã hết thời gian đăng ký"
    }
    return "Đang mở đăng ký"
  }

  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.modernLoadingContainer}>
        <View style={styles.modernLoadingContent}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="medical" size={48} color="#6366f1" />
          </View>
          <Text style={styles.modernLoadingText}>Đang tải thông tin sự kiện...</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.loadingDot, { animationDelay: "0ms" }]} />
            <View style={[styles.loadingDot, { animationDelay: "150ms" }]} />
            <View style={[styles.loadingDot, { animationDelay: "300ms" }]} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.modernErrorContainer}>
        <View style={styles.modernErrorContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>
          <Text style={styles.modernErrorTitle}>Không tìm thấy sự kiện</Text>
          <Text style={styles.modernErrorText}>Sự kiện tiêm chủng này có thể đã bị xóa hoặc không tồn tại.</Text>
          <TouchableOpacity style={styles.modernBackButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.modernBackButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const statusConfig = getStatusConfig(eventData?.status || "upcoming")

  return (
    <SafeAreaView style={styles.modernContainer}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.animatedBackButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle} numberOfLines={1}>
          {eventData?.title}
        </Text>
        <TouchableOpacity style={styles.animatedShareButton} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={20} color="#1f2937" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.modernHeroSection}>
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.modernBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroActionButton} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroActionButton} activeOpacity={0.7}>
                <Ionicons name="bookmark-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={[styles.modernStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <Text style={[styles.modernStatusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
            </View>

            <Text style={styles.modernEventTitle}>{eventData?.title}</Text>

            <View style={styles.vaccineHeroInfo}>
              <View style={styles.vaccineIconBadge}>
                <Ionicons name="medical" size={20} color="#6366f1" />
              </View>
              <Text style={styles.modernVaccineNameHero}>{eventData?.vaccineName}</Text>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatText}>{formatDate(eventData?.eventDate || "")}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatText} numberOfLines={1}>
                  {eventData?.location}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content Cards */}
        <View style={styles.modernContentContainer}>
          {/* Student Info Card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="person" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.modernCardTitle}>Thông tin học sinh</Text>
                <Text style={styles.cardSubtitle}>Học sinh đăng ký tham gia</Text>
              </View>
            </View>
<View style={styles.studentInfoContainer}>
  <View style={styles.studentAvatar}>
    <Ionicons name="person-circle-outline" size={32} color="#6366f1" />
  </View>
  <View style={styles.studentInfo}>
    <Text style={styles.modernStudentName}>{studentName}</Text>
  </View>
  <View style={styles.studentBadge}>
    <Text style={styles.studentBadgeText}>Học sinh</Text>
  </View>
</View>
          </View>

          {/* Event Description Card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="information-circle" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.modernCardTitle}>Thông tin chi tiết</Text>
                <Text style={styles.cardSubtitle}>Mô tả về sự kiện tiêm chủng</Text>
              </View>
            </View>
            <View style={styles.descriptionContainer}>
              {(eventData as any)?.provider && (
                <View style={styles.providerContainer}>
                  <View style={styles.providerIconBadge}>
                    <Ionicons name="business" size={16} color="#6366f1" />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerLabel}>Đơn vị tổ chức:</Text>
                    <Text style={styles.providerText}>{(eventData as any).provider}</Text>
                  </View>
                </View>
              )}
              <Text style={styles.modernDescription}>{eventData?.description}</Text>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="location" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.modernCardTitle}>Địa điểm tiêm chủng</Text>
                <Text style={styles.cardSubtitle}>Nơi tổ chức sự kiện</Text>
              </View>
            </View>
            <View style={styles.locationContainer}>
              <View style={styles.locationIconBadge}>
                <Ionicons name="location-outline" size={20} color="#ef4444" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.modernLocationText}>{eventData?.location}</Text>
                <TouchableOpacity style={styles.directionButton} activeOpacity={0.7}>
                  <Ionicons name="navigate-outline" size={16} color="#6366f1" />
                  <Text style={styles.directionButtonText}>Chỉ đường</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Timeline Card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="time" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.modernCardTitle}>Lịch trình</Text>
                <Text style={styles.cardSubtitle}>Thời gian đăng ký và tiêm chủng</Text>
              </View>
            </View>
            <View style={styles.modernTimelineContainer}>
              {/* Registration Period */}
              <View style={styles.modernTimelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.modernTimelineTitle}>Thời gian đăng ký</Text>
                    <View style={styles.timelineStatusBadge}>
                      <Text style={styles.timelineStatusText}>Đăng ký</Text>
                    </View>
                  </View>
                  <Text style={styles.modernTimelineDate}>{formatDate(eventData?.startRegistrationDate || "")}</Text>
                  <Text style={styles.modernTimelineTime}>
                    {formatTime(eventData?.startRegistrationDate || "")} -{" "}
                    {formatTime(eventData?.endRegistrationDate || "")}
                  </Text>
                  <Text style={styles.timelineDuration}>Đến {formatDate(eventData?.endRegistrationDate || "")}</Text>
                </View>
              </View>

              {/* Event Date */}
              <View style={styles.modernTimelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={[styles.timelineDot, styles.eventTimelineDot]} />
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.modernTimelineTitle}>Ngày tiêm chủng</Text>
                    <View style={[styles.timelineStatusBadge, styles.eventStatusBadge]}>
                      <Text style={[styles.timelineStatusText, styles.eventStatusText]}>Tiêm chủng</Text>
                    </View>
                  </View>
                  <Text style={styles.modernTimelineDate}>{formatDate(eventData?.eventDate || "")}</Text>
                  <Text style={styles.modernTimelineTime}>{formatTime(eventData?.eventDate || "")}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Requirements Card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="list" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.modernCardTitle}>Yêu cầu & Lưu ý</Text>
                <Text style={styles.cardSubtitle}>Những điều cần chuẩn bị</Text>
              </View>
            </View>
            <View style={styles.requirementsContainer}>
              <View style={styles.modernRequirementItem}>
                <View style={styles.requirementIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <Text style={styles.modernRequirementText}>Mang theo sổ tiêm chủng/phiếu tiêm chủng</Text>
              </View>
              <View style={styles.modernRequirementItem}>
                <View style={styles.requirementIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <Text style={styles.modernRequirementText}>Khám sàng lọc trước khi tiêm</Text>
              </View>
              <View style={styles.modernRequirementItem}>
                <View style={styles.requirementIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <Text style={styles.modernRequirementText}>Theo dõi sau tiêm 30 phút tại điểm tiêm</Text>
              </View>
              <View style={styles.modernRequirementItem}>
                <View style={styles.requirementIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <Text style={styles.modernRequirementText}>Thông báo ngay nếu có phản ứng bất thường</Text>
              </View>
            </View>
          </View>

          {/* Registration Status or Button */}
          <View style={styles.registrationSection}>
            {(() => {
              console.log('=== RENDER REGISTRATION SECTION ===')
              console.log('existingRegistration:', !!existingRegistration)
              console.log('canRegister result:', canRegister(eventData))
              console.log('eventData:', !!eventData)
              console.log('====================================')
              return null
            })()}
            
            {existingRegistration ? (
              <View style={styles.modernRegistrationStatus}>
                <View style={styles.statusHeader}>
                  <View
                    style={[
                      styles.modernStatusIndicator,
                      {
                        backgroundColor:
                          existingRegistration.status === "pending"
                            ? "#f59e0b"
                            : existingRegistration.status === "approved"
                              ? "#10b981"
                              : "#ef4444",
                      },
                    ]}
                  />
                  <Text style={styles.modernStatusIndicatorText}>
                    {existingRegistration.status === "pending"
                      ? "Đã đăng ký - Chờ duyệt"
                      : existingRegistration.status === "approved"
                        ? "Đã được duyệt"
                        : "Đã từ chối"}
                  </Text>
                </View>
                <Text style={styles.statusDescription}>
                  {existingRegistration.status === "pending"
                    ? "Đăng ký của bạn đang được xem xét bởi nhà trường"
                    : existingRegistration.status === "approved"
                      ? "Đăng ký đã được phê duyệt. Vui lòng đến đúng giờ"
                      : "Đăng ký đã bị từ chối hoặc bạn đã từ chối tham gia"}
                </Text>
                <View style={styles.statusActions}>
                  <TouchableOpacity style={styles.statusActionButton} activeOpacity={0.7}>
                    <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                    <Text style={styles.statusActionText}>Thêm vào lịch</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statusActionButton} activeOpacity={0.7}>
                    <Ionicons name="call-outline" size={16} color="#6366f1" />
                    <Text style={styles.statusActionText}>Liên hệ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !canRegister(eventData) ? (
              <View style={styles.modernRegistrationStatus}>
                <View style={styles.statusHeader}>
                  <View style={[styles.modernStatusIndicator, { backgroundColor: "#6b7280" }]} />
                  <Text style={styles.modernStatusIndicatorText}>{getRegistrationStatusMessage(eventData)}</Text>
                </View>
                <Text style={styles.statusDescription}>
                  {getRegistrationStatusMessage(eventData) === "Chưa đến thời gian đăng ký"
                    ? "Thời gian đăng ký sẽ bắt đầu vào " + formatDate(eventData?.startRegistrationDate || "")
                    : "Thời gian đăng ký đã kết thúc vào " + formatDate(eventData?.endRegistrationDate || "")}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.modernRegisterButton} onPress={handleRegister} activeOpacity={0.7}>
                <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.registerButtonGradient}>
                  <Ionicons name="add-circle-outline" size={24} color="#fff" />
                  <Text style={styles.modernRegisterButtonText}>Đăng ký tham gia</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {renderConsentModal()}
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
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  modernErrorContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modernErrorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  modernErrorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  modernErrorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  modernBackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernBackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 16,
    paddingHorizontal: 20,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  animatedBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  animatedHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  animatedShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  modernHeroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  modernBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroActions: {
    flexDirection: "row",
    gap: 12,
  },
  heroActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  modernStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  modernStatusText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  modernEventTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
  },
  vaccineHeroInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  vaccineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modernVaccineNameHero: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  heroStatItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  heroStatText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginLeft: 6,
    fontWeight: "500",
  },
  heroStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 16,
  },
  modernContentContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modernCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  modernCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  modernCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  studentInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  modernStudentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  studentBadge: {
    backgroundColor: "#f0f0ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  studentBadgeText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
  },
  descriptionContainer: {
    padding: 20,
  },
  modernDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  locationIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  modernLocationText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 8,
  },
  directionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  directionButtonText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginLeft: 4,
  },
  modernTimelineContainer: {
    padding: 20,
  },
  modernTimelineItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    marginBottom: 8,
  },
  eventTimelineDot: {
    backgroundColor: "#10b981",
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: "#e5e7eb",
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modernTimelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  timelineStatusBadge: {
    backgroundColor: "#f0f0ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusBadge: {
    backgroundColor: "#f0fdf4",
  },
  timelineStatusText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
  },
  eventStatusText: {
    color: "#10b981",
  },
  modernTimelineDate: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 4,
  },
  modernTimelineTime: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  timelineDuration: {
    fontSize: 13,
    color: "#9ca3af",
  },
  requirementsContainer: {
    padding: 20,
  },
  modernRequirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  requirementIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  modernRequirementText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  registrationSection: {
    marginBottom: 20,
  },
  modernRegistrationStatus: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modernStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  modernStatusIndicatorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  statusDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginLeft: 24,
    marginBottom: 16,
  },
  statusActions: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 24,
  },
  statusActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusActionText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginLeft: 4,
  },
  modernRegisterButton: {
    borderRadius: 20,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  modernRegisterButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  // Modal Styles
  modernModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modernModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 24,
    maxHeight: "95%",
    minHeight: "50%",
    flex: 1,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modernModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  modalInfoSection: {
    marginBottom: 32,
  },
  modernModalSection: {
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
  },
  modalInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  consentSection: {
    marginBottom: 32,
  },
  modernConsentQuestion: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 26,
  },
  modernConsentButtons: {
    flexDirection: "row",
    gap: 16,
  },
  modernConsentButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  selectedAgreeButton: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  selectedRejectButton: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  consentButtonContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  consentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modernConsentButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  selectedConsentText: {
    color: "#1f2937",
  },
  modernReasonSection: {
    marginBottom: 32,
  },
  modernReasonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  modernReasonInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#fff",
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 8,
  },
  modernModalButtons: {
    flexDirection: "row",
    gap: 16,
  },
  modernModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modernModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  modernModalSubmitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
  },
  modernModalSubmitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Legacy styles for compatibility
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#1f2937",
    textAlign: "center",
    fontWeight: "500",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  vaccineNameHero: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  content: {
    flex: 1,
    marginTop: -15,
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 25,
    paddingHorizontal: 20,
    minHeight: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    padding: 16,
    borderRadius: 15,
  },
  locationText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6366f1",
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotEvent: {
    backgroundColor: "#10b981",
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: "#e5e7eb",
    marginLeft: 5,
    marginVertical: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  timelineTime: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  requirementsCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: "#1f2937",
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 20,
  },
  modalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    textAlign: "right",
  },
  consentQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginVertical: 20,
  },
  consentButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  consentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
  },
  selectedConsentButton: {
    backgroundColor: "#059669",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  selectedRejectButton: {
    backgroundColor: "#dc2626",
  },
  consentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
  reasonSection: {
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  registrationStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusIndicatorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  studentInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    padding: 16,
    borderRadius: 15,
  },
  studentName: {
    marginLeft: 12,
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
    fontWeight: "500",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  modalScrollView: {
    flex: 1,
    maxHeight: "80%",
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalBottomSection: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  // Provider styles
  providerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
  },
  providerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 2,
  },
  providerText: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },

})
