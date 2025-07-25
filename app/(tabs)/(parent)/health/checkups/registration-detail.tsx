import { api } from "@/lib/api";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegistrationDetailScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [registration, setRegistration] = useState<any>(null);

  useEffect(() => {
    if (registrationId) {
      loadRegistrationDetail();
    }
  }, [registrationId]);

  const loadRegistrationDetail = async () => {
    try {
      setIsLoading(true);
      const response = await api.getHealthCheckRegistrationDetail(registrationId);
      console.log("✅ Registration detail response:", JSON.stringify(response.data, null, 2));
      console.log("✅ Student data:", JSON.stringify(response.data.student, null, 2));
      setRegistration(response.data);
    } catch (error) {
      console.error("❌ Load registration detail error:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đăng ký");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#52c41a";
      case "rejected": return "#ff4d4f";
      case "pending": return "#faad14";
      case "cancelled": return "#8c8c8c";
      default: return "#1890ff";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Đã duyệt";
      case "rejected": return "Từ chối";
      case "pending": return "Đang chờ xử lý";
      case "cancelled": return "Đã hủy";
      default: return "Không xác định";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đăng ký</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đăng ký</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {registration && (
          <>
            {/* Trạng thái đăng ký */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="assignment" size={20} color="#1890ff" />
                <Text style={styles.sectionTitle}>Trạng thái đăng ký</Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(registration.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(registration.status)}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ngày đăng ký:</Text>
                <Text style={styles.value}>{formatDateTime(registration.createdAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Năm học:</Text>
                <Text style={styles.value}>{registration.schoolYear}</Text>
              </View>
              {registration.updatedAt !== registration.createdAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Cập nhật lần cuối:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.updatedAt)}</Text>
                </View>
              )}
            </View>

            {/* Thông tin sự kiện */}
            {registration.event && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="event" size={20} color="#1890ff" />
                  <Text style={styles.sectionTitle}>Thông tin sự kiện</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Tên sự kiện:</Text>
                  <Text style={styles.value}>{registration.event.eventName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mô tả:</Text>
                  <Text style={styles.value}>{registration.event.description}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Địa điểm:</Text>
                  <Text style={styles.value}>{registration.event.location}</Text>
                </View>
                {registration.event.provider && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Đơn vị thực hiện:</Text>
                    <Text style={styles.value}>{registration.event.provider}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Ngày khám:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.event.eventDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Thời gian đăng ký:</Text>
                  <Text style={styles.value}>
                    {formatDate(registration.event.startRegistrationDate)} - {formatDate(registration.event.endRegistrationDate)}
                  </Text>
                </View>
                {registration.event.status && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Trạng thái sự kiện:</Text>
                    <Text style={[styles.value, { color: registration.event.status === 'completed' ? '#52c41a' : '#1890ff' }]}>
                      {registration.event.status === 'completed' ? 'Đã hoàn thành' : 
                       registration.event.status === 'ongoing' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Thông tin học sinh */}
            {registration.student && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="person" size={20} color="#1890ff" />
                  <Text style={styles.sectionTitle}>Thông tin học sinh</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Họ và tên:</Text>
                  <Text style={styles.value}>{registration.student.fullName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mã học sinh:</Text>
                  <Text style={styles.value}>{registration.student.studentCode || registration.student.studentIdCode}</Text>
                </View>
                {registration.student.dob && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Ngày sinh:</Text>
                      <Text style={styles.value}>{formatDate(registration.student.dob)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Tuổi:</Text>
                      <Text style={styles.value}>{calculateAge(registration.student.dob)} tuổi</Text>
                    </View>
                  </>
                )}
                {registration.student.gender && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Giới tính:</Text>
                    <Text style={styles.value}>{registration.student.gender === 'male' ? 'Nam' : 'Nữ'}</Text>
                  </View>
                )}
                {registration.student.classId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Lớp:</Text>
                    <Text style={styles.value}>{registration.student.classId}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Thông tin phụ huynh */}
            {registration.parent && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="family-restroom" size={20} color="#1890ff" />
                  <Text style={styles.sectionTitle}>Thông tin phụ huynh</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Họ và tên:</Text>
                  <Text style={styles.value}>{registration.parent.fullName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{registration.parent.email}</Text>
                </View>
                {registration.parent.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Số điện thoại:</Text>
                    <Text style={styles.value}>{registration.parent.phone}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Vai trò:</Text>
                  <Text style={styles.value}>Phụ huynh</Text>
                </View>
              </View>
            )}

            {/* Ghi chú và lý do */}
            {(registration.notes || registration.cancellationReason || registration.note) && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="note" size={20} color="#1890ff" />
                  <Text style={styles.sectionTitle}>Ghi chú</Text>
                </View>
                {registration.notes && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Ghi chú:</Text>
                    <Text style={styles.value}>{registration.notes}</Text>
                  </View>
                )}
                {registration.note && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Ghi chú khác:</Text>
                    <Text style={styles.value}>{registration.note}</Text>
                  </View>
                )}
                {registration.cancellationReason && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Lý do từ chối:</Text>
                    <Text style={[styles.value, { color: '#ff4d4f' }]}>{registration.cancellationReason}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1890ff",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1890ff",
    marginLeft: 8,
  },
  statusContainer: {
    alignItems: "flex-start",
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    width: 130,
    marginRight: 10,
  },
  value: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});