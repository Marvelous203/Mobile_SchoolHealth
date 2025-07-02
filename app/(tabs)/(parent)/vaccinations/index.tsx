"use client";

import { api, getCurrentUserId } from "@/lib/api";
import type { VaccineEvent } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { formatDate, formatTime } from "../../../../lib/utils";

const { width } = Dimensions.get("window");

// Type definitions
interface VaccinationSession {
  name: string;
  date: string;
}

interface VaccinationHistory {
  name: string;
  date: string;
}

interface Student {
  _id: string;
  fullName: string;
  classId?: string;
  avatar?: string;
}

type TabType = "events" | "sessions" | "history";

const EmptyUpcoming = () => (
  <View style={styles.emptyState}>
    <Ionicons name="calendar-outline" size={64} color="#8e8e93" />
    <Text style={styles.emptyStateText}>
      Chưa có sự kiện tiêm chủng nào sắp diễn ra
    </Text>
  </View>
);

const EmptyHistory = () => (
  <View style={styles.emptyState}>
    <Ionicons name="time-outline" size={64} color="#8e8e93" />
    <Text style={styles.emptyStateText}>Chưa có lịch sử tiêm chủng nào</Text>
  </View>
);

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
  const router = useRouter();

  // School Year Selection
  const [selectedSchoolYear, setSelectedSchoolYear] =
    useState<string>("2025-2026");
  const [availableSchoolYears] = useState<string[]>([
    "2025-2026",
    "2026-2027",
    "2027-2028",
  ]);

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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
        if (refresh || page === 1) {
          setVaccineEvents([]);
        }
        setCurrentPage(1);
        setTotalPages(1);
      }

      // Load existing vaccination sessions
      try {
        const sessions = await api.getVaccinationSessions();
        setVaccinationSessions(sessions);
      } catch (error) {
        console.log("No vaccination sessions available:", error);
        setVaccinationSessions([]);
      }

      // Load vaccination history only if student is selected
      if (selectedStudent) {
        try {
          const history = await api.getVaccinationHistory(selectedStudent._id);
          setVaccinationHistory(history);
        } catch (error) {
          console.log("No vaccination history available:", error);
          setVaccinationHistory([]);
        }
      } else {
        setVaccinationHistory([]);
      }
    } catch (error) {
      console.error("Failed to load vaccination data", error);
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
    loadStudents();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedSchoolYear, selectedStudent]); // Reload when student changes

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

  const handleEventPress = (eventId: string): void => {
    if (!selectedStudent) {
      Alert.alert("Thông báo", "Vui lòng chọn học sinh trước khi xem chi tiết");
      return;
    }
    router.push({
      pathname: "/(tabs)/(parent)/vaccinations/event-detail",
      params: {
        id: eventId,
        studentId: selectedStudent._id,
        studentName: selectedStudent.fullName,
      },
    });
  };

  const handleRegisterPress = (): void => {
    if (!selectedStudent) {
      Alert.alert("Thông báo", "Vui lòng chọn học sinh trước khi đăng ký");
      return;
    }
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

  // Add student selection render function
  const renderStudentSelection = () => (
    <View style={styles.studentContainer}>
      <Text style={styles.sectionLabel}>Chọn học sinh</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.studentScrollContainer}
      >
        {students.map((student) => (
          <TouchableOpacity
            key={student._id}
            style={[
              styles.studentCard,
              selectedStudent?._id === student._id &&
                styles.selectedStudentCard,
            ]}
            onPress={() => setSelectedStudent(student)}
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={
                selectedStudent?._id === student._id ? "#4A90E2" : "#8e8e93"
              }
            />
            <Text
              style={[
                styles.studentName,
                selectedStudent?._id === student._id &&
                  styles.selectedStudentName,
              ]}
            >
              {student.fullName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render functions
  const renderEventCard = (event: VaccineEvent) => {
    const isPast = new Date(event.eventDate) < new Date();
    const statusColor = isPast ? "#8e8e93" : "#4A90E2";
    const statusBgColor = isPast ? "#f2f2f7" : "#EBF5FF";

    return (
      <TouchableOpacity
        key={event._id}
        style={[styles.eventCard, isPast && styles.pastEventCard]}
        onPress={() => handleEventPress(event._id)}
      >
        <View style={styles.eventHeader}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusBgColor }]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isPast ? "Đã kết thúc" : "Đang mở đăng ký"}
            </Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.eventName}</Text>
          <Text style={styles.vaccineName}>💉 {event.vaccineName}</Text>
        </View>

        <View style={styles.eventCardInfo}>
          <View style={styles.eventCardInfoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.eventCardInfoText}>
              {formatDate(event.eventDate)}
            </Text>
            <Text style={styles.eventCardInfoTextBold}>
              {formatTime(event.eventDate)}
            </Text>
          </View>

          <View style={styles.eventCardInfoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.eventCardInfoText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>

          <View style={styles.eventCardInfoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.eventCardInfoText}>
              Đăng ký từ: {formatDate(event.startRegistrationDate)} -{" "}
              {formatDate(event.endRegistrationDate)}
            </Text>
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

  const upcomingEvents = vaccineEvents.filter(
    (event) => new Date(event.eventDate) >= new Date()
  );
  const pastEvents = vaccineEvents.filter(
    (event) => new Date(event.eventDate) < new Date()
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
      {renderStudentSelection()}

      <View style={styles.tabContainer}>
        {renderTabButton("events", "Sự kiện", "calendar-outline")}
        {renderTabButton("sessions", "Phiên tiêm", "medical-outline")}
        {renderTabButton("history", "Lịch sử", "time-outline")}
      </View>

      <View style={styles.content}>
        {activeTab === "events" && (
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
              />
            }
          >
            {/* Upcoming Events Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="calendar" size={24} color="#4A90E2" />
                  <Text style={styles.sectionTitle}>Sự kiện sắp diễn ra</Text>
                </View>
                <Text style={styles.eventCount}>
                  {upcomingEvents.length} sự kiện
                </Text>
              </View>

              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(renderEventCard)
              ) : (
                <EmptyUpcoming />
              )}
            </View>

            {/* Past Events Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="time" size={24} color="#8e8e93" />
                  <Text style={styles.sectionTitle}>Lịch sử tiêm chủng</Text>
                </View>
                <Text style={styles.eventCount}>
                  {pastEvents.length} sự kiện
                </Text>
              </View>

              {pastEvents.length > 0 ? (
                pastEvents.map(renderEventCard)
              ) : (
                <EmptyHistory />
              )}
            </View>
          </ScrollView>
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
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
    lineHeight: 28,
  },
  vaccineName: {
    fontSize: 17,
    color: "#34495e",
    lineHeight: 24,
  },
  eventDescription: {
    fontSize: 13,
    color: "#95a5a6",
    marginBottom: 16,
    lineHeight: 18,
  },
  eventInfo: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f2f2f7",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  infoTextBold: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    lineHeight: 22,
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
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 4,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#8e8e93",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
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
  studentContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  studentScrollContainer: {
    paddingRight: 20,
  },
  studentCard: {
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
  selectedStudentCard: {
    backgroundColor: "#E8F4FD",
    borderColor: "#4A90E2",
  },
  studentName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#8e8e93",
  },
  selectedStudentName: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
  },
  eventCount: {
    fontSize: 14,
    color: "#666",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  pastEventCard: {
    opacity: 0.8,
  },
  eventHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  eventContent: {
    padding: 16,
    paddingTop: 12,
  },
  eventCardInfo: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f2f2f7",
    marginTop: 8,
  },
  eventCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eventCardInfoText: {
    flex: 1,
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  eventCardInfoTextBold: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    lineHeight: 22,
  },
});
