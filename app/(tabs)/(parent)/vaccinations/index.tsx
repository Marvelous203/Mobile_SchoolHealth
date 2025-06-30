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
interface VaccineEvent {
  _id: string;
  eventName: string;
  gradeId: string;
  description: string;
  vaccineName: string;
  location: string;
  startRegistrationDate: string;
  endRegistrationDate: string;
  eventDate: string;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface VaccinationSession {
  name: string;
  date: string;
}

interface VaccinationHistory {
  name: string;
  date: string;
}

type TabType = "events" | "sessions" | "history";

export default function VaccinationsScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [vaccineEvents, setVaccineEvents] = useState<VaccineEvent[]>([]);
  const [vaccinationSessions, setVaccinationSessions] = useState<
    VaccinationSession[]
  >([]);
  const [vaccinationHistory, setVaccinationHistory] = useState<
    VaccinationHistory[]
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

      // Load vaccine events from new API with retry mechanism
      try {
        const eventsResponse = await api.searchVaccineEvents({
          pageNum: page,
          pageSize: 10,
          schoolYear: selectedSchoolYear,
        });

        if (refresh || page === 1) {
          setVaccineEvents(eventsResponse.pageData || []);
        } else {
          setVaccineEvents((prev) => [
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
          setVaccineEvents([]);
        }
        setCurrentPage(1);
        setTotalPages(1);
      }

      // Load existing vaccination sessions (keep for backward compatibility)
      try {
        const sessions = await api.getVaccinationSessions();
        setVaccinationSessions(sessions);
      } catch (error) {
        console.log("No vaccination sessions available:", error);
        setVaccinationSessions([]);
      }

      // Load vaccination history
      try {
        const studentId = "1"; // In real app, get from context
        const history = await api.getVaccinationHistory(studentId);
        setVaccinationHistory(history);
      } catch (error) {
        console.log("No vaccination history available:", error);
        setVaccinationHistory([]);
      }
    } catch (error) {
      console.error("Failed to load vaccination data", error);
      // Ensure UI doesn't crash by setting safe defaults
      setVaccineEvents([]);
      setVaccinationSessions([]);
      setVaccinationHistory([]);
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
    setVaccineEvents([]);
    setCurrentPage(1);
    setTotalPages(1);
    // Load data for new school year
    loadData(1, true);
  };

  useEffect(() => {
    loadData();
  }, [selectedSchoolYear]); // Reload when school year changes

  // Helper functions - Calculate status based on dates
  const getEventStatus = (event: VaccineEvent): string => {
    const now = new Date();
    const startReg = new Date(event.startRegistrationDate);
    const endReg = new Date(event.endRegistrationDate);
    const eventDate = new Date(event.eventDate);

    if (now > eventDate) {
      return "completed";
    } else if (now >= startReg && now <= endReg) {
      return "ongoing";
    } else if (now < startReg) {
      return "upcoming";
    } else {
      return "closed";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "#4A90E2";
      case "ongoing":
        return "#7ED321";
      case "completed":
        return "#9B9B9B";
      case "closed":
        return "#D0021B";
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
      case "closed":
        return "#FEF2F2";
      default:
        return "#FFFBEB";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "Sắp mở đăng ký";
      case "ongoing":
        return "Đang mở đăng ký";
      case "completed":
        return "Đã hoàn thành";
      case "closed":
        return "Đã đóng đăng ký";
      default:
        return "Không xác định";
    }
  };

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
    router.push(`/(tabs)/(parent)/vaccinations/event-detail?id=${eventId}`);
  };

  const handleRegisterPress = (): void => {
    router.push("/(tabs)/(parent)/vaccinations/registration");
  };

