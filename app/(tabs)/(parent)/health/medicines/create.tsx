import {
  api,
  CreateMedicineSubmissionRequest,
  MedicineItem,
  SchoolNurse,
} from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Import auth context
import { useAuth } from "@/lib/auth";

export default function CreateMedicineScreen() {
  const [loading, setLoading] = useState(false);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [schoolNurses, setSchoolNurses] = useState<SchoolNurse[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<SchoolNurse | null>(null);
  const [nurseSearchQuery, setNurseSearchQuery] = useState("");
  const { user } = useAuth();

  // User and student data
  const [userProfile, setUserProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Multiple medicines state
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      name: "",
      dosage: "",
      usageInstructions: "",
      quantity: 1,
      timesPerDay: 1,
      timeSlots: ["08:00"],
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      note: "",
      reason: "",
    },
  ]);

  const [currentMedicineIndex, setCurrentMedicineIndex] = useState(0);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadUserAndStudentData();
    loadSchoolNurses();
  }, []);

  const loadUserAndStudentData = async () => {
    try {
      setLoadingUserData(true);
      console.log("🔄 Loading user and student data...");

      // Load user profile
      const userProfileResponse = await api.getCurrentUser();
      const profile = (userProfileResponse as any).data || userProfileResponse;
      setUserProfile(profile);
      console.log("✅ User profile loaded:", profile);

      // Load all students data if available
      if (profile.studentIds && profile.studentIds.length > 0) {
        console.log("📚 Loading students data for IDs:", profile.studentIds);

        const studentPromises = profile.studentIds.map((studentId: string) =>
          api.getStudentById(studentId)
        );

        const studentResponses = await Promise.all(studentPromises);
        const loadedStudents = studentResponses.map(
          (response) => response.data || response
        );

        setStudents(loadedStudents);
        setSelectedStudent(loadedStudents[0]); // Auto-select first student
        console.log("✅ Students data loaded:", loadedStudents);
      } else {
        console.log("❌ No studentIds found in profile");
        Alert.alert(
          "Lỗi",
          "Không tìm thấy thông tin học sinh trong tài khoản của bạn."
        );
      }
    } catch (error) {
      console.error("❌ Failed to load user/student data:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải thông tin người dùng. Vui lòng thử lại."
      );
    } finally {
      setLoadingUserData(false);
    }
  };

  const loadSchoolNurses = async (query?: string) => {
    try {
      setLoadingNurses(true);
      const response = await api.searchSchoolNurses(1, 20, query);
      setSchoolNurses(response.pageData);

      if (!selectedNurse && response.pageData.length > 0) {
        setSelectedNurse(response.pageData[0]);
      }
    } catch (error) {
      console.error("Load school nurses error:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách y tá trường");
    } finally {
      setLoadingNurses(false);
    }
  };

  const handleNurseSearch = (query: string) => {
    setNurseSearchQuery(query);
    if (query.trim()) {
      loadSchoolNurses(query);
    } else {
      loadSchoolNurses();
    }
  };

  const selectNurse = (nurse: SchoolNurse) => {
    setSelectedNurse(nurse);
    setShowNurseModal(false);
  };

  // Helper functions for medicine management
  const getCurrentMedicine = () => medicines[currentMedicineIndex];

  const updateCurrentMedicine = (updates: Partial<MedicineItem>) => {
    const newMedicines = [...medicines];
    newMedicines[currentMedicineIndex] = {
      ...newMedicines[currentMedicineIndex],
      ...updates,
    };
    setMedicines(newMedicines);
  };

  const addNewMedicine = () => {
    const newMedicine: MedicineItem = {
      name: "",
      dosage: "",
      usageInstructions: "",
      quantity: 1,
      timesPerDay: 1,
      timeSlots: ["08:00"],
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      note: "",
      reason: "",
    };
    setMedicines([...medicines, newMedicine]);
    setCurrentMedicineIndex(medicines.length);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      const newMedicines = medicines.filter((_, i) => i !== index);
      setMedicines(newMedicines);
      if (currentMedicineIndex >= newMedicines.length) {
        setCurrentMedicineIndex(newMedicines.length - 1);
      } else if (currentMedicineIndex > index) {
        setCurrentMedicineIndex(currentMedicineIndex - 1);
      }
    }
  };

  const handleTimeSlotChange = (index: number, value: string) => {
    const currentMedicine = getCurrentMedicine();
    const newTimeSlots = [...currentMedicine.timeSlots];
    newTimeSlots[index] = value;
    updateCurrentMedicine({ timeSlots: newTimeSlots });
  };

  const addTimeSlot = () => {
    const currentMedicine = getCurrentMedicine();
    if (currentMedicine.timeSlots.length < 6) {
      updateCurrentMedicine({
        timeSlots: [...currentMedicine.timeSlots, "12:00"],
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    const currentMedicine = getCurrentMedicine();
    if (currentMedicine.timeSlots.length > 1) {
      const newTimeSlots = currentMedicine.timeSlots.filter(
        (_, i) => i !== index
      );
      updateCurrentMedicine({ timeSlots: newTimeSlots });
    }
  };

  const handleSubmit = async () => {
    console.log("🚀 Submit button pressed!");

    // Validation for all medicines
    for (let i = 0; i < medicines.length; i++) {
      const medicine = medicines[i];
      if (!medicine.name.trim()) {
        Alert.alert("Lỗi", `Vui lòng nhập tên thuốc cho thuốc thứ ${i + 1}`);
        setCurrentMedicineIndex(i);
        return;
      }

      if (!medicine.endDate) {
        Alert.alert(
          "Lỗi",
          `Vui lòng chọn ngày kết thúc cho thuốc thứ ${i + 1}`
        );
        setCurrentMedicineIndex(i);
        return;
      }

      if (new Date(medicine.endDate) <= new Date(medicine.startDate)) {
        Alert.alert(
          "Lỗi",
          `Ngày kết thúc phải sau ngày bắt đầu cho thuốc thứ ${i + 1}`
        );
        setCurrentMedicineIndex(i);
        return;
      }
    }

    if (!selectedNurse) {
      Alert.alert("Lỗi", "Vui lòng chọn y tá trường");
      return;
    }

    if (!userProfile?._id || !selectedStudent?._id) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin học sinh. Vui lòng thử tải lại trang."
      );
      return;
    }

    setLoading(true);

    try {
      const request: CreateMedicineSubmissionRequest = {
        parentId: userProfile._id,
        studentId: selectedStudent._id,
        schoolNurseId: selectedNurse._id,
        medicines: medicines,
      };

      console.log("💊 Creating medicine submission:", request);

      const response = await api.createMedicineSubmission(request);
      console.log("📋 API Response:", response);

      if (response.success) {
        Alert.alert(
          "Thành công",
          `Đơn thuốc với ${medicines.length} loại thuốc cho ${selectedStudent.fullName} đã được tạo thành công. Y tá trường sẽ xem xét và phê duyệt.`,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Lỗi",
          response.message || "Có lỗi xảy ra khi tạo đơn thuốc"
        );
      }
    } catch (error: any) {
      console.error("❌ Create medicine submission error:", error);
      Alert.alert("Lỗi", error.message || "Có lỗi xảy ra khi tạo đơn thuốc");
    } finally {
      setLoading(false);
    }
  };

  const renderNurseItem = ({ item }: { item: SchoolNurse }) => (
    <TouchableOpacity
      style={[
        styles.nurseItem,
        selectedNurse?._id === item._id && styles.selectedNurseItem,
      ]}
      onPress={() => selectNurse(item)}
    >
      <View style={styles.nurseInfo}>
        <Text style={styles.nurseName}>{item.fullName}</Text>
        <Text style={styles.nurseEmail}>{item.email}</Text>
        <Text style={styles.nursePhone}>{item.phone}</Text>
      </View>
      {selectedNurse?._id === item._id && (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  const renderMedicineTabs = () => (
    <View style={styles.medicineTabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {medicines.map((medicine, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.medicineTab,
              currentMedicineIndex === index && styles.activeMedicineTab,
            ]}
            onPress={() => setCurrentMedicineIndex(index)}
          >
            <Text
              style={[
                styles.medicineTabText,
                currentMedicineIndex === index && styles.activeMedicineTabText,
              ]}
            >
              Thuốc {index + 1}
            </Text>
            {medicine.name && (
              <Text
                style={[
                  styles.medicineTabName,
                  currentMedicineIndex === index &&
                    styles.activeMedicineTabName,
                ]}
                numberOfLines={1}
              >
                {medicine.name}
              </Text>
            )}
            {medicines.length > 1 && (
              <TouchableOpacity
                style={styles.removeMedicineButton}
                onPress={() => removeMedicine(index)}
              >
                <Ionicons name="close" size={16} color="#ff4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addMedicineTab}
          onPress={addNewMedicine}
        >
          <Ionicons name="add" size={20} color="#4CAF50" />
          <Text style={styles.addMedicineTabText}>Thêm thuốc</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const currentMedicine = getCurrentMedicine();

  if (loadingUserData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.content}>
          {/* Student Selection */}
          {students.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn học sinh</Text>
              {students.length > 1 ? (
                <View>
                  {students.map((student, index) => (
                    <TouchableOpacity
                      key={student._id}
                      style={[
                        styles.studentCard,
                        selectedStudent?._id === student._id &&
                          styles.selectedStudentCard,
                      ]}
                      onPress={() => setSelectedStudent(student)}
                    >
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {student.fullName}
                        </Text>
                        <Text style={styles.studentDetails}>
                          Lớp: {student.classInfo?.name || "N/A"} • Mã HS:{" "}
                          {student.studentCode}
                        </Text>
                      </View>
                      {selectedStudent?._id === student._id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#4CAF50"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{students[0].fullName}</Text>
                  <Text style={styles.studentDetails}>
                    Lớp: {students[0].classInfo?.name || "N/A"} • Mã HS:{" "}
                    {students[0].studentCode}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* School Nurse Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Y tá trường phụ trách</Text>
            <TouchableOpacity
              style={styles.nurseSelector}
              onPress={() => setShowNurseModal(true)}
            >
              <View style={styles.nurseSelectorContent}>
                {selectedNurse ? (
                  <View>
                    <Text style={styles.selectedNurseName}>
                      {selectedNurse.fullName}
                    </Text>
                    <Text style={styles.selectedNurseEmail}>
                      {selectedNurse.email}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.nursePlaceholder}>Chọn y tá trường</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Medicine Tabs */}
          {renderMedicineTabs()}

          {/* Current Medicine Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Thông tin thuốc {currentMedicineIndex + 1}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên thuốc *</Text>
              <TextInput
                style={styles.input}
                value={currentMedicine.name}
                onChangeText={(text) => updateCurrentMedicine({ name: text })}
                placeholder="Nhập tên thuốc"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Liều lượng</Text>
              <TextInput
                style={styles.input}
                value={currentMedicine.dosage}
                onChangeText={(text) => updateCurrentMedicine({ dosage: text })}
                placeholder="Ví dụ: 1 viên, 5ml"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hướng dẫn sử dụng</Text>
              <TextInput
                style={styles.input}
                value={currentMedicine.usageInstructions}
                onChangeText={(text) =>
                  updateCurrentMedicine({ usageInstructions: text })
                }
                placeholder="Ví dụ: Uống sau ăn"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Số lượng</Text>
                <TextInput
                  style={styles.input}
                  value={currentMedicine.quantity.toString()}
                  onChangeText={(text) =>
                    updateCurrentMedicine({ quantity: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Số lần/ngày</Text>
                <TextInput
                  style={styles.input}
                  value={currentMedicine.timesPerDay.toString()}
                  onChangeText={(text) => {
                    const times = parseInt(text) || 1;
                    const defaultTimes = {
                      1: ["08:00"],
                      2: ["08:00", "20:00"],
                      3: ["08:00", "12:00", "20:00"],
                      4: ["08:00", "12:00", "16:00", "20:00"],
                      5: ["08:00", "11:00", "14:00", "17:00", "20:00"],
                      6: ["08:00", "10:00", "12:00", "14:00", "16:00", "20:00"],
                    };

                    updateCurrentMedicine({
                      timesPerDay: times,
                      timeSlots: defaultTimes[
                        times as keyof typeof defaultTimes
                      ] || ["08:00"],
                    });
                  }}
                  keyboardType="numeric"
                  placeholder="3"
                />
              </View>
            </View>
          </View>

          {/* Time Slots */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thời gian uống thuốc</Text>
              {currentMedicine.timeSlots.length < 6 && (
                <TouchableOpacity
                  onPress={addTimeSlot}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={20} color="#4CAF50" />
                </TouchableOpacity>
              )}
            </View>

            {currentMedicine.timeSlots.map((time, index) => (
              <View key={index} style={styles.timeSlotRow}>
                <Text style={styles.timeLabel}>Lần {index + 1}:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={(text) => handleTimeSlotChange(index, text)}
                  placeholder="HH:MM"
                />
                {currentMedicine.timeSlots.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeTimeSlot(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="remove" size={20} color="#ff4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian sử dụng</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày bắt đầu</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>{currentMedicine.startDate}</Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày kết thúc *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text
                  style={[
                    styles.dateText,
                    !currentMedicine.endDate && styles.placeholder,
                  ]}
                >
                  {currentMedicine.endDate || "Chọn ngày"}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú và lý do</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={currentMedicine.note}
                onChangeText={(text) => updateCurrentMedicine({ note: text })}
                placeholder="Ghi chú thêm về cách sử dụng thuốc"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lý do sử dụng</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={currentMedicine.reason}
                onChangeText={(text) => updateCurrentMedicine({ reason: text })}
                placeholder="Lý do cần sử dụng thuốc này"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading
                ? "Đang tạo..."
                : `Tạo đơn thuốc (${medicines.length} loại)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nurse Selection Modal */}
        <Modal
          visible={showNurseModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn y tá trường</Text>
              <TouchableOpacity
                onPress={() => setShowNurseModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={nurseSearchQuery}
                onChangeText={handleNurseSearch}
                placeholder="Tìm kiếm y tá theo tên, email..."
              />
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
            </View>

            {loadingNurses ? (
              <View style={styles.loadingContainer}>
                <Text>Đang tải...</Text>
              </View>
            ) : (
              <FlatList
                data={schoolNurses}
                renderItem={renderNurseItem}
                keyExtractor={(item) => item._id}
                style={styles.nurseList}
              />
            )}
          </SafeAreaView>
        </Modal>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={new Date(currentMedicine.startDate)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                updateCurrentMedicine({
                  startDate: selectedDate.toISOString().split("T")[0],
                });
              }
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={
              currentMedicine.endDate
                ? new Date(currentMedicine.endDate)
                : new Date()
            }
            mode="date"
            display="default"
            minimumDate={new Date(currentMedicine.startDate)}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                updateCurrentMedicine({
                  endDate: selectedDate.toISOString().split("T")[0],
                });
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  studentInfo: {
    alignItems: "center",
  },
  studentName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: "#666",
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedStudentCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0fff4",
  },
  // Medicine tabs styles
  medicineTabsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineTab: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    position: "relative",
  },
  activeMedicineTab: {
    backgroundColor: "#4CAF50",
  },
  medicineTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  activeMedicineTabText: {
    color: "#fff",
  },
  medicineTabName: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  activeMedicineTabName: {
    color: "#fff",
  },
  removeMedicineButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addMedicineTab: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
  },
  addMedicineTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 4,
  },
  // Nurse selector styles
  nurseSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  nurseSelectorContent: {
    flex: 1,
  },
  selectedNurseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedNurseEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  nursePlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  nurseList: {
    flex: 1,
  },
  nurseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedNurseItem: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  nurseInfo: {
    flex: 1,
  },
  nurseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  nurseEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  nursePhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  // Form styles
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  timeSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: "#666",
    width: 60,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  placeholder: {
    color: "#999",
  },
  buttonContainer: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
