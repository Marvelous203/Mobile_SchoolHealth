import { api } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

export default function RegistrationDetailScreen() {
  const router = useRouter();
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [registration, setRegistration] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    if (registrationId) {
      loadRegistrationDetail();
    }
  }, [registrationId]);

  const loadRegistrationDetail = async () => {
    try {
      setIsLoading(true);
      const response = await api.getHealthCheckRegistrationDetail(registrationId);
      console.log("✅ Registration detail response:", JSON.stringify(response.data, null, 2));
      console.log("✅ Student data:", JSON.stringify(response.data.student, null, 2));
      setRegistration(response.data);
      
      // Content is immediately visible
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    } catch (error) {
      console.error("❌ Load registration detail error:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đăng ký");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#52c41a";
      case "rejected": return "#ff4d4f";
      case "pending": return "#faad14";
      case "cancelled": return "#8c8c8c";
      default: return "#1890ff";
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "approved": return ['#10b981', '#059669'];
      case "rejected": return ['#ef4444', '#dc2626'];
      case "pending": return ['#f59e0b', '#d97706'];
      case "cancelled": return ['#6b7280', '#4b5563'];
      default: return ['#3b82f6', '#2563eb'];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return "checkmark-circle";
      case "rejected": return "close-circle";
      case "pending": return "time";
      case "cancelled": return "ban";
      default: return "information-circle";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Đã đồng ý - Chờ duyệt";
      case "rejected": return "Đã từ chối";
      case "pending": return "Chờ xác nhận từ phụ huynh";
      case "cancelled": return "Đã hủy";
      default: return "Không xác định";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleUpdateRegistration = async (newStatus: "approved" | "rejected", reason?: string) => {
    if (!registration) {
      Alert.alert("Lỗi", "Không tìm thấy đăng ký");
      return;
    }

    // Check if registration is still in pending status
    if (registration.status !== "pending") {
      Alert.alert(
        "Thông báo", 
        "Đăng ký này đã được xử lý. Vui lòng tải lại trang để xem trạng thái mới nhất.",
        [{
          text: "Tải lại",
          onPress: () => loadRegistrationDetail()
        }]
      );
      return;
    }

    try {
      setIsProcessing(true);
      
      let response;
      if (newStatus === "approved") {
        response = await api.updateHealthCheckRegistrationStatus(registration._id, {
          status: "approved",
          notes: "Đồng ý đăng ký khám sức khỏe từ ứng dụng di động"
        });
      } else {
        response = await api.updateHealthCheckRegistrationStatus(registration._id, {
          status: "rejected",
          cancellationReason: reason || "Từ chối đăng ký khám sức khỏe từ ứng dụng di động"
        });
      }

      // Check if response is successful
      if (response && (response._id || response.id)) {
        Alert.alert(
          "Thành công", 
          newStatus === "approved" ? "Đã đồng ý tham gia khám sức khỏe" : "Đã từ chối tham gia khám sức khỏe",
          [{
            text: "OK",
            onPress: () => {
              loadRegistrationDetail(); // Reload data to show updated status
            }
          }]
        );
      } else {
        throw new Error("Không thể cập nhật đăng ký");
      }
    } catch (error: any) {
      console.error("❌ Update registration error:", error);
      const errorMessage = error.message || "Không thể cập nhật đăng ký. Vui lòng thử lại.";
      
      if (errorMessage.includes("pending")) {
        Alert.alert(
          "Thông báo", 
          "Đăng ký này đã được xử lý trước đó. Vui lòng tải lại để xem trạng thái mới nhất.",
          [{
            text: "Tải lại",
            onPress: () => loadRegistrationDetail()
          }]
        );
      } else {
        Alert.alert("Lỗi", errorMessage);
      }
    } finally {
       setIsProcessing(false);
     }
   };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đăng ký</Text>
          <View style={styles.headerRight} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            <Text style={styles.loadingSubText}>Vui lòng chờ trong giây lát</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đăng ký khám sức khỏe</Text>
        <View style={styles.headerRight} />
      </LinearGradient>
      
      <Animated.ScrollView 
        style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]} 
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
          if (isCloseToBottom && !showActionButtons) {
            setShowActionButtons(true);
          }
        }}
        scrollEventThrottle={400}
      >
        {registration && (
          <>
            {/* Trạng thái đăng ký */}
            <View style={styles.statusCard}>
              <LinearGradient
                colors={getStatusGradient(registration.status)}
                style={styles.statusGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statusHeader}>
                  <View style={styles.statusIconContainer}>
                    <Ionicons 
                      name={getStatusIcon(registration.status)} 
                      size={24} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusTitle}>Trạng thái đăng ký</Text>
                    <Text style={styles.statusText}>{getStatusText(registration.status)}</Text>
                  </View>
                </View>
              </LinearGradient>
              <View style={styles.statusDetails}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mã đăng ký:</Text>
                  <Text style={styles.value}>{registration._id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Ngày đăng ký:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Năm học:</Text>
                  <Text style={styles.value}>{registration.schoolYear}</Text>
                </View>
                {registration.updatedAt !== registration.createdAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Cập nhật lần cuối:</Text>
                    <Text style={styles.value}>{formatDateTime(registration.updatedAt)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Thông tin sự kiện */}
            {registration.event && (
              <View style={styles.modernCard}>
                <View style={styles.modernSectionHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calendar" size={20} color="#667eea" />
                  </View>
                  <Text style={styles.modernSectionTitle}>Thông tin sự kiện khám sức khỏe</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mã sự kiện:</Text>
                  <Text style={styles.value}>{registration.event._id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Tên sự kiện:</Text>
                  <Text style={styles.value}>{registration.event.eventName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mô tả:</Text>
                  <Text style={styles.value}>{registration.event.description}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Địa điểm:</Text>
                  <Text style={styles.value}>{registration.event.location}</Text>
                </View>
                {registration.event.provider && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Đơn vị thực hiện:</Text>
                    <Text style={styles.value}>{registration.event.provider}</Text>
                  </View>
                )}
                {registration.event.gradeId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Mã khối lớp:</Text>
                    <Text style={styles.value}>{registration.event.gradeId}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Năm học sự kiện:</Text>
                  <Text style={styles.value}>{registration.event.schoolYear}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Ngày khám:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.event.eventDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Thời gian đăng ký:</Text>
                  <Text style={styles.value}>
                    {formatDate(registration.event.startRegistrationDate)} - {formatDate(registration.event.endRegistrationDate)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Ngày tạo sự kiện:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.event.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Cập nhật sự kiện:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.event.updatedAt)}</Text>
                </View>
                {registration.event.status && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Trạng thái sự kiện:</Text>
                    <Text style={[styles.value, { color: registration.event.status === 'completed' ? '#52c41a' : registration.event.status === 'ongoing' ? '#faad14' : '#1890ff' }]}>
                      {registration.event.status === 'completed' ? 'Đã hoàn thành' : 
                       registration.event.status === 'ongoing' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Thông tin học sinh */}
            {registration.student && (
              <View style={styles.modernCard}>
                <View style={styles.modernSectionHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="person" size={20} color="#667eea" />
                  </View>
                  <Text style={styles.modernSectionTitle}>Thông tin học sinh</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mã học sinh:</Text>
                  <Text style={styles.value}>{registration.student._id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mã số học sinh:</Text>
                  <Text style={styles.value}>{registration.student.studentCode}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mã định danh:</Text>
                  <Text style={styles.value}>{registration.student.studentIdCode}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Họ và tên:</Text>
                  <Text style={styles.value}>{registration.student.fullName}</Text>
                </View>
                {registration.student.dob && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Ngày sinh:</Text>
                      <Text style={styles.value}>{formatDate(registration.student.dob)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Tuổi:</Text>
                      <Text style={styles.value}>{calculateAge(registration.student.dob)} tuổi</Text>
                    </View>
                  </>
                )}
                {registration.student.gender && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Giới tính:</Text>
                    <Text style={styles.value}>{registration.student.gender === 'male' ? 'Nam' : 'Nữ'}</Text>
                  </View>
                )}
                {registration.student.classId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Mã lớp học:</Text>
                    <Text style={styles.value}>{registration.student.classId}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Trạng thái học sinh:</Text>
                  <Text style={styles.value}>{registration.student.status === 'active' ? 'Đang học' : 'Không hoạt động'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Ngày tạo hồ sơ:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.student.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Cập nhật hồ sơ:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.student.updatedAt)}</Text>
                </View>
              </View>
            )}

            {/* Thông tin phụ huynh */}
            {registration.parent && (
              <View style={styles.modernCard}>
                <View style={styles.modernSectionHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="people" size={20} color="#667eea" />
                  </View>
                  <Text style={styles.modernSectionTitle}>Thông tin phụ huynh</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Mã phụ huynh:</Text>
                  <Text style={styles.value}>{registration.parent._id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Họ và tên:</Text>
                  <Text style={styles.value}>{registration.parent.fullName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{registration.parent.email}</Text>
                </View>
                {registration.parent.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Số điện thoại:</Text>
                    <Text style={styles.value}>{registration.parent.phone}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Vai trò:</Text>
                  <Text style={styles.value}>{registration.parent.role === 'parent' ? 'Phụ huynh' : registration.parent.role}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Quyền truy cập đầy đủ:</Text>
                  <Text style={styles.value}>{registration.parent.fullPermission ? 'Có' : 'Không'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Số học sinh quản lý:</Text>
                  <Text style={styles.value}>{registration.parent.studentIds ? registration.parent.studentIds.length : 0}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Ngày tạo tài khoản:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.parent.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Cập nhật tài khoản:</Text>
                  <Text style={styles.value}>{formatDateTime(registration.parent.updatedAt)}</Text>
                </View>
              </View>
            )}

            {/* Ghi chú và lý do */}
            {(registration.notes || registration.cancellationReason || registration.note) && (
              <View style={styles.modernCard}>
                <View style={styles.modernSectionHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="document-text" size={20} color="#667eea" />
                  </View>
                  <Text style={styles.modernSectionTitle}>Ghi chú & Lý do</Text>
                </View>
                {registration.notes && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Ghi chú:</Text>
                    <Text style={styles.value}>{registration.notes}</Text>
                  </View>
                )}
                {registration.note && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Ghi chú khác:</Text>
                    <Text style={styles.value}>{registration.note}</Text>
                  </View>
                )}
                {registration.cancellationReason && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Lý do từ chối:</Text>
                    <Text style={[styles.value, { color: '#ff4d4f' }]}>{registration.cancellationReason}</Text>
                  </View>
                )}
              </View>
            )}            
            {/* Scroll indicator for pending registrations */}
            {registration && registration.status === "pending" && !showActionButtons && (
              <View style={styles.scrollIndicator}>
                <View style={styles.scrollIndicatorCard}>
                  <Ionicons name="arrow-down" size={20} color="#667eea" />
                  <Text style={styles.scrollIndicatorText}>Cuộn xuống để xem nút xác nhận</Text>
                  <Ionicons name="arrow-down" size={20} color="#667eea" />
                </View>
              </View>
            )}
            
            {/* Action Section */}
            {registration && registration.status === "pending" && (
              <View style={styles.modernCard}>
                <View style={styles.actionHeader}>
                  <Ionicons name="help-circle" size={24} color="#667eea" />
                  <Text style={styles.actionTitle}>Xác nhận tham gia</Text>
                </View>
                <Text style={styles.actionDescription}>
                  Vui lòng xác nhận đồng ý hoặc từ chối cho con em tham gia chương trình khám sức khỏe
                </Text>
                <TouchableOpacity 
                  style={[styles.modernActionButton, isProcessing && styles.disabledButton]} 
                  onPress={() => setShowConfirmModal(true)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="checkmark-done" size={22} color="#fff" />
                    <Text style={styles.modernButtonText}>Xác nhận tham gia</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="help-circle" size={32} color="#667eea" />
              <Text style={styles.modalTitle}>Xác nhận tham gia khám sức khỏe</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Vui lòng chọn một trong hai lựa chọn dưới đây để xác nhận việc tham gia chương trình khám sức khỏe cho con em.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, isProcessing && styles.disabledButton]} 
                onPress={() => {
                  setShowConfirmModal(false);
                  handleUpdateRegistration("approved");
                }}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>Đồng ý tham gia</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                 style={[styles.modalButton, isProcessing && styles.disabledButton]} 
                 onPress={() => {
                   setShowConfirmModal(false);
                   setShowRejectModal(true);
                 }}
                 disabled={isProcessing}
                 activeOpacity={0.8}
               >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>Từ chối tham gia</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
       </Modal>
       
       {/* Reject Reason Modal */}
       <Modal
         visible={showRejectModal}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setShowRejectModal(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.modalContainer}>
             <View style={styles.modalHeader}>
               <Ionicons name="close-circle" size={32} color="#ef4444" />
               <Text style={styles.modalTitle}>Lý do từ chối tham gia</Text>
             </View>
             
             <Text style={styles.modalDescription}>
               Vui lòng nhập lý do tại sao bạn từ chối cho con em tham gia chương trình khám sức khỏe này.
             </Text>
             
             <View style={styles.inputContainer}>
               <TextInput
                 style={styles.textInput}
                 placeholder="Nhập lý do từ chối..."
                 placeholderTextColor="#94a3b8"
                 value={rejectReason}
                 onChangeText={setRejectReason}
                 multiline={true}
                 numberOfLines={4}
                 textAlignVertical="top"
               />
             </View>
             
             <View style={styles.modalButtons}>
               <TouchableOpacity 
                 style={[styles.modalButton, (!rejectReason.trim() || isProcessing) && styles.disabledButton]} 
                 onPress={() => {
                   if (rejectReason.trim()) {
                     setShowRejectModal(false);
                     handleUpdateRegistration("rejected", rejectReason.trim());
                     setRejectReason("");
                   }
                 }}
                 disabled={!rejectReason.trim() || isProcessing}
                 activeOpacity={0.8}
               >
                 <LinearGradient
                   colors={['#ef4444', '#dc2626']}
                   style={styles.modalButtonGradient}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                 >
                   {isProcessing ? (
                     <ActivityIndicator size="small" color="#fff" />
                   ) : (
                     <>
                       <Ionicons name="close-circle" size={20} color="#fff" />
                       <Text style={styles.modalButtonText}>Xác nhận từ chối</Text>
                     </>
                   )}
                 </LinearGradient>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={styles.modalCancelButton}
                 onPress={() => {
                   setShowRejectModal(false);
                   setRejectReason("");
                 }}
                 disabled={isProcessing}
                 activeOpacity={0.8}
               >
                 <Text style={styles.modalCancelText}>Hủy</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>
       
       {/* Status Footer for non-pending registrations */}
      {registration && registration.status !== "pending" && (
        <View style={styles.modernFooter}>
          <LinearGradient
            colors={getStatusGradient(registration.status)}
            style={styles.statusFooterGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statusFooterContent}>
              <Ionicons 
                name={getStatusIcon(registration.status)} 
                size={24} 
                color="white" 
              />
              <Text style={styles.statusFooterText}>
                {registration.status === "approved" 
                  ? "Đăng ký đã được phê duyệt" 
                  : registration.status === "rejected"
                    ? "Đăng ký đã bị từ chối"
                    : registration.status === "expired"
                      ? "Đăng ký đã hết hạn do quá thời gian xác nhận"
                      : "Trạng thái không xác định"}
              </Text>
            </View>
          </LinearGradient>
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
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Status Card Styles
  statusCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  statusDetails: {
    padding: 20,
    backgroundColor: 'white',
  },
  // Modern Card Styles
  modernCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  // Modern Section Header
  modernSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: '#fafbfc',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
    width: 140,
    marginRight: 12,
  },
  value: {
    fontSize: 15,
    color: "#1e293b",
    flex: 1,
    lineHeight: 22,
    fontWeight: '500',
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: "#1e293b",
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: 'center',
  },
  // Scroll Indicator Styles
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  scrollIndicatorCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  scrollIndicatorText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  // Modern Footer Styles
  modernFooter: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  footerContent: {
    padding: 24,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  actionDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  modernActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  modernButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Status Footer Styles
  statusFooterGradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statusFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  statusFooterText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginTop: 8,
  },
  modalCancelText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#64748b',
   },
   // Input Styles
   inputContainer: {
     marginBottom: 20,
   },
   textInput: {
     borderWidth: 1,
     borderColor: '#e2e8f0',
     borderRadius: 12,
     padding: 16,
     fontSize: 16,
     color: '#1e293b',
     backgroundColor: '#f8fafc',
     minHeight: 100,
     maxHeight: 150,
   },
 });