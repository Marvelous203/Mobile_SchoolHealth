import { api } from "@/lib/api";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  classId: string | null;
  classInfo?: {
    _id: string;
    name: string;
    isDeleted: boolean;
  };
  isDeleted: boolean;
  parentInfos?: {
    _id: string;
    fullName: string;
    phone: string;
    email: string;
    role: string;
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

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editGender, setEditGender] = useState<"male" | "female">("male");
  const [editDob, setEditDob] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowMenu(true)}
        >
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
          <Text
            style={[styles.studentClass, !student?.classInfo && styles.noClass]}
          >
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

  const handleUpdateProfile = async () => {
    try {
      if (!editFullName.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
        return;
      }

      if (!student) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin học sinh");
        return;
      }

      setIsUpdatingProfile(true);

      const updateData = {
        fullName: editFullName.trim(),
        gender: editGender,
        dob: editDob,
        avatar: editAvatar,
      };

      const response = await api.updateStudent(id, updateData);

      if (response.success && response.data) {
        // Use the API response data directly
        setStudent(response.data);
        // Reload student data to get the latest information including class
        loadStudentData();
        Alert.alert("Thành công", "Cập nhật thông tin thành công");
        setShowEditProfile(false);
      } else {
        throw new Error(response.message || "Không thể cập nhật thông tin");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể cập nhật thông tin. Vui lòng thử lại."
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditDob(selectedDate.toISOString());
    }
  };

  // Initialize edit form when modal opens
  useEffect(() => {
    if (showEditProfile && student) {
      setEditFullName(student.fullName);
      setEditGender(student.gender);
      setEditDob(student.dob);
      setEditAvatar(student.avatar || "");
    }
  }, [showEditProfile, student]);

  const renderMenu = () => (
    <Modal
      visible={showMenu}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              setShowEditProfile(true);
            }}
          >
            <MaterialIcons name="edit" size={24} color="#4CAF50" />
            <Text style={styles.menuText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderEditProfileModal = () => (
    <Modal
      visible={showEditProfile}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditProfile(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            <TouchableOpacity
              onPress={() => setShowEditProfile(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Profile Image */}
            <View style={styles.imageContainer}>
              <TouchableOpacity onPress={pickImage}>
                <Image
                  source={
                    editAvatar
                      ? { uri: editAvatar }
                      : { uri: "https://via.placeholder.com/120" }
                  }
                  style={styles.profileImage}
                />
                <View style={styles.imageOverlay}>
                  <MaterialIcons name="camera-alt" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập họ và tên"
              />
            </View>

            {/* Gender Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Giới tính</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editGender === "male" && styles.genderButtonActive,
                  ]}
                  onPress={() => setEditGender("male")}
                >
                  <MaterialIcons
                    name="male"
                    size={24}
                    color={editGender === "male" ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      editGender === "male" && styles.genderTextActive,
                    ]}
                  >
                    Nam
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editGender === "female" && styles.genderButtonActive,
                  ]}
                  onPress={() => setEditGender("female")}
                >
                  <MaterialIcons
                    name="female"
                    size={24}
                    color={editGender === "female" ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      editGender === "female" && styles.genderTextActive,
                    ]}
                  >
                    Nữ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date of Birth Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ngày sinh</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {editDob
                    ? new Date(editDob).toLocaleDateString("vi-VN")
                    : "Chọn ngày sinh"}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={editDob ? new Date(editDob) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Read-only Information */}
            <View style={styles.readOnlySection}>
              <Text style={styles.sectionTitle}>Thông tin khác</Text>

              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Mã học sinh</Text>
                <Text style={styles.infoValue}>{student?.studentCode}</Text>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Lớp</Text>
                <Text style={styles.infoValue}>
                  {student?.classInfo?.name || "Chưa phân lớp"}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowEditProfile(false)}
            >
              <Text style={[styles.buttonText, { color: "#666" }]}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  Lưu thay đổi
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
      {renderMenu()}
      {renderEditProfileModal()}
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
    color: "#4CAF50",
    marginBottom: 4,
  },
  noClass: {
    color: "#ff9800",
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

  // Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  infoContainer: {
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  genderText: {
    fontSize: 16,
    color: "#666",
  },
  genderTextActive: {
    color: "#fff",
  },
  readOnlySection: {
    marginTop: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
});
