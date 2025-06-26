"use client";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function ParentHome() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [healthUpdates, setHealthUpdates] = useState<any[]>([]);
  const [vaccineEvents, setVaccineEvents] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalEvents: 12,
    pendingTasks: 3,
    upcomingAppointments: 2,
    healthAlerts: 1,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("👨‍👩‍👧‍👦 Loading parent home data...");

      // Load user profile
      const userProfileResponse = await api.getCurrentUser();
      console.log(
        "🔍 DEBUG: Full API response:",
        JSON.stringify(userProfileResponse, null, 2)
      );

      // Extract data from response - same as children page
      const userProfile =
        (userProfileResponse as any).data || userProfileResponse;
      setProfile(userProfile);
      console.log(
        "✅ Parent profile loaded:",
        JSON.stringify(userProfile, null, 2)
      );
      console.log("🔍 DEBUG: studentIds:", userProfile.studentIds);
      console.log("🔍 DEBUG: studentParents:", userProfile.studentParents);

      // Load children data using real API - same logic as children/index.tsx
      if (userProfile.studentIds && userProfile.studentIds.length > 0) {
        console.log("📚 Loading student data for IDs:", userProfile.studentIds);
        const childrenData = [];

        for (const studentId of userProfile.studentIds) {
          try {
            const studentResponse = await api.getStudentById(studentId);
            const studentData = studentResponse.data || studentResponse;

            // Transform student data for display
            const childInfo = {
              id: studentData._id,
              name: studentData.fullName,
              class: studentData.classInfo?.name || "Lớp 1A1",
              avatar: studentData.avatar || "https://via.placeholder.com/60",
              healthStatus: "good", // Default status
              studentCode: studentData.studentCode,
              gender: studentData.gender,
              dob: studentData.dob,
              classId: studentData.classId,
              parentInfos: studentData.parentInfos || [],
              recentActivity: "Khám sức khỏe định kỳ",
              lastCheckup: "15/06/2025",
            };

            childrenData.push(childInfo);
            console.log(
              `✅ Student ${studentData.fullName} loaded successfully`
            );
          } catch (error) {
            console.error(`❌ Failed to load student ${studentId}:`, error);
            // Add placeholder data for failed requests
            childrenData.push({
              id: studentId,
              name: "Unknown Student",
              class: "Unknown Class",
              avatar: "https://via.placeholder.com/60",
              healthStatus: "unknown",
              error: true,
            });
          }
        }

        setChildren(childrenData);
        console.log("👶 All children data loaded:", childrenData);
        console.log("🔢 Total children count:", childrenData.length);
      } else {
        console.log("❌ No studentIds found or empty array");
        console.log(
          "🔍 Available keys in userProfile:",
          Object.keys(userProfile)
        );
      }

      // TODO: Load alerts when API is available
      setAlerts([
        {
          id: 1,
          type: "vaccination",
          title: "Vaccination Consent Required",
          description:
            "Annual flu vaccination is scheduled for October 15. Please provide your consent.",
          priority: "high",
          date: "2023-10-15",
        },
        {
          id: 2,
          type: "checkup",
          title: "Health Checkup Scheduled",
          description:
            "Annual health checkup is scheduled for September 20. Please provide your consent.",
          priority: "medium",
          date: "2023-09-20",
        },
      ]);

      setHealthUpdates([
        {
          id: 1,
          title: "Latest Health Checkup",
          date: "September 5, 2023",
          height: "135 cm",
          weight: "32 kg",
          vision: "20/20 (Normal)",
        },
      ]);
    } catch (error) {
      console.error("❌ Failed to load parent home data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin trang chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderHeader = () => (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Xin chào, {profile?.fullName || user?.name || "Phụ huynh"}! 👋
          </Text>
          <Text style={styles.schoolName}>Trường Tiểu học Lincoln</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.profileButton}>
          <Image
            source={{
              uri: profile?.image || "https://via.placeholder.com/50",
            }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Tổng quan</Text>
      <View style={styles.statsGrid}>
        <LinearGradient colors={["#ff9a9e", "#fecfef"]} style={styles.statCard}>
          <FontAwesome5 name="calendar-alt" size={24} color="#fff" />
          <Text style={styles.statNumber}>{quickStats.totalEvents}</Text>
          <Text style={styles.statLabel}>Sự kiện</Text>
        </LinearGradient>

        <LinearGradient colors={["#a8edea", "#fed6e3"]} style={styles.statCard}>
          <FontAwesome5 name="tasks" size={24} color="#fff" />
          <Text style={styles.statNumber}>{quickStats.pendingTasks}</Text>
          <Text style={styles.statLabel}>Cần xử lý</Text>
        </LinearGradient>

        <LinearGradient colors={["#ffecd2", "#fcb69f"]} style={styles.statCard}>
          <FontAwesome5 name="clock" size={24} color="#fff" />
          <Text style={styles.statNumber}>
            {quickStats.upcomingAppointments}
          </Text>
          <Text style={styles.statLabel}>Lịch hẹn</Text>
        </LinearGradient>

        <LinearGradient colors={["#ff8a80", "#ff5722"]} style={styles.statCard}>
          <FontAwesome5 name="exclamation-triangle" size={24} color="#fff" />
          <Text style={styles.statNumber}>{quickStats.healthAlerts}</Text>
          <Text style={styles.statLabel}>Cảnh báo</Text>
        </LinearGradient>
      </View>
    </View>
  );

  const renderChildren = () => (
    <View style={styles.childSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Con em ({children.length})</Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/(parent)/children")}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#667eea" />
        </TouchableOpacity>
      </View>

      {children.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {children.map((child, index) => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childCard, { marginLeft: index === 0 ? 20 : 12 }]}
              onPress={() => {
                router.push(`/(tabs)/(parent)/children/${child.id}`);
              }}
            >
              <LinearGradient
                colors={["#fff", "#f8f9fa"]}
                style={styles.childCardGradient}
              >
                <View style={styles.childImageContainer}>
                  <Image
                    source={{ uri: child.avatar }}
                    style={styles.childAvatar}
                  />
                  <View
                    style={[
                      styles.statusDot,
                      child.error
                        ? styles.statusError
                        : child.healthStatus === "good"
                        ? styles.statusGood
                        : styles.statusWarning,
                    ]}
                  />
                </View>

                <View style={styles.childInfo}>
                  <Text style={styles.childName} numberOfLines={1}>
                    {child.name}
                  </Text>
                  <Text style={styles.childClass}>{child.class}</Text>
                  {child.studentCode && (
                    <Text style={styles.childCode}>
                      Mã: {child.studentCode}
                    </Text>
                  )}

                  <View style={styles.childStats}>
                    <View style={styles.childStatItem}>
                      <FontAwesome5
                        name="heartbeat"
                        size={12}
                        color="#52c41a"
                      />
                      <Text style={styles.childStatText}>Tốt</Text>
                    </View>
                    <View style={styles.childStatItem}>
                      <FontAwesome5 name="calendar" size={12} color="#1890ff" />
                      <Text style={styles.childStatText}>
                        {child.lastCheckup}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.recentActivity} numberOfLines={1}>
                    {child.recentActivity}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
          <View style={{ width: 20 }} />
        </ScrollView>
      ) : (
        <View style={styles.noChildrenCard}>
          <FontAwesome5 name="child" size={48} color="#d9d9d9" />
          <Text style={styles.noChildrenText}>Chưa có thông tin con em</Text>
          <TouchableOpacity style={styles.addChildButton}>
            <Text style={styles.addChildText}>Thêm thông tin</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => {
    const actions = [
      {
        id: "health",
        title: "Sức khỏe",
        subtitle: "Hồ sơ & Khám bệnh",
        icon: "heartbeat",
        colors: ["#667eea", "#764ba2"],
        route: "/(tabs)/(parent)/health",
      },
      {
        id: "medicines",
        title: "Thuốc men",
        subtitle: "Gửi đơn thuốc",
        icon: "pills",
        colors: ["#f093fb", "#f5576c"],
        route: "/(tabs)/(parent)/medicines",
      },
      {
        id: "checkups",
        title: "Khám sức khỏe",
        subtitle: "Đặt lịch & Kết quả",
        icon: "stethoscope",
        colors: ["#4facfe", "#00f2fe"],
        route: "/(tabs)/(parent)/checkups",
      },
      {
        id: "vaccinations",
        title: "Tiêm chủng",
        subtitle: "Lịch tiêm & Đồng ý",
        icon: "syringe",
        colors: ["#43e97b", "#38f9d7"],
        route: "/(tabs)/(parent)/vaccinations",
      },
      {
        id: "blogs",
        title: "Tin tức",
        subtitle: "Thông tin y tế",
        icon: "newspaper",
        colors: ["#fa709a", "#fee140"],
        route: "/(tabs)/(parent)/blogs",
      },
      {
        id: "profile",
        title: "Hồ sơ",
        subtitle: "Thông tin cá nhân",
        icon: "user-circle",
        colors: ["#a8edea", "#fed6e3"],
        route: "/(tabs)/(parent)/profile",
      },
    ];

    return (
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Dịch vụ</Text>
        <View style={styles.actionGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCardContainer}
              onPress={() => router.push(action.route as any)}
            >
              <LinearGradient
                colors={action.colors as [string, string, ...string[]]}
                style={styles.actionCard}
              >
                <FontAwesome5
                  name={action.icon as any}
                  size={28}
                  color="#fff"
                />
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        {renderHeader()}
        {renderQuickStats()}
        {renderChildren()}
        {renderQuickActions()}
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
  scrollView: {
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
    color: "#fff",
    fontWeight: "500",
  },

  // Header Styles
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  profileButton: {
    marginLeft: 16,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#fff",
  },

  // Stats Section
  statsContainer: {
    padding: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },

  // Children Section
  childSection: {
    marginTop: 20,
  },
  childCard: {
    width: 280,
    marginRight: 12,
  },
  childCardGradient: {
    borderRadius: 20,
    padding: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  childImageContainer: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  childAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    bottom: 0,
    right: 10,
    borderWidth: 3,
    borderColor: "#fff",
  },
  statusGood: {
    backgroundColor: "#52c41a",
  },
  statusWarning: {
    backgroundColor: "#faad14",
  },
  statusError: {
    backgroundColor: "#f5222d",
  },
  childInfo: {
    alignItems: "center",
  },
  childName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 4,
    textAlign: "center",
  },
  childClass: {
    fontSize: 14,
    color: "#8c8c8c",
    marginBottom: 4,
  },
  childCode: {
    fontSize: 12,
    color: "#1890ff",
    marginBottom: 12,
  },
  childStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 12,
  },
  childStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  childStatText: {
    fontSize: 12,
    color: "#8c8c8c",
    marginLeft: 4,
  },
  recentActivity: {
    fontSize: 12,
    color: "#595959",
    textAlign: "center",
    fontStyle: "italic",
  },
  noChildrenCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  noChildrenText: {
    fontSize: 16,
    color: "#8c8c8c",
    marginTop: 16,
    marginBottom: 20,
  },
  addChildButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addChildText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Quick Actions
  quickActions: {
    padding: 20,
    marginTop: 20,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCardContainer: {
    width: (width - 60) / 2,
    marginBottom: 16,
  },
  actionCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },

  bottomSpacing: {
    height: 30,
  },
});
