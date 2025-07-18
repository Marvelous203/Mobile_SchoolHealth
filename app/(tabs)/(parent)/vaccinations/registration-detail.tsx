"use client"

import { api, getCurrentUserId } from "@/lib/api"
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

interface VaccineRegistrationDetail {
  _id: string
  studentId: string
  parentId: string
  eventId: string
  status: "pending" | "approved" | "rejected"
  student?: {
    _id: string
    fullName: string
    studentCode: string
    gender: string
    dob: string
    avatar?: string
  }
  parent?: {
    _id: string
    fullName: string
    email: string
    phone: string
  }
  event: string
  eventName?: string
  vaccineName?: string
  schoolYear: string
  notes?: string
  cancellationReason?: string
  registrationDate?: string
  consentDate?: string
  createdAt: string
  updatedAt: string
}

interface VaccineEvent {
  _id: string
  eventName: string
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
  status?: "upcoming" | "ongoing" | "completed" | "closed"
}

export default function VaccineRegistrationDetailScreen() {
  const { id } = useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [registrationData, setRegistrationData] = useState<VaccineRegistrationDetail | null>(null)
  const [eventData, setEventData] = useState<VaccineEvent | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [scrollY] = useState(new Animated.Value(0))

  useEffect(() => {
    loadInitialData()
  }, [id])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)

      // Load registration data
      const registrationResponse = await api.getVaccineRegistrationDetail(id as string)
      setRegistrationData(registrationResponse.data)

      // Load event data if eventId exists
      if (registrationResponse.data.eventId) {
        try {
          const eventResponse = await api.getVaccineEventDetail(registrationResponse.data.eventId)
          setEventData(eventResponse.data)
        } catch (eventError) {
          console.error("Failed to load event data", eventError)
          // Continue without event data
        }
      }

      // Get current user
      const userId = await getCurrentUserId()
      setCurrentUserId(userId)
    } catch (error) {
      console.error("Failed to load registration data", error)
      Alert.alert("Lỗi", "Không thể tải thông tin đăng ký tiêm chủng")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadInitialData()
    setIsRefreshing(false)
  }

  const handleCancelRegistration = () => {
    setCancellationReason("")
    setShowCancelModal(true)
  }

  const handleSubmitCancellation = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do hủy đăng ký")
      return
    }

    setIsProcessing(true)

    try {
      await api.updateVaccineRegistrationStatus(registrationData!._id, {
        status: "rejected",
        cancellationReason: cancellationReason,
        notes: `Hủy đăng ký từ ứng dụng di động: ${cancellationReason}`,
      })

      setShowCancelModal(false)
      Alert.alert("Thành công", "Đã hủy đăng ký tiêm chủng thành công", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ])
    } catch (error: any) {
      console.error("❌ Cancellation error:", error)
      Alert.alert("Lỗi", "Không thể hủy đăng ký. Vui lòng thử lại.")
    } finally {
      setIsProcessing(false)
    }
  }

  const renderCancelModal = () => (
    <Modal
      visible={showCancelModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCancelModal(false)}
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
                <Ionicons name="warning" size={32} color="#ef4444" />
              </View>
              <Text style={styles.modernModalTitle}>Hủy đăng ký tiêm chủng</Text>
              <Text style={styles.modalSubtitle}>Xác nhận hủy đăng ký</Text>
            </View>

            <View style={styles.modalInfoSection}>
              <View style={styles.modernModalSection}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="person-outline" size={20} color="#6b7280" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Học sinh</Text>
                    <Text style={styles.modalInfoValue}>
                      {registrationData?.student?.fullName || "Không có thông tin"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.modernModalSection}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Sự kiện</Text>
                    <Text style={styles.modalInfoValue}>
                      {eventData?.eventName || registrationData?.eventName || "Sự kiện tiêm chủng"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.modernModalSection}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="medical-outline" size={20} color="#6b7280" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Vaccine</Text>
                    <Text style={styles.modalInfoValue}>
                      {eventData?.vaccineName || registrationData?.vaccineName || "Vaccine"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.warningSection}>
              <View style={styles.warningContainer}>
                <Ionicons name="alert-circle" size={24} color="#f59e0b" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
                  <Text style={styles.warningText}>
                    Sau khi hủy đăng ký, bạn sẽ không thể tham gia sự kiện tiêm chủng này. Vui lòng cân nhắc kỹ trước
                    khi xác nhận.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modernReasonSection}>
              <Text style={styles.modernReasonLabel}>Lý do hủy đăng ký *</Text>
              <TextInput
                style={styles.modernReasonInput}
                placeholder="Nhập lý do hủy đăng ký tiêm chủng..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={4}
                value={cancellationReason}
                onChangeText={setCancellationReason}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{cancellationReason.length}/500</Text>
            </View>
          </ScrollView>

          {/* Fixed Bottom Buttons */}
          <View style={styles.modalBottomSection}>
            <View style={styles.modernModalButtons}>
              <TouchableOpacity
                style={styles.modernModalCancelButton}
                onPress={() => setShowCancelModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modernModalCancelText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modernModalSubmitButton,
                  styles.cancelSubmitButton,
                  isProcessing && styles.disabledButton,
                ]}
                onPress={handleSubmitCancellation}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.modernModalSubmitText}>Xác nhận hủy</Text>
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
          icon: "checkmark-circle",
        }
      case "rejected":
        return {
          color: "#ef4444",
          bgColor: "#fef2f2",
          text: "Đã từ chối",
          icon: "close-circle",
        }
      default:
        return {
          color: "#6b7280",
          bgColor: "#f9fafb",
          text: "Không xác định",
          icon: "help-circle",
        }
    }
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
          <Text style={styles.modernLoadingText}>Đang tải thông tin đăng ký...</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.loadingDot, { animationDelay: "0ms" }]} />
            <View style={[styles.loadingDot, { animationDelay: "150ms" }]} />
            <View style={[styles.loadingDot, { animationDelay: "300ms" }]} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (!registrationData) {
    return (
      <SafeAreaView style={styles.modernErrorContainer}>
        <View style={styles.modernErrorContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>
          <Text style={styles.modernErrorTitle}>Không tìm thấy thông tin đăng ký</Text>
          <Text style={styles.modernErrorText}>
            Thông tin đăng ký tiêm chủng này có thể đã bị xóa hoặc không tồn tại.
          </Text>
          <TouchableOpacity style={styles.modernBackButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.modernBackButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const statusConfig = getStatusConfig(registrationData.status)

  return (
    <SafeAreaView style={styles.modernContainer}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.animatedBackButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle} numberOfLines={1}>
          Chi tiết đăng ký
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

            <Text style={styles.modernEventTitle}>
              {eventData?.eventName || registrationData?.eventName || "Sự kiện tiêm chủng"}
            </Text>

            <View style={styles.vaccineHeroInfo}>
              <View style={styles.vaccineIconBadge}>
                <Ionicons name="medical" size={20} color="#6366f1" />
              </View>
              <Text style={styles.modernVaccineNameHero}>
                {eventData?.vaccineName || registrationData?.vaccineName || "Vaccine"}
              </Text>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatText}>{registrationData.student?.fullName || "Học sinh"}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatText}>{registrationData.schoolYear}</Text>
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
                <Text style={styles.modernStudentName}>
                  {registrationData.student?.fullName || "Không có thông tin"}
                </Text>
                <Text style={styles.studentCode}>
                  Mã HS: {registrationData.student?.studentCode || "Chưa xác định"}
                </Text>
                {registrationData.student?.dob && (
                  <Text style={styles.studentDob}>Sinh: {formatDate(registrationData.student.dob)}</Text>
                )}
              </View>
              <View style={styles.studentBadge}>
                <Text style={styles.studentBadgeText}>Học sinh</Text>
              </View>
            </View>
          </View>

          {/* Registration Status Card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="clipboard" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.modernCardTitle}>Trạng thái đăng ký</Text>
                <Text style={styles.cardSubtitle}>Tình trạng xử lý đăng ký</Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.modernStatusCard, { backgroundColor: statusConfig.bgColor }]}>
                <View style={styles.statusRow}>
                  <View style={styles.statusIconContainer}>
                    <Ionicons name={statusConfig.icon as any} size={24} color={statusConfig.color} />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={[styles.modernStatusTitle, { color: statusConfig.color }]}>{statusConfig.text}</Text>
                    <Text style={styles.statusDate}>
                      Đăng ký: {formatDate(registrationData.registrationDate || registrationData.createdAt)}
                    </Text>
                    {registrationData.consentDate && (
                      <Text style={styles.statusDate}>Xác nhận: {formatDate(registrationData.consentDate)}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Event Information Card */}
          {eventData && (
            <View style={styles.modernCard}>
              <View style={styles.modernCardHeader}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="information-circle" size={24} color="#6366f1" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.modernCardTitle}>Thông tin sự kiện</Text>
                  <Text style={styles.cardSubtitle}>Mô tả về sự kiện tiêm chủng</Text>
                </View>
              </View>
              <View style={styles.descriptionContainer}>
                <Text style={styles.modernDescription}>{eventData.description}</Text>
              </View>
            </View>
          )}

          {/* Location Card */}
          {eventData?.location && (
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
                  <Text style={styles.modernLocationText}>{eventData.location}</Text>
                  <TouchableOpacity style={styles.directionButton} activeOpacity={0.7}>
                    <Ionicons name="navigate-outline" size={16} color="#6366f1" />
                    <Text style={styles.directionButtonText}>Chỉ đường</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Timeline Card */}
          {eventData && (
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
                {/* Registration Date */}
                <View style={styles.modernTimelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.modernTimelineTitle}>Ngày đăng ký</Text>
                      <View style={styles.timelineStatusBadge}>
                        <Text style={styles.timelineStatusText}>Đăng ký</Text>
                      </View>
                    </View>
                    <Text style={styles.modernTimelineDate}>
                      {formatDate(registrationData.registrationDate || registrationData.createdAt)}
                    </Text>
                    <Text style={styles.modernTimelineTime}>
                      {formatTime(registrationData.registrationDate || registrationData.createdAt)}
                    </Text>
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
                    <Text style={styles.modernTimelineDate}>{formatDate(eventData.eventDate)}</Text>
                    <Text style={styles.modernTimelineTime}>{formatTime(eventData.eventDate)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Notes Card */}
          {(registrationData.notes || registrationData.cancellationReason) && (
            <View style={styles.modernCard}>
              <View style={styles.modernCardHeader}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name="document-text" size={24} color="#6366f1" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.modernCardTitle}>Ghi chú</Text>
                  <Text style={styles.cardSubtitle}>Thông tin bổ sung</Text>
                </View>
              </View>
              <View style={styles.notesContainer}>
                {registrationData.notes && (
                  <View style={styles.noteItem}>
                    <View style={styles.noteIconContainer}>
                      <Ionicons name="document-text-outline" size={20} color="#6366f1" />
                    </View>
                    <View style={styles.noteContent}>
                      <Text style={styles.noteLabel}>Ghi chú</Text>
                      <Text style={styles.noteText}>{registrationData.notes}</Text>
                    </View>
                  </View>
                )}
                {registrationData.cancellationReason && (
                  <View style={styles.noteItem}>
                    <View style={[styles.noteIconContainer, { backgroundColor: "#fef2f2" }]}>
                      <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                    </View>
                    <View style={styles.noteContent}>
                      <Text style={[styles.noteLabel, { color: "#ef4444" }]}>Lý do từ chối</Text>
                      <Text style={styles.noteText}>{registrationData.cancellationReason}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* School Year Card */}
          <View style={styles.modernCard}>
            <View style={styles.modernCardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="school" size={24} color="#6366f1" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.modernCardTitle}>Năm học</Text>
                <Text style={styles.cardSubtitle}>Năm học áp dụng</Text>
              </View>
            </View>
            <View style={styles.schoolYearContainer}>
              <View style={styles.schoolYearIconBadge}>
                <Ionicons name="calendar-outline" size={20} color="#6366f1" />
              </View>
              <Text style={styles.modernSchoolYearText}>{registrationData.schoolYear}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.modernFooter}>
        {registrationData.status === "pending" ? (
          <TouchableOpacity style={styles.modernCancelButton} onPress={handleCancelRegistration} activeOpacity={0.7}>
            <LinearGradient colors={["#ef4444", "#dc2626"]} style={styles.cancelButtonGradient}>
              <Ionicons name="close-circle-outline" size={24} color="#fff" />
              <Text style={styles.modernCancelButtonText}>Hủy đăng ký</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.modernStatusFooter}>
            <View style={styles.statusFooterContent}>
              <View style={[styles.modernStatusIndicator, { backgroundColor: statusConfig.color }]} />
              <Text style={styles.modernStatusFooterText}>
                {registrationData.status === "approved" ? "Đăng ký đã được phê duyệt" : "Đăng ký đã bị từ chối"}
              </Text>
            </View>
            {registrationData.status === "approved" && (
              <TouchableOpacity style={styles.calendarButton} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                <Text style={styles.calendarButtonText}>Thêm lịch</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {renderCancelModal()}
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
    paddingBottom: 100,
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
  studentCode: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  studentDob: {
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
  statusContainer: {
    padding: 20,
  },
  modernStatusCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  modernStatusTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  statusDate: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
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
  },
  notesContainer: {
    padding: 20,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  noteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  schoolYearContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  schoolYearIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modernSchoolYearText: {
    fontSize: 18,
    color: "#1f2937",
    fontWeight: "600",
  },
  modernFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modernCancelButton: {
    borderRadius: 20,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  modernCancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  modernStatusFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusFooterContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  modernStatusFooterText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  calendarButtonText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginLeft: 4,
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
    backgroundColor: "#fef2f2",
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
  warningSection: {
    marginBottom: 32,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fffbeb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
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
  modalBottomSection: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
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
  cancelSubmitButton: {
    backgroundColor: "#ef4444",
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
    color: "#4A90E2",
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
    color: "#2c3e50",
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
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
    color: "#2c3e50",
    marginLeft: 8,
  },
  studentInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    padding: 16,
    borderRadius: 15,
  },
  studentName: {
    marginLeft: 12,
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
    fontWeight: "500",
  },
  statusCard: {
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  // statusRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  // },
  // statusInfo: {
  //   marginLeft: 12,
  //   flex: 1,
  // },
  // statusTitle: {
  //   fontSize: 16,
  //   fontWeight: "600",
  //   marginBottom: 4,
  // },
  // statusDate: {
  //   fontSize: 14,
  //   color: "#666",
  //   marginBottom: 2,
  // },
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#34495e",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    padding: 16,
    borderRadius: 15,
  },
  locationText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
    fontWeight: "500",
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
  // timelineDot: {
  //   width: 12,
  //   height: 12,
  //   borderRadius: 6,
  //   backgroundColor: "#4A90E2",
  //   marginTop: 4,
  //   marginRight: 12,
  // },
  timelineDotEvent: {
    backgroundColor: "#43e97b",
  },
  // timelineLine: {
  //   flex: 1,
  //   width: 2,
  //   height: 40,
  //   backgroundColor: "#e8e8e8",
  //   marginLeft: 5,
  //   marginVertical: 8,
  // },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: "#666",
  },
  timelineTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  notesText: {
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
  },
  cancellationReasonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  cancellationReasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff4d4f",
    marginBottom: 4,
  },
  cancellationReasonText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  schoolYearCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    padding: 16,
    borderRadius: 15,
  },
  schoolYearText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4d4f",
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusFooter: {
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
    color: "#2c3e50",
  },
  backButton: {
    marginTop: 24,
    backgroundColor: "#4A90E2",
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
    color: "#333",
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
    color: "#666",
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  cancelQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginVertical: 20,
  },
  reasonSection: {
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
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
    borderColor: "#ddd",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    color: "#666",
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: "#43e97b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  // cancelSubmitButton: {
  //   backgroundColor: "#ff4d4f",
  // },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  // disabledButton: {
  //   opacity: 0.6,
  // },
})
