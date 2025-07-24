import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function ChildrenScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentCode, setStudentCode] = useState("");
  const [relationshipType, setRelationshipType] = useState("father");
  const [isLinking, setIsLinking] = useState(false);

  const loadChildren = async () => {
    try {
      setIsLoading(true);
      const userProfileResponse = await api.getCurrentUser();
      const userProfile =
        (userProfileResponse as any).data || userProfileResponse;
      console.log(
        "🔍 CHILDREN PAGE DEBUG: userProfile:",
        JSON.stringify(userProfile, null, 2)
      );

      if (userProfile.studentIds && userProfile.studentIds.length > 0) {
        const childrenData = [];

        for (const studentId of userProfile.studentIds) {
          try {
            const studentResponse = await api.getStudentById(studentId);
            const studentData = studentResponse.data || studentResponse;

            const childInfo = {
              id: studentData._id,
              name: studentData.fullName,
              class: studentData.classInfo?.name || "Unknown Class",
              avatar: studentData.avatar || "https://via.placeholder.com/60",
              healthStatus: "good",
              studentCode: studentData.studentCode,
              gender: studentData.gender,
              dob: studentData.dob,
              classId: studentData.classId,
            };

            childrenData.push(childInfo);
          } catch (error) {
            console.error(`Failed to load student ${studentId}:`, error);
          }
        }

        setChildren(childrenData);
      }
    } catch (error) {
      console.error("Failed to load children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await loadChildren();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải thông tin con em...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddChild = async () => {
    if (!studentCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã học sinh");
      return;
    }

    try {
      setIsLinking(true);
      await api.linkStudents([
        {
          studentCode: studentCode.trim(),
          type: relationshipType,
        },
      ]);

      Alert.alert("Thành công", "Đã liên kết học sinh thành công", [
        {
          text: "OK",
          onPress: () => {
            setShowAddModal(false);
            setStudentCode("");
            setRelationshipType("father");
            loadChildren(); // Reload the children list
          },
        },
      ]);
    } catch (error: any) {
      console.error("Failed to link student:", error);
      Alert.alert("Lỗi", error.message || "Không thể liên kết học sinh");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Con em của tôi</Text>
          <Text style={styles.headerSubtitle}>{children.length} học sinh</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={["#1890ff"]}
          />
        }
      >
        {children.length > 0 ? (
          children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childCard}
              onPress={() =>
                router.push(`/(tabs)/(parent)/children/${child.id}`)
              }
            >
              <Image
                source={{ uri: child.avatar }}
                style={styles.childAvatar}
              />
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childClass}>{child.class}</Text>
                <Text style={styles.childCode}>Mã HS: {child.studentIdCode}</Text>
                <View style={styles.healthStatus}>
                  <View style={[styles.statusIndicator, styles.statusGood]} />
                  <Text style={styles.statusText}>Tình trạng tốt</Text>
                </View>
              </View>
              <MaterialIcons
                name="arrow-forward-ios"
                size={20}
                color="#1890ff"
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noChildrenCard}>
            <MaterialIcons name="child-care" size={48} color="#d9d9d9" />
            <Text style={styles.noChildrenText}>Chưa có thông tin con em</Text>
            <TouchableOpacity
              style={styles.addFirstChildButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addFirstChildText}>
                Thêm học sinh đầu tiên
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Child Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm học sinh</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#8c8c8c" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mã học sinh</Text>
              <TextInput
                style={styles.textInput}
                value={studentCode}
                onChangeText={setStudentCode}
                placeholder="Nhập mã học sinh (VD: HS001)"
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Quan hệ với học sinh</Text>
              <View style={styles.relationshipContainer}>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    relationshipType === "father" && styles.relationshipOptionSelected,
                  ]}
                  onPress={() => setRelationshipType("father")}
                >
                  <Text
                    style={[
                      styles.relationshipText,
                      relationshipType === "father" && styles.relationshipTextSelected,
                    ]}
                  >
                    Bố
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    relationshipType === "mother" && styles.relationshipOptionSelected,
                  ]}
                  onPress={() => setRelationshipType("mother")}
                >
                  <Text
                    style={[
                      styles.relationshipText,
                      relationshipType === "mother" && styles.relationshipTextSelected,
                    ]}
                  >
                    Mẹ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    relationshipType === "guardian" && styles.relationshipOptionSelected,
                  ]}
                  onPress={() => setRelationshipType("guardian")}
                >
                  <Text
                    style={[
                      styles.relationshipText,
                      relationshipType === "guardian" && styles.relationshipTextSelected,
                    ]}
                  >
                    Người giám hộ
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                  disabled={isLinking}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    isLinking && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleAddChild}
                  disabled={isLinking}
                >
                  <Text style={styles.confirmButtonText}>
                    {isLinking ? "Đang thêm..." : "Thêm"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#1890ff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addFirstChildButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addFirstChildText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#262626",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#262626",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "#8c8c8c",
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: "#d9d9d9",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8c8c8c",
  },
  childCard: {
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
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 4,
  },
  childClass: {
    fontSize: 14,
    color: "#8c8c8c",
    marginBottom: 2,
  },
  childCode: {
    fontSize: 12,
    color: "#1890ff",
    marginBottom: 8,
  },
  healthStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusGood: {
    backgroundColor: "#52c41a",
  },
  statusText: {
    fontSize: 12,
    color: "#52c41a",
  },
  noChildrenCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginTop: 40,
  },
  noChildrenText: {
    fontSize: 16,
    color: "#8c8c8c",
    marginTop: 12,
  },
  relationshipContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  relationshipOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  relationshipOptionSelected: {
    borderColor: "#1890ff",
    backgroundColor: "#e6f7ff",
  },
  relationshipText: {
    fontSize: 14,
    color: "#8c8c8c",
    fontWeight: "500",
  },
  relationshipTextSelected: {
    color: "#1890ff",
  },
});
