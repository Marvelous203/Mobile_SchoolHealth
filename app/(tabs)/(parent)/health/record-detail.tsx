import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Student } from "../../../../lib/api";
import { HealthRecord } from "../../../../lib/types";

export default function HealthRecordDetailScreen() {
  const router = useRouter();
  const { recordId, studentName, studentId, allRecordIds } =
    useLocalSearchParams<{
      recordId: string;
      studentName: string;
      studentId: string;
      allRecordIds?: string;
    }>();

  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [allHealthRecords, setAllHealthRecords] = useState<HealthRecord[]>([]);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    if (recordId) {
      loadHealthRecords();
    }
  }, [recordId]);

  const loadHealthRecords = async () => {
    try {
      setLoading(true);

      // If we have multiple record IDs, load all of them
      if (allRecordIds) {
        const recordIds: string[] = JSON.parse(allRecordIds);
        console.log("📚 Loading multiple records:", recordIds);

        const recordPromises = recordIds.map((id) =>
          api.getHealthRecordById(id)
        );
        const responses = await Promise.all(recordPromises);

        const records = responses
          .filter((response) => response.success && response.data)
          .map((response) => response.data)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setAllHealthRecords(records);

        // Set the main record (latest one)
        const mainRecord =
          records.find((r) => r._id === recordId) || records[0];
        setHealthRecord(mainRecord);
        setSelectedYear(mainRecord.schoolYear);

        console.log("📊 All records loaded:", records.length);
      } else {
        // Load single record (fallback)
        const response = await api.getHealthRecordById(recordId!);
        if (response.success && response.data) {
          setHealthRecord(response.data);
          setAllHealthRecords([response.data]);
          setSelectedYear(response.data.schoolYear);
        }
      }

      // Load student info
      if (studentId) {
        console.log("👤 Fetching student info for ID:", studentId);
        await loadStudentInfo(studentId);
      }
    } catch (error: any) {
      console.error("❌ Load health record detail error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải chi tiết hồ sơ sức khỏe"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadStudentInfo = async (studentId: string) => {
    try {
      console.log("📚 Loading student profile for ID:", studentId);
      const studentResponse = await api.getStudentProfile(studentId);

      if (studentResponse.success && studentResponse.data) {
        setStudentInfo(studentResponse.data);
        console.log("✅ Student info loaded:", studentResponse.data);
      } else {
        console.log("⚠️ Failed to load student info:", studentResponse);
      }
    } catch (error: any) {
      console.error("❌ Load student info error:", error);
      // Don't show alert for student info error, just log it
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getHealthStatus = (record: HealthRecord) => {
    const hasIssues =
      record.chronicDiseases.length > 0 || record.allergies.length > 0;
    return hasIssues ? "Cần theo dõi" : "Tốt";
  };

  const getHealthStatusColor = (record: HealthRecord) => {
    const hasIssues =
      record.chronicDiseases.length > 0 || record.allergies.length > 0;
    return hasIssues ? "#ff7875" : "#52c41a";
  };

  const renderInfoSection = (
    title: string,
    icon: string,
    children: React.ReactNode,
    iconColor: string = "#1890ff"
  ) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name={icon as any} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderInfoItem = (
    label: string,
    value: string | null,
    isImportant = false
  ) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text
        style={[
          styles.infoValue,
          isImportant && styles.importantValue,
          !value && styles.noDataValue,
        ]}
      >
        {value || "Chưa có thông tin"}
      </Text>
    </View>
  );

  const renderListSection = (
    title: string,
    items: string[],
    icon: string,
    emptyText: string,
    iconColor: string = "#1890ff",
    itemStyle?: any
  ) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name={icon as any} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View
          style={[styles.countBadge, { backgroundColor: iconColor + "20" }]}
        >
          <Text style={[styles.countText, { color: iconColor }]}>
            {items.length}
          </Text>
        </View>
      </View>
      <View style={styles.sectionContent}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <View key={index} style={[styles.listItem, itemStyle]}>
              <FontAwesome5
                name="circle"
                size={6}
                color={iconColor}
                style={styles.bulletIcon}
              />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyListText}>{emptyText}</Text>
        )}
      </View>
    </View>
  );

  // Switch to different year record
  const switchToYear = (year: string) => {
    const record = allHealthRecords.find((r) => r.schoolYear === year);
    if (record) {
      setHealthRecord(record);
      setSelectedYear(year);
    }
  };

  // Get available years
  const getAvailableYears = () => {
    return allHealthRecords.map((r) => r.schoolYear).sort();
  };

  const renderYearSelector = () => {
    const availableYears = getAvailableYears();

    if (availableYears.length <= 1) return null;

    return (
      <View style={styles.yearSelector}>
        <Text style={styles.yearSelectorTitle}>Năm học:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.yearList}
        >
          {availableYears.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.selectedYearButton,
              ]}
              onPress={() => switchToYear(year)}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.selectedYearButtonText,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải chi tiết hồ sơ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!healthRecord) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={64} color="#ff4d4f" />
          <Text style={styles.errorTitle}>Không tìm thấy hồ sơ</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#1890ff", "#69c0ff"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backIcon}
              onPress={() => router.back()}
            >
              <FontAwesome5 name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <FontAwesome5 name="book-medical" size={24} color="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Hồ Sơ Sức Khỏe</Text>
                <Text style={styles.headerSubtitle}>
                  {studentInfo?.fullName || studentName || "Đang tải..."}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getHealthStatusColor(healthRecord) },
              ]}
            >
              <FontAwesome5
                name={
                  getHealthStatus(healthRecord) === "Tốt"
                    ? "check"
                    : "exclamation"
                }
                size={12}
                color="#fff"
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Year Selector */}
        {renderYearSelector()}

        {/* Student Information */}
        {renderInfoSection(
          "Thông tin học sinh",
          "user-graduate",
          <View>
            {renderInfoItem(
              "Họ và tên",
              studentInfo?.fullName || studentName || null,
              true
            )}
            {renderInfoItem("Mã học sinh", studentInfo?.studentCode || null)}
            {renderInfoItem("Năm học", healthRecord.schoolYear, true)}
            {renderInfoItem(
              "Ngày tạo hồ sơ",
              formatDate(healthRecord.createdAt)
            )}
            {renderInfoItem(
              "Cập nhật lần cuối",
              formatDate(healthRecord.updatedAt)
            )}
          </View>,
          "#1890ff"
        )}

        {/* Thông tin tổng quan */}
        {renderInfoSection(
          "Thông tin tổng quan",
          "info-circle",
          <>
            {renderInfoItem(
              "Tên học sinh",
              studentInfo?.fullName || studentName || "Đang tải...",
              true
            )}
            {studentInfo &&
              renderInfoItem("Mã học sinh", studentInfo.studentCode, true)}
            {renderInfoItem("Năm học", healthRecord.schoolYear)}
            {renderInfoItem(
              "Trạng thái sức khỏe",
              getHealthStatus(healthRecord),
              true
            )}
            {renderInfoItem(
              "Cập nhật lần cuối",
              formatDate(healthRecord.updatedAt)
            )}
          </>
        )}

        {/* Thông tin thể chất */}
        {renderInfoSection(
          "Thông tin thể chất",
          "user-md",
          <>
            {renderInfoItem("Thị lực", healthRecord.vision)}
            {renderInfoItem("Thính lực", healthRecord.hearing)}
          </>,
          "#52c41a"
        )}

        {/* Bệnh mãn tính */}
        {renderListSection(
          "Bệnh mãn tính",
          healthRecord.chronicDiseases,
          "heartbeat",
          "Không có bệnh mãn tính nào được ghi nhận",
          "#fa8c16",
          { backgroundColor: "#fff7e6", borderColor: "#ffd591" }
        )}

        {/* Dị ứng */}
        {renderListSection(
          "Dị ứng",
          healthRecord.allergies,
          "exclamation-triangle",
          "Không có dị ứng nào được ghi nhận",
          "#ff4d4f",
          { backgroundColor: "#fff1f0", borderColor: "#ffccc7" }
        )}

        {/* Tiền sử điều trị */}
        {renderListSection(
          "Tiền sử điều trị",
          healthRecord.pastTreatments,
          "history",
          "Chưa có tiền sử điều trị nào được ghi nhận",
          "#722ed1"
        )}

        {/* Lịch sử tiêm chủng */}
        {renderListSection(
          "Lịch sử tiêm chủng",
          healthRecord.vaccinationHistory,
          "syringe",
          "Chưa có thông tin tiêm chủng",
          "#13c2c2"
        )}

        {/* Thông tin hệ thống */}
        {renderInfoSection(
          "Thông tin hệ thống",
          "cog",
          <>
            {renderInfoItem("ID hồ sơ", healthRecord._id)}
            {renderInfoItem("Tạo lúc", formatDate(healthRecord.createdAt))}
            {renderInfoItem("Cập nhật lúc", formatDate(healthRecord.updatedAt))}
          </>,
          "#8c8c8c"
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 2,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#262626",
    marginLeft: 12,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionContent: {
    padding: 20,
    paddingTop: 0,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    color: "#8c8c8c",
    minWidth: 120,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    color: "#262626",
    fontWeight: "500",
    flex: 1,
  },
  importantValue: {
    fontWeight: "bold",
    color: "#1890ff",
  },
  noDataValue: {
    color: "#bfbfbf",
    fontStyle: "italic",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  bulletIcon: {
    marginTop: 6,
    marginRight: 12,
  },
  listItemText: {
    fontSize: 14,
    color: "#262626",
    flex: 1,
    lineHeight: 20,
  },
  emptyListText: {
    fontSize: 14,
    color: "#bfbfbf",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8c8c8c",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff4d4f",
    marginTop: 16,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 40,
  },
  yearSelector: {
    marginBottom: 16,
  },
  yearSelectorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 8,
  },
  yearList: {
    flexDirection: "row",
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#262626",
  },
  selectedYearButton: {
    backgroundColor: "#1890ff",
  },
  selectedYearButtonText: {
    color: "#fff",
  },
});
