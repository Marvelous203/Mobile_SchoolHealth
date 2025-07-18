import { api, getCurrentUserId } from "@/lib/api";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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

interface HealthCheckEvent {
  _id: string;
  eventName: string;
  gradeId: string;
  description: string;
  location: string;
  startRegistrationDate: string;
  endRegistrationDate: string;
  eventDate: string;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Student {
  _id: string;
  fullName: string;
  classId?: string;
}

interface HealthCheckRegistration {
  _id: string;
  studentId: string;
  parentId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  registrationDate: string;
  schoolYear: string;
  consentDate?: string;
  cancellationReason?: string;
  notes?: string;
}

export default function HealthCheckRegistrationPage() {
  const router = useRouter();
  const { 
    eventId, 
    studentId, 
    studentName, 
    eventName, 
    eventDate, 
    location 
  } = useLocalSearchParams<{ 
    eventId?: string;
    studentId?: string;
    studentName?: string;
    eventName?: string;
    eventDate?: string;
    location?: string;
  }>();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentClass, setStudentClass] = useState<Class | null>(null);
  const [studentGrade, setStudentGrade] = useState<Grade | null>(null);
  const [healthCheckEvents, setHealthCheckEvents] = useState<
    HealthCheckEvent[]
  >([]);
  const [selectedEvent, setSelectedEvent] = useState<HealthCheckEvent | null>(
    null
  );
  const [existingRegistration, setExistingRegistration] =
    useState<HealthCheckRegistration | null>(null);
  const [studentRegistrations, setStudentRegistrations] = useState<
    HealthCheckRegistration[]
  >([]);

  // School year selection
  const [selectedSchoolYear, setSelectedSchoolYear] =
    useState<string>("2025-2026");
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

  // Cập nhật useEffect để xử lý thông tin từ detail.tsx
  useEffect(() => {
    if (eventId && studentId && studentName) {
      // Tự động chọn học sinh nếu có thông tin từ detail
      const student: Student = {
        _id: studentId,
        fullName: studentName
      };
      setSelectedStudent(student);
      
      // Load chi tiết sự kiện từ API
      loadEventDetail();
    }
  }, [eventId, studentId, studentName]);

