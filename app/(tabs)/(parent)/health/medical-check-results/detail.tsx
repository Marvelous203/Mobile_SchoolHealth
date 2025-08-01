"use client";

import { getMedicalCheckAppointmentDetail } from "@/lib/api";
import { MedicalCheckAppointment, PostMedicalCheckStatus } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Using interface from types.ts

export default function MedicalCheckResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medicalCheckResult, setMedicalCheckResult] = useState<MedicalCheckAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (id) {
      loadMedicalCheckResultDetail();
    }
  }, [id]);

  const loadMedicalCheckResultDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getMedicalCheckAppointmentDetail(id!);
      setMedicalCheckResult(response.data);
    } catch (error) {
      console.error("❌ Load medical check result detail error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMedicalCheckResultDetail();
    setIsRefreshing(false);
  };

  const getHealthStatusConfig = (isEligible: boolean) => {
    return isEligible
      ? {
          color: "#10B981",
          bgColor: "#ECFDF5",
          text: "Đủ điều kiện",
          icon: "checkmark-circle" as const,
        }
      : {
          color: "#EF4444",
          bgColor: "#FEF2F2",
          text: "Không đủ điều kiện",
          icon: "warning" as const,
        };
  };

  const getPostCheckStatusConfig = (status: PostMedicalCheckStatus) => {
    switch (status) {
      case PostMedicalCheckStatus.Healthy:
        return {
          color: "#10B981",
          bgColor: "#ECFDF5",
          text: "Khỏe mạnh",
        };
      case PostMedicalCheckStatus.NeedFollowUp:
        return {
          color: "#F59E0B",
          bgColor: "#FFFBEB",
          text: "Cần theo dõi",
        };
      case PostMedicalCheckStatus.Sick:
        return {
          color: "#EF4444",
          bgColor: "#FEF2F2",
          text: "Phát hiện bệnh",
        };
      case PostMedicalCheckStatus.Other:
        return {
          color: "#8B5CF6",
          bgColor: "#F3E8FF",
          text: "Khác",
        };
      case PostMedicalCheckStatus.NotChecked:
      default:
        return {
          color: "#6B7280",
          bgColor: "#F9FAFB",
          text: "Chưa đánh giá",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: "Thiếu cân", color: "#f59e0b" };
    if (bmi < 25) return { text: "Bình thường", color: "#10b981" };
    if (bmi < 30) return { text: "Thừa cân", color: "#f59e0b" };
    return { text: "Béo phì", color: "#ef4444" };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Đang tải chi tiết kết quả...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!medicalCheckResult) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Không tìm thấy kết quả</Text>
          <Text style={styles.errorText}>
            Kết quả khám sức khỏe này có thể đã bị xóa hoặc không tồn tại.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const healthConfig = getHealthStatusConfig(medicalCheckResult.isHealthy ?? true);
  const postCheckConfig = getPostCheckStatusConfig(medicalCheckResult.postMedicalCheckStatus);
  const bmi = medicalCheckResult.bmi?.toString() || "0";
  const bmiStatus = getBMIStatus(medicalCheckResult.bmi || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity style={styles.animatedBackButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.animatedHeaderTitle} numberOfLines={1}>
          Chi tiết kết quả khám
        </Text>
        <TouchableOpacity style={styles.animatedShareButton} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={20} color="#1f2937" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.heroBackButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroActionButton} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroActionButton} activeOpacity={0.7}>
                <Ionicons name="bookmark-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={[styles.healthBadge, { backgroundColor: healthConfig.bgColor }]}>
              <Ionicons name={healthConfig.icon as any} size={14} color={healthConfig.color} />
              <Text style={[styles.healthText, { color: healthConfig.color }]}>
                {healthConfig.text}
              </Text>
            </View>

            <Text style={styles.studentName}>
              {medicalCheckResult.student?.fullName || "Học sinh"}
            </Text>

            <View style={styles.studentInfo}>
              <View style={styles.studentIconBadge}>
                <Ionicons name="person" size={20} color="#6366f1" />
              </View>
              {/* <Text style={styles.studentCode}>
                {medicalCheckResult.student?.studentCode || "Mã học sinh"}
              </Text> */}
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Ionicons name="medical-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStatText}>{medicalCheckResult.event?.eventName || "Khám sức khỏe"}</Text>
              </View>
              {medicalCheckResult.event?.location && (
                <View style={styles.heroStatItem}>
                  <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroStatText}>{medicalCheckResult.event.location}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Content Cards */}
        <View style={styles.contentContainer}>
          {/* Status Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="information-circle" size={24} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Thông tin trạng thái</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Tình trạng sức khỏe</Text>
                <View style={[styles.statusBadge, { backgroundColor: healthConfig.bgColor }]}>
                  <Ionicons name={healthConfig.icon as any} size={14} color={healthConfig.color} />
                  <Text style={[styles.statusBadgeText, { color: healthConfig.color }]}>
                    {healthConfig.text}
                  </Text>
                </View>
              </View>

              {/* <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Tình trạng sau khám</Text>
                <View style={[styles.statusBadge, { backgroundColor: postCheckConfig.bgColor }]}>
                  <Ionicons name={postCheckConfig.icon as any} size={14} color={postCheckConfig.color} />
                  <Text style={[styles.statusBadgeText, { color: postCheckConfig.color }]}>
                    {postCheckConfig.text}
                  </Text>
                </View>
              </View> */}
            </View>
          </View>

          {/* Student Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="person" size={24} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Thông tin học sinh</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Họ và tên</Text>
                  <Text style={styles.infoValue}>{medicalCheckResult.student?.fullName || "Không có thông tin"}</Text>
                </View>
              </View>

              {/* <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Mã học sinh</Text>
                  <Text style={styles.infoValue}>{medicalCheckResult.student?.studentCode || "Không có thông tin"}</Text>
                </View>
              </View> */}

              {medicalCheckResult.student?.studentIdCode && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Mã định danh</Text>
                    <Text style={styles.infoValue}>{medicalCheckResult.student.studentIdCode}</Text>
                  </View>
                </View>
              )}

              {medicalCheckResult.student?.gender && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Giới tính</Text>
                    <Text style={styles.infoValue}>
                      {medicalCheckResult.student.gender === "male" ? "Nam" : "Nữ"}
                    </Text>
                  </View>
                </View>
              )}

              {medicalCheckResult.student?.dob && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ngày sinh</Text>
                    <Text style={styles.infoValue}>{formatDate(medicalCheckResult.student.dob)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Physical Measurements Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="fitness" size={24} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Chỉ số cơ thể</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.measurementGrid}>
                <View style={styles.measurementCard}>
                  <Ionicons name="resize" size={20} color="#6366f1" />
                  <Text style={styles.measurementLabel}>Chiều cao</Text>
                  <Text style={styles.measurementValue}>{medicalCheckResult.height} cm</Text>
                </View>
                <View style={styles.measurementCard}>
                  <Ionicons name="scale" size={20} color="#10b981" />
                  <Text style={styles.measurementLabel}>Cân nặng</Text>
                  <Text style={styles.measurementValue}>{medicalCheckResult.weight} kg</Text>
                </View>
              </View>

              <View style={styles.bmiContainer}>
                <View style={styles.bmiHeader}>
                  <Ionicons name="analytics" size={20} color="#f59e0b" />
                  <Text style={styles.bmiLabel}>Chỉ số BMI</Text>
                </View>
                <View style={styles.bmiContent}>
                  <Text style={styles.bmiValue}>{bmi}</Text>
                  <View style={[styles.bmiStatusBadge, { backgroundColor: `${bmiStatus.color}20` }]}>
                    <Text style={[styles.bmiStatusText, { color: bmiStatus.color }]}>
                      {bmiStatus.text}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.vitalSignsGrid}>
                <View style={styles.vitalSignCard}>
                  <Ionicons name="heart" size={16} color="#ef4444" />
                  <Text style={styles.vitalSignLabel}>Huyết áp</Text>
                  <Text style={styles.vitalSignValue}>{medicalCheckResult.bloodPressure}</Text>
                </View>
                <View style={styles.vitalSignCard}>
                  <Ionicons name="pulse" size={16} color="#f59e0b" />
                  <Text style={styles.vitalSignLabel}>Nhịp tim</Text>
                  <Text style={styles.vitalSignValue}>{medicalCheckResult.heartRate} bpm</Text>
                </View>
              </View>

              <View style={styles.visionContainer}>
                <Text style={styles.visionTitle}>Thị lực</Text>
                <View style={styles.visionGrid}>
                  <View style={styles.visionCard}>
                    <Ionicons name="eye" size={16} color="#6366f1" />
                    <Text style={styles.visionLabel}>Mắt trái</Text>
                    <Text style={styles.visionValue}>{medicalCheckResult.visionLeft}/10</Text>
                  </View>
                  <View style={styles.visionCard}>
                    <Ionicons name="eye" size={16} color="#6366f1" />
                    <Text style={styles.visionLabel}>Mắt phải</Text>
                    <Text style={styles.visionValue}>{medicalCheckResult.visionRight}/10</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Event Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="medical" size={24} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Thông tin sự kiện</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tên sự kiện</Text>
                  <Text style={styles.infoValue}>{medicalCheckResult.event?.eventName || "Không có thông tin"}</Text>
                </View>
              </View>

              {medicalCheckResult.event?.description && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Mô tả</Text>
                    <Text style={styles.infoValue}>{medicalCheckResult.event.description}</Text>
                  </View>
                </View>
              )}

              {medicalCheckResult.event?.location && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Địa điểm</Text>
                    <Text style={styles.infoValue}>{medicalCheckResult.event.location}</Text>
                  </View>
                </View>
              )}

              {medicalCheckResult.event?.eventDate && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ngày khám</Text>
                    <Text style={styles.infoValue}>{formatDate(medicalCheckResult.event.eventDate)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Năm học</Text>
                  <Text style={styles.infoValue}>{medicalCheckResult.schoolYear}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Health Examination Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="medical" size={24} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Chi tiết khám sức khỏe</Text>
            </View>

            <View style={styles.cardContent}>
              {medicalCheckResult.dentalHealth && (
                <View style={styles.healthDetailCard}>
                  <View style={styles.healthDetailHeader}>
                    <Ionicons name="happy" size={20} color="#6366f1" />
                    <Text style={styles.healthDetailTitle}>Tình trạng răng miệng</Text>
                  </View>
                  <Text style={styles.healthDetailValue}>{medicalCheckResult.dentalHealth}</Text>
                </View>
              )}

              {medicalCheckResult.entHealth && (
                <View style={styles.healthDetailCard}>
                  <View style={styles.healthDetailHeader}>
                    <Ionicons name="ear" size={20} color="#f59e0b" />
                    <Text style={styles.healthDetailTitle}>Tai mũi họng</Text>
                  </View>
                  <Text style={styles.healthDetailValue}>{medicalCheckResult.entHealth}</Text>
                </View>
              )}

              {medicalCheckResult.skinCondition && (
                <View style={styles.healthDetailCard}>
                  <View style={styles.healthDetailHeader}>
                    <Ionicons name="hand-left" size={20} color="#ef4444" />
                    <Text style={styles.healthDetailTitle}>Tình trạng da</Text>
                  </View>
                  <Text style={styles.healthDetailValue}>{medicalCheckResult.skinCondition}</Text>
                </View>
              )}

              {!medicalCheckResult.isHealthy && medicalCheckResult.reasonIfUnhealthy && (
                <View style={styles.healthDetailCard}>
                  <View style={styles.healthDetailHeader}>
                    <Ionicons name="warning" size={20} color="#ef4444" />
                    <Text style={styles.healthDetailTitle}>Lý do không khỏe mạnh</Text>
                  </View>
                  <Text style={[styles.healthDetailValue, { color: '#ef4444' }]}>{medicalCheckResult.reasonIfUnhealthy}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Medical Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="medical-outline" size={24} color="#ef4444" />
              </View>
              <Text style={styles.cardTitle}>Thông tin y tế</Text>
            </View>

            <View style={styles.cardContent}>
              {medicalCheckResult.checkedBy && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Bác sĩ khám</Text>
                    <Text style={styles.infoValue}>{medicalCheckResult.checkedBy.fullName || 'Không có thông tin'}</Text>
                  </View>
                </View>
              )}

              {medicalCheckResult.medicalCheckedAt && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Thời gian khám</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(medicalCheckResult.medicalCheckedAt)} lúc {formatTime(medicalCheckResult.medicalCheckedAt)}
                    </Text>
                  </View>
                </View>
              )}

              {medicalCheckResult.notes && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Ghi chú khám</Text>
                    <Text style={styles.infoValue}>{medicalCheckResult.notes}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tình trạng sức khỏe tổng quát</Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: medicalCheckResult.isHealthy ? '#ECFDF5' : '#FEF2F2' 
                  }]}>
                    <Ionicons 
                      name={medicalCheckResult.isHealthy ? 'checkmark-circle' : 'warning'} 
                      size={14} 
                      color={medicalCheckResult.isHealthy ? '#10B981' : '#EF4444'} 
                    />
                    <Text style={[styles.statusBadgeText, { 
                      color: medicalCheckResult.isHealthy ? '#10B981' : '#EF4444' 
                    }]}>
                      {medicalCheckResult.isHealthy ? 'Khỏe mạnh' : 'Có vấn đề sức khỏe'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  animatedBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  animatedHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginHorizontal: 16,
  },
  animatedShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroActions: {
    flexDirection: "row",
    gap: 12,
  },
  heroActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  healthText: {
    fontSize: 14,
    fontWeight: "600",
  },
  studentName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  studentIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  studentCode: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  heroStats: {
    alignItems: "center",
    gap: 8,
  },
  heroStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroStatText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  cardContent: {
    gap: 16,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    marginBottom: 12,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "600",
  },
  measurementGrid: {
    flexDirection: "row",
    gap: 12,
  },
  measurementCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  measurementLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  measurementValue: {
    fontSize: 18,
    color: "#1f2937",
    fontWeight: "bold",
  },
  bmiContainer: {
    backgroundColor: "#fffbeb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  bmiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  bmiLabel: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "600",
  },
  bmiContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bmiValue: {
    fontSize: 24,
    color: "#92400e",
    fontWeight: "bold",
  },
  bmiStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bmiStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  vitalSignsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  vitalSignCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  vitalSignLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  vitalSignValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "bold",
  },
  visionContainer: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  visionTitle: {
    fontSize: 14,
    color: "#0c4a6e",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  visionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  visionCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  visionLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  visionValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "bold",
  },
  healthDetailCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  healthDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  healthDetailTitle: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  healthDetailValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
    lineHeight: 20,
  },
});