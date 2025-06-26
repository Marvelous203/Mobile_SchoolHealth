import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

interface CheckupSession {
  id: string;
  name: string;
  date: string;
  description: string;
  status: string;
}

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

export default function ConsentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<CheckupSession | null>(null);
  const [medicalEvent, setMedicalEvent] = useState<MedicalEvent | null>(null);
  const [registration, setRegistration] =
    useState<MedicalCheckRegistration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const data = await api.getHealthCheckSession(id as string);
        setSession(data);
      } catch (error) {
        console.error("Failed to load session details", error);
        Alert.alert("Lỗi", "Không thể tải thông tin phiên khám");
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [id]);

  const handleConsent = async (consent: boolean) => {
    if (!consent && !cancellationReason.trim()) {
      Alert.alert("Lưu ý", "Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`${consent ? "✅" : "❌"} Processing consent:`, consent);

      if (!id || id === "new") {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đăng ký");
        return;
      }

      const updateData: any = {
        status: consent ? "approved" : "rejected",
        consentDate: new Date().toISOString(),
        notes: consent
          ? "Bạn đã đồng ý cho phép khám sức khỏe"
          : "Bạn đã từ chối cho phép khám sức khỏe",
      };

      if (!consent && cancellationReason.trim()) {
        updateData.cancellationReason = cancellationReason.trim();
      }

      const response = await api.updateMedicalCheckRegistrationStatus(
        id as string,
        updateData
      );

      console.log("✅ Medical check consent updated:", response);

      Alert.alert(
        "Thành công",
        consent
          ? "Bạn đã xác nhận đồng ý cho phép khám sức khỏe"
          : "Bạn đã từ chối cho phép khám sức khỏe",
        [
          {
            text: "OK",
            onPress: () => {
              setShowRejectModal(false);
              router.back();
            },
          },
        ]
      );

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Không tìm thấy thông tin phiên khám</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{session.name}</Text>
        <Text style={styles.date}>Ngày khám: {session.date}</Text>
        <Text style={styles.description}>{session.description}</Text>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() => handleConsent(true)}
            loading={isProcessing}
            style={styles.button}
          >
            Đồng ý
          </Button>
          <Button
            onPress={() => setShowRejectModal(true)}
            variant="secondary"
            style={styles.button}
          >
            Từ chối
          </Button>
        </View>
      </ScrollView>
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
                    <Text style={styles.modalConfirmText}>
                      Xác nhận từ chối
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: "100%",
  },
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
});
