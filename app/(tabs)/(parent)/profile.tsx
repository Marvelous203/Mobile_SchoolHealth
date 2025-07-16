import { api, UserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface ChildInfo {
  id: string;
  name: string;
  class: string;
  avatar: string;
  healthStatus: string;
  studentCode: string;
  gender: string;
  dob: string;
  classId: string;
}

interface ServiceHistoryItem {
  icon: string;
  title: string;
  route: string;
  count: number;
}

export default function ParentProfile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editImage, setEditImage] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([
    {
      icon: "medical-services",
      title: "Khám sức khỏe",
      route: "health/checkups/history", // Thay đổi route để trỏ đến history
      count: 0,
    },
    {
      icon: "event",
      title: "Lịch hẹn",
      route: "/appointments",
      count: 0,
    },
    {
      icon: "medication",
      title: "Uống thuốc",
      route: "/health/medicines/history", // Thay đổi route này
      count: 0,
    },
    {
      icon: "vaccines",
      title: "Tiêm chủng",
      route: "/vaccinations",
      count: 0,
    },
  ]);

  const loadServiceCounts = async (parentId: string) => {
    try {
      // Fetch checkup count
      const checkupResponse = await api.searchHealthCheckRegistrations({
        parentId,
        pageNum: 1,
        pageSize: 1,
      });
  
      // Fetch appointment count
      const appointmentResponse = await api.searchAppointments({
        parentId,
        pageNum: 1,
        pageSize: 1,
      });
  
      // Fetch medicine count
      const medicineResponse = await api.searchMedicineSubmissions({
        parentId,
        pageNum: 1,
        pageSize: 1,
      });
  
      // Fetch vaccination count
      const vaccinationResponse = await api.searchVaccineRegistrations({
        parentId,
        pageNum: 1,
        pageSize: 1,
      });
  
      setServiceHistory((prev) =>
        prev.map((service) => {
          // Sửa route để khớp với serviceHistory
          if (service.route === "health/checkups/history") {
            return { 
              ...service, 
              count: checkupResponse?.pageInfo?.totalItems || 0 
            };
          }
          if (service.route === "/appointments") {
            return {
              ...service,
              count: appointmentResponse?.pageInfo?.totalItems || 0,
            };
          }
          if (service.route === "/health/medicines/history") {
            return { 
              ...service, 
              count: medicineResponse?.pageInfo?.totalItems || 0 
            };
          }
          if (service.route === "/vaccinations") {
            return {
              ...service,
              count: vaccinationResponse?.pageInfo?.totalItems || 0,
            };
          }
          return service;
        })
      );
    } catch (error) {
      console.error("Failed to load service counts:", error);
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      console.log("👨‍👩‍👧‍👦 Loading parent profile...");
      const response = await api.getCurrentUser();

      // Type guard function to check if object is UserProfile
      const isUserProfile = (obj: any): obj is UserProfile => {
        return (
          obj &&
          typeof obj === "object" &&
          "_id" in obj &&
          "email" in obj &&
          "fullName" in obj
        );
      };

      // Handle both direct response and nested data response
      const userProfile =
        "data" in response && isUserProfile(response.data)
          ? response.data
          : isUserProfile(response)
          ? response
          : null;

      if (!userProfile) {
        throw new Error("Invalid user profile data");
      }

      setProfile(userProfile);
      console.log("✅ Parent profile loaded:", userProfile);

      // Load service counts
      await loadServiceCounts(userProfile._id);

      // Load children data
      if (userProfile.studentIds && userProfile.studentIds.length > 0) {
        const childrenData = [];
        for (const studentId of userProfile.studentIds) {
          try {
            const studentResponse = await api.getStudentById(studentId);
            const studentData =
              "data" in studentResponse
                ? studentResponse.data
                : studentResponse;

            if (
              studentData &&
              typeof studentData === "object" &&
              "_id" in studentData
            ) {
              const childInfo = {
                id: studentData._id,
                name: studentData.fullName,
                class: studentData.classInfo?.name || "Chưa phân lớp",
                avatar: studentData.avatar || "https://via.placeholder.com/60",
                healthStatus: "good",
                studentCode: studentData.studentCode,
                gender: studentData.gender,
                dob: studentData.dob,
                classId: studentData.classId,
              };
              childrenData.push(childInfo);
            }
          } catch (error) {
            console.error(`Failed to load student ${studentId}:`, error);
          }
        }
        setChildren(childrenData);
      }
    } catch (error) {
      console.error("❌ Failed to load parent profile:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin profile");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      setIsRefreshing(true);
      await loadProfile();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const renderChangePasswordModal = () => (
    <Modal
      visible={showChangePassword}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowChangePassword(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <TouchableOpacity
              onPress={() => setShowChangePassword(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Current Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry
              />
            </View>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
              />
            </View>

            {/* Confirm New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowChangePassword(false);
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  Đổi mật khẩu
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleChangePassword = async () => {
    try {
      if (!oldPassword || !newPassword || !confirmPassword) {
        Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu mới không khớp");
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }

      setIsChangingPassword(true);
      const response = await api.changePassword({
        oldPassword,
        newPassword,
      });

      if (response.success) {
        Alert.alert("Thành công", "Đổi mật khẩu thành công");
        setShowChangePassword(false);
        // Reset form
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      console.error("❌ Failed to change password:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể đổi mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

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
                    editImage
                      ? { uri: editImage }
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

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
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

  const handleUpdateProfile = async () => {
    try {
      if (!editFullName.trim() || !editPhone.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
      }

      setIsUpdatingProfile(true);

      const updateData: Partial<UserProfile> = {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
      };

      if (editImage) {
        updateData.image = editImage;
      }

      const response = await api.updateUserProfile(user?._id || "", updateData);

      if (response.success) {
        setProfile(response.data);
        Alert.alert("Thành công", "Cập nhật thông tin thành công");
        setShowEditProfile(false);
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
        setEditImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  // Initialize edit form when modal opens
  useEffect(() => {
    if (showEditProfile && profile) {
      setEditFullName(profile.fullName);
      setEditPhone(profile.phone);
      setEditImage(profile.image || "");
    }
  }, [showEditProfile, profile]);

  useEffect(() => {
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshProfile}
            colors={["#1890ff"]}
          />
        }
      >
        {/* Profile content */}
        {profile && (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {profile.image ? (
                <Image source={{ uri: profile.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <FontAwesome5 name="user-alt" size={32} color="#52c41a" />
                </View>
              )}
            </View>
            <Text style={styles.profileName}>{profile.fullName}</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
            <Text style={styles.infoValue}>{profile.phone}</Text>

            <View style={styles.divider} />

            {/* Thông tin về số con */}
            <View style={styles.infoRow}>
              <FontAwesome5 name="child" size={20} color="#1890ff" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số con</Text>
                <Text style={styles.infoValue}>
                  {profile.studentIds?.length || 0} học sinh
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Children List */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách con</Text>
            {children.map((child, index) => (
              <TouchableOpacity
                key={child.id}
                style={styles.childCard}
                onPress={() => router.push(`/children/${child.id}`)}
              >
                <Image
                  source={{ uri: child.avatar }}
                  style={styles.childAvatar}
                />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childClass}>{child.class}</Text>
                  <Text style={styles.childCode}>
                    Mã HS: {child.studentCode}
                  </Text>
                  <View style={styles.childDetails}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="wc" size={16} color="#8c8c8c" />
                      <Text style={styles.detailText}>
                        {child.gender === "male" ? "Nam" : "Nữ"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="cake" size={16} color="#8c8c8c" />
                      <Text style={styles.detailText}>
                        {new Date(child.dob).toLocaleDateString("vi-VN")}
                      </Text>
                    </View>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#bfbfbf" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Service History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử dịch vụ</Text>
          <View style={styles.serviceGrid}>
            {serviceHistory.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={styles.serviceCard}
                onPress={() => router.push(service.route as any)}
              >
                <View style={styles.serviceCardInner}>
                  <MaterialIcons
                    name={service.icon as any}
                    size={24}
                    color="#1890ff"
                  />
                  <Text style={styles.serviceCount}>{service.count}</Text>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => setShowEditProfile(true)}
          >
            <MaterialIcons name="edit" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>Chỉnh sửa thông tin</Text>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {/* Change Password Button */}
          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => setShowChangePassword(true)}
          >
            <MaterialIcons name="lock" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>Đổi mật khẩu</Text>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.settingButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="#ff4d4f" />
            <Text style={[styles.settingText, { color: "#ff4d4f" }]}>
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderChangePasswordModal()}
      {renderEditProfileModal()}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#262626",
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
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  profileCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f6ffed",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#52c41a",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#262626",
    textAlign: "center",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#8c8c8c",
  },
  infoValue: {
    fontSize: 16,
    color: "#262626",
    marginTop: 2,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 12,
  },
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  childInfo: {
    flex: 1,
    marginLeft: 12,
  },
  childName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
  },
  childClass: {
    fontSize: 14,
    color: "#1890ff",
    marginTop: 2,
  },
  childCode: {
    fontSize: 12,
    color: "#8c8c8c",
    marginTop: 2,
  },
  childDetails: {
    flexDirection: "row",
    marginTop: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: "#8c8c8c",
    marginLeft: 4,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  serviceCard: {
    width: "50%",
    padding: 8,
  },
  serviceCardInner: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1890ff",
    marginTop: 8,
  },
  serviceTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#262626",
    marginLeft: 12,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#ff4d4f",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#262626",
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#8c8c8c",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#1890ff",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#52c41a",
  },
  saveButtonText: {
    fontWeight: "bold",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
