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

interface VaccineRegistrationDetail {
  _id: string;
  studentId: string;
  parentId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  student?: {
    _id: string;
    fullName: string;
    studentCode: string;
    gender: string;
    dob: string;
    avatar?: string;
  };
  parent?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  event: string;
  schoolYear: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

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
  status?: "upcoming" | "ongoing" | "completed" | "closed";
}

export default function VaccineRegistrationDetailScreen() {
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState<VaccineRegistrationDetail | null>(null);
  const [eventData, setEventData] = useState<VaccineEvent | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Load registration data
      const registrationResponse = await api.getVaccineRegistrationDetail(id as string);
      setRegistrationData(registrationResponse.data);

      // Load event data if eventId exists
      if (registrationResponse.data.eventId) {
        try {
          const eventResponse = await api.getVaccineEventDetail(registrationResponse.data.eventId);
          setEventData(eventResponse.data);
        } catch (eventError) {
          console.error("Failed to load event data", eventError);
          // Continue without event data
        }
      }

      // Get current user
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error("Failed to load registration data", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đăng ký tiêm chủng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRegistration = () => {
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do hủy đăng ký");
      return;
    }

    setIsProcessing(true);

    try {
      await api.updateVaccineRegistrationStatus(registrationData!._id, {
        status: "rejected",
        cancellationReason: cancellationReason,
        notes: `Hủy đăng ký từ ứng dụng di động: ${cancellationReason}`,
      });

      setShowCancelModal(false);
      Alert.alert("Thành công", "Đã hủy đăng ký tiêm chủng thành công", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("❌ Cancellation error:", error);
      Alert.alert("Lỗi", "Không thể hủy đăng ký. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCancelModal = () => (
    <Modal
      visible={showCancelModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Hủy đăng ký tiêm chủng</Text>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Học sinh:</Text>
            <Text style={styles.modalValue}>{registrationData?.student?.fullName || 'Không có thông tin'}</Text>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Sự kiện:</Text>
            <Text style={styles.modalValue}>{eventData?.eventName || registrationData?.eventName}</Text>
          </View>

          <Text style={styles.cancelQuestion}>
            Bạn có chắc chắn muốn hủy đăng ký tiêm chủng này không?
          </Text>

          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Lý do hủy đăng ký *</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Nhập lý do hủy đăng ký tiêm chủng..."
              multiline={true}
              numberOfLines={3}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              maxLength={500}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={styles.modalCancelText}>Đóng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                styles.cancelSubmitButton,
                isProcessing && styles.disabledButton,
              ]}
              onPress={handleSubmitCancellation}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSubmitText}>Xác nhận hủy</Text>
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
      case "pending":
        return "#faad14";
      case "approved":
        return "#52c41a";
      case "rejected":
        return "#ff4d4f";
      default:
        return "#8e8e93";
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "#fff7e6";
      case "approved":
        return "#f6ffed";
      case "rejected":
        return "#fff2f0";
      default:
        return "#f5f5f5";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Chờ duyệt";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return "Không xác định";
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "approved":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="medical" size={48} color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải thông tin đăng ký...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!registrationData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#D0021B" />
          <Text style={styles.errorText}>Không tìm thấy thông tin đăng ký</Text>
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
          <Text style={styles.headerTitle}>Chi tiết đăng ký</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroSection}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(registrationData.status) },
            ]}
          >
            <Ionicons
              name={getStatusIcon(registrationData.status) as any}
              size={16}
              color={getStatusColor(registrationData.status)}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(registrationData.status) },
              ]}
            >
              {getStatusText(registrationData.status)}
            </Text>
          </View>
          <Text style={styles.eventTitle}>
            {eventData?.eventName || registrationData.eventName || "Sự kiện tiêm chủng"}
          </Text>
          <Text style={styles.vaccineNameHero}>
            💉 {eventData?.vaccineName || registrationData.vaccineName || "Vaccine"}
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
              <Text style={styles.studentName}>
                {registrationData.student?.fullName || 'Không có thông tin'}
              </Text>
            </View>
          </View>

          {/* Registration Status */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Trạng thái đăng ký</Text>
            </View>
            <View
              style={[
                styles.statusCard,
                { backgroundColor: getStatusBgColor(registrationData.status) },
              ]}
            >
              <View style={styles.statusRow}>
                <Ionicons
                  name={getStatusIcon(registrationData.status) as any}
                  size={24}
                  color={getStatusColor(registrationData.status)}
                />
                <View style={styles.statusInfo}>
                  <Text
                    style={[
                      styles.statusTitle,
                      { color: getStatusColor(registrationData.status) },
                    ]}
                  >
                    {getStatusText(registrationData.status)}
                  </Text>
                  <Text style={styles.statusDate}>
                    Đăng ký ngày: {formatDate(registrationData.registrationDate || registrationData.createdAt)}
                  </Text>
                  {registrationData.consentDate && (
                    <Text style={styles.statusDate}>
                      Ngày xác nhận: {formatDate(registrationData.consentDate)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Event Information */}
          {eventData && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={20} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Thông tin sự kiện</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.description}>{eventData.description}</Text>
              </View>
            </View>
          )}

          {/* Location */}
          {eventData?.location && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Địa điểm tiêm chủng</Text>
              </View>
              <View style={styles.locationCard}>
                <Ionicons name="location-outline" size={24} color="#4A90E2" />
                <Text style={styles.locationText}>{eventData.location}</Text>
              </View>
            </View>
          )}

          {/* Timeline */}
          {eventData && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={20} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Thời gian</Text>
              </View>
              <View style={styles.timelineCard}>
                {/* Registration Date */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Ngày đăng ký</Text>
                    <Text style={styles.timelineDate}>
                      {formatDate(registrationData.registrationDate || registrationData.createdAt)}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatTime(registrationData.registrationDate || registrationData.createdAt)}
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
                      {formatDate(eventData.eventDate)}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatTime(eventData.eventDate)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Notes */}
          {(registrationData.notes || registrationData.cancellationReason) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Ghi chú</Text>
              </View>
              <View style={styles.notesCard}>
                {registrationData.notes && (
                  <Text style={styles.notesText}>{registrationData.notes}</Text>
                )}
                {registrationData.cancellationReason && (
                  <View style={styles.cancellationReasonContainer}>
                    <Text style={styles.cancellationReasonLabel}>Lý do từ chối:</Text>
                    <Text style={styles.cancellationReasonText}>
                      {registrationData.cancellationReason}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* School Year */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Năm học</Text>
            </View>
            <View style={styles.schoolYearCard}>
              <Ionicons name="calendar-outline" size={24} color="#4A90E2" />
              <Text style={styles.schoolYearText}>{registrationData.schoolYear}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        {registrationData.status === "pending" ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRegistration}
          >
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.cancelButtonText}>Hủy đăng ký</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statusFooter}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(registrationData.status) },
              ]}
            />
            <Text style={styles.statusFooterText}>
              {registrationData.status === "approved"
                ? "Đăng ký đã được phê duyệt"
                : "Đăng ký đã bị từ chối"}
            </Text>
          </View>
        )}
      </View>

      {renderCancelModal()}
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
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
  statusFooterText: {
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
  cancelSubmitButton: {
    backgroundColor: "#ff4d4f",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.6,
  },
});