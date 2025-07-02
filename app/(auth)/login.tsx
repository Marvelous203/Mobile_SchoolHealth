"use client";

import { useAuth } from "@/lib/auth";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const { token } = useLocalSearchParams();

  const { login } = useAuth();

  // Handle reset password token from email
  useEffect(() => {
    if (token) {
      router.replace(`/reset-password?token=${token}`);
    }
  }, [token]);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
      }

      setIsLoading(true);
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể đăng nhập. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }

    try {
      setIsSendingReset(true);
      const response = await api.forgotPassword({ email: forgotEmail });

      if (response.success) {
        Alert.alert(
          "Thành công",
          "Link đặt lại mật khẩu đã được gửi đến email của bạn"
        );
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể gửi yêu cầu đặt lại mật khẩu"
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  const renderForgotPasswordModal = () => (
    <Modal
      visible={showForgotPassword}
      transparent
      animationType="slide"
      onRequestClose={() => setShowForgotPassword(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Quên mật khẩu</Text>
          <Text style={styles.modalDescription}>
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={forgotEmail}
            onChangeText={setForgotEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowForgotPassword(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleForgotPassword}
              disabled={isSendingReset}
            >
              {isSendingReset ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Chào mừng bạn quay trở lại!</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.actionLinks}>
          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={styles.actionLink}
          >
            <Text style={styles.actionLinkText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/reset-password")}
            style={styles.actionLink}
          >
            <Text style={styles.actionLinkText}>Đổi mật khẩu</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {renderForgotPasswordModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  actionLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionLink: {
    padding: 4,
  },
  actionLinkText: {
    color: "#1890ff",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#bae7ff",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#1890ff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: "#8c8c8c",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: "#1890ff",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
