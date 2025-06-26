import { api } from "@/lib/api";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Student {
  _id: string;
  fullName: string;
  studentCode: string;
  gender: "male" | "female";
  dob: string;
  avatar?: string;
  classInfo?: {
    name: string;
  };
  parentInfos?: {
    fullName: string;
    phone: string;
    email: string;
    type: "father" | "mother" | "guardian";
  }[];
}

interface QuickAction {
  title: string;
  icon: string;
  colors: [string, string];
  onPress: () => void;
}

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      console.log("📚 Loading student detail for ID:", id);

      if (!id) {
        throw new Error("Student ID is required");
      }

      const studentResponse = await api.getStudentById(id);
      const studentData = (studentResponse as any).data || studentResponse;

      setStudent(studentData);
      console.log("✅ Student detail loaded:", studentData);
    } catch (error) {
      console.error("❌ Failed to load student detail:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin học sinh");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await loadStudentData();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadStudentData();
    }
  }, [id]);

  const quickActions: QuickAction[] = [
    {
      title: "Hồ sơ sức khỏe",
      icon: "file-medical-alt",
      colors: ["#667eea", "#764ba2"],
      onPress: () => router.push("/(tabs)/(parent)/health/records" as any),
    },
    {
      title: "Sự kiện y tế",
      icon: "exclamation-triangle",
      colors: ["#f093fb", "#f5576c"],
      onPress: () =>
        router.push("/(tabs)/(parent)/health/medical-events" as any),
    },
    {
      title: "Tiêm chủng",
      icon: "syringe",
      colors: ["#43e97b", "#38f9d7"],
      onPress: () => router.push("/(tabs)/(parent)/vaccinations" as any),
    },
    {
      title: "Thuốc men",
      icon: "pills",
      colors: ["#fa709a", "#fee140"],
      onPress: () => router.push("/(tabs)/(parent)/medicines" as any),
    },
    {
      title: "Khám sức khỏe",
      icon: "stethoscope",
      colors: ["#4facfe", "#00f2fe"],
      onPress: () => router.push("/(tabs)/(parent)/checkups" as any),
    },
    {
      title: "Tin tức y tế",
      icon: "newspaper",
      colors: ["#a8edea", "#fed6e3"],
      onPress: () => router.push("/(tabs)/(parent)/blogs" as any),
    },
  ];

  const renderHeader = () => (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết học sinh</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderStudentProfile = () => (
    <View style={styles.profileSection}>
      <LinearGradient colors={["#fff", "#f8f9fa"]} style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: student?.avatar || "https://via.placeholder.com/120",
            }}
            style={styles.avatar}
          />
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: "#52c41a" }]} />
          </View>
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student?.fullName}</Text>
          <Text style={styles.studentClass}>
            {student?.classInfo?.name || "Chưa phân lớp"}
          </Text>
          <Text style={styles.studentCode}>Mã HS: {student?.studentCode}</Text>

          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <MaterialIcons name="wc" size={16} color="#8c8c8c" />
              <Text style={styles.infoText}>
                {student?.gender === "male" ? "Nam" : "Nữ"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="cake" size={16} color="#8c8c8c" />
              <Text style={styles.infoText}>
                {student?.dob
                  ? new Date(student.dob).toLocaleDateString("vi-VN")
                  : "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Dịch vụ y tế</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCardContainer}
            onPress={action.onPress}
          >
            <LinearGradient colors={action.colors} style={styles.actionCard}>
              <FontAwesome5 name={action.icon as any} size={24} color="#fff" />
              <Text style={styles.actionTitle}>{action.title}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHealthOverview = () => (
    <View style={styles.healthSection}>
      <Text style={styles.sectionTitle}>Tình trạng sức khỏe</Text>
      <LinearGradient colors={["#fff", "#f8f9fa"]} style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <View style={styles.healthStatus}>
            <View style={[styles.healthDot, { backgroundColor: "#52c41a" }]} />
            <Text style={styles.healthStatusText}>Tình trạng tốt</Text>
          </View>
          <Text style={styles.lastUpdate}>Cập nhật: Hôm nay</Text>
        </View>

        <View style={styles.healthMetrics}>
          <View style={styles.metricCard}>
            <FontAwesome5 name="ruler-vertical" size={20} color="#1890ff" />
            <Text style={styles.metricValue}>135 cm</Text>
            <Text style={styles.metricLabel}>Chiều cao</Text>
          </View>
          <View style={styles.metricCard}>
            <FontAwesome5 name="weight" size={20} color="#52c41a" />
            <Text style={styles.metricValue}>32 kg</Text>
            <Text style={styles.metricLabel}>Cân nặng</Text>
          </View>
          <View style={styles.metricCard}>
            <FontAwesome5 name="eye" size={20} color="#fa8c16" />
            <Text style={styles.metricValue}>20/20</Text>
            <Text style={styles.metricLabel}>Thị lực</Text>
          </View>
          <View style={styles.metricCard}>
            <FontAwesome5 name="heartbeat" size={20} color="#f5222d" />
            <Text style={styles.metricValue}>Normal</Text>
            <Text style={styles.metricLabel}>Tim mạch</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderRecentActivities = () => (
    <View style={styles.activitiesSection}>
      <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
      <LinearGradient
        colors={["#fff", "#f8f9fa"]}
        style={styles.activitiesCard}
      >
        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: "#52c41a" }]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Khám sức khỏe định kỳ</Text>
            <Text style={styles.activityDate}>15/12/2024</Text>
            <Text style={styles.activityDescription}>Kết quả: Bình thường</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: "#1890ff" }]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Tiêm vaccine cúm</Text>
            <Text style={styles.activityDate}>01/12/2024</Text>
            <Text style={styles.activityDescription}>Hoàn thành</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: "#fa8c16" }]} />
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Uống thuốc vitamin</Text>
            <Text style={styles.activityDate}>Hôm nay</Text>
            <Text style={styles.activityDescription}>Đang thực hiện</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Đang tải thông tin học sinh...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#f5222d" />
          <Text style={styles.errorText}>
            Không tìm thấy thông tin học sinh
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.errorButton}
          >
            <Text style={styles.errorButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={["#667eea"]}
            tintColor="#667eea"
          />
        }
      >
        {renderStudentProfile()}
        {renderQuickActions()}
        {renderHealthOverview()}
        {renderRecentActivities()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8c8c8c",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#8c8c8c",
    marginVertical: 20,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Profile Section
  profileSection: {
    padding: 20,
    marginTop: -20,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  statusBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  studentInfo: {
    alignItems: "center",
  },
  studentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 16,
    color: "#1890ff",
    fontWeight: "600",
    marginBottom: 4,
  },
  studentCode: {
    fontSize: 14,
    color: "#8c8c8c",
    marginBottom: 16,
  },
  basicInfo: {
    flexDirection: "row",
    gap: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#595959",
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCardContainer: {
    width: (width - 60) / 3,
    marginBottom: 12,
  },
  actionCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginTop: 8,
    textAlign: "center",
  },

  // Health Section
  healthSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  healthCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  healthStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  healthStatusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#52c41a",
  },
  lastUpdate: {
    fontSize: 12,
    color: "#8c8c8c",
  },
  healthMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#262626",
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#8c8c8c",
  },

  // Activities Section
  activitiesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activitiesCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activityItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: "#1890ff",
    fontWeight: "500",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: "#8c8c8c",
  },

  bottomSpacing: {
    height: 30,
  },
});
