import { api } from "@/lib/api";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface VaccineEvent {
  _id: string;
  title: string;
  vaccineName: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

interface VaccineRegistration {
  _id: string;
  studentId: string;
  parentId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  studentName: string;
  parentName: string;
}

export default function VaccineRegistrationPage() {
  const router = useRouter();
  const { eventId, registrationId, studentId, parentId } =
    useLocalSearchParams<{
      eventId?: string;
      registrationId?: string;
      studentId?: string;
      parentId?: string;
    }>();

  const [isLoading, setIsLoading] = useState(true);
  const [vaccineEvent, setVaccineEvent] = useState<VaccineEvent | null>(null);
  const [registration, setRegistration] = useState<VaccineRegistration | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const loadVaccineData = async () => {
    try {
      setIsLoading(true);
      console.log("📋 Loading vaccine registration data...");
      console.log("Parameters:", {
        eventId,
        registrationId,
        studentId,
        parentId,
      });

      if (registrationId) {
        // Load registration details
        const regResponse = await api.getVaccineRegistrationById(
          registrationId
        );
        const regData = (regResponse as any).data || regResponse;
        setRegistration(regData);
        console.log("✅ Registration loaded:", regData);

        // Load event details
        if (regData.eventId) {
          const eventResponse = await api.getVaccineEventById(regData.eventId);
          const eventData = (eventResponse as any).data || eventResponse;
          setVaccineEvent(eventData);
          console.log("✅ Vaccine event loaded:", eventData);
        }
      } else if (eventId) {
        // Direct event access
        const eventResponse = await api.getVaccineEventById(eventId);
        const eventData = (eventResponse as any).data || eventResponse;
        setVaccineEvent(eventData);
        console.log("✅ Vaccine event loaded:", eventData);
      }
    } catch (error) {
      console.error("❌ Failed to load vaccine data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin sự kiện tiêm chủng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsent = async (consent: boolean) => {
    try {
      setIsProcessing(true);
      console.log(`${consent ? "✅" : "❌"} Processing consent:`, consent);

      if (!registrationId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đăng ký");
        return;
      }

      const response = await api.updateVaccineRegistrationStatus(
        registrationId,
        {
          status: consent ? "approved" : "rejected",
          consentDate: new Date().toISOString(),
          notes: consent
            ? "Phụ huynh đồng ý tiêm chủng"
            : "Phụ huynh từ chối tiêm chủng",
        }
      );

      console.log("✅ Consent updated:", response);

      Alert.alert(
        "Thành công",
        consent
          ? "Bạn đã xác nhận đồng ý cho con tiêm chủng"
          : "Bạn đã từ chối cho con tiêm chủng",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to vaccinations page
              router.replace("/(tabs)/(parent)/vaccinations");
            },
          },
        ]
      );

      // Update local state
      if (registration) {
        setRegistration({
          ...registration,
          status: consent ? "approved" : "rejected",
        });
      }
    } catch (error) {
      console.error("❌ Failed to update consent:", error);
      Alert.alert("Lỗi", "Không thể cập nhật đồng ý tiêm chủng");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadVaccineData();
  }, [eventId, registrationId]);

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
        <Text style={styles.headerTitle}>Xác nhận tiêm chủng</Text>
        <View style={styles.placeholder} />
      </View>
    </LinearGradient>
  );

  const renderEventInfo = () => (
    <View style={styles.eventSection}>
      <LinearGradient colors={["#fff", "#f8f9fa"]} style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <FontAwesome5 name="syringe" size={24} color="#43e97b" />
          <Text style={styles.eventTitle}>
            {vaccineEvent?.title || "Sự kiện tiêm chủng"}
          </Text>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vaccine:</Text>
            <Text style={styles.detailValue}>
              {vaccineEvent?.vaccineName || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thời gian:</Text>
            <Text style={styles.detailValue}>
              {vaccineEvent?.startDate
                ? `${new Date(vaccineEvent.startDate).toLocaleDateString(
                    "vi-VN"
                  )} - ${new Date(vaccineEvent.endDate).toLocaleDateString(
                    "vi-VN"
                  )}`
                : "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Địa điểm:</Text>
            <Text style={styles.detailValue}>
              {vaccineEvent?.location || "Trường Tiểu học ABC"}
            </Text>
          </View>

          {registration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Học sinh:</Text>
              <Text style={styles.detailValue}>{registration.studentName}</Text>
            </View>
          )}
        </View>

        {vaccineEvent?.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Mô tả:</Text>
            <Text style={styles.descriptionText}>
              {vaccineEvent.description}
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
                ? "Bạn đã đồng ý cho con tiêm chủng"
                : "Bạn đã từ chối cho con tiêm chủng"}
            </Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.consentSection}>
        <Text style={styles.consentTitle}>
          Vui lòng xác nhận đồng ý tiêm vaccine cho học sinh.
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
                  <Text style={styles.buttonText}>Xác nhận tiêm vaccine</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleConsent(false)}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={["#ff4d4f", "#ff7875"]}
              style={styles.buttonGradient}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="times" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Từ chối</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteText}>
            💡 Mẹo: Bạn có thể lưu trang này để xem lại thông tin tiêm chủng
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#43e97b" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    marginBottom: 8,
    lineHeight: 18,
  },
  linkText: {
    fontSize: 12,
    color: "#1890ff",
    fontFamily: "monospace",
  },

  bottomSpacing: {
    height: 30,
  },
});
