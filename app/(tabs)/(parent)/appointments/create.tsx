import { api, CreateAppointmentRequest } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/lib/auth";

export default function CreateAppointmentScreen() {
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const { user } = useAuth();

  // User and student data
  const [userProfile, setUserProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Appointment form data
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [reason, setReason] = useState("");
  const [type, setType] = useState("other");
  const [note, setNote] = useState("");

  // UI states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Appointment types
  const appointmentTypes = [
    { value: "checkup", label: "Khám sức khỏe", icon: "medical" },
    { value: "vaccination", label: "Tiêm chủng", icon: "medical-outline" },
    {
      value: "consultation",
      label: "Tư vấn sức khỏe",
      icon: "chatbubble-ellipses",
    },
    { value: "medicine", label: "Uống thuốc", icon: "medical" },
    { value: "injury", label: "Chấn thương", icon: "bandage" },
    { value: "other", label: "Khác", icon: "ellipsis-horizontal" },
  ];

  // Common reasons
  const commonReasons = [
    "Cần tư vấn về sức khỏe của con",
    "Cần hướng dẫn về thuốc",
    "Kiểm tra tình trạng sức khỏe",
    "Tư vấn về dinh dưỡng",
    "Theo dõi sau bệnh",
    "Khác",
  ];

  useEffect(() => {
    loadUserAndStudentData();
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

  const handleSubmit = async () => {
    console.log("🚀 Submit appointment button pressed!");

    // Validation
    if (!selectedStudent) {
      Alert.alert("Lỗi", "Vui lòng chọn học sinh");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do đặt lịch");
      return;
    }

    // Check if appointment time is in the future
    if (appointmentTime <= new Date()) {
      Alert.alert("Lỗi", "Thời gian hẹn phải trong tương lai");
      return;
    }

    setLoading(true);

    try {
      const request: CreateAppointmentRequest = {
        studentId: selectedStudent._id,
        appointmentTime: appointmentTime.toISOString(),
        reason: reason.trim(),
        type: type,
        note: note.trim(),
      };

      console.log("📅 Creating appointment:", request);

      const response = await api.createAppointment(request);
      console.log("📋 API Response:", response);

      if (response.success) {
        Alert.alert(
          "Thành công",
          `Lịch hẹn cho ${selectedStudent.fullName} đã được đặt thành công. Y tá trường sẽ xem xét và phê duyệt.`,
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
          response.message || "Có lỗi xảy ra khi đặt lịch hẹn"
        );
      }
    } catch (error: any) {
      console.error("❌ Create appointment error:", error);
      Alert.alert("Lỗi", error.message || "Có lỗi xảy ra khi đặt lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt lịch hẹn</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Student Selection */}
          {students.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn học sinh</Text>
              {students.length > 1 ? (
                <View>
                  {students.map((student) => (
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

          {/* Appointment Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loại lịch hẹn</Text>
            <View style={styles.typeGrid}>
              {appointmentTypes.map((appointmentType) => (
                <TouchableOpacity
                  key={appointmentType.value}
                  style={[
                    styles.typeCard,
                    type === appointmentType.value && styles.selectedTypeCard,
                  ]}
                  onPress={() => setType(appointmentType.value)}
                >
                  <Ionicons
                    name={appointmentType.icon as any}
                    size={24}
                    color={type === appointmentType.value ? "#4CAF50" : "#666"}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      type === appointmentType.value && styles.selectedTypeText,
                    ]}
                  >
                    {appointmentType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian hẹn</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày và giờ *</Text>
              <TouchableOpacity
                style={styles.dateTimeInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {formatDateTime(appointmentTime)}
                </Text>
                <Ionicons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lý do đặt lịch</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chọn lý do có sẵn (tùy chọn)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.reasonChips}>
                  {commonReasons.map((commonReason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.reasonChip}
                      onPress={() => setReason(commonReason)}
                    >
                      <Text style={styles.reasonChipText}>{commonReason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lý do chi tiết *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Nhập lý do cần đặt lịch hẹn với y tá trường..."
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{reason.length}/500</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú thêm</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={note}
                onChangeText={setNote}
                placeholder="Thêm ghi chú nếu cần..."
                multiline
                numberOfLines={3}
                maxLength={300}
              />
              <Text style={styles.charCount}>{note.length}/300</Text>
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
              {loading ? "Đang đặt lịch..." : "Đặt lịch hẹn"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={appointmentTime}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setAppointmentTime(selectedDate);
                // Auto show time picker after date selection
                setTimeout(() => setShowTimePicker(true), 500);
              }
            }}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={appointmentTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const newDateTime = new Date(appointmentTime);
                newDateTime.setHours(selectedTime.getHours());
                newDateTime.setMinutes(selectedTime.getMinutes());
                setAppointmentTime(newDateTime);
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: "#666",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedTypeCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0fff4",
  },
  typeText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  selectedTypeText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
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
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  dateTimeInput: {
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
  dateTimeText: {
    fontSize: 16,
    color: "#333",
  },
  reasonChips: {
    flexDirection: "row",
    gap: 8,
  },
  reasonChip: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  reasonChipText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "#fff",
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
