import { api, Appointment, AppointmentSearchParams } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/lib/auth";

// Loading skeleton component
const AppointmentSkeleton = () => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(animation).start();
  }, []);

  return (
    <Animated.View style={[styles.appointmentCard, { opacity }]}>
      <View style={styles.appointmentHeader}>
        <View style={styles.typeSection}>
          <View
            style={[styles.skeletonCircle, { backgroundColor: "#e0e0e0" }]}
          />
          <View style={styles.typeInfo}>
            <View
              style={[
                styles.skeletonText,
                { width: "60%", height: 20, backgroundColor: "#e0e0e0" },
              ]}
            />
            <View
              style={[
                styles.skeletonText,
                {
                  width: "40%",
                  height: 16,
                  backgroundColor: "#e0e0e0",
                  marginTop: 8,
                },
              ]}
            />
          </View>
        </View>
      </View>
      <View
        style={[
          styles.skeletonText,
          {
            width: "80%",
            height: 16,
            backgroundColor: "#e0e0e0",
            marginTop: 12,
          },
        ]}
      />
      <View
        style={[
          styles.skeletonText,
          {
            width: "40%",
            height: 14,
            backgroundColor: "#e0e0e0",
            marginTop: 8,
          },
        ]}
      />
    </Animated.View>
  );
};

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  const { user } = useAuth();

  const statusOptions = [
    { value: "all", label: "Tất cả", color: "#666" },
    { value: "pending", label: "Chờ duyệt", color: "#FF9800" },
    { value: "approved", label: "Đã duyệt", color: "#4CAF50" },
    { value: "completed", label: "Hoàn thành", color: "#2196F3" },
    { value: "cancelled", label: "Đã hủy", color: "#F44336" },
  ];

  const appointmentTypeIcons: { [key: string]: string } = {
    checkup: "medical",
    vaccination: "shield-checkmark",
    consultation: "chatbubble-ellipses",
    medicine: "medical-outline",
    injury: "bandage",
    other: "ellipsis-horizontal",
  };

  const appointmentTypeLabels: { [key: string]: string } = {
    checkup: "Khám sức khỏe",
    vaccination: "Tiêm chủng",
    consultation: "Tư vấn sức khỏe",
    medicine: "Uống thuốc",
    injury: "Chấn thương",
    other: "Khác",
  };

  // Check when user is loaded
  useEffect(() => {
    if (user?._id) {
      console.log("👤 Parent loaded with ID:", user._id);
      setIsUserLoaded(true);
    }
  }, [user?._id]);

  // Thêm ref để track request
  // Bỏ các dòng này:
  // const loadingRef = useRef(false);
  // const abortControllerRef = useRef<AbortController | null>(null);
  
  // Và bỏ logic cancel request trong loadAppointments
  const loadAppointments = async (page = 1, isRefresh = false, retryCount = 0) => {
  // Cancel previous request
  try {
      console.log("🔄 Starting loadAppointments...", { page, isRefresh });
      console.log("👤 Current parent:", user?._id);

      if (!user?._id) {
        console.log("⚠️ No parent ID available");
        return;
      }

      if (page === 1) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: AppointmentSearchParams = {
        parentId: user._id,
        pageNum: page,
        pageSize: pageSize,
      };

      if (searchQuery.trim()) {
        params.query = searchQuery.trim();
      }

      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      console.log(
        "📤 Fetching appointments with params:",
        JSON.stringify(params, null, 2)
      );

      const response = await api.searchAppointments(params);
      console.log('📥 Appointments API Response:', JSON.stringify(response, null, 2));
      
      // Xử lý response dựa trên cấu trúc thực tế
      let appointmentsData: Appointment[] = [];
      let pageInfo = {
        pageNum: page,
        pageSize: pageSize,
        totalPages: 1,
        totalItems: 0
      };

      // Kiểm tra các cấu trúc response có thể
      if (Array.isArray(response)) {
        // Response là array trực tiếp
        appointmentsData = response;
        pageInfo.totalItems = response.length;
        console.log("📋 Response is direct array:", response.length);
      } else if (response?.pageData && Array.isArray(response.pageData)) {
        // Response có cấu trúc pageData
        appointmentsData = response.pageData;
        pageInfo = response.pageInfo || pageInfo;
        console.log("📦 Response has pageData:", response.pageData.length);
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          // Data là array
          appointmentsData = response.data;
          pageInfo.totalItems = response.data.length;
          console.log("📦 Response.data is array:", response.data.length);
        } else if (response.data.pageData && Array.isArray(response.data.pageData)) {
          // Data có pageData
          appointmentsData = response.data.pageData;
          pageInfo = response.data.pageInfo || pageInfo;
          console.log("📦 Response.data has pageData:", response.data.pageData.length);
        }
      }

      console.log("📥 Final appointments data:", appointmentsData.length);

      if (page === 1 || isRefresh) {
        setAppointments(appointmentsData);
      } else {
        setAppointments((prev) => [...prev, ...appointmentsData]);
      }

      setCurrentPage(pageInfo.pageNum);
      setTotalPages(pageInfo.totalPages);
      
    } catch (error: any) {
      console.error("❌ Failed to load appointments", error);

      const errorMessage =
        error.message === "ParentId is required for searching appointments"
          ? "Vui lòng đăng nhập lại để xem lịch hẹn"
          : "Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.";

      Alert.alert("Thông báo", errorMessage);

      if (page === 1) {
        setAppointments([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load appointments only after user is loaded
  // Load appointments only after user is loaded
  useEffect(() => {
    console.log("🔄 Checking parent loaded state:", {
      isUserLoaded,
      parentId: user?._id,
    });
    if (isUserLoaded && user?._id) {
      console.log("🔄 Initial load triggered after parent loaded");
      loadAppointments(1, false);
    }
  }, [isUserLoaded]);
  
  // Handle status changes
  useEffect(() => {
    console.log("🔄 Status change effect triggered:", selectedStatus);
    if (isUserLoaded && user?._id) {
      loadAppointments(1, true);
    }
  }, [selectedStatus]);
  
  // Handle search
  useEffect(() => {
    console.log("🔍 Search effect triggered:", searchQuery);
    if (isUserLoaded && user?._id) {
      const timeoutId = setTimeout(() => {
        loadAppointments(1, true);
      }, 500);
  
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAppointments(1, true);
  }, [selectedStatus]);

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadAppointments(currentPage + 1);
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption?.color || "#666";
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(
      (option) => option.value === status
    );
    return statusOption?.label || status;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => router.push(`/appointments/${item._id}` as any)}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.typeSection}>
          <Ionicons
            name={appointmentTypeIcons[item.type] as any}
            size={24}
            color="#4CAF50"
          />
          <View style={styles.typeInfo}>
            <Text style={styles.typeLabel}>
              {appointmentTypeLabels[item.type] || "Khác"}
            </Text>
            <Text style={styles.appointmentTime}>
              {formatDateTime(item.appointmentTime)}
            </Text>
            {item.student && (
              <Text style={styles.studentName}>
                Học sinh: {item.student.fullName}
              </Text>
            )}
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.reasonText} numberOfLines={2}>
        {item.reason}
      </Text>

      {item.note && (
        <Text style={styles.noteText} numberOfLines={1}>
          Ghi chú: {item.note}
        </Text>
      )}

      <View style={styles.appointmentFooter}>
        <Text style={styles.dateText}>
          Đặt lịch: {formatDateOnly(item.createdAt)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
      <Text style={styles.emptySubtitle}>
        Nhấn nút &quot;+&quot; để đặt lịch hẹn mới với y tá trường
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Lịch hẹn</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/appointments/create")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterContainer}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm lịch hẹn..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusOptions}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStatus === item.value && styles.selectedFilterChip,
                { borderColor: item.color },
              ]}
              onPress={() => setSelectedStatus(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === item.value && {
                    color: item.color,
                    fontWeight: "600",
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  if (isLoading && appointments.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderSearchAndFilter()}
        <View style={styles.listContainer}>
          {[1, 2, 3].map((key) => (
            <AppointmentSkeleton key={key} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchAndFilter()}

      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContainer,
          appointments.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchFilterContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  selectedFilterChip: {
    backgroundColor: "#f0f8ff",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  typeSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  typeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: "#666",
  },
  studentName: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  reasonText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  appointmentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  skeletonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonText: {
    borderRadius: 4,
    marginVertical: 2,
  },
});
