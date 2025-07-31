import { api, getCurrentUserId } from "@/lib/api";
import { useAuth, checkUserPermission, showPermissionDeniedAlert } from "@/lib/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  status?: string; // Thêm trường status từ API
}

export default function HealthCheckDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { eventId, studentId, studentName } = useLocalSearchParams<{ 
    eventId: string;
    studentId: string;
    studentName: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<HealthCheckEvent | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      
      if (eventId) {
        loadEventDetail();
      }
    } catch (error) {
      console.error("❌ Load initial data error:", error);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadEventDetail();
    }
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setIsLoading(true);
      const response = await api.getHealthCheckEventDetail(eventId);

      if (response.success) {
        setEvent(response.data);
        // Kiểm tra đăng ký hiện có
        await checkExistingRegistration();
      } else {
        Alert.alert("Lỗi", "Không thể tải thông tin sự kiện");
      }
    } catch (error) {
      console.error("❌ Load event detail error:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tải thông tin sự kiện");
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingRegistration = async () => {
    if (!currentUserId || !eventId || !studentId) return;
    
    try {
      setIsCheckingRegistration(true);
      const response = await api.getHealthCheckRegistrations({
        parentId: currentUserId,
        eventId: eventId,
        studentId: studentId
      });
      
      if (response.success && response.data.length > 0) {
        setExistingRegistration(response.data[0]);
      }
    } catch (error) {
      console.error("❌ Check existing registration error:", error);
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const getRegistrationStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#F5A623';
      case 'approved':
        return '#7ED321';
      case 'rejected':
        return '#D0021B';
      case 'cancelled':
        return '#9B9B9B';
      default:
        return '#666';
    }
  };

  const getRegistrationStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận từ phụ huynh';
      case 'approved':
        return 'Đã đồng ý - Chờ duyệt';
      case 'rejected':
        return 'Đã từ chối';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
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

  const handleRegister = () => {
    // Reset form states
    setConsent(null);
    setRejectionReason("");
    setShowConsentModal(true);
  };

  const handleSubmitRegistration = async () => {
    // Check user permission first
    if (!checkUserPermission(user)) {
      showPermissionDeniedAlert();
      return;
    }

    if (!currentUserId || !eventId || !studentId || !event) {
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

    try {
      setIsProcessing(true);

      // First, get the auto-created registration for this event and student
      console.log("🔍 Finding auto-created registration for event:", eventId, "student:", studentId);
      
      const registrationsResponse = await api.getHealthCheckRegistrationsForEvent(eventId, {
        studentId: studentId,
        parentId: currentUserId,
        status: "pending"
      });

      if (!registrationsResponse.success || !registrationsResponse.pageData || registrationsResponse.pageData.length === 0) {
        Alert.alert("Lỗi", "Không tìm thấy đơn đăng ký. Vui lòng liên hệ nhà trường.");
        return;
      }

      const registration = registrationsResponse.pageData[0];
      console.log("✅ Found registration:", registration);

      // Update the registration status
      const updateData = {
        status: consent ? ("approved" as const) : ("rejected" as const),
        consentDate: consent ? new Date().toISOString() : undefined,
        notes: consent ? "Đồng ý tham gia khám sức khỏe" : rejectionReason,
        ...(consent ? {} : { cancellationReason: rejectionReason }),
      };

      // Check if registration is still in pending status
      if (registration.status !== "pending") {
        Alert.alert(
          "Thông báo", 
          "Đăng ký này đã được xử lý. Vui lòng tải lại trang để xem trạng thái mới nhất.",
          [{
            text: "Tải lại",
            onPress: () => {
              setShowConsentModal(false);
              checkExistingRegistration();
            }
          }]
        );
        return;
      }

      console.log("📝 Updating registration status:", registration._id, updateData);

      const response = consent 
        ? await api.approveHealthCheckRegistration(registration._id, {
            consentDate: updateData.consentDate,
            notes: updateData.notes
          })
        : await api.rejectHealthCheckRegistration(registration._id, {
            cancellationReason: rejectionReason,
            notes: updateData.notes
          });

      // Check if response is successful (API returns the updated registration object directly)
      if (response && (response._id || response.id)) {
        setShowConsentModal(false);
        
        const message = consent
          ? "Đăng ký khám sức khỏe thành công! Chờ xác nhận từ nhà trường."
          : "Đã ghi nhận từ chối tham gia khám sức khỏe.";

        Alert.alert("Thành công", message, [
          {
            text: "OK",
            onPress: () => {
              router.back(); // Quay lại trang trước
            },
          },
        ]);
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật đăng ký");
      }
    } catch (error: any) {
      console.error("❌ Registration update error:", error);
      const errorMessage = error.message || "Đã có lỗi xảy ra khi cập nhật đăng ký";
      
      if (errorMessage.includes("pending")) {
        Alert.alert(
          "Thông báo", 
          "Đăng ký này đã được xử lý trước đó. Vui lòng tải lại để xem trạng thái mới nhất.",
          [{
            text: "Tải lại",
            onPress: () => {
              setShowConsentModal(false);
              checkExistingRegistration();
            }
          }]
        );
      } else {
        Alert.alert("Lỗi", errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const renderConsentModal = () => (
    <Modal
      visible={showConsentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowConsentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <MaterialIcons name="health-and-safety" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.modalTitle}>Xác nhận đăng ký</Text>
              <Text style={styles.modalSubtitle}>Khám sức khỏe định kỳ</Text>
            </View>

            <View style={styles.modalInfoSection}>
              <View style={styles.modalInfoRow}>
                <MaterialIcons name="person" size={20} color="#666" />
                <View style={styles.modalInfoContent}>
                  <Text style={styles.modalInfoLabel}>Học sinh</Text>
                  <Text style={styles.modalInfoValue}>{studentName}</Text>
                </View>
              </View>

              <View style={styles.modalInfoRow}>
                <MaterialIcons name="event" size={20} color="#666" />
                <View style={styles.modalInfoContent}>
                  <Text style={styles.modalInfoLabel}>Sự kiện</Text>
                  <Text style={styles.modalInfoValue}>{event?.eventName}</Text>
                </View>
              </View>

              <View style={styles.modalInfoRow}>
                <MaterialIcons name="location-on" size={20} color="#666" />
                <View style={styles.modalInfoContent}>
                  <Text style={styles.modalInfoLabel}>Địa điểm</Text>
                  <Text style={styles.modalInfoValue}>{event?.location}</Text>
                </View>
              </View>
            </View>

            <View style={styles.consentSection}>
              <Text style={styles.consentQuestion}>
                Bạn có đồng ý cho con tham gia khám sức khỏe không?
              </Text>

              <View style={styles.consentButtons}>
                <TouchableOpacity
                  style={[
                    styles.consentButton,
                    consent === true && styles.selectedAgreeButton,
                  ]}
                  onPress={() => {
                    setConsent(true);
                    setRejectionReason("");
                  }}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={consent === true ? "#fff" : "#4A90E2"}
                  />
                  <Text
                    style={[
                      styles.consentButtonText,
                      consent === true && styles.selectedConsentText,
                    ]}
                  >
                    Đồng ý
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.consentButton,
                    consent === false && styles.selectedRejectButton,
                  ]}
                  onPress={() => setConsent(false)}
                >
                  <MaterialIcons
                    name="cancel"
                    size={24}
                    color={consent === false ? "#fff" : "#f44336"}
                  />
                  <Text
                    style={[
                      styles.consentButtonText,
                      consent === false && styles.selectedConsentText,
                    ]}
                  >
                    Không đồng ý
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {consent === false && (
              <View style={styles.reasonSection}>
                <Text style={styles.reasonLabel}>Lý do từ chối *</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Nhập lý do từ chối tham gia khám sức khỏe..."
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={4}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>{rejectionReason.length}/500</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowConsentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.disabledButton]}
              onPress={handleSubmitRegistration}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons
                    name={consent === true ? "check" : consent === false ? "close" : "send"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>
                    {consent === true ? "Đăng ký" : consent === false ? "Gửi từ chối" : "Xác nhận"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
    </LinearGradient>
  );

  // Thêm hàm xác định trạng thái đăng ký
  const getRegistrationStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return {
        status: 'not_started',
        text: 'Chưa mở đăng ký',
        color: '#9B9B9B',
        bgColor: '#F5F5F5',
        canRegister: false
      };
    } else if (now >= start && now <= end) {
      return {
        status: 'open',
        text: 'Đang mở đăng ký',
        color: '#7ED321',
        bgColor: '#F0FDF4',
        canRegister: true
      };
    } else {
      return {
        status: 'closed',
        text: 'Đã hết hạn đăng ký',
        color: '#D0021B',
        bgColor: '#FEF2F2',
        canRegister: false
      };
    }
  };

  // Cập nhật hàm renderEventInfo
  const renderEventInfo = () => {
    if (!event) return null;

    const registrationStatus = getRegistrationStatus(
      event.startRegistrationDate,
      event.endRegistrationDate
    );
    
    // Ưu tiên status từ API nếu có, nếu không thì tính toán dựa trên ngày tháng
    let eventStatus: string;
    
    if (event.status) {
      // Sử dụng status từ API
      eventStatus = event.status;
    } else {
      // Tính toán status dựa trên ngày tháng (logic cũ)
      eventStatus =
        new Date() > new Date(event.eventDate)
          ? "completed"
          : registrationStatus.status === 'open'
          ? "ongoing"
          : "upcoming";
    }

    return (
      <View style={styles.content}>
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.eventName}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBgColor(eventStatus) },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(eventStatus) },
                ]}
              >
                {getStatusText(eventStatus)}
              </Text>
            </View>
          </View>

          <Text style={styles.eventDescription}>{event.description}</Text>

          {/* Hiển thị trạng thái đăng ký */}
          <View style={styles.registrationStatusInfo}>
            <View style={styles.registrationStatusRow}>
              <MaterialIcons name="schedule" size={20} color={registrationStatus.color} />
              <Text style={styles.registrationStatusLabel}>Trạng thái đăng ký:</Text>
              <View style={[
                styles.registrationStatusBadge,
                { backgroundColor: registrationStatus.bgColor }
              ]}>
                <Text style={[
                  styles.registrationStatusText,
                  { color: registrationStatus.color }
                ]}>
                  {registrationStatus.text}
                </Text>
              </View>
            </View>
          </View>

          {/* Hiển thị trạng thái đăng ký hiện có nếu có */}
          {existingRegistration && (
            <View style={styles.existingRegistrationCard}>
              <View style={styles.registrationStatusHeader}>
                <MaterialIcons name="assignment" size={20} color={getRegistrationStatusColor(existingRegistration.status)} />
                <Text style={styles.registrationStatusTitle}>Đăng ký của bạn</Text>
              </View>
              <View style={styles.registrationStatusContent}>
                <View style={[
                  styles.registrationStatusBadge,
                  { backgroundColor: getRegistrationStatusColor(existingRegistration.status) + '20' }
                ]}>
                  <Text style={[
                    styles.registrationStatusText,
                    { color: getRegistrationStatusColor(existingRegistration.status) }
                  ]}>
                    {getRegistrationStatusText(existingRegistration.status)}
                  </Text>
                </View>
                {existingRegistration.notes && (
                  <Text style={styles.registrationNotes}>
                    Ghi chú: {existingRegistration.notes}
                  </Text>
                )}
                {existingRegistration.cancellationReason && (
                  <Text style={styles.registrationReason}>
                    Lý do từ chối: {existingRegistration.cancellationReason}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ... existing event details ... */}
          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <MaterialIcons name="school" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Năm học:</Text>
              <Text style={styles.eventDetailValue}>{event.schoolYear}</Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="location-on" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Địa điểm:</Text>
              <Text style={styles.eventDetailValue}>{event.location}</Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="event" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Ngày khám:</Text>
              <Text style={styles.eventDetailValue}>
                {formatDateTime(event.eventDate)}
              </Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="schedule" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Thời gian đăng ký:</Text>
              <Text style={styles.eventDetailValue}>
                {formatDate(event.startRegistrationDate)} -{" "}
                {formatDate(event.endRegistrationDate)}
              </Text>
            </View>

            <View style={styles.eventDetail}>
              <MaterialIcons name="update" size={20} color="#4A90E2" />
              <Text style={styles.eventDetailLabel}>Ngày tạo:</Text>
              <Text style={styles.eventDetailValue}>
                {formatDate(event.createdAt)}
              </Text>
            </View>
          </View>

          {/* Logic hiển thị nút đăng ký dựa trên trạng thái - ưu tiên theo thứ tự */}
          {(() => {
            // Nếu sự kiện đã hoàn thành
            if (eventStatus === "completed") {
              return (
                <View style={styles.completedButton}>
                  <MaterialIcons name="check-circle" size={20} color="#9B9B9B" />
                  <Text style={styles.completedButtonText}>Sự kiện đã hoàn thành</Text>
                </View>
              );
            }
            
            // Nếu đã có đăng ký
            if (existingRegistration) {
              return (
                <View style={styles.alreadyRegisteredButton}>
                  <MaterialIcons name="check-circle" size={20} color="#7ED321" />
                  <Text style={styles.alreadyRegisteredText}>Đã đăng ký</Text>
                </View>
              );
            }
            
            // Nếu có thể đăng ký (trong thời gian đăng ký)
            if (registrationStatus.canRegister) {
              return (
                <TouchableOpacity
                  style={[styles.registerButton, (isProcessing || isCheckingRegistration) && styles.disabledButton]}
                  onPress={handleRegister}
                  disabled={isProcessing || isCheckingRegistration}
                >
                  {(isProcessing || isCheckingRegistration) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="app-registration" size={20} color="#fff" />
                  )}
                  <Text style={styles.registerButtonText}>
                    {isCheckingRegistration ? "Đang kiểm tra..." : isProcessing ? "Đang đăng ký..." : "Đăng ký tham gia"}
                  </Text>
                </TouchableOpacity>
              );
            }
            
            // Nếu chưa mở đăng ký
            if (registrationStatus.status === 'not_started') {
              return (
                <View style={[styles.statusButton, { backgroundColor: registrationStatus.bgColor }]}>
                  <MaterialIcons name="schedule" size={20} color={registrationStatus.color} />
                  <Text style={[styles.statusButtonText, { color: registrationStatus.color }]}>
                    {registrationStatus.text}
                  </Text>
                </View>
              );
            }
            
            // Nếu đã hết hạn đăng ký
            if (registrationStatus.status === 'closed') {
              return (
                <View style={[styles.statusButton, { backgroundColor: registrationStatus.bgColor }]}>
                  <MaterialIcons name="event-busy" size={20} color={registrationStatus.color} />
                  <Text style={[styles.statusButtonText, { color: registrationStatus.color }]}>
                    {registrationStatus.text}
                  </Text>
                </View>
              );
            }
            
            return null;
          })()}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Thông tin quan trọng</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialIcons name="info" size={16} color="#4A90E2" />
              <Text style={styles.infoText}>
                Vui lòng chuẩn bị các giấy tờ cần thiết trước khi đến khám
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="info" size={16} color="#4A90E2" />
              <Text style={styles.infoText}>
                Học sinh cần có mặt đúng giờ theo lịch hẹn
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="info" size={16} color="#4A90E2" />
              <Text style={styles.infoText}>
                Liên hệ y tế trường nếu có thắc mắc
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#4A90E2";
      case "ongoing":
        return "#7ED321";
      case "completed":
        return "#9B9B9B";
      default:
        return "#F5A623";
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#E8F4FD";
      case "ongoing":
        return "#F0FDF4";
      case "completed":
        return "#F5F5F5";
      default:
        return "#FFFBEB";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "Sắp diễn ra";
      case "ongoing":
        return "Đang đăng ký";
      case "completed":
        return "Đã hoàn thành";
      default:
        return "Không xác định";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Không tìm thấy thông tin sự kiện</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadEventDetail}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderEventInfo()}
      </ScrollView>
      {renderConsentModal()}
    </SafeAreaView>
  );
}

