import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getMedicineById, getSupplyById } from "../../../../../lib/api";
import { MedicalEvent } from "../../../../../lib/types";


export default function MedicalEventDetailScreen() {
  const router = useRouter();
  const { id, eventName } = useLocalSearchParams<{
    id: string;
    eventName: string;
  }>();

  const [medicalEvent, setMedicalEvent] = useState<MedicalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [medicinesDetails, setMedicinesDetails] = useState<any[]>([]);
  const [suppliesDetails, setSuppliesDetails] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadMedicalEventDetail();
    }
  }, [id]);

  const loadMedicalEventDetail = async () => {
    try {
      setLoading(true);
      const response = await api.getMedicalEventById(id!);

      if (response.success && response.data) {
        setMedicalEvent(response.data);
        
        // Load medicines details
        if (response.data.medicinesUsed && response.data.medicinesUsed.length > 0) {
          await loadMedicinesDetails(response.data.medicinesUsed);
        }
        
        // Load supplies details
        if (response.data.medicalSuppliesUsed && response.data.medicalSuppliesUsed.length > 0) {
          await loadSuppliesDetails(response.data.medicalSuppliesUsed);
        }
      }
    } catch (error: any) {
      console.error("❌ Load medical event detail error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải chi tiết Sự cố y tế"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadMedicinesDetails = async (medicinesUsed: any[]) => {
    try {
      const medicinesPromises = medicinesUsed.map(async (medicineUsed) => {
        try {
          const medicineResponse = await getMedicineById(medicineUsed.medicineId);
          return {
            ...medicineResponse.data,
            quantityUsed: medicineUsed.quantity,
            _id: medicineUsed._id
          };
        } catch (error) {
          console.error(`❌ Error loading medicine ${medicineUsed.medicineId}:`, error);
          return {
            _id: medicineUsed._id,
            name: "Không thể tải thông tin thuốc",
            quantityUsed: medicineUsed.quantity,
            description: "Lỗi khi tải dữ liệu"
          };
        }
      });
      
      const medicinesData = await Promise.all(medicinesPromises);
      setMedicinesDetails(medicinesData);
    } catch (error) {
      console.error("❌ Error loading medicines details:", error);
    }
  };

  const loadSuppliesDetails = async (suppliesUsed: any[]) => {
    try {
      const suppliesPromises = suppliesUsed.map(async (supplyUsed) => {
        try {
          const supplyResponse = await getSupplyById(supplyUsed.supplyId);
          return {
            ...supplyResponse.data,
            quantityUsed: supplyUsed.quantity,
            _id: supplyUsed._id
          };
        } catch (error) {
          console.error(`❌ Error loading supply ${supplyUsed.supplyId}:`, error);
          return {
            _id: supplyUsed._id,
            name: `Vật tư y tế (ID: ${supplyUsed.supplyId})`,
            description: "Không thể tải thông tin chi tiết",
            quantityUsed: supplyUsed.quantity,
            supplyId: supplyUsed.supplyId
          };
        }
      });

      const suppliesData = await Promise.all(suppliesPromises);
      setSuppliesDetails(suppliesData);
    } catch (error) {
      console.error("❌ Error loading supplies details:", error);
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

  const getSeverityColor = (severityLevel: string) => {
    switch (severityLevel) {
      case 'Critical':
        return "#ff4d4f";
      case 'Moderate':
        return "#fa8c16";
      case 'Mild':
        return "#52c41a";
      default:
        return "#8c8c8c";
    }
  };

  const getSeverityText = (severityLevel: string) => {
    if (!severityLevel) {
      console.warn('⚠️ Medical event severityLevel is null/undefined');
      return "Chưa phân loại";
    }
    
    switch (severityLevel) {
      case 'Critical':
        return "Nghiêm trọng";
      case 'Moderate':
        return "Trung bình";
      case 'Mild':
        return "Nhẹ";
      default:
        console.warn('⚠️ Unknown severity level:', severityLevel);
        return `Mức độ: ${severityLevel}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'treated':
        return "#52c41a";
      case 'monitoring':
        return "#1890ff";
      case 'transferred':
        return "#fa8c16";
      default:
        return "#8c8c8c";
    }
  };

  const getStatusText = (status: string) => {
    if (!status) {
      console.warn('⚠️ Medical event status is null/undefined');
      return "Chưa cập nhật";
    }
    
    switch (status?.toLowerCase()) {
      case 'treated':
        return "Đã điều trị";
      case 'monitoring':
        return "Đang theo dõi";
      case 'transferred':
        return "Đã chuyển viện";
      default:
        console.warn('⚠️ Unknown medical event status:', status);
        return `Trạng thái: ${status}`;
    }
  };

  const getLeaveMethodText = (leaveMethod: string) => {
    if (!leaveMethod) {
      console.warn('⚠️ Medical event leaveMethod is null/undefined');
      return "Chưa xác định";
    }
    
    switch (leaveMethod?.toLowerCase()) {
      case 'parent_pickup':
        return "Phụ huynh đón";
      case 'hospital_transfer':
        return "Chuyển viện";
      case 'none':
        return "Không rời khỏi trường";
      default:
        console.warn('⚠️ Unknown leave method:', leaveMethod);
        return `Phương thức: ${leaveMethod}`;
    }
  };

  const getParentContactStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'not_contacted':
        return "Chưa liên lạc";
      case 'contacting':
        return "Đang liên lạc";
      case 'contacted':
        return "Đã liên lạc";
      default:
        return "Không xác định";
    }
  };

  const getParentContactStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'not_contacted':
        return "#ff4d4f";
      case 'contacting':
        return "#faad14";
      case 'contacted':
        return "#52c41a";
      default:
        return "#8c8c8c";
    }
  };

  const renderInfoSection = (
    title: string,
    icon: string,
    children: React.ReactNode,
    iconColor: string = "#ff7875"
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

  const renderMedicineItem = (medicine: any, index: number) => (
    <View key={medicine._id} style={styles.medicineCard}>
      <View style={styles.medicineHeader}>
        <FontAwesome5 name="pills" size={16} color="#fa8c16" />
        <Text style={styles.medicineName}>{medicine.name}</Text>
      </View>
      <Text style={styles.medicineDescription}>{medicine.description}</Text>
      <View style={styles.medicineDetails}>
        <View style={styles.medicineDetailItem}>
          <Text style={styles.medicineDetailLabel}>Số lượng sử dụng:</Text>
          <Text style={styles.medicineDetailValue}>{medicine.quantityUsed || 'N/A'}</Text>
        </View>
        {medicine.dosage && (
          <View style={styles.medicineDetailItem}>
            <Text style={styles.medicineDetailLabel}>Liều lượng:</Text>
            <Text style={styles.medicineDetailValue}>{medicine.dosage}</Text>
          </View>
        )}
        {medicine.sideEffects && (
          <View style={styles.medicineDetailItem}>
            <Text style={styles.medicineDetailLabel}>Tác dụng phụ:</Text>
            <Text style={styles.medicineDetailValue}>{medicine.sideEffects}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderSupplyItem = (supply: any, index: number) => (
    <View key={supply._id} style={styles.supplyCard}>
      <View style={styles.supplyHeader}>
        <FontAwesome5 name="box" size={16} color="#13c2c2" />
        <Text style={styles.supplyName}>{supply.name}</Text>
      </View>
      <Text style={styles.supplyDescription}>{supply.description}</Text>
      <View style={styles.supplyDetails}>
        <View style={styles.supplyDetailItem}>
          <Text style={styles.supplyDetailLabel}>Số lượng sử dụng:</Text>
          <Text style={styles.supplyDetailValue}>{supply.quantityUsed || 'N/A'}</Text>
        </View>
        {supply.quantity && supply.unit && (
          <View style={styles.supplyDetailItem}>
            <Text style={styles.supplyDetailLabel}>Số lượng tồn kho:</Text>
            <Text style={styles.supplyDetailValue}>
              {supply.quantity} {supply.unit}
            </Text>
          </View>
        )}
        {supply.supplier && (
          <View style={styles.supplyDetailItem}>
            <Text style={styles.supplyDetailLabel}>Nhà cung cấp:</Text>
            <Text style={styles.supplyDetailValue}>{supply.supplier}</Text>
          </View>
        )}
        {supply.expiryDate && (
          <View style={styles.supplyDetailItem}>
            <Text style={styles.supplyDetailLabel}>Hạn sử dụng:</Text>
            <Text style={styles.supplyDetailValue}>
              {new Date(supply.expiryDate).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff7875" />
          <Text style={styles.loadingText}>Đang tải chi tiết sự kiện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!medicalEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={64} color="#ff4d4f" />
          <Text style={styles.errorTitle}>Không tìm thấy sự kiện</Text>
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
          colors={["#ff7875", "#ff9c6e"]}
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
              <FontAwesome5 name="first-aid" size={24} color="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Chi tiết Sự kiện</Text>
                <Text style={styles.headerSubtitle}>
                  {medicalEvent.eventName}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(medicalEvent.status) },
              ]}
            >
              <FontAwesome5
                name={medicalEvent.status === 'transferred' ? "ambulance" : medicalEvent.status === 'treated' ? "check" : "clock"}
                size={12}
                color="#fff"
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin tổng quan */}
        {renderInfoSection(
          "Thông tin sự kiện",
          "info-circle",
          <>
            {renderInfoItem("Tên sự kiện", medicalEvent.eventName, true)}
            {renderInfoItem(
              "Trạng thái",
              getStatusText(medicalEvent.status),
              true
            )}
            {medicalEvent.initialCondition && renderInfoItem("Tình trạng ban đầu", medicalEvent.initialCondition, true)}
            {medicalEvent.firstAid && renderInfoItem("Sơ cứu ban đầu", medicalEvent.firstAid, true)}
            {renderInfoItem("Mô tả", medicalEvent.description)}
            {renderInfoItem("Hành động đã thực hiện", medicalEvent.actionTaken)}
            {renderInfoItem("Ghi chú", medicalEvent.notes)}
            {medicalEvent.images && medicalEvent.images.length > 0 && (
              <View style={styles.imagesSection}>
                <Text style={styles.imagesLabel}>Hình ảnh ({medicalEvent.images.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                  {medicalEvent.images.map((imageUrl, index) => (
                    <TouchableOpacity key={index} style={styles.imageWrapper}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.eventImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {renderInfoItem(
              "Thời gian xảy ra",
              formatDate(medicalEvent.createdAt)
            )}
            {/* Legacy field for backward compatibility */}
            {medicalEvent.severityLevel && renderInfoItem(
              "Mức độ nghiêm trọng",
              getSeverityText(medicalEvent.severityLevel),
              true
            )}
          </>
        )}

        {/* Thông tin học sinh */}
        {medicalEvent.student &&
          renderInfoSection(
            "Thông tin học sinh",
            "user-graduate",
            <>
              {renderInfoItem("Họ và tên", medicalEvent.student.fullName, true)}
              {renderInfoItem("Mã học sinh", medicalEvent.student.studentIdCode)}
              {renderInfoItem(
                "Giới tính",
                medicalEvent.student.gender === "male" ? "Nam" : "Nữ"
              )}
              {renderInfoItem(
                "Ngày sinh",
                new Date(medicalEvent.student.dob).toLocaleDateString("vi-VN")
              )}
              {medicalEvent.student.avatar && (
                <View style={styles.avatarContainer}>
                  <Text style={styles.infoLabel}>Ảnh đại diện:</Text>
                  <Image
                    source={{ uri: medicalEvent.student.avatar }}
                    style={styles.studentAvatar}
                    defaultSource={require("../../../../../assets/images/react-logo.png")}
                  />
                </View>
              )}
            </>,
            "#1890ff"
          )}

        {/* Thông tin y tá */}
        {medicalEvent.schoolNurse &&
          renderInfoSection(
            "Y tá phụ trách",
            "user-md",
            <>
              {renderInfoItem(
                "Họ và tên",
                medicalEvent.schoolNurse.fullName,
                true
              )}
              {/* {renderInfoItem("Email", medicalEvent.schoolNurse.email)} */}
              {renderInfoItem("Số điện thoại", medicalEvent.schoolNurse.phone)}
              {medicalEvent.schoolNurse.image && (
                <View style={styles.avatarContainer}>
                  <Text style={styles.infoLabel}>Ảnh đại diện:</Text>
                  <Image
                    source={{ uri: medicalEvent.schoolNurse.image }}
                    style={styles.nurseAvatar}
                    defaultSource={require("../../../../../assets/images/react-logo.png")}
                  />
                </View>
              )}
            </>,
            "#722ed1"
          )}

        {/* Timeline hành động */}
        {medicalEvent.actions && medicalEvent.actions.length > 0 && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="history" size={18} color="#1890ff" />
              <Text style={styles.sectionTitle}>Lịch sử hành động</Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: "#1890ff" + "20" },
                ]}
              >
                <Text style={[styles.countText, { color: "#1890ff" }]}>
                  {medicalEvent.actions.length}
                </Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {medicalEvent.actions.map((action, index) => (
                <View key={index} style={styles.actionItem}>
                  <View style={styles.actionTimeContainer}>
                    <FontAwesome5 name="clock" size={12} color="#8c8c8c" />
                    <Text style={styles.actionTime}>
                      {formatDate(action.time)}
                    </Text>
                  </View>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                  <Text style={styles.actionPerformedBy}>Thực hiện bởi: {action.performedBy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Thông tin rời khỏi trường và liên lạc phụ huynh */}
        {(medicalEvent.leaveMethod !== 'none' || medicalEvent.parentContactStatus !== 'not_contacted') &&
          renderInfoSection(
            "Thông tin rời khỏi trường & Liên lạc phụ huynh",
            "phone",
            <>
              {medicalEvent.leaveMethod && medicalEvent.leaveMethod !== 'none' && (
                <>
                  {renderInfoItem(
                    "Phương thức rời khỏi trường",
                    getLeaveMethodText(medicalEvent.leaveMethod),
                    true
                  )}
                  {medicalEvent.leaveTime && renderInfoItem(
                    "Thời gian rời khỏi",
                    formatDate(medicalEvent.leaveTime)
                  )}
                  {medicalEvent.pickedUpBy && renderInfoItem(
                    "Người đón",
                    medicalEvent.pickedUpBy
                  )}
                </>
              )}
              {renderInfoItem(
                "Trạng thái liên lạc phụ huynh",
                getParentContactStatusText(medicalEvent.parentContactStatus),
                true
              )}
              {medicalEvent.parentContactedAt && renderInfoItem(
                "Thời gian liên lạc",
                formatDate(medicalEvent.parentContactedAt)
              )}
            </>,
            "#52c41a"
          )}

        {/* Thuốc đã sử dụng */}
        {medicinesDetails && medicinesDetails.length > 0 && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="pills" size={18} color="#fa8c16" />
              <Text style={styles.sectionTitle}>Thuốc đã sử dụng</Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: "#fa8c16" + "20" },
                ]}
              >
                <Text style={[styles.countText, { color: "#fa8c16" }]}>
                  {medicinesDetails.length}
                </Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              {medicinesDetails.map((medicine, index) =>
                renderMedicineItem(medicine, index)
              )}
            </View>
          </View>
        )}

        {/* Vật tư y tế đã sử dụng */}
        {suppliesDetails &&
          suppliesDetails.length > 0 && (
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="first-aid" size={18} color="#13c2c2" />
                <Text style={styles.sectionTitle}>Vật tư y tế đã sử dụng</Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: "#13c2c2" + "20" },
                  ]}
                >
                  <Text style={[styles.countText, { color: "#13c2c2" }]}>
                    {suppliesDetails.length}
                  </Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                {suppliesDetails.map((supply, index) =>
                  renderSupplyItem(supply, index)
                )}
              </View>
            </View>
          )}

        {/* Thông tin hệ thống */}
        {renderInfoSection(
          "Thông tin hệ thống",
          "cog",
          <>
            {/* {renderInfoItem("ID sự kiện", medicalEvent._id)} */}
            {renderInfoItem("Tạo lúc", formatDate(medicalEvent.createdAt))}
            {renderInfoItem("Cập nhật lúc", formatDate(medicalEvent.updatedAt))}
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
    color: "#ff7875",
  },
  noDataValue: {
    color: "#bfbfbf",
    fontStyle: "italic",
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
  },
  nurseAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
  },
  medicineCard: {
    backgroundColor: "#fff7e6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffd591",
  },
  medicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d46b08",
    marginLeft: 8,
  },
  medicineDescription: {
    fontSize: 14,
    color: "#8c8c8c",
    marginBottom: 12,
  },
  medicineDetails: {
    gap: 8,
  },
  medicineDetailItem: {
    flexDirection: "row",
  },
  medicineDetailLabel: {
    fontSize: 12,
    color: "#8c8c8c",
    minWidth: 80,
  },
  medicineDetailValue: {
    fontSize: 12,
    color: "#d46b08",
    fontWeight: "500",
    flex: 1,
  },
  supplyCard: {
    backgroundColor: "#f0fcff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#87e8de",
  },
  supplyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  supplyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#006d75",
    marginLeft: 8,
  },
  supplyDescription: {
    fontSize: 14,
    color: "#8c8c8c",
    marginBottom: 12,
  },
  supplyDetails: {
    gap: 8,
  },
  supplyDetailItem: {
    flexDirection: "row",
  },
  supplyDetailLabel: {
    fontSize: 12,
    color: "#8c8c8c",
    minWidth: 100,
  },
  supplyDetailValue: {
    fontSize: 12,
    color: "#006d75",
    fontWeight: "500",
    flex: 1,
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
    backgroundColor: "#ff7875",
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
  imagesSection: {
    marginVertical: 12,
  },
  imagesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: "row",
  },
  imageWrapper: {
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  eventImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  actionItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#1890ff",
  },
  actionTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  actionTime: {
    fontSize: 12,
    color: "#8c8c8c",
    marginLeft: 6,
    fontWeight: "500",
  },
  actionDescription: {
    fontSize: 14,
    color: "#262626",
    fontWeight: "600",
    marginBottom: 4,
  },
  actionPerformedBy: {
    fontSize: 12,
    color: "#1890ff",
    fontStyle: "italic",
  },
});
