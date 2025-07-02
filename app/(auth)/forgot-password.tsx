import { api } from "@/lib/api";
import { FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(60); // 60 seconds cooldown
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendResetEmail = async () => {
    try {
      if (!email.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập email");
        return;
      }

      setIsSending(true);

      const response = await api.forgotPassword({
        email: email.trim(),
      });

      if (response.success) {
        setEmailSent(true);
        startResendTimer();
        Alert.alert(
          "Thành công",
          "Vui lòng kiểm tra email của bạn để lấy link đặt lại mật khẩu."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể gửi email. Vui lòng thử lại."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <FontAwesome5 name="envelope" size={64} color="#1890ff" />
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSending}
          />

          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSendResetEmail}
            disabled={isSending || (emailSent && resendTimer > 0)}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>
                {emailSent
                  ? resendTimer > 0
                    ? `Gửi lại sau ${resendTimer}s`
                    : "Gửi lại email"
                  : "Gửi email"}
              </Text>
            )}
          </TouchableOpacity>

          {emailSent && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại
                mật khẩu. Vui lòng kiểm tra cả thư mục spam.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#262626",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8c8c8c",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "#bae7ff",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: 14,
    alignItems: "center",
  },
  backButtonText: {
    color: "#8c8c8c",
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: "#e6f7ff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    color: "#1890ff",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
