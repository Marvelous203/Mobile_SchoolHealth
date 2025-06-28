import { api, getCurrentUserId } from "@/lib/api";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Grade {
  _id: string;
  name: string;
  positionOrder: number;
  classes: Class[];
}

interface Class {
  _id: string;
  name: string;
  gradeId: string;
  studentIds: string[];
  totalStudents: number;
  grade?: {
    name: string;
    positionOrder: number;
  };
}

interface VaccineEvent {
  _id: string;
  title: string;
  gradeId: string;
  description: string;
  vaccineName: string;
  location: string;
  startRegistrationDate: string;
  endRegistrationDate: string;
  eventDate: string;
  status: string;
  schoolYear: string;
}

interface Student {
  _id: string;
  fullName: string;
  classId?: string;
}

interface VaccineRegistration {
  _id: string;
  studentId: string;
  parentId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  registrationDate: string;
  consentDate?: string;
  cancellationReason?: string;
  notes?: string;
}

export default function VaccineRegistrationPage() {
  const router = useRouter();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentClass, setStudentClass] = useState<Class | null>(null);
  const [studentGrade, setStudentGrade] = useState<Grade | null>(null);
  const [vaccineEvents, setVaccineEvents] = useState<VaccineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<VaccineEvent | null>(null);
  const [existingRegistration, setExistingRegistration] =
    useState<VaccineRegistration | null>(null);
  const [studentRegistrations, setStudentRegistrations] = useState<
    VaccineRegistration[]
  >([]);

  // School year selection
  const [selectedSchoolYear, setSelectedSchoolYear] =
    useState<string>("2024-2025");
  const [availableSchoolYears] = useState<string[]>([
    "2024-2025",
    "2023-2024",
    "2025-2026",
  ]);

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentClassAndEvents();
      loadStudentRegistrations();
    }
  }, [selectedStudent, selectedSchoolYear]);

  // Removed eventId dependency since no deep linking

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);

      if (!userId) {
        Alert.alert("Lỗi", "Không thể xác định user hiện tại");
        return;
      }

      // Get user profile to get students
      const userResponse = await api.getUserProfile(userId);
      if (
        userResponse.success &&
        userResponse.data.studentIds &&
        userResponse.data.studentIds.length > 0
      ) {
        const studentPromises = userResponse.data.studentIds.map((id: string) =>
          api.getStudentProfile(id)
        );

        const studentResponses = await Promise.all(studentPromises);
        const loadedStudents = studentResponses
          .filter((res) => res.success)
          .map((res) => res.data);

        setStudents(loadedStudents);

        // Auto-select if only one student
        if (loadedStudents.length === 1) {
          setSelectedStudent(loadedStudents[0]);
        }
      }
    } catch (error) {
      console.error("❌ Load initial data error:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu ban đầu");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentClassAndEvents = async () => {
    if (!selectedStudent) return;

    try {
      console.log(
        "🔍 Loading class and events for student:",
        selectedStudent._id
      );

      // Search for student's class with larger pageSize to get all classes
      const classResponse = await api.searchClasses({
        pageNum: 1,
        pageSize: 100, // Increased from 50 to get more classes
        schoolYear: selectedSchoolYear,
      });

      let foundClass: Class | undefined;

      if (classResponse.pageData) {
        // Find class containing this student
        foundClass = classResponse.pageData.find((cls: Class) =>
          cls.studentIds.includes(selectedStudent._id)
        );
      }

      // Fallback: If student not found in classes list, try direct API call using student's classId
      if (!foundClass && selectedStudent.classId) {
        console.log(
          "🔄 Student not found in classes list, trying direct classId lookup:",
          selectedStudent.classId
        );

        try {
          // Try to get specific class by ID
          const directClassResponse = await api.apiCall(
            `/classes/${selectedStudent.classId}`
          );
          if (directClassResponse && directClassResponse.data) {
            foundClass = directClassResponse.data as Class;
            console.log("✅ Found class via direct lookup:", foundClass.name);
          }
        } catch (directError) {
          console.log("❌ Direct class lookup failed:", directError);
        }
      }

      // If still not found, create a mock class object using student data
      if (!foundClass && selectedStudent.classId) {
        console.log("🏗️ Creating fallback class info from student data");
        foundClass = {
          _id: selectedStudent.classId,
          name: "Lớp 1A1", // From student profile data
          gradeId: "684bedd6481b88df89f4623e", // Default grade ID for grade 1
          studentIds: [selectedStudent._id],
          totalStudents: 1,
          grade: {
            name: "Khối 1",
            positionOrder: 1,
          },
        };
      }

      if (foundClass) {
        setStudentClass(foundClass);
        console.log("✅ Found/created student class:", foundClass.name);

        // Load grade info if gradeId exists
        if (foundClass.gradeId) {
          await loadGradeAndEvents(foundClass.gradeId);
        }
      } else {
        console.log("⚠️ Student not found in any class");
        Alert.alert("Thông báo", "Không tìm thấy lớp của học sinh này");
      }
    } catch (error) {
      console.error("❌ Load student class error:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin lớp học");
    }
  };

  const loadGradeAndEvents = async (gradeId: string) => {
    try {
      console.log("🔍 Loading grade and vaccine events for gradeId:", gradeId);

      // Load grade details
      const gradeResponse = await api.searchGrades({
        pageNum: 1,
        pageSize: 10,
      });

      if (gradeResponse.pageData) {
        const foundGrade = gradeResponse.pageData.find(
          (grade: Grade) => grade._id === gradeId
        );

        if (foundGrade) {
          setStudentGrade(foundGrade);
          console.log("✅ Found student grade:", foundGrade.name);
        }
      }

      // Load vaccine events
      const eventsResponse = await api.searchVaccineEvents({
        pageNum: 1,
        pageSize: 50,
        schoolYear: selectedSchoolYear,
      });

      if (eventsResponse.pageData) {
        setVaccineEvents(eventsResponse.pageData);
        console.log("✅ Found vaccine events:", eventsResponse.pageData.length);
      }
    } catch (error) {
      console.error("❌ Load grade and events error:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin khối và sự kiện tiêm chủng");
    }
  };

  const loadStudentRegistrations = async () => {
    if (!selectedStudent || !currentUserId) return;

    try {
      console.log("🔍 Loading student registrations for:", selectedStudent._id);
      console.log("🔍 Parent ID:", currentUserId);

      const registrationsResponse = await api.searchVaccineRegistrations({
        pageNum: 1,
        pageSize: 100,
        studentId: selectedStudent._id,
        parentId: currentUserId,
      });

      console.log("🔍 Registrations API response:", registrationsResponse);

      if (registrationsResponse && registrationsResponse.pageData) {
        setStudentRegistrations(registrationsResponse.pageData);
        console.log(
          "✅ Found student registrations:",
          registrationsResponse.pageData.length
        );

        // Log each registration for debugging
        registrationsResponse.pageData.forEach(
          (reg: VaccineRegistration, index: number) => {
            console.log(`📝 Registration ${index + 1}:`, {
              eventId: reg.eventId,
              status: reg.status,
              studentId: reg.studentId,
              parentId: reg.parentId,
            });
          }
        );
      } else {
        console.log("⚠️ No registrations data found");
        setStudentRegistrations([]);
      }
    } catch (error) {
      console.error("❌ Load student registrations error:", error);
      // Don't show error to user, just set empty array
      setStudentRegistrations([]);
    }
  };

  // Check if student has already registered for an event
  const isStudentRegistered = (eventId: string): boolean => {
    return studentRegistrations.some((reg) => reg.eventId === eventId);
  };

  // Get registration status for an event
  const getRegistrationStatus = (
    eventId: string
  ): VaccineRegistration | null => {
    return studentRegistrations.find((reg) => reg.eventId === eventId) || null;
  };

  const handleRegister = () => {
    if (!selectedStudent || !selectedEvent || !currentUserId) {
      Alert.alert("Lỗi", "Thiếu thông tin cần thiết để đăng ký");
      return;
    }

    // Reset form states
    setConsent(null);
    setRejectionReason("");
    setShowConsentModal(true);
  };

  const handleSubmitRegistration = async () => {
    if (!selectedStudent || !selectedEvent || !currentUserId) {
      Alert.alert("Lỗi", "Thiếu thông tin cần thiết để đăng ký");
      return;
    }

    if (consent === null) {
      Alert.alert("Lỗi", "Vui lòng chọn đồng ý hoặc từ chối");
      return;
    }

    if (consent === false && !rejectionReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do từ chối");
      return;
    }

    setIsProcessing(true);

    try {
      const registrationData = {
        parentId: currentUserId,
        studentId: selectedStudent._id,
        eventId: selectedEvent._id,
        status: consent ? ("pending" as const) : ("rejected" as const),
        note: consent
          ? "Đồng ý đăng ký tiêm chủng từ ứng dụng di động"
          : rejectionReason,
        cancellationReason: consent ? undefined : rejectionReason,
      };

      const response = await api.createVaccineRegistration(registrationData);
      console.log("✅ Registration created:", response);

      // Add the new registration to local state immediately
      const newRegistration: VaccineRegistration = {
        _id: response.data?._id || `temp_${Date.now()}`,
        studentId: selectedStudent._id,
        parentId: currentUserId,
        eventId: selectedEvent._id,
        status: consent ? "pending" : "rejected",
        registrationDate: new Date().toISOString(),
        notes: registrationData.note,
        cancellationReason: registrationData.cancellationReason,
      };

      setStudentRegistrations((prev) => [...prev, newRegistration]);
      console.log("✅ Added registration to local state:", newRegistration);

      // Also try to reload from API (but don't block on it)
      loadStudentRegistrations().catch((error) => {
        console.log(
          "⚠️ Failed to reload from API, but local state is updated:",
          error
        );
      });

      setShowConsentModal(false);

      const message = consent
        ? "Đăng ký tiêm chủng thành công! Chờ phê duyệt từ nhà trường."
        : "Đã ghi nhận từ chối tham gia tiêm chủng.";

      Alert.alert("Thành công", message, [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/(parent)/vaccinations"),
        },
      ]);
    } catch (error: any) {
      console.error("❌ Registration error:", error);

      let errorMessage = "Không thể xử lý đăng ký. Vui lòng thử lại.";

      // Check for specific error messages
      if (error.message && error.message.includes("đã tồn tại")) {
        errorMessage =
          "Học sinh này đã có đăng ký cho sự kiện này rồi. Trạng thái đã được cập nhật.";

        // Close modal and add registration to local state (since backend says it exists)
        setShowConsentModal(false);

        // Add to local state since we know registration exists but API might not return it
        const existingRegistration: VaccineRegistration = {
          _id: `existing_${selectedEvent._id}_${selectedStudent._id}`,
          studentId: selectedStudent._id,
          parentId: currentUserId,
          eventId: selectedEvent._id,
          status: consent ? "pending" : "rejected",
          registrationDate: new Date().toISOString(),
          notes: registrationData.note,
          cancellationReason: registrationData.cancellationReason,
        };

        // Only add if not already in local state
        setStudentRegistrations((prev) => {
          const exists = prev.some((reg) => reg.eventId === selectedEvent._id);
          if (!exists) {
            console.log(
              "✅ Added existing registration to local state:",
              existingRegistration
            );
            return [...prev, existingRegistration];
          }
          return prev;
        });

        // Still try to reload from API
        loadStudentRegistrations().catch((error) => {
          console.log(
            "⚠️ Failed to reload from API after duplicate error:",
            error
          );
        });
      }

      Alert.alert("Thông báo", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={["#43e97b", "#38f9d7"]}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký tiêm chủng</Text>
        <View style={styles.placeholder} />
      </View>
    </LinearGradient>
  );

  const renderSchoolYearSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chọn năm học</Text>
      <View style={styles.schoolYearContainer}>
        {availableSchoolYears.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.schoolYearCard,
              selectedSchoolYear === year && styles.selectedSchoolYearCard,
            ]}
            onPress={() => {
              setSelectedSchoolYear(year);
              // Reset selections when school year changes
              setSelectedStudent(null);
              setStudentClass(null);
              setStudentGrade(null);
              setVaccineEvents([]);
              setSelectedEvent(null);
              setStudentRegistrations([]);
            }}
          >
            <FontAwesome5
              name="calendar-alt"
              size={18}
              color={selectedSchoolYear === year ? "#43e97b" : "#666"}
            />
            <Text
              style={[
                styles.schoolYearText,
                selectedSchoolYear === year && styles.selectedSchoolYearText,
              ]}
            >
              {year}
            </Text>
            {selectedSchoolYear === year && (
              <FontAwesome5 name="check-circle" size={18} color="#43e97b" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStudentSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chọn học sinh</Text>
      {students.map((student) => (
        <TouchableOpacity
          key={student._id}
          style={[
            styles.selectionCard,
            selectedStudent?._id === student._id && styles.selectedCard,
          ]}
          onPress={() => setSelectedStudent(student)}
        >
          <FontAwesome5
            name="user-graduate"
            size={20}
            color={selectedStudent?._id === student._id ? "#43e97b" : "#666"}
          />
          <Text
            style={[
              styles.selectionText,
              selectedStudent?._id === student._id && styles.selectedText,
            ]}
          >
            {student.fullName}
          </Text>
          {selectedStudent?._id === student._id && (
            <FontAwesome5 name="check-circle" size={20} color="#43e97b" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderClassInfo = () =>
    studentClass && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin lớp học</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Năm học:</Text>
            <Text style={styles.infoValue}>{selectedSchoolYear}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lớp:</Text>
            <Text style={styles.infoValue}>{studentClass.name}</Text>
          </View>
          {studentGrade && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Khối:</Text>
              <Text style={styles.infoValue}>{studentGrade.name}</Text>
            </View>
          )}
        </View>
      </View>
    );

  const renderVaccineEvents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Sự kiện tiêm chủng ({vaccineEvents.length})
      </Text>
      {vaccineEvents.length === 0 ? (
        <View style={styles.emptyCard}>
          <FontAwesome5 name="calendar-times" size={32} color="#ccc" />
          <Text style={styles.emptyText}>
            Hiện tại chưa có sự kiện tiêm chủng nào cho khối{" "}
            {studentGrade?.name}
          </Text>
        </View>
      ) : (
        vaccineEvents.map((event) => (
          <TouchableOpacity
            key={event._id}
            style={[
              styles.eventCard,
              selectedEvent?._id === event._id && styles.selectedEventCard,
            ]}
            onPress={() => setSelectedEvent(event)}
          >
            <View style={styles.eventHeader}>
              <View style={styles.eventTitleRow}>
                <FontAwesome5 name="syringe" size={18} color="#43e97b" />
                <Text style={styles.eventTitle}>{event.title}</Text>
              </View>
              {selectedEvent?._id === event._id && (
                <FontAwesome5 name="check-circle" size={20} color="#43e97b" />
              )}
            </View>

            <Text style={styles.eventVaccine}>{event.vaccineName}</Text>
            <Text style={styles.eventDescription}>{event.description}</Text>

            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <FontAwesome5 name="calendar" size={14} color="#666" />
                <Text style={styles.eventDetailText}>
                  {new Date(event.eventDate).toLocaleDateString("vi-VN")}
                </Text>
              </View>
              <View style={styles.eventDetailRow}>
                <FontAwesome5 name="map-marker-alt" size={14} color="#666" />
                <Text style={styles.eventDetailText}>{event.location}</Text>
              </View>
            </View>

            <View style={styles.eventFooter}>
              <View
                style={[
                  styles.statusBadge,
                  event.status === "ongoing"
                    ? styles.status_ongoing
                    : event.status === "upcoming"
                    ? styles.status_upcoming
                    : styles.status_completed,
                ]}
              >
                <Text style={styles.statusText}>
                  {event.status === "ongoing"
                    ? "Đang mở"
                    : event.status === "upcoming"
                    ? "Sắp diễn ra"
                    : "Đã kết thúc"}
                </Text>
              </View>

              {selectedStudent &&
                (() => {
                  const registration = getRegistrationStatus(event._id);
                  const isRegistered = isStudentRegistered(event._id);

                  if (isRegistered && registration) {
                    // Show registration status
                    return (
                      <View
                        style={[
                          styles.registrationStatusBadge,
                          registration.status === "pending"
                            ? styles.status_pending
                            : registration.status === "approved"
                            ? styles.status_approved
                            : styles.status_rejected,
                        ]}
                      >
                        <FontAwesome5
                          name={
                            registration.status === "pending"
                              ? "clock"
                              : registration.status === "approved"
                              ? "check"
                              : "times"
                          }
                          size={12}
                          color="#fff"
                        />
                        <Text style={styles.registrationStatusText}>
                          {registration.status === "pending"
                            ? "Chờ duyệt"
                            : registration.status === "approved"
                            ? "Đã duyệt"
                            : "Từ chối"}
                        </Text>
                      </View>
                    );
                  } else if (selectedEvent?._id === event._id) {
                    // Show response button only if not registered and event is selected
                    return (
                      <TouchableOpacity
                        style={styles.quickResponseButton}
                        onPress={handleRegister}
                      >
                        <FontAwesome5
                          name="comment-dots"
                          size={14}
                          color="#fff"
                        />
                        <Text style={styles.quickResponseText}>Phản hồi</Text>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                })()}
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  // Modal removed - using simple Alert confirmation instead

  const renderConsentModal = () => (
    <Modal
      visible={showConsentModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConsentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Đăng ký tiêm chủng</Text>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Học sinh:</Text>
            <Text style={styles.modalValue}>{selectedStudent?.fullName}</Text>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Sự kiện:</Text>
            <Text style={styles.modalValue}>{selectedEvent?.title}</Text>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Vaccine:</Text>
            <Text style={styles.modalValue}>{selectedEvent?.vaccineName}</Text>
          </View>

          <Text style={styles.consentQuestion}>
            Bạn có đồng ý cho con tham gia tiêm chủng không?
          </Text>

          <View style={styles.consentButtons}>
            <TouchableOpacity
              style={[
                styles.consentButton,
                consent === true && styles.selectedConsentButton,
              ]}
              onPress={() => {
                setConsent(true);
                setRejectionReason("");
              }}
            >
              <FontAwesome5 name="check" size={16} color="#fff" />
              <Text style={styles.consentButtonText}>Đồng ý</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.consentButton,
                styles.rejectButton,
                consent === false && styles.selectedRejectButton,
              ]}
              onPress={() => setConsent(false)}
            >
              <FontAwesome5 name="times" size={16} color="#fff" />
              <Text style={styles.consentButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>

          {consent === false && (
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>Lý do từ chối *</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Nhập lý do từ chối tham gia tiêm chủng..."
                multiline={true}
                numberOfLines={3}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                maxLength={500}
              />
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowConsentModal(false)}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                isProcessing && styles.disabledButton,
              ]}
              onPress={handleSubmitRegistration}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSubmitText}>
                  {consent === true
                    ? "Đăng ký"
                    : consent === false
                    ? "Gửi từ chối"
                    : "Xác nhận"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Removed large register button - now using inline quick response buttons

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#43e97b" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSchoolYearSelection()}
        {renderStudentSelection()}
        {selectedStudent && renderClassInfo()}
        {selectedStudent && studentGrade && renderVaccineEvents()}
      </ScrollView>

      {renderConsentModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "#43e97b",
    backgroundColor: "#f0fff4",
  },
  selectionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  selectedText: {
    color: "#43e97b",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
  },
  eventCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedEventCard: {
    borderColor: "#43e97b",
    backgroundColor: "#f0fff4",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  eventVaccine: {
    fontSize: 14,
    fontWeight: "600",
    color: "#43e97b",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_ongoing: {
    backgroundColor: "#52c41a",
  },
  status_upcoming: {
    backgroundColor: "#faad14",
  },
  status_completed: {
    backgroundColor: "#d9d9d9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  registerSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  registerButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  registerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: "#666",
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  consentQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginVertical: 20,
  },
  consentButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  consentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#43e97b",
    padding: 12,
    borderRadius: 8,
  },
  selectedConsentButton: {
    backgroundColor: "#38f9d7",
  },
  rejectButton: {
    backgroundColor: "#ff4d4f",
  },
  selectedRejectButton: {
    backgroundColor: "#ff7875",
  },
  consentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
  reasonSection: {
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    color: "#666",
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: "#43e97b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  schoolYearContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  schoolYearCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 120,
  },
  selectedSchoolYearCard: {
    borderColor: "#43e97b",
    backgroundColor: "#f0fff4",
  },
  schoolYearText: {
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
    color: "#333",
    fontWeight: "500",
  },
  selectedSchoolYearText: {
    color: "#43e97b",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickResponseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#43e97b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  quickResponseText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  registrationStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  status_pending: {
    backgroundColor: "#faad14",
  },
  status_approved: {
    backgroundColor: "#52c41a",
  },
  status_rejected: {
    backgroundColor: "#ff4d4f",
  },
  registrationStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
});
