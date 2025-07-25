"use client"

import { getVaccineAppointmentDetail } from "@/lib/api"
import { VaccineAppointmentResult } from "@/lib/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
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

const { width } = Dimensions.get("window")

export default function VaccineResultDetailScreen() {
  const { id } = useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [vaccineResult, setVaccineResult] = useState<VaccineAppointmentResult | null>(null)
  const [scrollY] = useState(new Animated.Value(0))

  useEffect(() => {
    loadVaccineResultDetail()
  }, [id])

  const loadVaccineResultDetail = async () => {
    try {
      setIsLoading(true)

      // Get vaccine appointment detail by ID
      const response = await getVaccineAppointmentDetail(id as string)

      if (response && response.success && response.data) {
        setVaccineResult(response.data)
        console.log('✅ Loaded vaccine result detail:', response.data)
      } else {
        Alert.alert("Lỗi", "Không tìm thấy kết quả vaccine")
      }
    } catch (error) {
      console.error('Failed to load vaccine result detail:', error)
      Alert.alert("Lỗi", "Không thể tải chi tiết kết quả vaccine")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadVaccineResultDetail()
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

  const getPostVaccinationStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "bình thường":
        return {
          color: "#10b981",
          bgColor: "#f0fdf4",
          text: "Khỏe mạnh",
          icon: "checkmark-circle",
        }
      case "mild_reaction":
      case "phản ứng nhẹ":
        return {
          color: "#f59e0b",
          bgColor: "#fffbeb",
          text: "Phản ứng nhẹ",
          icon: "warning",
        }
      case "severe_reaction":
      case "phản ứng nặng":
        return {
          color: "#ef4444",
          bgColor: "#fef2f2",
          text: "Phản ứng nặng",
          icon: "alert-circle",
        }
      case "other":
      case "khác":
        return {
          color: "#8b5cf6",
          bgColor: "#f3e8ff",
          text: "Khác",
          icon: "ellipsis-horizontal-circle",
        }
      case "not_checked":
      case "chưa kiểm tra":
        return {
          color: "#6b7280",
          bgColor: "#f9fafb",
          text: "Chưa kiểm tra",
          icon: "help-circle",
        }
      default:
        return {
          color: "#6b7280",
          bgColor: "#f9fafb",
          text: status || "Chưa có thông tin",
          icon: "help-circle",
        }
    }
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Chưa có thông tin"
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string): string => {
    if (!dateString) return "Chưa có thông tin"
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Đang tải chi tiết kết quả...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!vaccineResult) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Không tìm thấy kết quả</Text>
          <Text style={styles.errorText}>
            Kết quả vaccine này có thể đã bị xóa hoặc không tồn tại.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const eligibilityConfig = getEligibilityConfig(vaccineResult.isEligible)
  const statusConfig = getAppointmentStatusConfig(vaccineResult.status)
  const postVaccinationConfig = getPostVaccinationStatusConfig(vaccineResult.postVaccinationStatus)

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.animatedBackButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle} numberOfLines={1}>
          Chi tiết kết quả
        </Text>
        <TouchableOpacity style={styles.animatedShareButton} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={20} color="#1f2937" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.heroBackButton} onPress={() => router.back()} activeOpacity={0.7}>
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
            <View style={[styles.eligibilityBadge, { backgroundColor: eligibilityConfig.bgColor }]}>
              <Ionicons name={eligibilityConfig.icon as any} size={14} color={eligibilityConfig.color} />
              <Text style={[styles.eligibilityText, { color: eligibilityConfig.color }]}>
                {eligibilityConfig.text}
              </Text>
            </View>

            <Text style={styles.studentName}>
              {vaccineResult.student?.fullName || "Học sinh"}
            </Text>

            <View style={styles.studentInfo}>
              <View style={styles.studentIconBadge}>
                <Ionicons name="person" size={20} color="#6366f1" />
              </View>
              <Text style={styles.studentCode}>
                {vaccineResult.student?.studentCode || "Mã học sinh"}
              </Text>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Ionicons name="medical-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatText}>{vaccineResult.event?.vaccineName || vaccineResult.event?.title || "Sự kiện vaccine"}</Text>
              </View>
              {vaccineResult.event?.location && (
                <View style={styles.heroStatItem}>
                  <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroStatText}>{vaccineResult.event.location}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Content Cards */}
        <View style={styles.contentContainer}>
          {/* Status Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="information-circle" size={24} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Thông tin trạng thái</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Tình trạng đủ điều kiện</Text>
                <View style={[styles.statusBadge, { backgroundColor: eligibilityConfig.bgColor }]}>
                  <Ionicons name={eligibilityConfig.icon as any} size={14} color={eligibilityConfig.color} />
                  <Text style={[styles.statusBadgeText, { color: eligibilityConfig.color }]}>
                    {eligibilityConfig.text}
                  </Text>
                </View>
              </View>

              {vaccineResult.isEligible && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Trạng thái lịch hẹn</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                      {statusConfig.text}
                    </Text>
                  </View>
                </View>
              )}

              {vaccineResult.isEligible && vaccineResult.postVaccinationStatus && (
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Tình trạng sau tiêm</Text>
                  <View style={[styles.statusBadge, { backgroundColor: postVaccinationConfig.bgColor }]}>
                    <Ionicons name={postVaccinationConfig.icon as any} size={14} color={postVaccinationConfig.color} />
                    <Text style={[styles.statusBadgeText, { color: postVaccinationConfig.color }]}>
                      {postVaccinationConfig.text}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Student Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="person" size={24} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Thông tin học sinh</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Họ và tên</Text>
                  <Text style={styles.infoValue}>{vaccineResult.student?.fullName || "Không có thông tin"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Mã học sinh</Text>
                  <Text style={styles.infoValue}>{vaccineResult.student?.studentCode || "Không có thông tin"}</Text>
                </View>
              </View>

              {vaccineResult.student?.studentIdCode && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Mã định danh</Text>
                    <Text style={styles.infoValue}>{vaccineResult.student.studentIdCode}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.student?.gender && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Giới tính</Text>
                    <Text style={styles.infoValue}>
                      {vaccineResult.student.gender === "male" ? "Nam" : "Nữ"}
                    </Text>
                  </View>
                </View>
              )}

              {vaccineResult.student?.dob && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ngày sinh</Text>
                    <Text style={styles.infoValue}>{formatDate(vaccineResult.student.dob)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Event Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="medical" size={24} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Thông tin sự kiện</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tên sự kiện</Text>
                  <Text style={styles.infoValue}>{vaccineResult.event?.title || "Không có thông tin"}</Text>
                </View>
              </View>

              {vaccineResult.event?.description && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Mô tả</Text>
                    <Text style={styles.infoValue}>{vaccineResult.event.description}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.event?.vaccineName && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Loại vaccine</Text>
                    <Text style={styles.infoValue}>{vaccineResult.event.vaccineName}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.event?.location && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Địa điểm</Text>
                    <Text style={styles.infoValue}>{vaccineResult.event.location}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.event?.provider && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nhà cung cấp</Text>
                    <Text style={styles.infoValue}>{vaccineResult.event.provider}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.event?.eventDate && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ngày tiêm</Text>
                    <Text style={styles.infoValue}>{formatDate(vaccineResult.event.eventDate)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Năm học</Text>
                  <Text style={styles.infoValue}>{vaccineResult.schoolYear}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Medical Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="heart" size={24} color="#ef4444" />
              </View>
              <Text style={styles.cardTitle}>Thông tin y tế</Text>
            </View>

            <View style={styles.cardContent}>
              {vaccineResult.bloodPressure && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Huyết áp</Text>
                    <Text style={styles.infoValue}>{vaccineResult.bloodPressure}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.checkedBy && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Y tá kiểm tra</Text>
                    <Text style={styles.infoValue}>{vaccineResult.checkedBy.fullName}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.checkedBy?.phone && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Số điện thoại y tá</Text>
                    <Text style={styles.infoValue}>{vaccineResult.checkedBy.phone}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.checkedBy?.email && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Email y tá</Text>
                    <Text style={styles.infoValue}>{vaccineResult.checkedBy.email}</Text>
                  </View>
                </View>
              )}

              {!vaccineResult.isEligible && vaccineResult.reasonIfIneligible && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Lý do không đủ điều kiện</Text>
                    <Text style={styles.infoValue}>{vaccineResult.reasonIfIneligible}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.notes && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ghi chú</Text>
                    <Text style={styles.infoValue}>{vaccineResult.notes}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.postVaccinationNotes && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ghi chú sau tiêm</Text>
                    <Text style={styles.infoValue}>{vaccineResult.postVaccinationNotes}</Text>
                  </View>
                </View>
              )}

              {vaccineResult.vaccinatedAt && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Thời gian tiêm</Text>
                    <Text style={styles.infoValue}>{formatDate(vaccineResult.vaccinatedAt)} lúc {formatTime(vaccineResult.vaccinatedAt)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  animatedBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  animatedHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  animatedShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroActions: {
    flexDirection: "row",
    gap: 12,
  },
  heroActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  eligibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  eligibilityText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  studentName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  studentIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  studentCode: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  heroStats: {
    alignItems: "center",
    gap: 8,
  },
  heroStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStatText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 6,
  },
  contentContainer: {
    padding: 20,
    marginTop: -20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    alignItems: "center",
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  cardContent: {
    gap: 16,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
})