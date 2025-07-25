import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../../../lib/api";
import {
  MedicalEvent,
  MedicalEventSearchParams,
} from "../../../../../lib/types";

export default function MedicalEventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [medicalEvents, setMedicalEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentCache, setStudentCache] = useState<{[key: string]: any}>({});
  
  // We will get studentId from current user API instead of params
  console.log('📋 Medical Events Screen - will use studentId from current user API');

  useEffect(() => {
    loadMedicalEvents(true);
  }, [loadMedicalEvents]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      if (searchQuery.trim() !== "") {
        loadMedicalEvents(true);
      } else {
        loadMedicalEvents(true);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, loadMedicalEvents]);



  // Load current user function
  const loadCurrentUser = async () => {
    try {
      if (currentUser && currentUser._id) {
        return currentUser;
      }
      
      await AsyncStorage.removeItem('userData');
      
      console.log('Fetching current user profile from API...');
      const response = await api.getCurrentUser();
      
      if (response && response.success && response.data) {
        console.log('✅ Parent profile loaded:', response.data);
        
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));
        setCurrentUser(response.data);
        return response.data;
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    return null;
  };

  // Fetch student information
  const fetchStudentInfo = async (studentId: string) => {
    // Kiểm tra cache trước
    if (studentCache[studentId]) {
      return studentCache[studentId];
    }
    
    try {
      console.log('📚 Fetching student info for ID:', studentId);
      const response = await api.getStudentById(studentId);
      
      if (response && response.data) {
        const studentInfo = {
          _id: response.data._id,
          fullName: response.data.fullName,
          studentCode: response.data.studentCode,
          classInfo: response.data.classInfo ? {
            _id: response.data.classInfo._id,
            name: response.data.classInfo.name
          } : undefined
        };
        
        // Lưu vào cache
        setStudentCache(prev => ({
          ...prev,
          [studentId]: studentInfo
        }));
        
        return studentInfo;
      }
    } catch (error) {
      console.error('❌ Error fetching student info:', error);
    }
    
    return null;
  };

  const loadMedicalEvents = useCallback(async (reset = false, query?: string) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      }

      const user = await loadCurrentUser();
      console.log('User for API call:', user);
      
      if (!user || !user._id) {
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
        return;
      }

      // Use first studentId from current user's profile
      const effectiveStudentId = user.studentIds && user.studentIds.length > 0 ? user.studentIds[0] : undefined;
      console.log('🔍 Using studentId from current user:', effectiveStudentId, 'user studentIds:', user.studentIds);

      const pageToLoad = reset ? 1 : currentPage;
      const searchParams: MedicalEventSearchParams = {
        pageNum: pageToLoad,
        pageSize: 10,
        query: query || searchQuery || undefined,
        studentId: effectiveStudentId,
      };
      
      console.log('🔍 Medical events search params:', searchParams);
      console.log('📋 Using studentId from current user API:', effectiveStudentId);

      const response = await api.searchMedicalEvents(searchParams);

      if (response.pageData) {
        // Fetch thông tin học sinh cho từng medical event
        const eventsWithStudentInfo = await Promise.all(
          response.pageData.map(async (event: MedicalEvent) => {
            if (event.studentId) {
              const studentInfo = await fetchStudentInfo(event.studentId);
              return {
                ...event,
                studentInfo
              };
            }
            return event;
          })
        );
        
        if (reset) {
          setMedicalEvents(eventsWithStudentInfo);
        } else {
          // Prevent duplicates by filtering out existing items
          const existingIds = new Set(medicalEvents.map((item) => item._id));
          const newItems = eventsWithStudentInfo.filter(
            (item) => !existingIds.has(item._id)
          );
          setMedicalEvents((prev) => [...prev, ...newItems]);
        }

        setTotalPages(response.pageInfo.totalPages);
        setHasMoreData(pageToLoad < response.pageInfo.totalPages);
      }
    } catch (error: any) {
      console.error("❌ Load medical events error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải sự kiện y tế");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, searchQuery, studentCache]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    loadMedicalEvents(true);
  }, [loadMedicalEvents]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMoreData && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      setTimeout(() => {
        loadMedicalEvents(false);
      }, 100);
    }
  }, [loading, hasMoreData, currentPage, totalPages, loadMedicalEvents]);

  const handleEventPress = (event: MedicalEvent) => {
    router.push({
      pathname: "/(tabs)/(parent)/health/medical-events/[id]",
      params: { id: event._id, eventName: event.eventName },
    });
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
    switch (severityLevel?.toLowerCase()) {
      case 'critical':
        return "#ff4d4f";
      case 'moderate':
        return "#fa8c16";
      case 'mild':
        return "#52c41a";
      default:
        return "#8c8c8c";
    }
  };

  const getSeverityText = (severityLevel: string) => {
    switch (severityLevel?.toLowerCase()) {
      case 'critical':
        return "Nghiêm trọng";
      case 'moderate':
        return "Trung bình";
      case 'mild':
        return "Nhẹ";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'monitoring':
        return "#1890ff";
      case 'transferred':
        return "#fa8c16";
      case 'resolved':
        return "#52c41a";
      case 'pending':
        return "#faad14";
      default:
        return "#8c8c8c";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'monitoring':
        return "Đang theo dõi";
      case 'transferred':
        return "Đã chuyển viện";
      case 'resolved':
        return "Đã giải quyết";
      case 'pending':
        return "Chờ xử lý";
      default:
        return "Không xác định";
    }
  };

  const getLeaveMethodText = (leaveMethod: string) => {
    switch (leaveMethod?.toLowerCase()) {
      case 'parent_pickup':
        return "Phụ huynh đón";
      case 'ambulance':
        return "Xe cứu thương";
      case 'self_discharge':
        return "Tự về";
      case 'none':
        return "Không rời khỏi trường";
      default:
        return "Không xác định";
    }
  };

  const renderMedicalEvent = ({ item }: { item: MedicalEvent }) => {
    // Safety check for item
    if (!item || !item._id) {
      console.warn("⚠️ Invalid medical event item:", item);
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => handleEventPress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["#fff", "#f8f9fa"]}
          style={styles.cardGradient}
        >
          {/* Header với tên sự kiện */}
          <View style={styles.eventHeader}>
            <View style={styles.eventInfo}>
              <FontAwesome5
                name={item.severityLevel === 'Critical' ? "exclamation-triangle" : "info-circle"}
                size={16}
                color={getSeverityColor(item.severityLevel)}
              />
              <Text style={styles.eventName}>{item.eventName}</Text>
            </View>
            <View
              style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(item.severityLevel) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.severityText,
                  { color: getSeverityColor(item.severityLevel) },
                ]}
              >
                {getSeverityText(item.severityLevel)}
              </Text>
            </View>
          </View>

          {/* Status và Leave Method */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <FontAwesome5 name="heartbeat" size={12} color={getStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
            {item.leaveMethod && item.leaveMethod !== 'none' && (
              <View style={styles.statusItem}>
                <FontAwesome5 name="sign-out-alt" size={12} color="#722ed1" />
                <Text style={styles.leaveMethodText}>
                  {getLeaveMethodText(item.leaveMethod)}
                </Text>
              </View>
            )}
          </View>

          {/* Thông tin học sinh */}
          <View style={styles.studentInfo}>
            <FontAwesome5 name="user-graduate" size={14} color="#1890ff" />
            <Text style={styles.studentName}>
              {(item as any).studentInfo?.fullName || item.student?.fullName || "N/A"}
            </Text>
            <Text style={styles.studentCode}>
              ({(item as any).studentInfo?.studentCode || item.student?.studentIdCode || "N/A"})
            </Text>
            {(item as any).studentInfo?.classInfo && (
              <Text style={styles.classInfo}>
                - {(item as any).studentInfo.classInfo.name}
              </Text>
            )}
          </View>

          {/* Mô tả sự kiện */}
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Hành động đã thực hiện */}
          <View style={styles.actionSection}>
            <Text style={styles.actionLabel}>Hành động:</Text>
            <Text style={styles.actionText} numberOfLines={1}>
              {item.actionTaken}
            </Text>
          </View>

          {/* Thông tin bổ sung */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoItem}>
              <FontAwesome5 name="pills" size={12} color="#fa8c16" />
              <Text style={styles.infoText}>
                {item.medicines?.length || 0} thuốc
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="box" size={12} color="#13c2c2" />
              <Text style={styles.infoText}>
                {item.medicalSupplies?.length || 0} dụng cụ
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="user-md" size={12} color="#722ed1" />
              <Text style={styles.infoText}>
                {item.schoolNurse?.fullName || "N/A"}
              </Text>
            </View>
            {item.images && item.images.length > 0 && (
              <View style={styles.infoItem}>
                <FontAwesome5 name="image" size={12} color="#52c41a" />
                <Text style={styles.infoText}>
                  {item.images.length} hình ảnh
                </Text>
              </View>
            )}
          </View>

          {/* Ghi chú */}
          {item.notes && item.notes.trim() !== '' && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Ghi chú:</Text>
              <Text style={styles.notesText} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          )}

          {/* Footer với thời gian */}
          <View style={styles.eventFooter}>
            <Text style={styles.eventTime}>{formatDate(item.createdAt)}</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#d9d9d9" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={["#ff7875", "#ff9c6e"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)/(parent)/health")}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <FontAwesome5 name="first-aid" size={24} color="#fff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Sự kiện Y tế</Text>
              <Text style={styles.headerSubtitle}>
                Lịch sử tai nạn và sự cố
              </Text>
            </View>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#8c8c8c" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#bfbfbf"
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome5 name="times-circle" size={16} color="#8c8c8c" />
            </TouchableOpacity>
          )}
        </View>


      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="first-aid" size={64} color="#d9d9d9" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? "Không tìm thấy kết quả" : "Chưa có sự kiện y tế"}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? "Thử tìm kiếm với từ khóa khác"
          : "Sự kiện y tế sẽ được hiển thị tại đây"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || medicalEvents.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#ff7875" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {loading && medicalEvents.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff7875" />
          <Text style={styles.loadingText}>Đang tải sự kiện y tế...</Text>
        </View>
      ) : (
        <FlatList
          data={medicalEvents}
          renderItem={renderMedicalEvent}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#ff7875"]}
              tintColor="#ff7875"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
      )}
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
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerSpacer: {
    width: 36, // Same width as back button to center the title
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 2,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#262626",
  },

  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#262626",
    marginLeft: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  studentName: {
    fontSize: 14,
    color: "#1890ff",
    fontWeight: "500",
    marginLeft: 6,
  },
  studentCode: {
    fontSize: 12,
    color: "#8c8c8c",
    marginLeft: 4,
  },
  classInfo: {
    fontSize: 12,
    color: "#52c41a",
    marginLeft: 4,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "#262626",
    lineHeight: 20,
    marginBottom: 12,
  },
  actionSection: {
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 12,
    color: "#8c8c8c",
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#262626",
    fontWeight: "500",
  },
  additionalInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#8c8c8c",
    marginLeft: 4,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  eventTime: {
    fontSize: 12,
    color: "#8c8c8c",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8c8c8c",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#bfbfbf",
    textAlign: "center",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#8c8c8c",
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  leaveMethodText: {
    fontSize: 12,
    color: "#722ed1",
    fontWeight: "500",
    marginLeft: 4,
  },
  notesSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#1890ff",
  },
  notesLabel: {
    fontSize: 12,
    color: "#8c8c8c",
    fontWeight: "600",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: "#262626",
    lineHeight: 18,
  },
});
