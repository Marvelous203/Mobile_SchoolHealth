import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const [medicalEvents, setMedicalEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [filterSerious, setFilterSerious] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    loadMedicalEvents();
  }, []);

  useEffect(() => {
    if (searchQuery !== "") {
      const delayedSearch = setTimeout(() => {
        setCurrentPage(1);
        loadMedicalEvents(true, searchQuery);
      }, 500);
      return () => clearTimeout(delayedSearch);
    } else {
      setCurrentPage(1);
      loadMedicalEvents(true);
    }
  }, [searchQuery]);

  // Separate useEffect for filter changes
  useEffect(() => {
    console.log("🔍 Filter changed to:", filterSerious);
    setCurrentPage(1);
    loadMedicalEvents(true);
  }, [filterSerious]);

  const loadMedicalEvents = async (reset = false, query?: string) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      }

      const pageToLoad = reset ? 1 : currentPage;
      const params: MedicalEventSearchParams = {
        pageNum: pageToLoad,
        pageSize: 10,
        query: query || searchQuery || undefined,
        isSerious: filterSerious,
        // userId will be automatically added by the API from token
      };

      console.log("🔍 Medical events search params:", params);
      const response = await api.searchMedicalEvents(params);

      if (response.pageData) {
        if (reset) {
          setMedicalEvents(response.pageData);
        } else {
          // Prevent duplicates by filtering out existing items
          const existingIds = new Set(medicalEvents.map((item) => item._id));
          const newItems = response.pageData.filter(
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
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadMedicalEvents(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMoreData && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      setTimeout(() => {
        loadMedicalEvents(false);
      }, 100);
    }
  };

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

  const getSeverityColor = (isSerious: boolean) => {
    return isSerious ? "#ff4d4f" : "#52c41a";
  };

  const getSeverityText = (isSerious: boolean) => {
    return isSerious ? "Nghiêm trọng" : "Nhẹ";
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
                name={item.isSerious ? "exclamation-triangle" : "info-circle"}
                size={16}
                color={getSeverityColor(item.isSerious)}
              />
              <Text style={styles.eventName}>{item.eventName}</Text>
            </View>
            <View
              style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(item.isSerious) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.severityText,
                  { color: getSeverityColor(item.isSerious) },
                ]}
              >
                {getSeverityText(item.isSerious)}
              </Text>
            </View>
          </View>

          {/* Thông tin học sinh */}
          <View style={styles.studentInfo}>
            <FontAwesome5 name="user-graduate" size={14} color="#1890ff" />
            <Text style={styles.studentName}>
              {item.student?.fullName || "N/A"}
            </Text>
            <Text style={styles.studentCode}>
              ({item.student?.studentCode || "N/A"})
            </Text>
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
          </View>

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
          <View style={styles.headerTitleContainer}>
            <FontAwesome5 name="first-aid" size={24} color="#fff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Sự kiện Y tế</Text>
              <Text style={styles.headerSubtitle}>
                Lịch sử tai nạn và sự cố
              </Text>
            </View>
          </View>
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

        {/* Filter buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterSerious === undefined && styles.filterButtonActive,
            ]}
            onPress={() => setFilterSerious(undefined)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterSerious === undefined && styles.filterButtonTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterSerious === true && styles.filterButtonActive,
            ]}
            onPress={() => setFilterSerious(true)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterSerious === true && styles.filterButtonTextActive,
              ]}
            >
              Nghiêm trọng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterSerious === false && styles.filterButtonActive,
            ]}
            onPress={() => setFilterSerious(false)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterSerious === false && styles.filterButtonTextActive,
              ]}
            >
              Nhẹ
            </Text>
          </TouchableOpacity>
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#ff7875",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#8c8c8c",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
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
});
