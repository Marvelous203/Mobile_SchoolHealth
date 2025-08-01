import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HealthScreen() {
  const router = useRouter();

  const healthServices = [
    {
      id: "records",
      title: "Sổ Sức Khỏe",
      description: "Xem hồ sơ sức khỏe chi tiết của con em",
      icon: "book-medical",
      color: "#13c2c2",
      route: "/(tabs)/(parent)/health/records",
    },
    {
      id: "medical-events",
      title: "Sự cố y tế",
      description: "Lịch sử tai nạn và sự cố y tế",
      icon: "first-aid",
      color: "#ff7875",
      route: "/(tabs)/(parent)/health/medical-events",
    },
    {
      id: "checkups",
      title: "Khám sức khỏe",
      description: "Đặt lịch và xem kết quả khám sức khỏe",
      icon: "stethoscope",
      color: "#1890ff",
      route: "/(tabs)/(parent)/health/checkups",
    },
    {
      id: "vaccinations",
      title: "Tiêm chủng",
      description: "Đăng ký tham gia tiêm chủng",
      icon: "syringe",
      color: "#52c41a",
      route: "/(tabs)/(parent)/vaccinations",
    },
    {
      id: "medicines",
      title: "Thuốc men",
      description: "Gửi đơn thuốc và theo dõi",
      icon: "pills",
      color: "#fa8c16",
      route: "/(tabs)/(parent)/health/medicines",
    },
    {
      id: "vaccine-results",
      title: "Kết quả Vaccine",
      description: "Xem kết quả và trạng thái tiêm chủng",
      icon: "clipboard-check",
      color: "#722ed1",
      route: "/(tabs)/(parent)/health/vaccine-results",
    },
    {
      id: "medical-check-results",
      title: "Kết quả khám sức khỏe",
      description: "Xem kết quả và chi tiết khám sức khỏe",
      icon: "heartbeat",
      color: "#eb2f96",
      route: "/(tabs)/(parent)/health/medical-check-results",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dịch vụ Y tế</Text>
        <Text style={styles.headerSubtitle}>Quản lý sức khỏe con em</Text>
      </View>

      <ScrollView style={styles.content}>
        {healthServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => router.push(service.route as any)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${service.color}20` },
              ]}
            >
              <FontAwesome5
                name={service.icon as any}
                size={24}
                color={service.color}
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>
                {service.description}
              </Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={20} color="#d9d9d9" />
          </TouchableOpacity>
        ))}
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
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#262626",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8c8c8c",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#8c8c8c",
  },
});

// Removed duplicate services array