  // Cập nhật hàm load chi tiết sự kiện
  const loadEventDetail = async () => {
    if (!eventId) return;
    
    try {
      const eventResponse = await api.getHealthCheckEventDetail(eventId);
      if (eventResponse.success) {
        setSelectedEvent(eventResponse.data);
        
        // Kiểm tra đăng ký hiện có
        if (selectedStudent) {
          await loadStudentRegistrations();
          
          // Tự động hiển thị modal đăng ký nếu chưa đăng ký
          const existingReg = getRegistrationStatus(eventId);
          if (!existingReg) {
            setTimeout(() => {
              setShowConsentModal(true);
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error("❌ Load event detail error:", error);
    }
  };

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

      // Search for student's class
      const classResponse = await api.searchClasses({
        pageNum: 1,
        pageSize: 100,
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

          if (directClassResponse.success) {
            foundClass = directClassResponse.data;
            console.log("✅ Found class via direct lookup:", foundClass);
          }
        } catch (directError) {
          console.log("❌ Direct class lookup failed:", directError);
        }
      }

      if (foundClass) {
        setStudentClass(foundClass);
        console.log("✅ Found student class:", foundClass);

        // Load grade and events for this class
        await loadGradeAndEvents(foundClass.gradeId);
      } else {
        console.log("⚠️ Class not found for student");
        setStudentClass(null);
        setStudentGrade(null);
        setHealthCheckEvents([]);
      }
    } catch (error) {
      console.error("❌ Load student class and events error:", error);
      setStudentClass(null);
      setStudentGrade(null);
      setHealthCheckEvents([]);
    }
  };

  const loadGradeAndEvents = async (gradeId: string) => {
    try {
      console.log("🔍 Loading grade and events for gradeId:", gradeId);

      // Load grade information
      const gradeResponse = await api.searchGrades({
        pageNum: 1,
        pageSize: 50,
      });

      if (gradeResponse.pageData) {
        const foundGrade = gradeResponse.pageData.find(
          (g: Grade) => g._id === gradeId
        );
        if (foundGrade) {
          setStudentGrade(foundGrade);
          console.log("✅ Found grade:", foundGrade);
        }
      }

      // Load health check events for this grade
      const eventsResponse = await api.searchHealthCheckEvents({
        pageNum: 1,
        pageSize: 20,
        gradeId: gradeId,
        schoolYear: selectedSchoolYear,
      });

      if (eventsResponse.pageData) {
        setHealthCheckEvents(eventsResponse.pageData);
        console.log("✅ Found health check events:", eventsResponse.pageData);
      } else {
        setHealthCheckEvents([]);
      }
    } catch (error) {
      console.error("❌ Load grade and events error:", error);
      setStudentGrade(null);
      setHealthCheckEvents([]);
    }
  };

  const loadStudentRegistrations = async () => {
    if (!selectedStudent || !currentUserId) return;

    try {
      console.log("🔍 Loading registrations for student:", selectedStudent._id);

      const registrationsResponse = await api.searchHealthCheckRegistrations({
        pageNum: 1,
        pageSize: 50,
        studentId: selectedStudent._id,
        parentId: currentUserId,
      });

      if (registrationsResponse.pageData) {
        setStudentRegistrations(registrationsResponse.pageData);
        console.log("✅ Found registrations:", registrationsResponse.pageData);
      } else {
        setStudentRegistrations([]);
      }
    } catch (error) {
      console.error("❌ Load student registrations error:", error);
      setStudentRegistrations([]);
    }
  };

  const isStudentRegistered = (eventId: string): boolean => {
    return studentRegistrations.some((reg) => reg.eventId === eventId);
  };

  const getRegistrationStatus = (
    eventId: string
  ): HealthCheckRegistration | null => {
    return studentRegistrations.find((reg) => reg.eventId === eventId) || null;
  };

  const handleRegister = () => {
    if (!selectedEvent) return;

    const existingReg = getRegistrationStatus(selectedEvent._id);
    if (existingReg) {
      Alert.alert(
        "Thông báo",
        `Học sinh đã đăng ký sự kiện này với trạng thái: ${getStatusText(
          existingReg.status
        )}`
      );
      return;
    }

    setExistingRegistration(null);
    setConsent(null);
    setRejectionReason("");
    setShowConsentModal(true);
  };

  const handleSubmitRegistration = async () => {
    if (
      !selectedStudent ||
      !selectedEvent ||
      !currentUserId ||
      consent === null
    ) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!consent && !rejectionReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsProcessing(true);

      const registrationData = {
        parentId: currentUserId,
        studentId: selectedStudent._id,
        eventId: selectedEvent._id,
        status: consent ? ("pending" as const) : ("rejected" as const),
        schoolYear: selectedSchoolYear,
        ...(consent ? {} : { cancellationReason: rejectionReason }),
        notes: consent ? "Đồng ý tham gia" : "Không đồng ý tham gia",
      };

      console.log("📝 Submitting registration:", registrationData);

      const response = await api.createHealthCheckRegistration(
        registrationData
      );

      if (response.success) {
        Alert.alert(
          "Thành công",
          consent
            ? "Đã đăng ký thành công! Chờ xác nhận từ nhà trường."
            : "Đã từ chối tham gia sự kiện.",
          [
            {
              text: "OK",
              onPress: () => {
                setShowConsentModal(false);
                loadStudentRegistrations(); // Reload registrations
              },
            },
          ]
        );
      } else {
        Alert.alert("Lỗi", response.message || "Không thể đăng ký");
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      Alert.alert("Lỗi", error.message || "Đã có lỗi xảy ra khi đăng ký");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Đã từ chối";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "#F5A623";
      case "approved":
        return "#7ED321";
      case "rejected":
        return "#D0021B";
      default:
        return "#9B9B9B";
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderHeader = () => (
    <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Đăng ký khám sức khỏe</Text>
    </LinearGradient>
  );

  const renderSchoolYearSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Năm học</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.schoolYearScrollView}
      >
        {availableSchoolYears.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.schoolYearChip,
              selectedSchoolYear === year && styles.schoolYearChipActive,
            ]}
            onPress={() => setSelectedSchoolYear(year)}
          >
            <Text
              style={[
                styles.schoolYearChipText,
                selectedSchoolYear === year && styles.schoolYearChipTextActive,
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStudentSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chọn học sinh</Text>
      {students.map((student) => (
        <TouchableOpacity
          key={student._id}
          style={[
            styles.studentCard,
            selectedStudent?._id === student._id && styles.studentCardActive,
          ]}
          onPress={() => setSelectedStudent(student)}
        >
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.fullName}</Text>
            {selectedStudent?._id === student._id && (
              <MaterialIcons name="check-circle" size={24} color="#4A90E2" />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderClassInfo = () =>
    studentClass && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin lớp học</Text>
        <View style={styles.classCard}>
          <Text style={styles.classInfo}>Lớp: {studentClass.name}</Text>
          {studentGrade && (
            <Text style={styles.classInfo}>Khối: {studentGrade.name}</Text>
          )}
        </View>
      </View>
    );

  const renderHealthCheckEvents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Sự kiện khám sức khỏe {selectedSchoolYear}
      </Text>
      {healthCheckEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="calendar-times" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>
            Không có sự kiện khám sức khỏe nào cho khối này
          </Text>
        </View>
      ) : (
        healthCheckEvents.map((event) => {
          const registration = getRegistrationStatus(event._id);
          const isRegistrationOpen =
            new Date() >= new Date(event.startRegistrationDate) &&
            new Date() <= new Date(event.endRegistrationDate);

          return (
            <View key={event._id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.eventName}</Text>
                {registration && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(registration.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(registration.status) },
                      ]}
                    >
                      {getStatusText(registration.status)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.eventDescription}>{event.description}</Text>

              <View style={styles.eventDetails}>
                <View style={styles.eventDetail}>
                  <MaterialIcons name="location-on" size={16} color="#666" />
                  <Text style={styles.eventDetailText}>{event.location}</Text>
                </View>

                <View style={styles.eventDetail}>
                  <MaterialIcons name="event" size={16} color="#666" />
                  <Text style={styles.eventDetailText}>
                    Ngày khám: {formatDateTime(event.eventDate)}
                  </Text>
                </View>

                <View style={styles.eventDetail}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <Text style={styles.eventDetailText}>
                    Đăng ký: {formatDate(event.startRegistrationDate)} -{" "}
                    {formatDate(event.endRegistrationDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.eventActions}>
                {!registration && isRegistrationOpen && (
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => {
                      setSelectedEvent(event);
                      handleRegister();
                    }}
                  >
                    <Text style={styles.registerButtonText}>Đăng ký</Text>
                  </TouchableOpacity>
                )}

                {!isRegistrationOpen && !registration && (
                  <View style={styles.disabledButton}>
                    <Text style={styles.disabledButtonText}>
                      Hết hạn đăng ký
                    </Text>
                  </View>
                )}

                {registration && (
                  <View style={styles.registeredInfo}>
                    <Text style={styles.registeredText}>
                      Đăng ký:{" "}
                      {formatDate(
                        registration.registrationDate || registration.createdAt
                      )}
                    </Text>
                    {registration.notes && (
                      <Text style={styles.registeredNotes}>
                        {registration.notes}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderConsentModal = () => (
    <Modal
      visible={showConsentModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowConsentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Xác nhận đăng ký</Text>

          {selectedEvent && (
            <View style={styles.modalEventInfo}>
              <Text style={styles.modalEventName}>
                {selectedEvent.eventName}
              </Text>
              <Text style={styles.modalEventDate}>
                Ngày khám: {formatDateTime(selectedEvent.eventDate)}
              </Text>
              <Text style={styles.modalEventLocation}>
                Địa điểm: {selectedEvent.location}
              </Text>
            </View>
          )}

          <Text style={styles.modalQuestion}>
            Bạn có đồng ý cho con tham gia khám sức khỏe không?
          </Text>

          <View style={styles.consentOptions}>
            <TouchableOpacity
              style={[
                styles.consentOption,
                consent === true && styles.consentOptionActive,
              ]}
              onPress={() => setConsent(true)}
            >
              <MaterialIcons
                name={
                  consent === true
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={24}
                color={consent === true ? "#4A90E2" : "#ccc"}
              />
              <Text
                style={[
                  styles.consentOptionText,
                  consent === true && styles.consentOptionTextActive,
                ]}
              >
                Đồng ý
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.consentOption,
                consent === false && styles.consentOptionActive,
              ]}
              onPress={() => setConsent(false)}
            >
              <MaterialIcons
                name={
                  consent === false
                    ? "radio-button-checked"
                    : "radio-button-unchecked"
                }
                size={24}
                color={consent === false ? "#D0021B" : "#ccc"}
              />
              <Text
                style={[
                  styles.consentOptionText,
                  consent === false && styles.consentOptionTextActive,
                ]}
              >
                Không đồng ý
              </Text>
            </TouchableOpacity>
          </View>

          {consent === false && (
            <View style={styles.rejectionReasonContainer}>
              <Text style={styles.rejectionReasonLabel}>
                Lý do không đồng ý:
              </Text>
              <TextInput
                style={styles.rejectionReasonInput}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Nhập lý do..."
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowConsentModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                (consent === null ||
                  (consent === false && !rejectionReason.trim())) &&
                  styles.modalSubmitButtonDisabled,
              ]}
              onPress={handleSubmitRegistration}
              disabled={
                isProcessing ||
                consent === null ||
                (consent === false && !rejectionReason.trim())
              }
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Xác nhận</Text>
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
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content}>
        {/* Chỉ hiển thị thông tin sự kiện khi có eventId từ route params */}
        {eventId && selectedEvent ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin sự kiện</Text>
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{selectedEvent.eventName}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Đang đăng ký</Text>
                </View>
              </View>

              <Text style={styles.eventDescription}>{selectedEvent.description}</Text>

              <View style={styles.eventDetails}>
                <View style={styles.eventDetail}>
                  <MaterialIcons name="person" size={16} color="#666" />
                  <Text style={styles.eventDetailText}>Học sinh: {selectedStudent?.fullName}</Text>
                </View>

                <View style={styles.eventDetail}>
                  <MaterialIcons name="location-on" size={16} color="#666" />
                  <Text style={styles.eventDetailText}>{selectedEvent.location}</Text>
                </View>

                <View style={styles.eventDetail}>
                  <MaterialIcons name="event" size={16} color="#666" />
                  <Text style={styles.eventDetailText}>
                    Ngày khám: {formatDateTime(selectedEvent.eventDate)}
                  </Text>
                </View>

                <View style={styles.eventDetail}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <Text style={styles.eventDetailText}>
                    Đăng ký: {formatDate(selectedEvent.startRegistrationDate)} -{" "}
                    {formatDate(selectedEvent.endRegistrationDate)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          // Hiển thị giao diện chọn học sinh và sự kiện khi không có eventId
          <>
            {renderSchoolYearSelection()}
            {renderStudentSelection()}
            {renderClassInfo()}
            {renderHealthCheckEvents()}
          </>
        )}
      </ScrollView>

      {renderConsentModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
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
  schoolYearScrollView: {
    flexDirection: "row",
  },
  schoolYearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  schoolYearChipActive: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  schoolYearChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  schoolYearChipTextActive: {
    color: "#fff",
  },
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  studentCardActive: {
    borderColor: "#4A90E2",
    backgroundColor: "#f0f8ff",
  },
  studentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  classCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  classInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  eventDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  eventActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  registerButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  disabledButtonText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
  },
  registeredInfo: {
    flex: 1,
  },
  registeredText: {
    fontSize: 12,
    color: "#666",
  },
  registeredNotes: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  modalEventInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalEventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  modalEventDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  modalEventLocation: {
    fontSize: 14,
    color: "#666",
  },
  modalQuestion: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  consentOptions: {
    marginBottom: 16,
  },
  consentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  consentOptionActive: {
    backgroundColor: "#f0f8ff",
    borderColor: "#4A90E2",
  },
  consentOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  consentOptionTextActive: {
    color: "#4A90E2",
    fontWeight: "500",
  },
  rejectionReasonContainer: {
    marginBottom: 16,
  },
  rejectionReasonLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  rejectionReasonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  modalSubmitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