  // Render school year selector
  const renderSchoolYearSelector = () => (
    <View style={styles.schoolYearContainer}>
      <Text style={styles.schoolYearLabel}>Năm học</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.schoolYearScrollContainer}
      >
        {availableSchoolYears.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.schoolYearCard,
              selectedSchoolYear === year && styles.selectedSchoolYearCard,
            ]}
            onPress={() => handleSchoolYearChange(year)}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={selectedSchoolYear === year ? "#4A90E2" : "#8e8e93"}
            />
            <Text
              style={[
                styles.schoolYearText,
                selectedSchoolYear === year && styles.selectedSchoolYearText,
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render functions
  const renderVaccineEventItem = ({ item }: { item: VaccineEvent }) => {
    const eventStatus = getEventStatus(item);
    const isRegistrationOpen = eventStatus === "ongoing";

    return (
      <TouchableOpacity
        style={[
          styles.modernCard,
          { borderLeftColor: getStatusColor(eventStatus) },
        ]}
        onPress={() => handleEventPress(item._id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.vaccineIcon,
                { backgroundColor: getStatusBgColor(eventStatus) },
              ]}
            >
              <Ionicons
                name="medical"
                size={24}
                color={getStatusColor(eventStatus)}
              />
            </View>
            <View
              style={[
                styles.statusContainer,
                { backgroundColor: getStatusBgColor(eventStatus) },
              ]}
            >
              <Text
                style={[
                  styles.statusLabel,
                  { color: getStatusColor(eventStatus) },
                ]}
              >
                {getStatusText(eventStatus)}
              </Text>
            </View>
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.eventName}
          </Text>
          <Text style={styles.vaccineName} numberOfLines={1}>
            💉 {item.vaccineName}
          </Text>

          {item.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.eventInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Ngày tiêm: {formatDate(item.eventDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Đăng ký: {formatDate(item.startRegistrationDate)} -{" "}
                {formatDate(item.endRegistrationDate)}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            {isRegistrationOpen && (
              <TouchableOpacity
                style={styles.registerEventButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRegisterPress();
                }}
              >
                <Text style={styles.registerEventButtonText}>Đăng ký</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.detailButton,
                { backgroundColor: getStatusColor(eventStatus) },
              ]}
            >
              <Text style={styles.detailButtonText}>Chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabButton = (
    tabKey: TabType,
    title: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTabButton]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === tabKey ? "#4A90E2" : "#8e8e93"}
      />
      <Text
        style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}
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
      <Ionicons name={icon} size={64} color="#e1e8ed" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );

  const renderSessionItem = ({ item }: { item: VaccinationSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Ionicons name="medical-outline" size={20} color="#4A90E2" />
        <Text style={styles.sessionTitle}>{item.name}</Text>
      </View>
      <Text style={styles.sessionDate}>{item.date}</Text>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: VaccinationHistory }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Ionicons name="checkmark-circle" size={20} color="#7ED321" />
        <Text style={styles.historyTitle}>{item.name}</Text>
      </View>
      <Text style={styles.historyDate}>{item.date}</Text>
    </View>
  );

  // Loading state
  if (isLoading && vaccineEvents.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="medical" size={48} color="#4A90E2" />
          <Text style={styles.loadingText}>
            Đang tải thông tin tiêm chủng...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="medical" size={28} color="#4A90E2" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Tiêm chủng</Text>
              <Text style={styles.subtitle}>Năm học {selectedSchoolYear}</Text>
            </View>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegisterPress}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderSchoolYearSelector()}

      <View style={styles.tabContainer}>
        {renderTabButton("events", "Sự kiện", "calendar-outline")}
        {renderTabButton("sessions", "Phiên tiêm", "medical-outline")}
        {renderTabButton("history", "Lịch sử", "time-outline")}
      </View>

      <View style={styles.content}>
        {activeTab === "events" && (
          <FlatList
            data={vaccineEvents}
            renderItem={renderVaccineEventItem}
            keyExtractor={(item) => `event-${item._id}`}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                colors={["#4A90E2"]}
                tintColor="#4A90E2"
              />
            }
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.1}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() =>
              renderEmptyState(
                "Chưa có sự kiện tiêm chủng nào",
                "calendar-outline"
              )
            }
          />
        )}

        {activeTab === "sessions" && (
          <View style={styles.tabContent}>
            {vaccinationSessions.length > 0 ? (
              <FlatList
                data={vaccinationSessions}
                renderItem={renderSessionItem}
                keyExtractor={(item, index) => `session-${index}`}
                contentContainerStyle={styles.listContainer}
              />
            ) : (
              renderEmptyState(
                "Chưa có phiên tiêm chủng nào",
                "medical-outline"
              )
            )}
          </View>
        )}

        {activeTab === "history" && (
          <View style={styles.tabContent}>
            {vaccinationHistory.length > 0 ? (
              <FlatList
                data={vaccinationHistory}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => `history-${index}`}
                contentContainerStyle={styles.listContainer}
              />
            ) : (
              renderEmptyState("Chưa có lịch sử tiêm chủng", "time-outline")
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "500",
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E8F4FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  },
  schoolYearContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: -10,
  },
  schoolYearLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  schoolYearScrollContainer: {
    paddingRight: 20,
  },
  schoolYearCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedSchoolYearCard: {
    backgroundColor: "#E8F4FD",
    borderColor: "#4A90E2",
  },
  schoolYearText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#8e8e93",
  },
  selectedSchoolYearText: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: "#E8F4FD",
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#8e8e93",
  },
  activeTabText: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modernCard: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vaccineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 6,
  },
  vaccineName: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 13,
    color: "#95a5a6",
    marginBottom: 16,
    lineHeight: 18,
  },
  eventInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
  },
  dateBox: {
    flex: 1,
    alignItems: "center",
  },
  dateSeparator: {
    width: 2,
    height: 30,
    backgroundColor: "#e9ecef",
    marginHorizontal: 16,
  },
  dateLabel: {
    fontSize: 11,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c3e50",
  },
  timeValue: {
    fontSize: 11,
    color: "#7f8c8d",
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  registerEventButton: {
    backgroundColor: "#52c41a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  registerEventButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  deadlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deadlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#D0021B",
    fontWeight: "500",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8e8e93",
    textAlign: "center",
  },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#4A90E2",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
  },
  sessionDate: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#7ED321",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
  },
  historyDate: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  registerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
