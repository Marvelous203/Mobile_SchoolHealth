"use client"
import { api, getCurrentUserId, searchMedicalCheckAppointments } from "@/lib/api";
import { MedicalCheckAppointment, MedicalCheckAppointmentSearchParams, PostMedicalCheckStatus } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Using interfaces from types.ts

interface Student {
  _id: string;
  fullName: string;
  studentCode: string;
  studentIdCode: string;
  gender: "male" | "female";
  dob: string;
}

export default function MedicalCheckResultsScreen() {
  const [medicalCheckResults, setMedicalCheckResults] = useState<MedicalCheckAppointment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("2025-2026");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showSchoolYearPicker, setShowSchoolYearPicker] = useState(false);

  const schoolYears = ["2025-2026", "2026-2027", "2027-2028"];
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadMedicalCheckResults();
    }
  }, [selectedStudent, selectedSchoolYear]);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      await loadStudents(userId);
    } catch (error) {
      console.error("❌ Initialize data error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async (userId: string) => {
    try {
      // Get user profile to get studentIds
      const userProfileResponse = await api.getUserProfile(userId);
      
      if (!userProfileResponse.success || !userProfileResponse.data.studentIds || userProfileResponse.data.studentIds.length === 0) {
        console.log('⚠️ No studentIds found in user profile');
        return;
      }

      // Load student details for each studentId
      const studentPromises = userProfileResponse.data.studentIds.map((studentId: string) => 
        api.getStudentById(studentId)
      );
      
      const studentResponses = await Promise.all(studentPromises);
      const loadedStudents = studentResponses
        .filter(response => response.success && response.data)
        .map(response => response.data);
      
      setStudents(loadedStudents);
      if (loadedStudents.length > 0) {
        setSelectedStudent(loadedStudents[0]);
      }
    } catch (error) {
      console.error("❌ Load students error:", error);
    }
  };

  const loadMedicalCheckResults = async () => {
    if (!selectedStudent) return;

    try {
      setIsLoading(true);
      const params: MedicalCheckAppointmentSearchParams = {
        pageNum: 1,
        pageSize: 10,
        studentId: selectedStudent._id,
        schoolYear: selectedSchoolYear,
      };

      console.log('🔍 Loading medical check results with params:', params);
      const response = await searchMedicalCheckAppointments(params);
      
      console.log('✅ Medical check results response:', response);
      
      if (response && response.pageData) {
        setMedicalCheckResults(response.pageData);
      } else {
        setMedicalCheckResults([]);
      }
    } catch (error) {
      console.error("❌ Load medical check results error:", error);
      setMedicalCheckResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMedicalCheckResults();
    setIsRefreshing(false);
  };

  const getHealthStatusConfig = (isEligible: boolean) => {
    return isEligible
      ? {
          color: "#10B981",
          bgColor: "#ECFDF5",
          text: "Đủ điều kiện",
          icon: "checkmark-circle" as const,
        }
      : {
          color: "#EF4444",
          bgColor: "#FEF2F2",
          text: "Không đủ điều kiện",
          icon: "warning" as const,
        };
  };

  const getPostCheckStatusConfig = (status: PostMedicalCheckStatus) => {
    switch (status) {
      case PostMedicalCheckStatus.Healthy:
        return {
          color: "#10B981",
          bgColor: "#ECFDF5",
          text: "Khỏe mạnh",
        };
      case PostMedicalCheckStatus.NeedFollowUp:
        return {
          color: "#F59E0B",
          bgColor: "#FFFBEB",
          text: "Cần theo dõi",
        };
      case PostMedicalCheckStatus.Sick:
        return {
          color: "#EF4444",
          bgColor: "#FEF2F2",
          text: "Phát hiện bệnh",
        };
      case PostMedicalCheckStatus.Other:
        return {
          color: "#8B5CF6",
          bgColor: "#F3E8FF",
          text: "Khác",
        };
      case PostMedicalCheckStatus.NotChecked:
      default:
        return {
          color: "#6B7280",
          bgColor: "#F9FAFB",
          text: "Chưa đánh giá",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMedicalCheckResultItem = ({ item }: { item: MedicalCheckAppointment }) => {
    const healthConfig = getHealthStatusConfig(item.isHealthy ?? true);
    const postCheckConfig = getPostCheckStatusConfig(item.postMedicalCheckStatus);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => router.push(`/health/medical-check-results/detail?id=${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.resultHeader}>
          <View style={styles.resultInfo}>
            <Text style={styles.studentName}>{item.student?.fullName}</Text>
            <Text style={styles.studentCode}>{item.student?.studentCode}</Text>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: healthConfig.bgColor }]}>
            <Ionicons name={healthConfig.icon as any} size={14} color={healthConfig.color} />
            <Text style={[styles.healthText, { color: healthConfig.color }]}>
              {healthConfig.text}
            </Text>
          </View>
        </View>

        <View style={styles.resultContent}>
          <View style={styles.eventInfo}>
            <Ionicons name="medical" size={16} color="#6366f1" />
            <Text style={styles.eventName}>{item.event?.eventName || "Khám sức khỏe"}</Text>
          </View>

          <View style={styles.measurementRow}>
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Chiều cao</Text>
              <Text style={styles.measurementValue}>{item.height} cm</Text>
            </View>
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Cân nặng</Text>
              <Text style={styles.measurementValue}>{item.weight} kg</Text>
            </View>
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Huyết áp</Text>
              <Text style={styles.measurementValue}>{item.bloodPressure}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: postCheckConfig.bgColor }]}>
              <Ionicons name={postCheckConfig.icon as any} size={12} color={postCheckConfig.color} />
              <Text style={[styles.statusText, { color: postCheckConfig.color }]}>
                {postCheckConfig.text}
              </Text>
            </View>
            <Text style={styles.checkDate}>
              {formatDate(item.checkedAt)} • {formatTime(item.checkedAt)}
            </Text>
          </View>

          <View style={styles.schoolYearBadge}>
            <Ionicons name="school" size={12} color="#6366f1" />
            <Text style={styles.schoolYearText}>{item.schoolYear}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentPicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerTitle}>Chọn học sinh</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.pickerItem,
              selectedStudent?._id === item._id && styles.pickerItemSelected,
            ]}
            onPress={() => {
              setSelectedStudent(item);
              setShowStudentPicker(false);
            }}
          >
            <Text
              style={[
                styles.pickerItemText,
                selectedStudent?._id === item._id && styles.pickerItemTextSelected,
              ]}
            >
              {item.fullName}
            </Text>
            <Text style={styles.pickerItemSubtext}>{item.studentCode}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderSchoolYearPicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerTitle}>Chọn năm học</Text>
      <FlatList
        data={schoolYears}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.pickerItem,
              selectedSchoolYear === item && styles.pickerItemSelected,
            ]}
            onPress={() => {
              setSelectedSchoolYear(item);
              setShowSchoolYearPicker(false);
            }}
          >
            <Text
              style={[
                styles.pickerItemText,
                selectedSchoolYear === item && styles.pickerItemTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Đang tải kết quả khám sức khỏe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kết quả khám sức khỏe</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSchoolYearPicker(true)}
        >
          <Ionicons name="calendar" size={16} color="#6366f1" />
          <Text style={styles.filterButtonText}>{selectedSchoolYear}</Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowStudentPicker(true)}
        >
          <Ionicons name="person" size={16} color="#6366f1" />
          <Text style={styles.filterButtonText}>
            {selectedStudent?.fullName || "Chọn học sinh"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Results List */}
      <FlatList
        data={medicalCheckResults}
        keyExtractor={(item) => item._id}
        renderItem={renderMedicalCheckResultItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="medical-outline" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có kết quả khám</Text>
            <Text style={styles.emptyText}>
              Kết quả khám sức khỏe sẽ hiển thị ở đây sau khi được thực hiện.
            </Text>
          </View>
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {/* Student Picker Modal */}
      {showStudentPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn học sinh</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowStudentPicker(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {renderStudentPicker()}
          </View>
        </View>
      )}

      {/* School Year Picker Modal */}
      {showSchoolYearPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn năm học</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSchoolYearPicker(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {renderSchoolYearPicker()}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  studentCode: {
    fontSize: 14,
    color: "#6b7280",
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  healthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  resultContent: {
    gap: 12,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  measurementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  measurementItem: {
    alignItems: "center",
  },
  measurementLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  checkDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  schoolYearBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  schoolYearText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalCloseButton: {
    padding: 4,
  },
  pickerContainer: {
    maxHeight: 300,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  pickerItemSelected: {
    backgroundColor: "#6366f1",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  pickerItemTextSelected: {
    color: "#fff",
  },
  pickerItemSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
});