import { api, getCurrentUserId } from "@/lib/api";

import { CreateHealthRecordRequest } from "@/lib/types";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardTypeOptions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface StudentData {
  id: string;
  name: string;
  studentCode: string;
  studentIdCode: string;
  class: string;
  avatar: string;
}

export default function CreateHealthRecordScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null
  );
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSchoolYearModal, setShowSchoolYearModal] = useState(false);

  // Available school years
  const schoolYears = [
    "2025-2026",
    "2026-2027",
    "2027-2028",
    "2028-2029",
  ];

  const [formData, setFormData] = useState<CreateHealthRecordRequest>({
    studentId: "",
    chronicDiseases: [],
    allergies: [],
    pastTreatments: [],
    vision: "",
    hearing: "",
    vaccinationHistory: [],
    schoolYear: "2025-2026",
    height: "",
    weight: "",
  });

  // Form state for input handling
  const [chronicDiseasesInput, setChronicDiseasesInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [pastTreatmentsInput, setPastTreatmentsInput] = useState("");
  const [vaccinationHistoryInput, setVaccinationHistoryInput] = useState("");

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Auto-set school year when student is selected
  useEffect(() => {
    if (selectedStudent) {
      determineNextSchoolYear(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);

      // Get current user ID first
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        Alert.alert("Lỗi", "Không thể xác định user hiện tại");
        return;
      }

      // Get user profile to get studentIds
      const userProfileResponse = await api.getUserProfile(currentUserId);

      if (userProfileResponse.success && userProfileResponse.data.studentIds) {
        console.log(
          "📚 Loading student data for IDs:",
          userProfileResponse.data.studentIds
        );
        console.log(
          "🔢 Total students to load:",
          userProfileResponse.data.studentIds.length
        );

        const studentDataPromises = userProfileResponse.data.studentIds.map(
          async (studentId: string) => {
            try {
              console.log("📚 Loading student data for ID:", studentId);
              const studentResponse = await api.getStudentProfile(studentId);

              if (studentResponse.success && studentResponse.data) {
                console.log("✅ Student data loaded:", studentResponse.data);
                return {
                  id: studentResponse.data._id,
                  name: studentResponse.data.fullName,
                  studentCode: studentResponse.data.studentCode,
                  studentIdCode: studentResponse.data.studentIdCode,
                  class: studentResponse.data.classInfo?.name || "N/A",
                  avatar:
                    studentResponse.data.avatar ||
                    "https://example.com/avatar.jpg",
                };
              }
              return null;
            } catch (error) {
              console.error("❌ Error loading student:", studentId, error);
              return null;
            }
          }
        );

        console.log("⏳ Waiting for all student data to load...");
        const studentsData = await Promise.all(studentDataPromises);
        const validStudents = studentsData.filter(
          (student): student is StudentData => student !== null
        );

        console.log("👶 All children data loaded:", validStudents);
        console.log("🔢 Total children count:", validStudents.length);
        setStudents(validStudents);

        // Auto-select first student if only one
        if (validStudents.length === 1) {
          setSelectedStudent(validStudents[0]);
          setFormData((prev) => ({ ...prev, studentId: validStudents[0].id }));
          console.log(
            "🎯 Auto-selected single student:",
            validStudents[0].name
          );
        }
      }
    } catch (error) {
      console.error("❌ Error loading students:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách con em");
    } finally {
      setLoadingStudents(false);
    }
  };

  const determineNextSchoolYear = async (studentId: string) => {
    try {
      console.log("📅 Determining next school year for student:", studentId);

      // Get existing health records for this student
      const params = {
        pageNum: 1,
        pageSize: 50,
        studentId: studentId,
      };

      const response = await api.searchHealthRecords(params);

      if (response.pageData && response.pageData.length > 0) {
        // Get all existing school years
        const existingYears = response.pageData.map(
          (record) => record.schoolYear
        );
        console.log("📚 Existing school years:", existingYears);

        // Find the latest year and increment
        const latestYear = existingYears.sort().reverse()[0]; // Get the latest year
        console.log("📅 Latest existing year:", latestYear);

        const nextYear = getNextSchoolYear(latestYear);
        console.log("📅 Suggested next year:", nextYear);

        setFormData((prev) => ({ ...prev, schoolYear: nextYear }));
      } else {
        // No existing records, use current default year
        console.log("📅 No existing records, using default year: 2025-2026");
        setFormData((prev) => ({ ...prev, schoolYear: "2025-2026" }));
      }
    } catch (error) {
      console.error("❌ Error determining school year:", error);
      // Fall back to default
      setFormData((prev) => ({ ...prev, schoolYear: "2024-2025" }));
    }
  };

  const getNextSchoolYear = (currentYear: string): string => {
    // Parse the current year (e.g., "2024-2025" -> 2024)
    const startYear = parseInt(currentYear.split("-")[0]);
    const nextStartYear = startYear + 1;
    const nextEndYear = nextStartYear + 1;

    const nextSchoolYear = `${nextStartYear}-${nextEndYear}`;

    // Check if the next year is available in our list
    if (schoolYears.includes(nextSchoolYear)) {
      return nextSchoolYear;
    } else {
      // If not available, find the next available year
      const currentIndex = schoolYears.indexOf(currentYear);
      if (currentIndex !== -1 && currentIndex < schoolYears.length - 1) {
        return schoolYears[currentIndex + 1];
      } else {
        // Return the last available year if we're at the end
        return schoolYears[schoolYears.length - 1];
      }
    }
  };

  const validateHealthData = (): string | null => {
    // Validate height
    if (formData.height.trim()) {
      const height = parseFloat(formData.height);
      if (isNaN(height) || height <= 0) {
        return "Chiều cao phải là số dương";
      }
      if (height < 110 || height > 160) {
        return "Chiều cao của học sinh phải từ 110-160cm";
      }
    }

    // Validate weight
    if (formData.weight.trim()) {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight <= 0) {
        return "Cân nặng phải là số dương";
      }
      if (weight < 20 || weight > 70) {
        return "Cân nặng của học sinh phải từ 20-70kg";
      }
    }

    return null;
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate student selection
      if (!selectedStudent) {
        Alert.alert("Lỗi", "Vui lòng chọn học sinh");
        return;
      }

      // Validate required fields
      if (!formData.vision.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập thông tin thị lực");
        return;
      }

      if (!formData.hearing.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập thông tin thính lực");
        return;
      }

      // Validate health data (height and weight)
      const healthValidationError = validateHealthData();
      if (healthValidationError) {
        Alert.alert("Lỗi", healthValidationError);
        return;
      }

      // Convert comma-separated strings to arrays
      const finalData = {
        ...formData,
        studentId: selectedStudent.id,
        chronicDiseases: chronicDiseasesInput
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        allergies: allergiesInput
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        pastTreatments: pastTreatmentsInput
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        vaccinationHistory: vaccinationHistoryInput
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      };

      console.log("📝 Creating health record:", finalData);

      const response = await api.createHealthRecord(finalData);

      if (response.success) {
        Alert.alert("Thành công", "Hồ sơ sức khỏe đã được tạo thành công!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Lỗi", response.message || "Không thể tạo hồ sơ sức khỏe");
      }
    } catch (error: any) {
      console.error("❌ Create health record error:", error);
      Alert.alert("Lỗi", error.message || "Đã xảy ra lỗi khi tạo hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const renderFormSection = (
    title: string,
    icon: string,
    children: React.ReactNode
  ) => (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name={icon} size={18} color="#1890ff" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    multiline = false,
    keyboardType: KeyboardTypeOptions = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#bfbfbf"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderArrayInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    helperText: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#bfbfbf"
        multiline
        numberOfLines={3}
      />
      <Text style={styles.helperText}>{helperText}</Text>
    </View>
  );

  const renderStudentItem = ({ item }: { item: StudentData }) => (
    <TouchableOpacity
      style={[
        styles.studentItem,
        selectedStudent?.id === item.id && styles.selectedStudentItem,
      ]}
      onPress={() => {
        setSelectedStudent(item);
        setFormData((prev) => ({ ...prev, studentId: item.id }));
        setShowStudentModal(false);
      }}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentCode}>{item.studentIdCode}</Text>
        <Text style={styles.studentClass}>Lớp: {item.class}</Text>
      </View>
      {selectedStudent?.id === item.id && (
        <FontAwesome5 name="check-circle" size={20} color="#52c41a" />
      )}
    </TouchableOpacity>
  );

  const renderSchoolYearItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.schoolYearItem,
        formData.schoolYear === item && styles.selectedSchoolYearItem,
      ]}
      onPress={() => {
        setFormData((prev) => ({ ...prev, schoolYear: item }));
        setShowSchoolYearModal(false);
      }}
    >
      <Text
        style={[
          styles.schoolYearText,
          formData.schoolYear === item && styles.selectedSchoolYearText,
        ]}
      >
        {item}
      </Text>
      {formData.schoolYear === item && (
        <FontAwesome5 name="check-circle" size={20} color="#52c41a" />
      )}
    </TouchableOpacity>
  );

  if (loadingStudents) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>Đang tải danh sách con em...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1890ff", "#69c0ff"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <FontAwesome5 name="file-medical-alt" size={24} color="#fff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Tạo Hồ Sơ Sức Khỏe</Text>
              <Text style={styles.headerSubtitle}>
                {selectedStudent?.name || "Chọn học sinh"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Selection */}
        {renderFormSection(
          "Chọn học sinh",
          "user-graduate",
          <TouchableOpacity
            style={styles.studentSelector}
            onPress={() => setShowStudentModal(true)}
          >
            <View style={styles.studentSelectorContent}>
              {selectedStudent ? (
                <>
                  <Text style={styles.selectedStudentName}>
                    {selectedStudent.name}
                  </Text>
                  <Text style={styles.selectedStudentCode}>
                  {selectedStudent.studentIdCode}
                </Text>
                  <Text style={styles.selectedStudentClass}>
                    Class: {selectedStudent.class}
                  </Text>
                </>
              ) : (
                <Text style={styles.studentPlaceholder}>Chọn học sinh</Text>
              )}
            </View>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color="#8c8c8c"
            />
          </TouchableOpacity>
        )}

        {/* School Year Selection */}
        {selectedStudent &&
          renderFormSection(
            "Chọn năm học",
            "calendar-alt",
            <TouchableOpacity
              style={styles.schoolYearSelector}
              onPress={() => setShowSchoolYearModal(true)}
            >
              <View style={styles.schoolYearSelectorContent}>
                <Text style={styles.selectedSchoolYear}>
                  Năm học: {formData.schoolYear}
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={24}
                color="#8c8c8c"
              />
            </TouchableOpacity>
          )}

        {/* Basic Health Info */}
        {selectedStudent &&
          renderFormSection(
            "Thông tin sức khỏe cơ bản",
            "eye",
            <>
              {renderInput(
                "Thị lực",
                formData.vision,
                (text) => setFormData({ ...formData, vision: text }),
                "Ví dụ: 10/10, 8/10, cận thị..."
              )}
              {renderInput(
                "Thính lực",
                formData.hearing,
                (text) => setFormData({ ...formData, hearing: text }),
                "Ví dụ: Bình thường, giảm nghe nhẹ..."
              )}
              {renderInput(
                "Chiều cao (cm)",
                formData.height,
                (text) => {
                  // Only allow positive numbers and decimal point
                  const numericText = text.replace(/[^0-9.]/g, '');
                  // Prevent multiple decimal points
                  const parts = numericText.split('.');
                  const validText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                  setFormData({ ...formData, height: validText });
                },
                "Nhập chiều cao từ 110-160cm",
                false,
                "numeric"
              )}
              {renderInput(
                "Cân nặng (kg)",
                formData.weight,
                (text) => {
                  // Only allow positive numbers and decimal point
                  const numericText = text.replace(/[^0-9.]/g, '');
                  // Prevent multiple decimal points
                  const parts = numericText.split('.');
                  const validText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                  setFormData({ ...formData, weight: validText });
                },
                "Nhập cân nặng từ 20-70kg",
                false,
                "numeric"
              )}
            </>
          )}

        {/* Medical History */}
        {selectedStudent &&
          renderFormSection(
            "Tiền sử bệnh lý",
            "heartbeat",
            <>
              {renderArrayInput(
                "Bệnh mãn tính",
                chronicDiseasesInput,
                setChronicDiseasesInput,
                "Ví dụ: Hen suyễn, Tiểu đường...",
                "Phân cách bằng dấu phẩy nếu có nhiều bệnh"
              )}
              {renderArrayInput(
                "Dị ứng",
                allergiesInput,
                setAllergiesInput,
                "Ví dụ: Phấn hoa, Hải sản, Thuốc...",
                "Phân cách bằng dấu phẩy nếu có nhiều loại dị ứng"
              )}
              {renderArrayInput(
                "Tiền sử điều trị",
                pastTreatmentsInput,
                setPastTreatmentsInput,
                "Ví dụ: Phẫu thuật amidan, Điều trị sốt xuất huyết...",
                "Phân cách bằng dấu phẩy nếu có nhiều lần điều trị"
              )}
            </>
          )}

        {/* Vaccination History */}
        {selectedStudent &&
          renderFormSection(
            "Lịch sử tiêm chủng",
            "syringe",
            renderArrayInput(
              "Các loại vaccine đã tiêm",
              vaccinationHistoryInput,
              setVaccinationHistoryInput,
              "Ví dụ: BCG, Sởi, Viêm gan B...",
              "Phân cách bằng dấu phẩy cho từng loại vaccine"
            )
          )}

        {/* Save Button */}
        {selectedStudent && (
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#d9d9d9", "#d9d9d9"] : ["#52c41a", "#73d13d"]}
              style={styles.saveButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome5 name="save" size={18} color="#fff" />
              )}
              <Text style={styles.saveButtonText}>
                {loading ? "Đang lưu..." : "Lưu hồ sơ"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Student Selection Modal */}
      <Modal
        visible={showStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn học sinh</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStudentModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#8c8c8c" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={students}
              renderItem={renderStudentItem}
              keyExtractor={(item) => item.id}
              style={styles.studentList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* School Year Selection Modal */}
      <Modal
        visible={showSchoolYearModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSchoolYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn năm học</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSchoolYearModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#8c8c8c" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={schoolYears}
              renderItem={renderSchoolYearItem}
              keyExtractor={(item) => item}
              style={styles.schoolYearList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e6f7ff",
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8c8c8c",
  },
  studentSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  studentSelectorContent: {
    flex: 1,
  },
  selectedStudentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 2,
  },
  selectedStudentCode: {
    fontSize: 14,
    color: "#1890ff",
    marginBottom: 2,
  },
  selectedStudentClass: {
    fontSize: 12,
    color: "#8c8c8c",
  },
  studentPlaceholder: {
    fontSize: 16,
    color: "#bfbfbf",
  },
  schoolYearSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  schoolYearSelectorContent: {
    flex: 1,
  },
  selectedSchoolYear: {
    fontSize: 16,
    fontWeight: "500",
    color: "#262626",
  },
  schoolYearList: {
    paddingHorizontal: 20,
  },
  schoolYearItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  selectedSchoolYearItem: {
    backgroundColor: "#e6f7ff",
    borderColor: "#91d5ff",
  },
  schoolYearText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#262626",
  },
  selectedSchoolYearText: {
    color: "#1890ff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
  },
  closeButton: {
    padding: 4,
  },
  studentList: {
    paddingHorizontal: 20,
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  selectedStudentItem: {
    backgroundColor: "#e6f7ff",
    borderColor: "#91d5ff",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 2,
  },
  studentCode: {
    fontSize: 14,
    color: "#1890ff",
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 12,
    color: "#8c8c8c",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#595959",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#262626",
    backgroundColor: "#fff",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    color: "#8c8c8c",
    marginTop: 4,
    fontStyle: "italic",
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});
