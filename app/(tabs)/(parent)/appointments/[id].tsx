import { api, Appointment } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const appointmentTypeIcons: { [key: string]: string } = {
    checkup: "medical",
    vaccination: "shield-checkmark",
    consultation: "chatbubble-ellipses",
    medicine: "medical-outline",
    injury: "bandage",
    other: "ellipsis-horizontal",
  };

  const appointmentTypeLabels: { [key: string]: string } = {
    checkup: "Khám sức khỏe",
    vaccination: "Tiêm chủng",
    consultation: "Tư vấn sức khỏe",
    medicine: "Uống thuốc",
    injury: "Chấn thương",
    other: "Khác",
  };

  const statusColors: { [key: string]: string } = {
    pending: "#FF9800",
    approved: "#4CAF50",
    completed: "#2196F3",
    cancelled: "#F44336",
  };

  const statusLabels: { [key: string]: string } = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };

  useEffect(() => {
    if (id) {
      loadAppointmentDetail();
    }
  }, [id]);

  const loadAppointmentDetail = async () => {
    try {
      setIsLoading(true);
      console.log("📋 Loading appointment detail for ID:", id);

      const response = await api.getAppointmentById(id);
      console.log("📅 Appointment detail response:", response);

      if (response.success) {
        setAppointment(response.data);
      } else {
        Alert.alert(
          "Lỗi",
          response.message || "Không thể tải thông tin lịch hẹn"
        );
        router.back();
      }
    } catch (error) {
      console.error("❌ Load appointment detail error:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin lịch hẹn");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || "#666";
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

  const handleCancelAppointment = () => {
    if (!appointment) return;

    Alert.alert(
      "Hủy lịch hẹn",
      "Bạn có chắc chắn muốn hủy lịch hẹn này không?",
      [
        {
          text: "Không",
          style: "cancel",
        },
        {
          text: "Hủy lịch hẹn",
          style: "destructive",
          onPress: async () => {
            try {
              await api.updateAppointment(appointment._id, {
                status: "cancelled",
                note: "Hủy bởi phụ huynh",
              });

              Alert.alert("Thành công", "Lịch hẹn đã được hủy", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error("Cancel appointment error:", error);
              Alert.alert("Lỗi", "Không thể hủy lịch hẹn");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Không tìm thấy thông tin lịch hẹn
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status and Type */}
        <View style={styles.section}>
          <View style={styles.statusTypeRow}>
            <View style={styles.typeSection}>
              <Ionicons
                name={appointmentTypeIcons[appointment.type] as any}
                size={32}
                color="#4CAF50"
              />
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>
                  {appointmentTypeLabels[appointment.type] || "Khác"}
                </Text>
                <Text style={styles.typeSubtext}>Loại lịch hẹn</Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(appointment.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(appointment.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Student Information */}
        {appointment.student && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin học sinh</Text>
            <View style={styles.studentInfo}>
              <Ionicons name="person" size={20} color="#4CAF50" />
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>
                  {appointment.student.fullName}
                </Text>
                <Text style={styles.studentSubtext}>
                  Mã HS: {appointment.student.studentCode} • Giới tính:{" "}
                  {appointment.student.gender === "male" ? "Nam" : "Nữ"}
                </Text>
                <Text style={styles.studentSubtext}>
                  Ngày sinh: {formatDateOnly(appointment.student.dob)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Appointment Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian hẹn</Text>
          <View style={styles.timeInfo}>
            <Ionicons name="time" size={20} color="#4CAF50" />
            <View style={styles.timeDetails}>
              <Text style={styles.timeText}>
                {formatDateTime(appointment.appointmentTime)}
              </Text>
              <Text style={styles.timeSubtext}>
                {new Date(appointment.appointmentTime) > new Date()
                  ? "Sắp tới"
                  : "Đã qua"}
              </Text>
            </View>
          </View>
        </View>

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lý do đặt lịch</Text>
          <View style={styles.reasonContainer}>
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <Text style={styles.reasonText}>{appointment.reason}</Text>
          </View>
        </View>

        {/* Notes */}
        {appointment.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <View style={styles.noteContainer}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#4CAF50" />
              <Text style={styles.noteText}>{appointment.note}</Text>
            </View>
          </View>
        )}

        {/* Appointment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử</Text>
          <View style={styles.historyItem}>
            <Ionicons name="add-circle" size={16} color="#4CAF50" />
            <Text style={styles.historyText}>
              Đặt lịch hẹn - {formatDateOnly(appointment.createdAt)}
            </Text>
          </View>
          {appointment.updatedAt !== appointment.createdAt && (
            <View style={styles.historyItem}>
              <Ionicons name="create" size={16} color="#FF9800" />
              <Text style={styles.historyText}>
                Cập nhật lần cuối - {formatDateOnly(appointment.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {appointment.status === "pending" && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelAppointment}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.cancelButtonText}>Hủy lịch hẹn</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  statusTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  typeInfo: {
    marginLeft: 12,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  typeSubtext: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeDetails: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  timeSubtext: {
    fontSize: 14,
    color: "#666",
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reasonText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginLeft: 12,
    flex: 1,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noteText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginLeft: 12,
    flex: 1,
    fontStyle: "italic",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  historyText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  studentSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
});
