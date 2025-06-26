import { api } from "@/lib/api";
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

interface MedicalEvent {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

interface MedicalCheckRegistration {
  _id: string;
  studentId: string;
  parentId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
  parentName: string;
  cancellationReason?: string;
}

export default function MedicalCheckRegistrationPage() {
  const router = useRouter();
  const { registrationId, eventId, studentId, parentId } =
    useLocalSearchParams<{
      registrationId?: string;
      eventId?: string;
      studentId?: string;
      parentId?: string;
    }>();

  const [isLoading, setIsLoading] = useState(true);
  const [medicalEvent, setMedicalEvent] = useState<MedicalEvent | null>(null);
  const [registration, setRegistration] =
    useState<MedicalCheckRegistration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const loadMedicalCheckData = async () => {
    try {
      setIsLoading(true);
      console.log("📋 Loading medical check registration data...");
      console.log("Parameters:", {
        registrationId,
        eventId,
        studentId,
        parentId,
      });

      if (registrationId) {
        // Load registration details
        const regResponse = await api.getMedicalCheckRegistrationById(
          registrationId
        );
        const regData = (regResponse as any).data || regResponse;
        setRegistration(regData);
        console.log("✅ Medical check registration loaded:", regData);

        // Load event details
        if (regData.eventId) {
          const eventResponse = await api.getMedicalEventById(regData.eventId);
          const eventData = (eventResponse as any).data || eventResponse;
          setMedicalEvent(eventData);
          console.log("✅ Medical event loaded:", eventData);
        }
      } else if (eventId) {
        // Direct event access
        const eventResponse = await api.getMedicalEventById(eventId);
        const eventData = (eventResponse as any).data || eventResponse;
        setMedicalEvent(eventData);
        console.log("✅ Medical event loaded:", eventData);
      }
    } catch (error: any) {
      console.error("❌ Failed to load medical check data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin sự kiện khám sức khỏe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsent = async (consent: boolean) => {
    if (!consent && !cancellationReason.trim()) {
      Alert.alert("Lưu ý", "Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`${consent ? "✅" : "❌"} Processing consent:`, consent);

      if (!registrationId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đăng ký");
        return;
      }

      const updateData: any = {
        status: consent ? "approved" : "rejected",
        consentDate: new Date().toISOString(),
        notes: consent
          ? "Phụ huynh đồng ý cho con khám sức khỏe"
          : "Phụ huynh từ chối cho con khám sức khỏe",
      };

      // Thêm lý do từ chối nếu reject (theo API requirement)
      if (!consent && cancellationReason.trim()) {
        updateData.cancellationReason = cancellationReason.trim();
      }

      const response = await api.updateMedicalCheckRegistrationStatus(
        registrationId,
        updateData
      );

      console.log("✅ Medical check consent updated:", response);

      Alert.alert(
        "Thành công",
        consent
          ? "Bạn đã xác nhận đồng ý cho con khám sức khỏe"
          : "Bạn đã từ chối cho con khám sức khỏe",
        [
          {
            text: "OK",
            onPress: () => {
              setShowRejectModal(false);
              router.replace("/(tabs)/(parent)/checkups");
            },
          },
        ]
      );

      // Update local state
      if (registration) {
        setRegistration({
          ...registration,
          status: consent ? "approved" : "rejected",
          cancellationReason: !consent ? cancellationReason : undefined,
        });
      }
    } catch (error) {
      console.error("❌ Failed to update medical check consent:", error);
      Alert.alert("Lỗi", "Không thể cập nhật đồng ý khám sức khỏe");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadMedicalCheckData();
  }, [registrationId, eventId]);

  const renderHeader = () => (
    <LinearGradient
      colors={["#4facfe", "#00f2fe"]}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận khám sức khỏe</Text>
        <View style={styles.placeholder} />
      </View>
    </LinearGradient>
  );

  const renderEventInfo = () => (
    <View style={styles.eventSection}>
      <LinearGradient colors={["#fff", "#f8f9fa"]} style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <FontAwesome5 name="stethoscope" size={24} color="#4facfe" />
          <Text style={styles.eventTitle}>
            {medicalEvent?.title || "Sự kiện khám sức khỏe"}
          </Text>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thời gian:</Text>
            <Text style={styles.detailValue}>
              {medicalEvent?.startDate
                ? `${new Date(medicalEvent.startDate).toLocaleDateString(
                    "vi-VN"
                  )} - ${new Date(medicalEvent.endDate).toLocaleDateString(
                    "vi-VN"
                  )}`
                : "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Địa điểm:</Text>
            <Text style={styles.detailValue}>
              {medicalEvent?.location || "Trường Tiểu học ABC"}
            </Text>
          </View>

          {registration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Học sinh:</Text>
              <Text style={styles.detailValue}>{registration.studentName}</Text>
            </View>
          )}
        </View>

        {medicalEvent?.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Mô tả:</Text>
            <Text style={styles.descriptionText}>
              {medicalEvent.description}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderConsentSection = () => {
    if (registration?.status !== "pending") {
      return (
        <View style={styles.statusSection}>
          <LinearGradient
            colors={
              registration?.status === "approved"
                ? ["#52c41a", "#73d13d"]
                : ["#ff4d4f", "#ff7875"]
            }
            style={styles.statusCard}
          >
            <FontAwesome5
              name={
                registration?.status === "approved"
                  ? "check-circle"
                  : "times-circle"
              }
              size={48}
              color="#fff"
            />
            <Text style={styles.statusTitle}>
              {registration?.status === "approved"
                ? "Đã xác nhận"
                : "Đã từ chối"}
            </Text>
            <Text style={styles.statusDescription}>
              {registration?.status === "approved"
                ? "Bạn đã đồng ý cho con khám sức khỏe"
                : "Bạn đã từ chối cho con khám sức khỏe"}
            </Text>
            {registration?.cancellationReason && (
              <Text style={styles.reasonText}>
                Lý do: {registration.cancellationReason}
              </Text>
            )}
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.consentSection}>
        <Text style={styles.consentTitle}>
          Vui lòng xác nhận đồng ý cho học sinh khám sức khỏe định kỳ.
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleConsent(true)}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={["#52c41a", "#73d13d"]}
              style={styles.buttonGradient}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="check" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Xác nhận khám sức khỏe</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => setShowRejectModal(true)}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={["#ff4d4f", "#ff7875"]}
              style={styles.buttonGradient}
            >
              <FontAwesome5 name="times" size={20} color="#fff" />
              <Text style={styles.buttonText}>Từ chối</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteText}>
            💡 Khám sức khỏe định kỳ giúp phát hiện sớm các vấn đề sức khỏe
          </Text>
        </View>
      </View>
    );
  };

  const renderRejectModal = () => (
    <Modal
      visible={showRejectModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Lý do từ chối</Text>
          <Text style={styles.modalSubtitle}>
            Vui lòng cho biết lý do từ chối khám sức khỏe:
          </Text>

          <TextInput
            style={styles.reasonInput}
            placeholder="Nhập lý do từ chối..."
            placeholderTextColor="#8e8e93"
            value={cancellationReason}
            onChangeText={setCancellationReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowRejectModal(false);
                setCancellationReason("");
              }}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => handleConsent(false)}
              disabled={!cancellationReason.trim() || isProcessing}
            >
              <LinearGradient
                colors={["#ff4d4f", "#ff7875"]}
                style={styles.modalConfirmGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Xác nhận từ chối</Text>
                )}
              </LinearGradient>
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
          <ActivityIndicator size="large" color="#4facfe" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderEventInfo()}
        {renderConsentSection()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      {renderRejectModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },
  headerGradient: {
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8c8c8c",
    fontWeight: "500",
  },

  // Event Section
  eventSection: {
    padding: 20,
    marginTop: -20,
  },
  eventCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#262626",
    marginLeft: 12,
    flex: 1,
  },
  eventDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#8c8c8c",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#262626",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  descriptionSection: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#595959",
    lineHeight: 20,
  },

  // Status Section
  statusSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
  },
  reasonText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },

  // Consent Section
  consentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#262626",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  actionButtons: {
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  approveButton: {
    elevation: 4,
    shadowColor: "#52c41a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rejectButton: {
    elevation: 4,
    shadowColor: "#ff4d4f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Note Section
  noteSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#1890ff",
  },
  noteText: {
    fontSize: 14,
    color: "#8c8c8c",
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#262626",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#8c8c8c",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#262626",
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8c8c8c",
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },

  bottomSpacing: {
    height: 40,
  },
});
