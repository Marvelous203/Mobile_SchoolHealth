"use client";

import { api, getCurrentUserId } from "@/lib/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Type definitions
interface HealthCheckRegistration {
  _id: string;
  parentId: string;
  studentId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected" | "expired";
  note?: string;
  isDeleted: boolean;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  student: {
    _id: string;
    fullName: string;
    isDeleted: boolean;
    gender: string;
    dob: string;
    classId: string;
    avatar: string;
    studentCode: string;
    parents: {
      userId: string;
      type: string;
    }[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  event: {
    _id: string;
    eventName: string;
    gradeId: string;
    description: string;
    location: string;
    startRegistrationDate: string;
    endRegistrationDate: string;
    eventDate: string;
    schoolYear: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  } | null;
  parent: {
    _id: string;
    password: string;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    studentIds: string[];
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  studentName?: string;
  eventName?: string;
}

// Cập nhật interface HealthCheckHistory
interface HealthCheckHistory {
  _id: string;
  parentId: string;
  studentId: string;
  eventId: string;
  status: string;
  note?: string;
  isDeleted: boolean;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  student: {
    _id: string;
    fullName: string;
    isDeleted: boolean;
    gender: string;
    dob: string;
    classId: string;
    avatar: string;
    studentCode: string;
    parents: {
      userId: string;
      type: string;
    }[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  event: {
    _id: string;
    eventName: string;
    gradeId: string;
    description: string;
    location: string;
    startRegistrationDate: string;
    endRegistrationDate: string;
    eventDate: string;
    schoolYear: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  } | null;
  parent: {
    _id: string;
    password: string;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    studentIds: string[];
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface Student {
  _id: string;
  fullName: string;
  classInfo?: {
    name: string;
  };
}

type TabType = "registrations" | "history";

export default function HealthCheckupsScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [healthCheckRegistrations, setHealthCheckRegistrations] = useState<
    HealthCheckRegistration[]
  >([]);
  const [healthCheckHistory, setHealthCheckHistory] = useState<
    HealthCheckHistory[]
  >([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<TabType>("registrations");
  const [selectedRegistrationStatus, setSelectedRegistrationStatus] = useState<"pending" | "approved" | "rejected" | "expired" | "all">("all");
  const [allRegistrations, setAllRegistrations] = useState<HealthCheckRegistration[]>([]);

  // School Year Selection
  const [selectedSchoolYear, setSelectedSchoolYear] =
    useState<string>("2025-2026");
  const [availableSchoolYears] = useState<string[]>([
    "2025-2026",
    "2026-2027",
    "2027-2028",
  ]);

  // Student Selection
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentCollapsed, setIsStudentCollapsed] = useState(true);
  const [studentAnimation] = useState(new Animated.Value(0));

  // Load students function
  const loadStudents = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const userResponse = await api.getUserProfile(userId);
      if (userResponse.success && userResponse.data.studentIds) {
        const studentPromises = userResponse.data.studentIds.map((id: string) =>
          api.getStudentProfile(id)
        );

        const studentResponses = await Promise.all(studentPromises);
        const loadedStudents = studentResponses
          .filter((res) => res.success)
          .map((res) => res.data);

        setStudents(loadedStudents);
        if (loadedStudents.length === 1) {
          setSelectedStudent(loadedStudents[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  // Toggle student selection
  const toggleStudent = () => {
    const toValue = isStudentCollapsed ? 1 : 0;
    setIsStudentCollapsed(!isStudentCollapsed);
    Animated.timing(studentAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const loadData = async (
    page: number = 1,
    refresh: boolean = false
  ): Promise<void> => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load health check registrations from API
      if (activeTab === "registrations") {
        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            setHealthCheckRegistrations([]);
            return;
          }

          const params: any = {
            pageNum: page,
            pageSize: 10,
            parentId: userId,
          };
          
          // Only add schoolYear if it's not empty/default
          if (selectedSchoolYear && selectedSchoolYear !== '') {
            params.schoolYear = selectedSchoolYear;
          }

          // Add studentId if a student is selected
          if (selectedStudent) {
            params.studentId = selectedStudent._id;
          }

          // Add status filter if not "all"
          if (selectedRegistrationStatus !== "all") {
            params.status = selectedRegistrationStatus;
          }

          const registrationsResponse = await api.searchHealthCheckRegistrations(params);

          if (refresh || page === 1) {
            setHealthCheckRegistrations(registrationsResponse.pageData || []);
            // If loading "all" registrations, save them for count calculation
            if (selectedRegistrationStatus === "all") {
              setAllRegistrations(registrationsResponse.pageData || []);
            }
          } else {
            setHealthCheckRegistrations((prev) => [
              ...prev,
              ...(registrationsResponse.pageData || []),
            ]);
          }
          setCurrentPage(registrationsResponse.pageInfo?.pageNum || 1);
          setTotalPages(registrationsResponse.pageInfo?.totalPages || 1);
        } catch (apiError) {
          console.warn("API call failed, using fallback data:", apiError);
          // Set empty data on API failure to prevent crash
          if (refresh || page === 1) {
            setHealthCheckRegistrations([]);
          }
          setCurrentPage(1);
          setTotalPages(1);
        }
      }

      // Load health check history from API
      if (activeTab === "history") {
        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            setHealthCheckHistory([]);
            return;
          }

          // If no student selected, show empty state but don't crash
          if (!selectedStudent) {
            setHealthCheckHistory([]);
            return;
          }

          const params = {
            pageNum: 1,
            pageSize: 10,
            parentId: userId,
            studentId: selectedStudent._id,
          };

          const historyResponse = await api.searchHealthCheckRegistrations(params);
          console.log('History API Response:', historyResponse);
          console.log('History Data:', historyResponse.pageData);
          
          if (historyResponse.pageData && historyResponse.pageData.length > 0) {
            setHealthCheckHistory(historyResponse.pageData);
            console.log('Updated healthCheckHistory:', historyResponse.pageData);
          } else {
            setHealthCheckHistory([]);
            console.log('Set empty history array');
          }
        } catch (error) {
          console.log("Failed to load health check history:", error);
          setHealthCheckHistory([]);
        }
      }
    } catch (error) {
      console.error("Failed to load health check data", error);
      // Ensure UI doesn't crash by setting safe defaults
      setHealthCheckRegistrations([]);
      setHealthCheckHistory([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMoreData = (): void => {
    if (currentPage < totalPages && !isLoading) {
      loadData(currentPage + 1, false);
    }
  };

  const refreshData = (): void => {
    loadData(1, true);
  };

  // Reset when school year or student changes
  const handleSchoolYearChange = (schoolYear: string): void => {
    setSelectedSchoolYear(schoolYear);
    setHealthCheckRegistrations([]);
    setCurrentPage(1);
    setTotalPages(1);
    // Load data for new school year
    loadData(1, true);
  };

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentCollapsed(true);
    Animated.timing(studentAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Reload data with selected student
    setHealthCheckRegistrations([]);
    setCurrentPage(1);
    setTotalPages(1);
    loadData(1, true);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      // Reset allRegistrations when student or school year changes
      if (selectedSchoolYear || selectedStudent) {
        setAllRegistrations([]);
      }
      
      loadData();
      // Load all registrations for count calculation if not already loaded
      if (selectedRegistrationStatus !== "all" && allRegistrations.length === 0) {
        loadAllRegistrationsForCount();
      }
    }
  }, [selectedSchoolYear, selectedStudent, activeTab, selectedRegistrationStatus]); // Reload when school year, student, tab, or status filter changes

  // Function to load all registrations for count calculation
  const loadAllRegistrationsForCount = async () => {
    if (!selectedStudent) return;
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      
      const params: any = {
        pageNum: 1,
        pageSize: 1000, // Large limit to get all registrations
        studentId: selectedStudent._id,
        parentId: userId,
        // No status filter to get all registrations
      };
      
      // Only add schoolYear if it's not empty/default
      if (selectedSchoolYear && selectedSchoolYear !== '') {
        params.schoolYear = selectedSchoolYear;
      }
      
      const response = await api.searchHealthCheckRegistrations(params);

      if (response.success && response.data) {
        setAllRegistrations(response.data.registrations || []);
      }
    } catch (error) {
      console.error('Error loading all registrations for count:', error);
    }
  };

  // Helper functions
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  // const handleRegisterPress = (eventId: string): void => {
  //   router.push({
  //     pathname: "/(tabs)/(parent)/health/checkups/registration",
  //     params: {
  //       eventId: eventId
  //     }
  //   });
  // }

  const renderSchoolYearSelector = () => (
    <View style={styles.schoolYearContainer}>
      <Text style={styles.schoolYearLabel}>Năm học:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.schoolYearScrollView}
      >
        {availableSchoolYears.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.schoolYearItem,
              selectedSchoolYear === year && styles.schoolYearItemActive,
            ]}
            onPress={() => handleSchoolYearChange(year)}
          >
            <Text
              style={[
                styles.schoolYearText,
                selectedSchoolYear === year && styles.schoolYearTextActive,
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );



  const renderTabButton = (
  tabKey: TabType,
  title: string,
  icon: keyof typeof Ionicons.glyphMap
) => (
  <TouchableOpacity
    style={[styles.tabButton, activeTab === tabKey && styles.tabButtonActive]}
    onPress={() => {
      setActiveTab(tabKey);
      // Load data ngay khi chuyển tab
      if (students.length > 0) {
        loadData(1, true);
      }
    }}
  >
    <Ionicons
      name={icon}
      size={20}
      color={activeTab === tabKey ? "#007AFF" : "#666"}
    />
    <Text
      style={[
        styles.tabButtonText,
        activeTab === tabKey && styles.tabButtonTextActive,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

  const renderEmptyState = (
    message: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );

  const handleHistoryItemPress = (registrationId: string) => {
    router.push(`/health/checkups/registration-detail?registrationId=${registrationId}`);
  };

  const handleRegistrationPress = (registrationId: string) => {
    router.push(`/health/checkups/registration-detail?registrationId=${registrationId}`);
  };

  const renderStatusFilter = () => {
    // Use allRegistrations for count calculation to show accurate counts
    const registrationsForCount = allRegistrations.length > 0 ? allRegistrations : healthCheckRegistrations;
    
    const statusOptions = [
      { key: "all", label: "Tất cả", count: registrationsForCount.length },
      { key: "pending", label: "Chờ duyệt", count: registrationsForCount.filter(r => r.status === "pending").length },
      { key: "approved", label: "Đã duyệt", count: registrationsForCount.filter(r => r.status === "approved").length },
      { key: "rejected", label: "Từ chối", count: registrationsForCount.filter(r => r.status === "rejected").length },
      { key: "expired", label: "Hết hạn", count: registrationsForCount.filter(r => r.status === "expired").length },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilterContainer}
        contentContainerStyle={styles.statusFilterContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.statusFilterButton,
              selectedRegistrationStatus === option.key && styles.statusFilterButtonActive,
            ]}
            onPress={() => {
              setSelectedRegistrationStatus(option.key as any);
              setHealthCheckRegistrations([]);
              setCurrentPage(1);
              setTotalPages(1);
              loadData(1, true);
            }}
          >
            <Text
              style={[
                styles.statusFilterText,
                selectedRegistrationStatus === option.key && styles.statusFilterTextActive,
              ]}
            >
              {option.label} ({option.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const getEmptyStateMessage = () => {
    if (!selectedStudent) {
      return "Vui lòng chọn học sinh";
    }
    
    switch (selectedRegistrationStatus) {
      case "pending":
        return "Không có đăng ký khám sức khỏe nào đang chờ duyệt";
      case "approved":
        return "Không có đăng ký khám sức khỏe nào đã được duyệt";
      case "rejected":
        return "Không có đăng ký khám sức khỏe nào bị từ chối";
      case "expired":
        return "Không có đăng ký khám sức khỏe nào đã hết hạn";
      default:
        return "Không có đăng ký khám sức khỏe nào";
    }
  };

  const renderRegistrationCard = ({ item }: { item: HealthCheckRegistration }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case "pending":
          return {
            color: "#f59e0b",
            bgColor: "#fffbeb",
            text: "Chờ duyệt",
            icon: "time-outline",
          };
        case "approved":
          return {
            color: "#10b981",
            bgColor: "#f0fdf4",
            text: "Đã duyệt",
            icon: "checkmark-circle-outline",
          };
        case "rejected":
          return {
            color: "#ef4444",
            bgColor: "#fef2f2",
            text: "Từ chối",
            icon: "close-circle-outline",
          };
        case "expired":
          return {
            color: "#6b7280",
            bgColor: "#f9fafb",
            text: "Hết hạn",
            icon: "time-outline",
          };
        default:
          return {
            color: "#6b7280",
            bgColor: "#f9fafb",
            text: "Không xác định",
            icon: "help-circle-outline",
          };
      }
    };

    const statusConfig = getStatusConfig(item.status);
    const eventInfo = item.event;

    return (
      <TouchableOpacity
        style={styles.registrationCard}
        onPress={() => handleRegistrationPress(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.registrationHeader}>
          <View style={styles.registrationTitleContainer}>
            <Text style={styles.registrationTitle}>
              {eventInfo?.eventName || "Sự kiện khám sức khỏe"}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <Ionicons
                name={statusConfig.icon as any}
                size={12}
                color={statusConfig.color}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: statusConfig.color },
                ]}
              >
                {statusConfig.text}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.registrationContent}>
          <View style={styles.registrationDetail}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.registrationDetailText}>
              {item.student?.fullName || item.studentName || "Học sinh"}
            </Text>
          </View>

          {eventInfo?.location && (
            <View style={styles.registrationDetail}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.registrationDetailText}>{eventInfo.location}</Text>
            </View>
          )}

          {eventInfo?.eventDate && (
            <View style={styles.registrationDetail}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.registrationDetailText}>
                Ngày khám: {formatDate(eventInfo.eventDate)}
              </Text>
            </View>
          )}

          <View style={styles.registrationDetail}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.registrationDetailText}>
              Đăng ký: {formatDate(item.createdAt)}
            </Text>
          </View>

          {eventInfo?.description && (
            <View style={styles.registrationDetail}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.registrationDetailText} numberOfLines={2}>
                {eventInfo.description}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }: { item: HealthCheckHistory }) => {
    console.log('Rendering history item:', item);
    const getStatusText = (status: string): string => {
      switch (status) {
        case "pending":
          return "Đang chờ xử lý";
        case "approved":
          return "Đã duyệt";
        case "completed":
          return "Đã hoàn thành";
        case "cancelled":
          return "Đã hủy";
        default:
          return "Từ Chối";
      }
    };

    const getStatusColor = (status: string): string => {
      switch (status) {
        case "pending":
          return "#F5A623";
        case "approved":
          return "#7ED321";
        case "completed":
          return "#4A90E2";
        case "cancelled":
          return "#D0021B";
        default:
          return "#D0021B";
      }
    };

    const getStatusBgColor = (status: string): string => {
      switch (status) {
        case "pending":
          return "#FFFBEB";
        case "approved":
          return "#F0FDF4";
        case "completed":
          return "#E8F4FD";
        case "cancelled":
          return "#FEF2F2";
        default:
          return "#F5F5F5";
      }
    };

    // Kiểm tra nếu event null
    if (!item.event) {
      return (
        <TouchableOpacity 
          style={styles.historyCard}
          onPress={() => handleHistoryItemPress(item._id)}
          activeOpacity={0.7}
        >
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Sự kiện không xác định</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(item.status) }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(item.status) }
              ]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.historyDetails}>
            <View style={styles.historyDetailRow}>
              <Text style={styles.historyDetailText}>Ngày đăng ký: {formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.historyDetailRow}>
              <Text style={styles.historyDetailText}>Học sinh: {item.student.fullName}</Text>
            </View>
            {item.note && (
              <View style={styles.historyDetailRow}>
                <Text style={styles.historyDetailText}>Ghi chú: {item.note}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.historyCard}
        onPress={() => handleHistoryItemPress(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{item.event.eventName}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(item.status) }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(item.status) }
            ]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.historyDetails}>
          <View style={styles.historyDetailRow}>
            <Text style={styles.historyDetailText}>Ngày đăng ký: {formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.historyDetailRow}>
            <Text style={styles.historyDetailText}>Ngày khám: {formatDate(item.event.eventDate)}</Text>
          </View>
          <View style={styles.historyDetailRow}>
            <Text style={styles.historyDetailText}>Địa điểm: {item.event.location}</Text>
          </View>
          <View style={styles.historyDetailRow}>
            <Text style={styles.historyDetailText}>Học sinh: {item.student.fullName}</Text>
          </View>
          {item.note && (
            <View style={styles.historyDetailRow}>
              <Text style={styles.historyDetailText}>Ghi chú: {item.note}</Text>
            </View>
          )}
        </View>
        
        {item.status === "completed" && (
          <View style={styles.viewResultButton}>
            <Text style={styles.viewResultButtonText}>Xem kết quả</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Thêm hàm renderStudentSelection
  const renderStudentSelection = () => {
    if (students.length <= 1) return null;

    return (
      <View style={styles.studentContainer}>
        <TouchableOpacity
          style={styles.studentSelector}
          onPress={toggleStudent}
          activeOpacity={0.7}
        >
          <View style={styles.studentSelectorContent}>
            <View style={styles.studentInfo}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.studentLabel}>Học sinh:</Text>
              <Text style={styles.selectedStudentName}>
                {selectedStudent ? selectedStudent.fullName : "Chọn học sinh"}
              </Text>
            </View>
            <Ionicons
              name={isStudentCollapsed ? "chevron-down" : "chevron-up"}
              size={20}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.studentDropdown,
            {
              maxHeight: studentAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
              opacity: studentAnimation,
            },
          ]}
        >
          <ScrollView
            style={styles.studentList}
            showsVerticalScrollIndicator={false}
          >
            {students.map((student) => (
              <TouchableOpacity
                key={student._id}
                style={[
                  styles.studentItem,
                  selectedStudent?._id === student._id &&
                    styles.studentItemSelected,
                ]}
                onPress={() => handleStudentSelect(student)}
              >
                <View style={styles.studentItemContent}>
                  <Text
                    style={[
                      styles.studentItemName,
                      selectedStudent?._id === student._id &&
                        styles.studentItemNameSelected,
                    ]}
                  >
                    {student.fullName}
                  </Text>
                  {student.classInfo && (
                    <Text style={styles.studentItemClass}>
                      {student.classInfo.name}
                    </Text>
                  )}
                </View>
                {selectedStudent?._id === student._id && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Thêm header với button back */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Khám sức khỏe</Text>
        {/* <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleRegisterPress("")}
        >
          <MaterialIcons name="add" size={24} color="#1890ff" />
        </TouchableOpacity> */}
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
      >
        {renderSchoolYearSelector()}
        {renderStudentSelection()}

        <View style={styles.tabContainer}>
          {renderTabButton("registrations", "Đăng ký", "document-text")}
          {renderTabButton("history", "Lịch sử", "time")}
        </View>

        <View style={styles.content}>
          {activeTab === "registrations" && (
            <View style={styles.registrationsContainer}>
              {renderStatusFilter()}
              
              {healthCheckRegistrations.length > 0 ? (
                <View style={styles.modernSection}>
                  <View style={styles.modernSectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={styles.sectionIconContainer}>
                        <MaterialIcons name="assignment" size={24} color="#007AFF" />
                      </View>
                      <View>
                        <Text style={styles.modernSectionTitle}>Đăng ký khám sức khỏe</Text>
                        <Text style={styles.modernSectionSubtitle}>
                          {healthCheckRegistrations.length} đăng ký
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.modernEventsList}>
                    {healthCheckRegistrations.map((item) => (
                      <View key={item._id}>
                        {renderRegistrationCard({ item })}
                      </View>
                    ))}
                  </View>
                  
                  {currentPage < totalPages && (
                    <TouchableOpacity
                      style={styles.modernLoadMoreButton}
                      onPress={loadMoreData}
                      disabled={isLoading}
                    >
                      <Text style={styles.modernLoadMoreText}>
                        {isLoading ? "Đang tải..." : "Tải thêm"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                 !isLoading && (
                   <View style={styles.modernEmptyState}>
                     <View style={styles.emptyIconContainer}>
                       <MaterialIcons name="assignment" size={32} color="#007AFF" />
                     </View>
                     <Text style={styles.emptyTitle}>
                       {getEmptyStateMessage()}
                     </Text>
                     <Text style={styles.emptySubtitle}>
                       {selectedStudent 
                         ? `Các đăng ký khám sức khỏe của ${selectedStudent.fullName} sẽ xuất hiện tại đây`
                         : "Chọn học sinh để xem đăng ký khám sức khỏe"
                       }
                     </Text>
                   </View>
                 )
               )}
            </View>
          )}

          {activeTab === "history" && (
            !selectedStudent ? (
              <View style={styles.modernEmptyState}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="person-outline" size={32} color="#007AFF" />
                </View>
                <Text style={styles.emptyTitle}>
                  Vui lòng chọn học sinh
                </Text>
                <Text style={styles.emptySubtitle}>
                  Chọn học sinh để xem lịch sử khám sức khỏe
                </Text>
              </View>
            ) : healthCheckHistory.length > 0 ? (
              <View style={styles.modernSection}>
                <View style={styles.modernSectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIconContainer}>
                      <MaterialIcons name="history" size={24} color="#007AFF" />
                    </View>
                    <View>
                      <Text style={styles.modernSectionTitle}>Lịch sử khám sức khỏe</Text>
                      <Text style={styles.modernSectionSubtitle}>
                        {healthCheckHistory.length} bản ghi
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.modernEventsList}>
                  {healthCheckHistory.map((item, index) => (
                    <View key={`history-${index}`}>
                      {renderHistoryItem({ item })}
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.modernEmptyState}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="history" size={32} color="#007AFF" />
                </View>
                <Text style={styles.emptyTitle}>
                  Chưa có lịch sử khám sức khỏe
                </Text>
                <Text style={styles.emptySubtitle}>
                  Lịch sử khám sức khỏe của {selectedStudent.fullName} sẽ xuất hiện tại đây
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}





const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  registrationsContainer: {
    flex: 0,
  },
  statusFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusFilterContent: {
    paddingRight: 16,
  },
  statusFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 60,
    alignItems: 'center',
  },
  statusFilterButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
  statusFilterTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  registrationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  registrationHeader: {
    marginBottom: 12,
  },
  registrationTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  registrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  registrationContent: {
    gap: 8,
  },
  registrationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registrationDetailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  schoolYearContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  schoolYearLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  schoolYearScrollView: {
    flexDirection: "row",
  },
  schoolYearItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginRight: 10,
  },
  schoolYearItemActive: {
    backgroundColor: "#007AFF",
  },
  schoolYearText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  schoolYearTextActive: {
    color: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 5,
  },
  tabButtonActive: {
    backgroundColor: "#e8f4fd",
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  tabButtonTextActive: {
    color: "#007AFF",
  },
  content: {
    flex: 0,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modernSection: {
    marginBottom: 32,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  modernSectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  modernEventsList: {
    paddingHorizontal: 20,
  },
  modernLoadMoreButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modernLoadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    minHeight: 200,
    maxHeight: 300,
    justifyContent: 'center',
    flex: 0,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
  },
  eventResult: {
    fontSize: 14,
    color: "#333",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // Thêm styles cho student selection
  studentContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  studentSelector: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  studentSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  studentLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 10,
    color: "#333",
  },
  selectedStudentName: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
    flex: 1,
  },
  studentDropdown: {
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
  },
  studentList: {
    maxHeight: 200,
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  studentItemSelected: {
    backgroundColor: "#e8f4fd",
  },
  studentItemContent: {
    flex: 1,
  },
  studentItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  studentItemNameSelected: {
    color: "#007AFF",
  },
  studentItemClass: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  historyDate: {
    fontSize: 14,
    color: "#666",
  },
  historyResult: {
    fontSize: 14,
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCountBadge: {
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    // Fixed size to prevent stretching
    flexShrink: 0,
  },
  modernStatusFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    // Fixed width to prevent stretching
    minWidth: 80,
    maxWidth: 120,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  historyDetails: {
    marginBottom: 12,
  },
  historyDetailRow: {
    marginBottom: 4,
  },
  historyDetailText: {
    fontSize: 14,
    color: '#666',
  },
  viewResultButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewResultButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  eventContent: {
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: '#fff',
},
eventDetail: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 8,
  paddingVertical: 4,
},
eventDetailText: {
  fontSize: 14,
  color: '#333',
  marginLeft: 8,
  flex: 1,
  lineHeight: 20,
},
});


