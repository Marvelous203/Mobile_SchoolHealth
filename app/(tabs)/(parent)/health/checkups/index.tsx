"use client";

import { api } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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

interface HealthCheckHistory {
  name: string;
  date: string;
  result: string;
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
    useState<string>("2024-2025");
  const [availableSchoolYears] = useState<string[]>([
    "2024-2025",
    "2023-2024",
    "2025-2026",
  ]);

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
      try {
        const eventsResponse = await api.searchHealthCheckEvents({
          pageNum: page,
          pageSize: 10,
          schoolYear: selectedSchoolYear,
        });

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

      // Load health check history (placeholder for now)
      try {
        // TODO: Implement actual API call when available
        setHealthCheckHistory([
          {
            name: "Khám sức khỏe định kỳ",
            date: "2024-06-15",
            result: "Bình thường",
          },
          {
            name: "Khám sức khỏe đầu năm",
            date: "2024-09-01",
            result: "Cần theo dõi",
          },
        ]);
      } catch (error) {
        console.log("No health check history available:", error);
        setHealthCheckHistory([]);
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

  // Reset when school year changes
  const handleSchoolYearChange = (schoolYear: string): void => {
    setSelectedSchoolYear(schoolYear);
    setHealthCheckEvents([]);
    setCurrentPage(1);
    setTotalPages(1);
    // Load data for new school year
    loadData(1, true);
  };

  useEffect(() => {
    loadData();
  }, [selectedSchoolYear]); // Reload when school year changes

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
    router.push(`/(tabs)/(parent)/health/checkups/detail?eventId=${eventId}`);
  };

  const handleRegisterPress = (): void => {
    router.push("/(tabs)/(parent)/health/checkups/registration");
  };

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

        <View style={styles.eventActions}>
          {isRegistrationOpen && (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRegisterPress();
              }}
            >
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.detailButton}>
            <Text style={styles.detailButtonText}>Chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
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
      onPress={() => setActiveTab(tabKey)}
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

  const renderHistoryItem = ({ item }: { item: HealthCheckHistory }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>{item.name}</Text>
        <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
      </View>
      <Text style={styles.historyResult}>Kết quả: {item.result}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám sức khỏe</Text>
      </View>

      {renderSchoolYearSelector()}

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
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
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
    alignItems: "flex-start",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
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
  eventContent: {
    marginBottom: 16,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  eventActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  registerButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    color: "#666",
  },
  historyResult: {
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
});
