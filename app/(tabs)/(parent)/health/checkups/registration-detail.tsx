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
      default: return "#1890ff";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Đã duyệt";
      case "rejected": return "Từ chối";
      default: return "Đang chờ";
    }
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
      
      <ScrollView style={styles.content}>
        {registration && (
          <View style={styles.card}>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Trạng thái:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(registration.status) }]}>
                <Text style={styles.statusText}>{getStatusText(registration.status)}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Học sinh:</Text>
              <Text style={styles.value}>{registration.student?.fullName || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Mã học sinh:</Text>
              <Text style={styles.value}>{registration.student?.studentIdCode || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phụ huynh:</Text>
              <Text style={styles.value}>{registration.parent?.fullName || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email phụ huynh:</Text>
              <Text style={styles.value}>{registration.parent?.email || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Số điện thoại:</Text>
              <Text style={styles.value}>{registration.parent?.phone || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày đăng ký:</Text>
              <Text style={styles.value}>{new Date(registration.createdAt).toLocaleDateString('vi-VN')}</Text>
            </View>
            
            {registration.note && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ghi chú:</Text>
                <Text style={styles.value}>{registration.note}</Text>
              </View>
            )}
            
            {registration.consentDate && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ngày duyệt:</Text>
                <Text style={styles.value}>{new Date(registration.consentDate).toLocaleDateString('vi-VN')}</Text>
              </View>
            )}
            
            {registration.notes && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ghi chú:</Text>
                <Text style={styles.value}>{registration.notes}</Text>
              </View>
            )}
            
            {registration.cancellationReason && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Lý do từ chối:</Text>
                <Text style={styles.value}>{registration.cancellationReason}</Text>
              </View>
            )}
          </View>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 16,
  },
  content: {
    flex: 1,
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  value: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },
});