// Thêm styles cho modal
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  eventDetails: {
    marginBottom: 20,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventDetailLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    minWidth: 100,
  },
  eventDetailValue: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  registerButton: {
    backgroundColor: "#4A90E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  notOpenButton: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  notOpenButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  closedButton: {
    backgroundColor: "#ffebee",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  closedButtonText: {
    color: "#c62828",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoList: {
    paddingLeft: 0,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
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
    maxHeight: "90%",
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  modalInfoContent: {
    marginLeft: 12,
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  modalInfoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  consentSection: {
    marginBottom: 20,
  },
  consentQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  consentButtons: {
    flexDirection: "row",
    gap: 12,
  },
  consentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  selectedAgreeButton: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  selectedRejectButton: {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
  },
  consentButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  selectedConsentText: {
    color: "#fff",
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
    color: "#333",
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#4A90E2",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  
  // Thêm styles cho registration status info
  registrationStatusInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  registrationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registrationStatusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  registrationStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  registrationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  existingRegistrationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  registrationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  registrationStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  registrationStatusContent: {
    gap: 8,
  },
  registrationNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  registrationReason: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alreadyRegisteredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#7ED321',
  },
  alreadyRegisteredText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#7ED321',
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#9B9B9B',
  },
  completedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#9B9B9B',
  },
});
