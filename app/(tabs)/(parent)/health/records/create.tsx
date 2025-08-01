import { api, getCurrentUserId, searchVaccineTypes } from "@/lib/api";

import {
  CreateHealthRecordRequest,
  VaccinationRecord,
  VaccineType,
  VaccineTypeSearchParams,
} from "@/lib/types";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  gender?: string;
  birthday?: string;
  status?: 'active' | 'graduated' | 'transferred' | 'reserved';
}

export default function CreateHealthRecordScreen() {
  const router = useRouter();
  const { cloneData, importData } = useLocalSearchParams<{
    cloneData?: string;
    importData?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null
  );
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSchoolYearModal, setShowSchoolYearModal] = useState(false);
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([]);
  const [selectedVaccineTypes, setSelectedVaccineTypes] = useState<VaccineType[]>([]);
  const [showVaccineTypeModal, setShowVaccineTypeModal] = useState(false);

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
    height: 0,
    weight: 0,
  });

  // Form state for input handling
  const [chronicDiseasesInput, setChronicDiseasesInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [pastTreatmentsInput, setPastTreatmentsInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");

  // Load students and vaccine types on component mount
  useEffect(() => {
    loadStudents();
    loadVaccineTypes();
  }, []);

  // Auto-set school year when student is selected
  useEffect(() => {
    if (selectedStudent) {
      determineNextSchoolYear(selectedStudent.id);
    }
  }, [selectedStudent]);

  // Handle clone and import data
  useEffect(() => {
    if (cloneData) {
      try {
        const parsedData = JSON.parse(cloneData);
        populateFormWithData(parsedData);
      } catch (error) {
        console.error('Error parsing clone data:', error);
        Alert.alert('Lỗi', 'Dữ liệu sao chép không hợp lệ');
      }
    } else if (importData) {
      try {
        const parsedData = JSON.parse(importData);
        populateFormWithData(parsedData);
      } catch (error) {
        console.error('Error parsing import data:', error);
        Alert.alert('Lỗi', 'Dữ liệu nhập không hợp lệ');
      }
    }
  }, [cloneData, importData, students, vaccineTypes]);

  const populateFormWithData = (data: any) => {
    try {
      // Set form data
      if (data.chronicDiseases) {
        setChronicDiseasesInput(data.chronicDiseases.join(', '));
      }
      if (data.allergies) {
        setAllergiesInput(data.allergies.join(', '));
      }
      if (data.pastTreatments) {
        setPastTreatmentsInput(data.pastTreatments.join(', '));
      }
      if (data.height) {
        setHeightInput(data.height.toString());
      }
      if (data.weight) {
        setWeightInput(data.weight.toString());
      }
      if (data.vision) {
        setFormData(prev => ({ ...prev, vision: data.vision }));
      }
      if (data.hearing) {
        setFormData(prev => ({ ...prev, hearing: data.hearing }));
      }
      if (data.schoolYear) {
        setFormData(prev => ({ ...prev, schoolYear: data.schoolYear }));
      }
      
      // Set vaccination history
      if (data.vaccinationHistory && vaccineTypes.length > 0) {
        const selectedVaccines = data.vaccinationHistory
          .map((vaccination: any) => {
            return vaccineTypes.find(vt => vt._id === vaccination.vaccineTypeId);
          })
          .filter(Boolean);
        setSelectedVaccineTypes(selectedVaccines);
      }
      
      console.log('✅ Form populated with data');
    } catch (error) {
      console.error('Error populating form:', error);
      Alert.alert('Lỗi', 'Không thể điền dữ liệu vào form');
    }
  };

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
                  gender: studentResponse.data.gender,
                  birthday: studentResponse.data.dob,
                  status: studentResponse.data.status,
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

  // Load vaccine types
  const loadVaccineTypes = async () => {
    try {
      console.log('🔍 Loading vaccine types...');
      const params: VaccineTypeSearchParams = {
        pageNum: 1,
        pageSize: 100,
      };
      const response = await searchVaccineTypes(params);
      console.log('✅ Vaccine types response:', response);
      
      if (response && response.pageData) {
        setVaccineTypes(response.pageData);
        console.log(`✅ Loaded ${response.pageData.length} vaccine types`);
      } else {
        console.warn('⚠️ No vaccine types data in response');
        setVaccineTypes([]);
      }
    } catch (error: any) {
      console.error("❌ Load vaccine types error:", error);
      setVaccineTypes([]);
      // Show more detailed error message
      const errorMessage = error?.message || error?.toString() || "Không thể tải danh sách loại vaccine";
      Alert.alert("Lỗi", `Load vaccine types error: ${errorMessage}`);
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

  const formatVision = (input: string): string => {
    // Remove spaces and convert to lowercase
    const cleanInput = input.trim();
    
    // If input is just a number (e.g., "8"), format as "8/10"
    if (/^\d+$/.test(cleanInput)) {
      const num = parseInt(cleanInput);
      if (num >= 1 && num <= 10) {
        return `${num}/10`;
      }
    }
    
    // If input is already in x/y format, validate it
    if (/^\d+\/\d+$/.test(cleanInput)) {
      const [numerator, denominator] = cleanInput.split('/').map(Number);
      if (numerator >= 1 && numerator <= 10 && denominator === 10) {
        return cleanInput;
      }
    }
    
    return input; // Return original if doesn't match expected patterns
  };

  const validateHealthData = (): string | null => {
    // Validate height for elementary students (6-11 years old)
    if (heightInput.trim()) {
      const height = parseFloat(heightInput);
      if (isNaN(height) || height <= 0) {
        return "Chiều cao phải là số dương hợp lệ";
      }
      if (height < 80) {
        return "Chiều cao quá thấp, vui lòng kiểm tra lại";
      }
      if (height > 180) {
        return "Chiều cao quá cao cho học sinh tiểu học, vui lòng kiểm tra lại";
      }
      if (height < 105 || height > 155) {
        return "Chiều cao của học sinh tiểu học thường từ 105-155cm";
      }
    }

    // Validate weight for elementary students (6-11 years old)
    if (weightInput.trim()) {
      const weight = parseFloat(weightInput);
      if (isNaN(weight) || weight <= 0) {
        return "Cân nặng phải là số dương hợp lệ";
      }
      if (weight < 12) {
        return "Cân nặng quá nhẹ, vui lòng kiểm tra lại";
      }
      if (weight > 80) {
        return "Cân nặng quá nặng cho học sinh tiểu học, vui lòng kiểm tra lại";
      }
      if (weight < 16 || weight > 50) {
        return "Cân nặng của học sinh tiểu học thường từ 16-50kg";
      }
    }

    // Validate vision format
    if (formData.vision.trim()) {
      const visionInput = formData.vision.trim();
      // Check if it's a valid number or x/10 format
      if (!/^\d+$/.test(visionInput) && !/^\d+\/10$/.test(visionInput)) {
        return "Thị lực phải là số từ 1-10 hoặc định dạng x/10";
      }
      
      if (/^\d+$/.test(visionInput)) {
        const num = parseInt(visionInput);
        if (num < 1 || num > 10) {
          return "Thị lực phải từ 1-10";
        }
      }
      
      if (/^\d+\/10$/.test(visionInput)) {
        const numerator = parseInt(visionInput.split('/')[0]);
        if (numerator < 1 || numerator > 10) {
          return "Thị lực phải từ 1/10 đến 10/10";
        }
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

      // Check student status
      if (selectedStudent.status && selectedStudent.status !== 'active') {
        let statusMessage = "Học sinh không còn hoạt động";
        switch (selectedStudent.status) {
          case 'graduated':
            statusMessage = "Học sinh đã tốt nghiệp";
            break;
          case 'transferred':
            statusMessage = "Học sinh đã chuyển trường";
            break;
          case 'reserved':
            statusMessage = "Học sinh đang bảo lưu";
            break;
        }
        Alert.alert("Không thể tạo hồ sơ", `${statusMessage}. Chỉ có thể tạo hồ sơ sức khỏe cho học sinh đang học.`);
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

      // Validate height and weight are provided
      if (!heightInput.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập chiều cao");
        return;
      }

      if (!weightInput.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập cân nặng");
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
        studentName: selectedStudent.name,
        studentCode: selectedStudent.studentCode,
        gender: selectedStudent.gender || '',
        birthday: selectedStudent.birthday || '',
        height: parseFloat(heightInput) || 0,
        weight: parseFloat(weightInput) || 0,
        vision: formatVision(formData.vision), // Ensure vision is properly formatted
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
        vaccinationHistory: selectedVaccineTypes.map((vaccineType): VaccinationRecord => ({
          vaccineTypeId: vaccineType._id,
          injectedAt: new Date().toISOString(),
          provider: undefined,
          note: undefined,
          // Keep deprecated fields for backward compatibility
          vaccineName: vaccineType.name,
          vaccineType: vaccineType,
          dateAdministered: undefined,
          batchNumber: undefined,
          notes: undefined,
        })),
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
                (text) => {
                  // Limit input length to prevent excessive characters
                  if (text.length > 10) {
                    return; // Don't update if too long
                  }
                  
                  // Only allow numbers, slash, and basic text
                  const validText = text.replace(/[^0-9\/a-zA-ZÀ-ỹ\s]/g, '');
                  
                  // Auto-format vision input when user finishes typing
                  const formattedText = formatVision(validText);
                  setFormData({ ...formData, vision: formattedText });
                },
                "Ví dụ: 8 (tự động thành 8/10), 10/10..."
              )}
              {renderInput(
                "Thính lực",
                formData.hearing,
                (text) => {
                  // Limit input length to prevent excessive characters
                  if (text.length > 100) {
                    return; // Don't update if too long
                  }
                  
                  // Only allow letters, numbers, spaces, and Vietnamese characters
                  const validText = text.replace(/[^a-zA-ZÀ-ỹ0-9\s,.-]/g, '');
                  setFormData({ ...formData, hearing: validText });
                },
                "Ví dụ: Bình thường, giảm nghe nhẹ..."
              )}
              {renderInput(
                "Chiều cao (cm)",
                heightInput,
                (text) => {
                  // Only allow positive numbers and decimal point
                  const numericText = text.replace(/[^0-9.]/g, '');
                  
                  // Limit input length to prevent excessive digits
                  if (numericText.length > 5) {
                    return; // Don't update if too long
                  }
                  
                  // Prevent multiple decimal points
                  const parts = numericText.split('.');
                  const validText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                  
                  // Real-time validation for elementary students
                  if (validText && !validText.endsWith('.')) {
                    const value = parseFloat(validText);
                    if (value > 180) {
                      return; // Don't allow unrealistic heights for elementary students
                    }
                  }
                  
                  setHeightInput(validText);
                },
                "Nhập chiều cao từ 105-155cm (học sinh tiểu học)",
                false,
                "numeric"
              )}
              {renderInput(
                "Cân nặng (kg)",
                weightInput,
                (text) => {
                  // Only allow positive numbers and decimal point
                  const numericText = text.replace(/[^0-9.]/g, '');
                  
                  // Limit input length to prevent excessive digits
                  if (numericText.length > 5) {
                    return; // Don't update if too long
                  }
                  
                  // Prevent multiple decimal points
                  const parts = numericText.split('.');
                  const validText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericText;
                  
                  // Real-time validation for elementary students
                  if (validText && !validText.endsWith('.')) {
                    const value = parseFloat(validText);
                    if (value > 80) {
                      return; // Don't allow unrealistic weights for elementary students
                    }
                  }
                  
                  setWeightInput(validText);
                },
                "Nhập cân nặng từ 16-50kg (học sinh tiểu học)",
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
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lịch sử tiêm chủng</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowVaccineTypeModal(true)}
              >
                <Text style={styles.selectorButtonText}>
                  {selectedVaccineTypes.length > 0
                    ? `Đã chọn ${selectedVaccineTypes.length} loại vaccine`
                    : "Chọn loại vaccine"}
                </Text>
                <FontAwesome5 name="chevron-down" size={16} color="#8c8c8c" />
              </TouchableOpacity>
              {selectedVaccineTypes.length > 0 && (
                <View style={styles.selectedVaccinesContainer}>
                  {selectedVaccineTypes.map((vaccine, index) => (
                    <View key={vaccine._id} style={styles.selectedVaccineItem}>
                      <Text style={styles.selectedVaccineText}>
                        {vaccine.code}: {vaccine.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedVaccineTypes(prev => 
                            prev.filter(v => v._id !== vaccine._id)
                          );
                        }}
                      >
                        <FontAwesome5 name="times" size={14} color="#ff4d4f" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.helperText}>
                Chọn các loại vaccine đã tiêm từ danh sách có sẵn
              </Text>
            </View>
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

      {/* Vaccine Type Selection Modal */}
      <Modal
        visible={showVaccineTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVaccineTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn loại vaccine</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVaccineTypeModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#8c8c8c" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={vaccineTypes}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.vaccineTypeItem,
                    selectedVaccineTypes.some(v => v._id === item._id) && styles.selectedVaccineTypeItem,
                  ]}
                  onPress={() => {
                    const isSelected = selectedVaccineTypes.some(v => v._id === item._id);
                    if (isSelected) {
                      setSelectedVaccineTypes(prev => prev.filter(v => v._id !== item._id));
                    } else {
                      setSelectedVaccineTypes(prev => [...prev, item]);
                    }
                  }}
                >
                  <View style={styles.vaccineTypeInfo}>
                    <Text style={styles.vaccineTypeName}>{item.name}</Text>
                    <Text style={styles.vaccineTypeCode}>Mã: {item.code}</Text>
                    {item.description && (
                      <Text style={styles.vaccineTypeDescription}>{item.description}</Text>
                    )}
                  </View>
                  {selectedVaccineTypes.some(v => v._id === item._id) && (
                    <FontAwesome5 name="check-circle" size={20} color="#52c41a" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
              style={styles.vaccineTypeList}
              showsVerticalScrollIndicator={false}
            />
            
            {/* Confirm Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowVaccineTypeModal(false)}
              >
                <LinearGradient
                  colors={["#1890ff", "#40a9ff"]}
                  style={styles.confirmButtonGradient}
                >
                  <FontAwesome5 name="check" size={16} color="#fff" />
                  <Text style={styles.confirmButtonText}>
                    Xác nhận ({selectedVaccineTypes.length} đã chọn)
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  selectorButtonText: {
    fontSize: 16,
    color: "#262626",
  },
  selectedVaccinesContainer: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedVaccineItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#91d5ff",
  },
  selectedVaccineText: {
    fontSize: 12,
    color: "#1890ff",
    marginRight: 8,
  },
  vaccineTypeList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    maxHeight: 400,
  },
  vaccineTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedVaccineTypeItem: {
    backgroundColor: "#e6f7ff",
    borderColor: "#40a9ff",
    borderWidth: 2,
    shadowColor: "#1890ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vaccineTypeInfo: {
    flex: 1,
  },
  vaccineTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 4,
    lineHeight: 22,
  },
  vaccineTypeCode: {
    fontSize: 13,
    color: "#1890ff",
    marginBottom: 4,
    fontWeight: "500",
  },
  vaccineTypeDescription: {
    fontSize: 12,
    color: "#8c8c8c",
    lineHeight: 16,
    marginTop: 2,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  confirmButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  confirmButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});
