"use client";

import { api, getCurrentUserId } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface VaccineEvent {
  _id: string;
  eventName: string;
  gradeId: string;
  description: string;
  vaccineName: string;
  location: string;
  startRegistrationDate: string;
  endRegistrationDate: string;
  eventDate: string;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  status?: "upcoming" | "ongoing" | "completed" | "closed";
}

interface Student {
  _id: string;
  fullName: string;
  classId?: string;
  avatar?: string;
}

interface VaccineRegistration {
  _id: string;
  studentId: string;
  parentId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  registrationDate: string;
  schoolYear: string;
  notes?: string;
  cancellationReason?: string;
}

export default function VaccineEventDetailScreen() {
  const { id, studentId, studentName } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<VaccineEvent | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingRegistration, setExistingRegistration] =
    useState<VaccineRegistration | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Load event data
      const response = await api.getVaccineEventDetail(id as string);
      setEventData(response.data);

      // Get current user
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);

      // Check if registration exists
      if (userId && studentId) {
        try {
          const registrationResponse = await api.searchVaccineRegistrations({
            pageNum: 1,
            pageSize: 1,
            parentId: userId,
            studentId: studentId as string,
            eventId: id as string,
          });

          if (
            registrationResponse.pageData &&
            registrationResponse.pageData.length > 0
          ) {
            setExistingRegistration(registrationResponse.pageData[0]);
          }
        } catch (error) {
          console.error("Failed to check existing registration", error);
        }
      }
    } catch (error) {
      console.error("Failed to load event data", error);
      Alert.alert("Lỗi", "Không thể tải thông tin sự kiện tiêm chủng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    // Reset form states
    setConsent(null);
    setRejectionReason("");
    setShowConsentModal(true);
  };

  const handleSubmitRegistration = async () => {
    if (!currentUserId || !studentId || !eventData) {
      Alert.alert("Lỗi", "Thiếu thông tin cần thiết để đăng ký");
      return;
    }

    if (consent === null) {
      Alert.alert("Lỗi", "Vui lòng chọn đồng ý hoặc từ chối");
      return;
    }

    if (consent === false && !rejectionReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do từ chối");
      return;
    }

    setIsProcessing(true);

    const registrationData = {
      parentId: currentUserId,
      studentId: studentId as string,
      eventId: eventData._id,
      status: consent ? ("pending" as const) : ("rejected" as const),
      schoolYear: eventData.schoolYear,
      note: consent
        ? "Đồng ý đăng ký tiêm chủng từ ứng dụng di động"
        : rejectionReason,
      cancellationReason: consent ? undefined : rejectionReason,
    };

    try {
      const response = await api.createVaccineRegistration(registrationData);
      console.log("✅ Registration created:", response);

      setShowConsentModal(false);
      setExistingRegistration(response.data);

      const message = consent
        ? "Đăng ký tiêm chủng thành công! Chờ phê duyệt từ nhà trường."
        : "Đã ghi nhận từ chối tham gia tiêm chủng.";

      Alert.alert("Thành công", message);
    } catch (error: any) {
      console.error("❌ Registration error:", error);

      let errorMessage = "Không thể xử lý đăng ký. Vui lòng thử lại.";

      if (error.message && error.message.includes("đã tồn tại")) {
        errorMessage = "Học sinh này đã có đăng ký cho sự kiện này rồi.";
        setShowConsentModal(false);
      }

      Alert.alert("Thông báo", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderConsentModal = () => (
    <Modal
      visible={showConsentModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConsentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Đăng ký tiêm chủng</Text>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Học sinh:</Text>
            <Text style={styles.modalValue}>{studentName}</Text>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Sự kiện:</Text>
            <Text style={styles.modalValue}>{eventData?.eventName}</Text>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Vaccine:</Text>
            <Text style={styles.modalValue}>{eventData?.vaccineName}</Text>
          </View>

          <Text style={styles.consentQuestion}>
            Bạn có đồng ý cho con tham gia tiêm chủng không?
          </Text>

          <View style={styles.consentButtons}>
            <TouchableOpacity
              style={[
                styles.consentButton,
                consent === true && styles.selectedConsentButton,
              ]}
              onPress={() => {
                setConsent(true);
                setRejectionReason("");
              }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.consentButtonText}>Đồng ý</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.consentButton,
                styles.rejectButton,
                consent === false && styles.selectedRejectButton,
              ]}
              onPress={() => setConsent(false)}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.consentButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>

          {consent === false && (
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>Lý do từ chối *</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Nhập lý do từ chối tham gia tiêm chủng..."
                multiline={true}
                numberOfLines={3}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                maxLength={500}
              />
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowConsentModal(false)}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                isProcessing && styles.disabledButton,
              ]}
              onPress={handleSubmitRegistration}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSubmitText}>
                  {consent === true
                    ? "Đăng ký"
                    : consent === false
                    ? "Gửi từ chối"
                    : "Xác nhận"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#4A90E2";
      case "ongoing":
        return "#7ED321";
      case "completed":
        return "#9B9B9B";
      case "cancelled":
        return "#D0021B";
      default:
        return "#F5A623";
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#E8F4FD";
      case "ongoing":
        return "#F0FDF4";
      case "completed":
        return "#F5F5F5";
      case "cancelled":
        return "#FEF2F2";
      default:
        return "#FFFBEB";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "Sắp diễn ra";
      case "ongoing":
        return "Đang diễn ra";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  // Add this function to check registration time
  const canRegister = (event: VaccineEvent | null): boolean => {
    if (!event) return false;

    const now = new Date();
    const startReg = new Date(event.startRegistrationDate);
    const endReg = new Date(event.endRegistrationDate);

    return now >= startReg && now <= endReg;
  };

  // Add this function to get registration status message
  const getRegistrationStatusMessage = (event: VaccineEvent | null): string => {
    if (!event) return "";

    const now = new Date();
    const startReg = new Date(event.startRegistrationDate);
    const endReg = new Date(event.endRegistrationDate);

    if (now < startReg) {
      return "Chưa đến thời gian đăng ký";
    } else if (now > endReg) {
      return "Đã hết thời gian đăng ký";
    }
    return "Đang mở đăng ký";
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="medical" size={48} color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải thông tin sự kiện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#D0021B" />
          <Text style={styles.errorText}>Không tìm thấy thông tin sự kiện</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#43e97b", "#38f9d7"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroSection}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {getStatusText(eventData?.status || "upcoming")}
            </Text>
          </View>
          <Text style={styles.eventTitle}>{eventData?.eventName}</Text>
          <Text style={styles.vaccineNameHero}>
            💉 {eventData?.vaccineName}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Student Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Thông tin học sinh</Text>
            </View>
            <View style={styles.studentInfoCard}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color="#4A90E2"
              />
              <Text style={styles.studentName}>{studentName}</Text>
            </View>
          </View>

          {/* Event Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.description}>{eventData?.description}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Địa điểm tiêm chủng</Text>
            </View>
            <View style={styles.locationCard}>
              <Ionicons name="location-outline" size={24} color="#4A90E2" />
              <Text style={styles.locationText}>{eventData?.location}</Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Thời gian</Text>
            </View>
            <View style={styles.timelineCard}>
              {/* Registration Period */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Thời gian đăng ký</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(eventData?.startRegistrationDate || "")} -{" "}
                    {formatDate(eventData?.endRegistrationDate || "")}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {formatTime(eventData?.startRegistrationDate || "")} -{" "}
                    {formatTime(eventData?.endRegistrationDate || "")}
                  </Text>
                </View>
              </View>

              <View style={styles.timelineLine} />

              {/* Event Date */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotEvent]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Ngày tiêm chủng</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(eventData?.eventDate || "")}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {formatTime(eventData?.eventDate || "")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Yêu cầu & Lưu ý</Text>
            </View>
            <View style={styles.requirementsCard}>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#43e97b" />
                <Text style={styles.requirementText}>
                  Mang theo sổ tiêm chủng/phiếu tiêm chủng
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#43e97b" />
                <Text style={styles.requirementText}>
                  Khám sàng lọc trước khi tiêm
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={20} color="#43e97b" />
                <Text style={styles.requirementText}>
                  Theo dõi sau tiêm 30 phút tại điểm tiêm
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Registration Button */}
      <View style={styles.footer}>
        {existingRegistration ? (
          <View style={styles.registrationStatus}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    existingRegistration.status === "pending"
                      ? "#faad14"
                      : existingRegistration.status === "approved"
                      ? "#52c41a"
                      : "#ff4d4f",
                },
              ]}
            />
            <Text style={styles.statusIndicatorText}>
              {existingRegistration.status === "pending"
                ? "Đã đăng ký - Chờ duyệt"
                : existingRegistration.status === "approved"
                ? "Đã được duyệt"
                : "Đã từ chối"}
            </Text>
          </View>
        ) : !canRegister(eventData) ? (
          <View style={styles.registrationStatus}>
            <View
              style={[styles.statusIndicator, { backgroundColor: "#8e8e93" }]}
            />
            <Text style={styles.statusIndicatorText}>
              {getRegistrationStatusMessage(eventData)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.registerButton,
              {
                backgroundColor: getStatusColor(
                  eventData?.status || "upcoming"
                ),
              },
            ]}
            onPress={handleRegister}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.registerButtonText}>Đăng ký tham gia</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderConsentModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    color: "#2c3e50",
    marginLeft: 8,
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
    backgroundColor: "#4A90E2",
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotEvent: {
    backgroundColor: "#43e97b",
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: "#e8e8e8",
    marginLeft: 5,
    marginVertical: 8,
  },
  timelineContent: {
    flex: 1,
  },
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
    color: "#2c3e50",
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
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
  consentQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
    backgroundColor: "#43e97b",
    padding: 12,
    borderRadius: 8,
  },
  selectedConsentButton: {
    backgroundColor: "#38f9d7",
  },
  rejectButton: {
    backgroundColor: "#ff4d4f",
  },
  selectedRejectButton: {
    backgroundColor: "#ff7875",
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
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.6,
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
    color: "#2c3e50",
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
});
