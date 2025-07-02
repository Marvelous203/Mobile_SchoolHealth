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

export default function ResetPassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async () => {
    try {
      // Validate input
      if (!oldPassword || !newPassword || !confirmPassword) {
        Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu mới không khớp");
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }

      if (oldPassword === newPassword) {
        Alert.alert("Lỗi", "Mật khẩu mới phải khác mật khẩu cũ");
        return;
      }

      setIsChanging(true);

      // Call API to change password
      const response = await api.changePassword({
        oldPassword,
        newPassword,
      });

      if (response.success) {
        Alert.alert(
          "Thành công",
          "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.message || "Không thể đổi mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <FontAwesome5 name="lock" size={64} color="#1890ff" />
          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập mật khẩu cũ và mật khẩu mới của bạn
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu cũ"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleChangePassword}
            disabled={isChanging}
          >
            {isChanging ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Đổi mật khẩu</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
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
  resetButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  resetButtonText: {
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
});
