import { api, getCurrentUserId } from "@/lib/api";
import { checkUserPermission, useAuth } from "@/lib/auth";
import type { HealthRecord, HealthRecordSearchParams } from "@/lib/types";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function HealthRecordsScreen() {
  const { user } = useAuth();
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [studentNames, setStudentNames] = useState<{ [key: string]: string }>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStudentIdAndRecords();
    startShimmerAnimation();
  }, []);

  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    if (searchQuery !== "") {
      const delayedSearch = setTimeout(async () => {
        // Get current user and search across all students
        const currentUserId = await getCurrentUserId();
        if (currentUserId) {
          const userProfileResponse = await api.getUserProfile(currentUserId);
          if (
            userProfileResponse.success &&
            userProfileResponse.data.studentIds &&
            userProfileResponse.data.studentIds.length > 0
          ) {
            await searchHealthRecordsForAllStudents(
              userProfileResponse.data.studentIds,
              searchQuery
            );
          }
        }
      }, 500);
      return () => clearTimeout(delayedSearch);
    } else {
      // If no search query, reload all records
      loadStudentIdAndRecords();
    }
  }, [searchQuery]);

  // Fetch student names for health records
  useEffect(() => {
    if (healthRecords.length > 0) {
      fetchStudentNames();
    }
  }, [healthRecords]);

  const fetchStudentNames = async () => {
    const uniqueStudentIds = [
      ...new Set(healthRecords.map((record) => record.studentId)),
    ];
    const newStudentNames = { ...studentNames };

    for (const studentId of uniqueStudentIds) {
      if (!newStudentNames[studentId]) {
        try {
          const studentResponse = await api.getStudentProfile(studentId);
          if (studentResponse.success && studentResponse.data) {
            newStudentNames[studentId] = studentResponse.data.fullName;
          }
        } catch (error) {
          console.error(
            `Failed to fetch student name for ID ${studentId}:`,
            error
          );
          newStudentNames[studentId] = "Không xác định";
        }
      }
    }

    setStudentNames(newStudentNames);
  };

  const loadStudentIdAndRecords = async () => {
    try {
      // Get current user ID first
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        Alert.alert("Lỗi", "Không thể xác định user hiện tại");
        return;
      }

      // Get user profile to get studentIds
      const userProfileResponse = await api.getUserProfile(currentUserId);

      if (
        userProfileResponse.success &&
        userProfileResponse.data.studentIds &&
        userProfileResponse.data.studentIds.length > 0
      ) {
        console.log(
          "📚 Available studentIds:",
          userProfileResponse.data.studentIds
        );

        // Load health records for ALL students
        await loadHealthRecordsForAllStudents(
          userProfileResponse.data.studentIds
        );
      } else {
        console.log("⚠️ No studentIds found in user profile");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("❌ Load student ID error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải thông tin học sinh");
      setLoading(false);
    }
  };

  const loadHealthRecordsForAllStudents = async (studentIds: string[]) => {
    try {
      setLoading(true);
      const allHealthRecords: HealthRecord[] = [];

      // Load health records for each student
      for (const studentId of studentIds) {
        console.log("🔍 Loading health records for student:", studentId);

        const params: HealthRecordSearchParams = {
          pageNum: 1,
          pageSize: 50, // Increase page size to get more records
          studentId: studentId,
        };

        const response = await api.searchHealthRecords(params);

        if (response.pageData && response.pageData.length > 0) {
          console.log(
            `✅ Found ${response.pageData.length} records for student ${studentId}`
          );
          allHealthRecords.push(...response.pageData);
        } else {
          console.log(`📭 No records found for student ${studentId}`);
        }
      }

      // Group records by student and get the latest record for each student
      const latestRecordsByStudent = groupAndGetLatestRecords(allHealthRecords);

      setHealthRecords(latestRecordsByStudent);
      console.log(
        `🏥 Total students with health records: ${latestRecordsByStudent.length}`
      );
    } catch (error: any) {
      console.error("❌ Load health records for all students error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tải hồ sơ sức khỏe");
    } finally {
      setLoading(false);
    }
  };

  const groupAndGetLatestRecords = (
    records: HealthRecord[]
  ): HealthRecord[] => {
    // Group records by studentId
    const recordsByStudent: { [studentId: string]: HealthRecord[] } = {};

    records.forEach((record) => {
      if (!recordsByStudent[record.studentId]) {
        recordsByStudent[record.studentId] = [];
      }
      recordsByStudent[record.studentId].push(record);
    });

    // Get the latest record for each student
    const latestRecords: HealthRecord[] = [];

    Object.keys(recordsByStudent).forEach((studentId) => {
      const studentRecords = recordsByStudent[studentId];
      // Sort by creation date and get the latest one
      const latestRecord = studentRecords.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      // Add all records array to the latest record for detail view
      (latestRecord as any).allRecords = studentRecords;
      latestRecords.push(latestRecord);
    });

    // Sort students by their latest record date
    return latestRecords.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const searchHealthRecordsForAllStudents = async (
    studentIds: string[],
    query: string
  ) => {
    try {
      setLoading(true);
      const allHealthRecords: HealthRecord[] = [];

      // Search health records for each student
      for (const studentId of studentIds) {
        console.log(
          "🔍 Searching health records for student:",
          studentId,
          "with query:",
          query
        );

        const params: HealthRecordSearchParams = {
          pageNum: 1,
          pageSize: 50,
          studentId: studentId,
          query: query,
        };

        const response = await api.searchHealthRecords(params);

        if (response.pageData && response.pageData.length > 0) {
          console.log(
            `✅ Found ${response.pageData.length} matching records for student ${studentId}`
          );
          allHealthRecords.push(...response.pageData);
        }
      }

      // Group records by student and get the latest record for each student
      const latestRecordsByStudent = groupAndGetLatestRecords(allHealthRecords);

      setHealthRecords(latestRecordsByStudent);
      console.log(
        `🔍 Total students with matching records: ${latestRecordsByStudent.length}`
      );
    } catch (error: any) {
      console.error("❌ Search health records error:", error);
      Alert.alert("Lỗi", error.message || "Không thể tìm kiếm hồ sơ sức khỏe");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      // Get current user ID and reload for all students
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        setRefreshing(false);
        return;
      }

      const userProfileResponse = await api.getUserProfile(currentUserId);
      if (
        userProfileResponse.success &&
        userProfileResponse.data.studentIds &&
        userProfileResponse.data.studentIds.length > 0
      ) {
        await loadHealthRecordsForAllStudents(
          userProfileResponse.data.studentIds
        );
      }
    } catch (error: any) {
      console.error("❌ Refresh error:", error);
      Alert.alert("Lỗi", "Không thể làm mới dữ liệu");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecordPress = (record: HealthRecord) => {
    const allRecords = (record as any).allRecords || [record];
    // Extract only the IDs to avoid circular reference
    const recordIds = allRecords.map((r: HealthRecord) => r._id);

    router.push({
      pathname: "/(tabs)/(parent)/health/records/detail",
      params: {
        recordId: record._id,
        studentName:
          studentNames[record.studentId] || record.studentName || "Đang tải...",
        studentId: record.studentId,
        allRecordIds: JSON.stringify(recordIds), // Pass only IDs
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

  const renderHealthRecord = ({
    item,
    index,
  }: {
    item: HealthRecord;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.recordBook,
        {
          marginLeft: index % 2 === 0 ? 20 : 10,
          marginRight: index % 2 === 0 ? 10 : 20,
        },
      ]}
      onPress={() => handleRecordPress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          getHealthStatus(item) === "Tốt"
            ? ["#6a11cb", "#2575fc"]
            : ["#ff6b6b", "#ee5a6f"]
        }
        style={styles.bookCover}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top Section - Icon & Status */}
        <View style={styles.topSection}>
          <FontAwesome5 name="heartbeat" size={16} color="#fff" />
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getHealthStatus(item)}</Text>
          </View>
        </View>

        {/* Student Section */}
        <View style={styles.studentSection}>
          <Text style={styles.studentText}>
            {studentNames[item.studentId] || "Đang tải..."}
          </Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.bookTitle}>SỔ SỨC KHỎE</Text>
          <Text style={styles.schoolYear}>{item.schoolYear}</Text>
          {(item as any).allRecords && (item as any).allRecords.length > 1 && (
            <Text style={styles.recordCount}>
              {(item as any).allRecords.length} năm học
            </Text>
          )}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.dateText}>{formatDate(item.updatedAt)}</Text>
          <Text style={styles.pageNumber}>{index + 1}</Text>
        </View>
      </LinearGradient>

      {/* Shadow Effect */}
      <View style={styles.shadowEffect} />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <FontAwesome5 name="book-medical" size={28} color="#fff" />
              <View style={styles.headerIconBadge}>
                <FontAwesome5 name="heart" size={12} color="#667eea" />
              </View>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Thư Viện Sức Khỏe</Text>
              <Text style={styles.headerSubtitle}>Hồ sơ y tế con em</Text>
            </View>
          </View>
          {checkUserPermission(user) ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(tabs)/(parent)/health/create-record")}
            >
              <LinearGradient
                colors={["#4facfe", "#00f2fe"]}
                style={styles.addButtonGradient}
              >
                <FontAwesome5 name="plus" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.addButton} />
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FontAwesome5 name="search" size={16} color="#667eea" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm hồ sơ..."
              placeholderTextColor="#8e8e93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="clear" size={20} color="#8e8e93" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyBookshelf}>
        <FontAwesome5 name="book-open" size={64} color="#d9d9d9" />
        <Text style={styles.emptyTitle}>Thư viện trống</Text>
        <Text style={styles.emptySubtitle}>
          Chưa có hồ sơ sức khỏe nào được tạo
        </Text>
        {checkUserPermission(user) ? (
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => router.push("/(tabs)/(parent)/health/records/create")}
          >
            <LinearGradient
              colors={["#4facfe", "#00f2fe"]}
              style={styles.createFirstButtonGradient}
            >
              <FontAwesome5 name="plus" size={16} color="#fff" />
              <Text style={styles.createFirstButtonText}>Tạo hồ sơ đầu tiên</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Text style={styles.viewOnlyText}>Chỉ được phép xem</Text>
        )}
      </View>
    </View>
  );

  const renderSkeletonCard = ({ index }: { index: number }) => {
    const shimmerTranslate = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    return (
      <View
        style={[
          styles.recordBook,
          {
            marginLeft: index % 2 === 0 ? 20 : 10,
            marginRight: index % 2 === 0 ? 10 : 20,
          },
        ]}
      >
        <View style={styles.skeletonCard}>
          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
          
          {/* Top section skeleton */}
          <View style={styles.skeletonTopSection}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonBadge} />
          </View>
          
          {/* Student name skeleton */}
          <View style={styles.skeletonStudentName} />
          
          {/* Title section skeleton */}
          <View style={styles.skeletonTitleSection}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
          
          {/* Bottom section skeleton */}
          <View style={styles.skeletonBottomSection}>
            <View style={styles.skeletonDate} />
            <View style={styles.skeletonPageNumber} />
          </View>
        </View>
        
        {/* Shadow effect */}
        <View style={styles.shadowEffect} />
      </View>
    );
  };

  const renderSkeletonLoader = () => {
    return (
      <View style={styles.skeletonContainer}>
        <FlatList
          data={Array(6).fill(0)}
          renderItem={({ index }) => renderSkeletonCard({ index })}
          keyExtractor={(_, index) => `skeleton-${index}`}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || healthRecords.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  if (loading && healthRecords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ sức khỏe</Text>
          {checkUserPermission(user) ? (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/health/records/create')}
            >
              <MaterialIcons name="add" size={24} color="#1890ff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.addButton} />
          )}
        </View>
        
        {/* Search bar skeleton */}
        <View style={styles.searchContainer}>
          <View style={styles.skeletonSearchIcon} />
          <View style={styles.skeletonSearchInput} />
        </View>
        
        {/* Skeleton cards */}
        {renderSkeletonLoader()}
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Hồ sơ sức khỏe</Text>
        {checkUserPermission(user) ? (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/health/records/create')}
          >
            <MaterialIcons name="add" size={24} color="#1890ff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.addButton} />
        )}
      </View>
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm hồ sơ..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {healthRecords.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={healthRecords}
          renderItem={renderHealthRecord}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#667eea"]}
              tintColor="#667eea"
            />
          }
          onEndReached={() => {}}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}

// Thêm styles cho header
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    paddingVertical: 20,
  },
  recordBook: {
    width: (Dimensions.get("window").width - 60) / 2,
    marginBottom: 20,
    position: "relative",
  },
  bookCover: {
    borderRadius: 16,
    padding: 16,
    height: 240,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: "relative",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  studentSection: {
    marginBottom: 12,
  },
  studentText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  schoolYear: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  recordCount: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  healthSection: {
    flex: 1,
    gap: 8,
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  dateText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  pageNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  shadowEffect: {
    position: "absolute",
    bottom: -3,
    right: -3,
    left: 3,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: "#667eea",
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyBookshelf: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  createFirstButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createFirstButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginVertical: 20,
  },
  // Skeleton loading styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonCard: {
    borderRadius: 16,
    padding: 16,
    height: 240,
    backgroundColor: "#f0f0f0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    width: 100,
  },
  skeletonTopSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },
  skeletonStudentName: {
    width: "80%",
    height: 24,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
    alignSelf: "center",
  },
  skeletonTitleSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  skeletonTitle: {
    width: "90%",
    height: 20,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: "60%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonBottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  skeletonDate: {
    width: 60,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonPageNumber: {
    width: 20,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonSearchIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
  },
  skeletonSearchInput: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginLeft: 8,
  },
  viewOnlyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 16,
  },
});
