"use client";

import { api, getCurrentUserId } from "@/lib/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Type definitions
interface HealthCheckEvent {
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

type TabType = "events" | "history";

export default function HealthCheckupsScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [healthCheckEvents, setHealthCheckEvents] = useState<
    HealthCheckEvent[]
  >([]);
  const [healthCheckHistory, setHealthCheckHistory] = useState<
    HealthCheckHistory[]
  >([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<TabType>("events");

  // School Year Selection
  const [selectedSchoolYear, setSelectedSchoolYear] =
    useState<string>("2025-2026");
  const [availableSchoolYears] = useState<string[]>([
    "2025-2026",
    "2024-2025",
    "2023-2024",
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

      // Load health check events from API
      if (activeTab === "events") {
        try {
          const params: any = {
            pageNum: page,
            pageSize: 10,
            schoolYear: selectedSchoolYear,
          };

          // Add studentId if a student is selected
          if (selectedStudent) {
            // For health check events, we still need to use gradeId
            // but we can filter by the selected student's grade
            const studentResponse = await api.getStudentProfile(selectedStudent._id);
            if (studentResponse.success && studentResponse.data.classInfo?.gradeId) {
              params.gradeId = studentResponse.data.classInfo.gradeId;
            }
          }

          const eventsResponse = await api.searchHealthCheckEvents(params);

          if (refresh || page === 1) {
            setHealthCheckEvents(eventsResponse.pageData || []);
          } else {
            setHealthCheckEvents((prev) => [
              ...prev,
              ...(eventsResponse.pageData || []),
            ]);
          }
          setCurrentPage(eventsResponse.pageInfo?.pageNum || 1);
          setTotalPages(eventsResponse.pageInfo?.totalPages || 1);
        } catch (apiError) {
          console.warn("API call failed, using fallback data:", apiError);
          // Set empty data on API failure to prevent crash
          if (refresh || page === 1) {
            setHealthCheckEvents([]);
          }
          setCurrentPage(1);
          setTotalPages(1);
        }
      }

      // Load health check history from API
      if (activeTab === "history") {
        try {
          const userId = await getCurrentUserId();
          if (!userId || !selectedStudent) {
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
      setHealthCheckEvents([]);
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
    setHealthCheckEvents([]);
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
    setHealthCheckEvents([]);
    setCurrentPage(1);
    setTotalPages(1);
    loadData(1, true);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      loadData();
    }
  }, [selectedSchoolYear, selectedStudent]); // Reload when school year or student changes

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

  const handleEventPress = (eventId: string): void => {
    if (!selectedStudent) {
      Alert.alert("Thông báo", "Vui lòng chọn học sinh trước khi xem chi tiết sự kiện");
      return;
    }
    
    router.push({
      pathname: "/(tabs)/(parent)/health/checkups/detail",
      params: {
        eventId: eventId,
        studentId: selectedStudent._id,
        studentName: selectedStudent.fullName
      }
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

  const renderHealthCheckEventItem = ({ item }: { item: HealthCheckEvent }) => {
    const isRegistrationOpen =
      new Date() >= new Date(item.startRegistrationDate) &&
      new Date() <= new Date(item.endRegistrationDate);
    const eventStatus =
      new Date() > new Date(item.eventDate)
        ? "completed"
        : isRegistrationOpen
        ? "ongoing"
        : "upcoming";

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => handleEventPress(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleContainer}>
            <Text style={styles.eventTitle}>{item.eventName}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBgColor(eventStatus) },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(eventStatus) },
                ]}
              >
                {getStatusText(eventStatus)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.eventContent}>
          <View style={styles.eventDetail}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.eventDetailText}>{item.location}</Text>
          </View>

          <View style={styles.eventDetail}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.eventDetailText}>
              Ngày khám: {formatDate(item.eventDate)}{" "}
              {formatTime(item.eventDate)}
            </Text>
          </View>

          <View style={styles.eventDetail}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.eventDetailText}>
              Đăng ký: {formatDate(item.startRegistrationDate)} -{" "}
              {formatDate(item.endRegistrationDate)}
            </Text>
          </View>

          {item.description && (
            <View style={styles.eventDetail}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.eventDetailText}>{item.description}</Text>
            </View>
          )}
        </View>

        {/* <View style={styles.eventActions}>
          {isRegistrationOpen && (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRegisterPress(item._id);
              }}
            >
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.detailButton}>
            <Text style={styles.detailButtonText}>Chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View> */}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#4A90E2";
      case "ongoing":
        return "#7ED321";
      case "completed":
        return "#9B9B9B";
      default:
        return "#F5A623";
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#E8F4FD";
      case "ongoing":
        return "#F0FDF4";
      case "completed":
        return "#F5F5F5";
      default:
        return "#FFFBEB";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "Sắp diễn ra";
      case "ongoing":
        return "Đang đăng ký";
      case "completed":
        return "Đã hoàn thành";
      default:
        return "Không xác định";
    }
  };

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
          return "Không xác định";
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
          return "#9B9B9B";
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
        <View style={styles.historyCard}>
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
        </View>
      );
    }

    return (
      <View style={styles.historyCard}>
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
          <TouchableOpacity style={styles.viewResultButton}>
            <Text style={styles.viewResultButtonText}>Xem kết quả</Text>
          </TouchableOpacity>
        )}
      </View>
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
      
      {renderSchoolYearSelector()}
      {renderStudentSelection()}

      <View style={styles.tabContainer}>
        {renderTabButton("events", "Sự kiện", "calendar")}
        {renderTabButton("history", "Lịch sử", "time")}
      </View>

      <View style={styles.content}>
        {activeTab === "events" && (
          <FlatList
            data={healthCheckEvents}
            renderItem={renderHealthCheckEventItem}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                colors={["#007AFF"]}
              />
            }
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            ListEmptyComponent={() =>
              !isLoading
                ? renderEmptyState(
                    "Không có sự kiện khám sức khỏe nào",
                    "calendar-outline"
                  )
                : null
            }
          />
        )}

        {activeTab === "history" && (
          <FlatList
            data={healthCheckHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `history-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                colors={["#007AFF"]}
              />
            }
            showsVerticalScrollIndicator={false}
            style={styles.list}
            ListEmptyComponent={() =>
              renderEmptyState(
                "Chưa có lịch sử khám sức khỏe",
                "document-text-outline"
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}





const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    flex: 1,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
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


