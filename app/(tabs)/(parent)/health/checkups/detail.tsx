import { api } from "@/lib/api";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

interface HealthCheckEvent {
  _id: string;
  eventName: string;
  gradeId: string;
  description: string;
  location: string;
  startRegistrationDate: string;
  endRegistrationDate: string;
  eventDate: string;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function HealthCheckDetailScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<HealthCheckEvent | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEventDetail();
    }
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setIsLoading(true);
      const response = await api.getHealthCheckEventDetail(eventId);

      if (response.success) {
        setEvent(response.data);
      } else {
        Alert.alert("Lỗi", "Không thể tải thông tin sự kiện");
      }
    } catch (error) {
      console.error("❌ Load event detail error:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tải thông tin sự kiện");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRegister = () => {
    router.push("/(tabs)/(parent)/health/checkups/registration");
  };

  const renderHeader = () => (
    <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
    </LinearGradient>
  );

  const renderEventInfo = () => {
    if (!event) return null;

    const isRegistrationOpen =
      new Date() >= new Date(event.startRegistrationDate) &&
      new Date() <= new Date(event.endRegistrationDate);
    const eventStatus =
      new Date() > new Date(event.eventDate)
        ? "completed"
        : isRegistrationOpen
        ? "ongoing"
        : "upcoming";

    return (
      <View style={styles.content}>
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.eventName}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBgColor(eventStatus) },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(eventStatus) },
                ]}
              >
                {getStatusText(eventStatus)}
              </Text>
            </View>
          </View>

          <Text style={styles.eventDescription}>{event.description}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <MaterialIcons name="school" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Năm học:</Text>
              <Text style={styles.eventDetailValue}>{event.schoolYear}</Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="location-on" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Địa điểm:</Text>
              <Text style={styles.eventDetailValue}>{event.location}</Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="event" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Ngày khám:</Text>
              <Text style={styles.eventDetailValue}>
                {formatDateTime(event.eventDate)}
              </Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="schedule" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Thời gian đăng ký:</Text>
              <Text style={styles.eventDetailValue}>
                {formatDate(event.startRegistrationDate)} -{" "}
                {formatDate(event.endRegistrationDate)}
              </Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="update" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Ngày tạo:</Text>
              <Text style={styles.eventDetailValue}>
                {formatDate(event.createdAt)}
              </Text>
            </View>
          </View>

          {isRegistrationOpen && (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
            >
              <MaterialIcons name="app-registration" size={20} color="#fff" />
              <Text style={styles.registerButtonText}>Đăng ký tham gia</Text>
            </TouchableOpacity>
          )}

          {!isRegistrationOpen &&
            new Date() <= new Date(event.endRegistrationDate) && (
              <View style={styles.notOpenButton}>
                <Text style={styles.notOpenButtonText}>Chưa mở đăng ký</Text>
              </View>
            )}

          {new Date() > new Date(event.endRegistrationDate) && (
            <View style={styles.closedButton}>
              <Text style={styles.closedButtonText}>Đã hết hạn đăng ký</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Thông tin quan trọng</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialIcons name="info" size={16} color="#4A90E2" />
              <Text style={styles.infoText}>
                Vui lòng chuẩn bị các giấy tờ cần thiết trước khi đến khám
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="info" size={16} color="#4A90E2" />
              <Text style={styles.infoText}>
                Học sinh cần có mặt đúng giờ theo lịch hẹn
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="info" size={16} color="#4A90E2" />
              <Text style={styles.infoText}>
                Liên hệ y tế trường nếu có thắc mắc
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#4A90E2";
      case "ongoing":
        return "#7ED321";
      case "completed":
        return "#9B9B9B";
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
      default:
        return "#FFFBEB";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "Sắp diễn ra";
      case "ongoing":
        return "Đang đăng ký";
      case "completed":
        return "Đã hoàn thành";
      default:
        return "Không xác định";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Không tìm thấy thông tin sự kiện</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadEventDetail}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderEventInfo()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  eventDetails: {
    marginBottom: 20,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventDetailLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    minWidth: 100,
  },
  eventDetailValue: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  registerButton: {
    backgroundColor: "#4A90E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  notOpenButton: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  notOpenButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  closedButton: {
    backgroundColor: "#ffebee",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  closedButtonText: {
    color: "#c62828",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoList: {
    paddingLeft: 0,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
  },
});
