"use client"

import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

export default function ParentHome() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [children, setChildren] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [recentBlogs, setRecentBlogs] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [pendingMedicines, setPendingMedicines] = useState<any[]>([])
  const [quickStats, setQuickStats] = useState({
    totalEvents: 0,
    pendingTasks: 0,
    upcomingAppointments: 0,
    healthAlerts: 0,
  })

  const getCurrentSchoolYear = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11

    // Năm học bắt đầu từ tháng 9
    if (currentMonth >= 9) {
      return `${currentYear}-${currentYear + 1}`
    } else {
      return `${currentYear - 1}-${currentYear}`
    }
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log("👨‍👩‍👧‍👦 Loading parent home data...")

      // Load user profile
      const userProfileResponse = await api.getCurrentUser()
      const userProfile = (userProfileResponse as any).data || userProfileResponse
      setProfile(userProfile)
      console.log("✅ Parent profile loaded:", userProfile.fullName)

      // Load children data using real API
      if (userProfile.studentIds && userProfile.studentIds.length > 0) {
        console.log("📚 Loading student data for IDs:", userProfile.studentIds)
        const childrenData = []

        for (const studentId of userProfile.studentIds) {
          try {
            const studentResponse = await api.getStudentById(studentId)
            const studentData = studentResponse.data || studentResponse

            // Get latest health record for this student
            let lastCheckup = "Chưa có"
            let healthStatus = "unknown"
            try {
              const healthRecords = await api.searchHealthRecords({
                pageNum: 1,
                pageSize: 1,
                studentId: studentData._id,
                schoolYear: getCurrentSchoolYear(),
              })

              if (healthRecords.pageData && healthRecords.pageData.length > 0) {
                const latestRecord = healthRecords.pageData[0]
                lastCheckup = new Date(latestRecord.createdAt).toLocaleDateString("vi-VN")
                healthStatus = "good" // Assume good if has recent record
              }
            } catch (healthError) {
              console.warn(`⚠️ Could not load health records for ${studentData.fullName}:`, healthError)
            }

            const childInfo = {
              id: studentData._id,
              name: studentData.fullName,
              class: studentData.classInfo?.name || "Chưa phân lớp",
              avatar: studentData.avatar || "https://via.placeholder.com/60",
              healthStatus,
              studentCode: studentData.studentCode,
              gender: studentData.gender,
              dob: studentData.dob,
              classId: studentData.classId,
              classInfo: studentData.classInfo,
              parentInfos: studentData.parentInfos || [],
              recentActivity: "Khám sức khỏe định kỳ",
              lastCheckup,
            }

            childrenData.push(childInfo)
            console.log(`✅ Student ${studentData.fullName} loaded successfully`)
          } catch (error) {
            console.error(`❌ Failed to load student ${studentId}:`, error)
            childrenData.push({
              id: studentId,
              name: "Unknown Student",
              class: "Unknown Class",
              avatar: "https://via.placeholder.com/60",
              healthStatus: "unknown",
              error: true,
            })
          }
        }

        setChildren(childrenData)
        console.log("👶 All children data loaded:", childrenData.length)
      }

      // Load real alerts from vaccine and health check events
      await loadAlerts(userProfile)

      // Load recent blogs
      await loadRecentBlogs()

      // Load upcoming events
      await loadUpcomingEvents()

      // Load pending medicine submissions
      await loadPendingMedicines(userProfile._id)

      // Update quick stats with real data
      await updateQuickStats(userProfile)
    } catch (error) {
      console.error("❌ Failed to load parent home data:", error)
      Alert.alert("Lỗi", "Không thể tải thông tin trang chủ")
    } finally {
      setIsLoading(false)
    }
  }

  const loadAlerts = async (userProfile: any) => {
    try {
      const alertsData = []
      const currentSchoolYear = getCurrentSchoolYear()

      // Load vaccine events that need consent
      try {
        const vaccineEvents = await api.searchVaccineEvents({
          pageNum: 1,
          pageSize: 5,
          schoolYear: currentSchoolYear,
        })

        if (vaccineEvents.pageData) {
          for (const event of vaccineEvents.pageData) {
            // Check if user has registered for this event
            const registrations = await api.searchVaccineRegistrations({
              pageNum: 1,
              pageSize: 1,
              parentId: userProfile._id,
              eventId: event._id,
            })

            if (!registrations.pageData || registrations.pageData.length === 0) {
              alertsData.push({
                id: `vaccine-${event._id}`,
                type: "vaccination",
                title: "Cần đồng ý tiêm chủng",
                description: `Sự kiện tiêm chủng "${event.title}" cần sự đồng ý của phụ huynh.`,
                priority: "high",
                date: event.startRegistrationDate,
                eventId: event._id,
                route: "/(tabs)/(parent)/vaccinations",
              })
            }
          }
        }
      } catch (error) {
        console.warn("⚠️ Could not load vaccine events for alerts:", error)
      }

      // Load health check events that need consent
      try {
        const healthEvents = await api.searchHealthCheckEvents({
          pageNum: 1,
          pageSize: 5,
          schoolYear: currentSchoolYear,
        })

        if (healthEvents.pageData) {
          for (const event of healthEvents.pageData) {
            // Check if user has registered for this event
            const registrations = await api.searchHealthCheckRegistrations({
              pageNum: 1,
              pageSize: 1,
              parentId: userProfile._id,
              eventId: event._id,
            })

            if (!registrations.pageData || registrations.pageData.length === 0) {
              alertsData.push({
                id: `health-${event._id}`,
                type: "checkup",
                title: "Cần đồng ý khám sức khỏe",
                description: `Sự kiện khám sức khỏe "${event.eventName}" cần sự đồng ý của phụ huynh.`,
                priority: "medium",
                date: event.startRegistrationDate,
                eventId: event._id,
                route: "/(tabs)/(parent)/health/registration",
              })
            }
          }
        }
      } catch (error) {
        console.warn("⚠️ Could not load health check events for alerts:", error)
      }

      setAlerts(alertsData)
      console.log("🚨 Alerts loaded:", alertsData.length)
    } catch (error) {
      console.error("❌ Failed to load alerts:", error)
    }
  }

  const loadRecentBlogs = async () => {
    try {
      const blogsResponse = await api.searchBlogs({
        pageNum: 1,
        pageSize: 3,
      })

      if (blogsResponse.pageData) {
        setRecentBlogs(blogsResponse.pageData)
        console.log("📰 Recent blogs loaded:", blogsResponse.pageData.length)
      }
    } catch (error) {
      console.warn("⚠️ Could not load recent blogs:", error)
    }
  }

  const loadUpcomingEvents = async () => {
    try {
      const events = []
      const currentSchoolYear = getCurrentSchoolYear()

      // Load upcoming vaccine events
      const vaccineEvents = await api.searchVaccineEvents({
        pageNum: 1,
        pageSize: 3,
        schoolYear: currentSchoolYear,
      })

      if (vaccineEvents.pageData) {
        events.push(
          ...vaccineEvents.pageData.map((event: any) => ({
            ...event,
            type: "vaccine",
            icon: "syringe",
            color: "#6366f1",
          })),
        )
      }

      // Load upcoming health check events
      const healthEvents = await api.searchHealthCheckEvents({
        pageNum: 1,
        pageSize: 3,
        schoolYear: currentSchoolYear,
      })

      if (healthEvents.pageData) {
        events.push(
          ...healthEvents.pageData.map((event: any) => ({
            ...event,
            title: event.eventName,
            type: "health",
            icon: "stethoscope",
            color: "#10b981",
          })),
        )
      }

      // Sort by date and take first 5
      events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      setUpcomingEvents(events.slice(0, 5))
      console.log("📅 Upcoming events loaded:", events.length)
    } catch (error) {
      console.warn("⚠️ Could not load upcoming events:", error)
    }
  }

  const loadPendingMedicines = async (parentId: string) => {
    try {
      const medicinesResponse = await api.searchMedicineSubmissions({
        pageNum: 1,
        pageSize: 5,
        parentId,
        status: "pending",
      })

      if (medicinesResponse.pageData) {
        setPendingMedicines(medicinesResponse.pageData)
        console.log("💊 Pending medicines loaded:", medicinesResponse.pageData.length)
      }
    } catch (error) {
      console.warn("⚠️ Could not load pending medicines:", error)
    }
  }

  const updateQuickStats = async (userProfile: any) => {
    try {
      let totalEvents = 0
      let pendingTasks = 0
      let upcomingAppointments = 0
      let healthAlerts = 0

      // Count vaccine events
      try {
        const vaccineEvents = await api.searchVaccineEvents({
          pageNum: 1,
          pageSize: 50,
          schoolYear: getCurrentSchoolYear(),
        })
        totalEvents += vaccineEvents.pageInfo?.totalItems || 0
      } catch (error) {
        console.warn("Could not count vaccine events:", error)
      }

      // Count health check events
      try {
        const healthEvents = await api.searchHealthCheckEvents({
          pageNum: 1,
          pageSize: 50,
          schoolYear: getCurrentSchoolYear(),
        })
        totalEvents += healthEvents.pageInfo?.totalItems || 0
      } catch (error) {
        console.warn("Could not count health events:", error)
      }

      // Count pending medicine submissions
      try {
        const pendingMedicines = await api.searchMedicineSubmissions({
          pageNum: 1,
          pageSize: 50,
          parentId: userProfile._id,
          status: "pending",
        })
        pendingTasks += pendingMedicines.pageInfo?.totalItems || 0
      } catch (error) {
        console.warn("Could not count pending medicines:", error)
      }

      // Count appointments
      try {
        const appointments = await api.searchAppointments({
          pageNum: 1,
          pageSize: 10,
          parentId: userProfile._id,
          status: "approved",
        })
        upcomingAppointments = appointments.pageInfo?.totalItems || 0
      } catch (error) {
        console.warn("Could not count appointments:", error)
      }

      // Count health alerts (from alerts array)
      healthAlerts = alerts.length

      setQuickStats({
        totalEvents,
        pendingTasks,
        upcomingAppointments,
        healthAlerts,
      })

      console.log("📊 Quick stats updated:", { totalEvents, pendingTasks, upcomingAppointments, healthAlerts })
    } catch (error) {
      console.error("❌ Failed to update quick stats:", error)
    }
  }

  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      await loadData()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const renderHeader = () => (
    <LinearGradient colors={["#1990ff", "#8b5cf6"]} style={styles.headerGradient}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Xin chào, {profile?.fullName || user?.name || "Phụ huynh"}! 👋</Text>
          <Text style={styles.schoolName}>Trường Tiểu học Lincoln</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.profileButton}>
          <View style={styles.profileButtonContainer}>
            <Ionicons name="log-out" size={24} color="#6366f1" />
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Tổng quan</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#f0f0ff" }]}>
            <Ionicons name="calendar-outline" size={24} color="#6366f1" />
          </View>
          <Text style={styles.statNumber}>{quickStats.totalEvents}</Text>
          <Text style={styles.statLabel}>Sự kiện</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#fff7ed" }]}>
            <Ionicons name="list-outline" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.statNumber}>{quickStats.pendingTasks}</Text>
          <Text style={styles.statLabel}>Cần xử lý</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="time-outline" size={24} color="#10b981" />
          </View>
          <Text style={styles.statNumber}>{quickStats.upcomingAppointments}</Text>
          <Text style={styles.statLabel}>Lịch hẹn</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#fef2f2" }]}>
            <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
          </View>
          <Text style={styles.statNumber}>{quickStats.healthAlerts}</Text>
          <Text style={styles.statLabel}>Cảnh báo</Text>
        </View>
      </View>
    </View>
  )

  const renderAlerts = () => {
    if (alerts.length === 0) return null

    return (
      <View style={styles.alertsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thông báo quan trọng</Text>
          <View style={styles.alertCount}>
            <Text style={styles.alertCountText}>{alerts.length}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {alerts.map((alert, index) => (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertCard, { marginLeft: index === 0 ? 20 : 12 }]}
              onPress={() => router.push(alert.route)}
            >
              <View style={styles.alertCardContent}>
                <View
                  style={[
                    styles.alertIconContainer,
                    {
                      backgroundColor: alert.priority === "high" ? "#fef2f2" : "#f0fdf4",
                    },
                  ]}
                >
                  <Ionicons
                    name={alert.type === "vaccination" ? "medical-outline" : "fitness-outline"}
                    size={24}
                    color={alert.priority === "high" ? "#ef4444" : "#10b981"}
                  />
                </View>
                <Text style={styles.alertTitle} numberOfLines={2}>
                  {alert.title}
                </Text>
                <Text style={styles.alertDescription} numberOfLines={3}>
                  {alert.description}
                </Text>
                <Text style={styles.alertDate}>{new Date(alert.date).toLocaleDateString("vi-VN")}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ width: 20 }} />
        </ScrollView>
      </View>
    )
  }

  const renderChildren = () => (
    <View style={styles.childSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Con em ({children.length})</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/(parent)/children")} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={16} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {children.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {children.map((child, index) => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childCard, { marginLeft: index === 0 ? 20 : 12 }]}
              onPress={() => {
                router.push(`/(tabs)/(parent)/children/${child.id}`)
              }}
            >
              <View style={styles.childCardContent}>
                <View style={styles.childImageContainer}>
                  <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
                  <View
                    style={[
                      styles.statusDot,
                      child.error
                        ? styles.statusError
                        : child.healthStatus === "good"
                          ? styles.statusGood
                          : styles.statusWarning,
                    ]}
                  />
                </View>

                <View style={styles.childInfo}>
                  <Text style={styles.childName} numberOfLines={1}>
                    {child.name}
                  </Text>
                  <Text style={styles.childClass}>{child.class}</Text>
                  {child.studentCode && <Text style={styles.childCode}>Mã: {child.studentCode}</Text>}

                  <View style={styles.childStats}>
                    <View style={styles.childStatItem}>
                      <Ionicons
                        name="heart-outline"
                        size={14}
                        color={child.healthStatus === "good" ? "#10b981" : "#f59e0b"}
                      />
                      <Text style={styles.childStatText}>{child.healthStatus === "good" ? "Tốt" : "Chưa rõ"}</Text>
                    </View>
                    <View style={styles.childStatItem}>
                      <Ionicons name="calendar-outline" size={14} color="#6366f1" />
                      <Text style={styles.childStatText}>{child.lastCheckup}</Text>
                    </View>
                  </View>

                  <Text style={styles.recentActivity} numberOfLines={1}>
                    {child.recentActivity}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ width: 20 }} />
        </ScrollView>
      ) : (
        <View style={styles.noChildrenCard}>
          <View style={styles.noChildrenIconContainer}>
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
          </View>
          <Text style={styles.noChildrenText}>Chưa có thông tin con em</Text>
          <TouchableOpacity style={styles.addChildButton}>
            <Text style={styles.addChildText}>Thêm thông tin</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const renderUpcomingEvents = () => {
    if (upcomingEvents.length === 0) return null

    return (
      <View style={styles.eventsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/(parent)/vaccinations")} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {upcomingEvents.slice(0, 3).map((event, index) => (
          <TouchableOpacity
            key={event._id}
            style={styles.eventItem}
            onPress={() => {
              if (event.type === "vaccine") {
                router.push(`/(tabs)/(parent)/vaccinations/event-detail?id=${event._id}`)
              } else {
                router.push(`/(tabs)/(parent)/health/checkups/detail?id=${event._id}`)
              }
            }}
          >
            <View style={[styles.eventIcon, { backgroundColor: event.color }]}>
              <Ionicons
                name={event.icon === "syringe" ? "medical-outline" : "fitness-outline"}
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title || event.eventName}
              </Text>
              <Text style={styles.eventDate}>{new Date(event.eventDate).toLocaleDateString("vi-VN")}</Text>
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description || "Không có mô tả"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderRecentBlogs = () => {
    if (recentBlogs.length === 0) return null

    return (
      <View style={styles.blogsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tin tức mới nhất</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/(parent)/blogs")} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentBlogs.map((blog, index) => (
            <TouchableOpacity
              key={blog._id}
              style={[styles.blogCard, { marginLeft: index === 0 ? 20 : 12 }]}
              onPress={() => router.push(`/(tabs)/(parent)/blogs/${blog._id}`)}
            >
              <View style={styles.blogCardContent}>
                {blog.image && <Image source={{ uri: blog.image }} style={styles.blogImage} />}
                <View style={styles.blogInfo}>
                  <Text style={styles.blogTitle} numberOfLines={2}>
                    {blog.title}
                  </Text>
                  <Text style={styles.blogDate}>{new Date(blog.createdAt).toLocaleDateString("vi-VN")}</Text>
                  <Text style={styles.blogSummary} numberOfLines={3}>
                    {blog.summary || blog.content?.substring(0, 100) + "..."}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ width: 20 }} />
        </ScrollView>
      </View>
    )
  }

  const renderQuickActions = () => {
    const actions = [
      {
        id: "health",
        title: "Sức khỏe",
        subtitle: "Hồ sơ & Khám bệnh",
        icon: "heart-outline",
        route: "/(tabs)/(parent)/health",
      },
      {
        id: "medicines",
        title: "Thuốc men",
        subtitle: "Gửi đơn thuốc",
        icon: "medical-outline",
        route: "/(tabs)/(parent)/health/medicines",
        badge: pendingMedicines.length > 0 ? pendingMedicines.length : null,
      },
      {
        id: "checkups",
        title: "Khám sức khỏe",
        subtitle: "Đặt lịch & Kết quả",
        icon: "fitness-outline",
        route: "/(tabs)/(parent)/health/checkups",
      },
      {
        id: "vaccinations",
        title: "Tiêm chủng",
        subtitle: "Lịch tiêm & Đồng ý",
        icon: "shield-checkmark-outline",
        route: "/(tabs)/(parent)/vaccinations",
      },
      {
        id: "appointments",
        title: "Tư vấn",
        subtitle: "Đặt lịch tư vấn",
        icon: "calendar-outline",
        route: "/(tabs)/(parent)/appointments",
      },
      {
        id: "blogs",
        title: "Tin tức",
        subtitle: "Thông tin y tế",
        icon: "newspaper-outline",
        route: "/(tabs)/(parent)/blogs",
      },
      {
        id: "profile",
        title: "Hồ sơ",
        subtitle: "Thông tin cá nhân",
        icon: "person-circle-outline",
        route: "/(tabs)/(parent)/profile",
      },
    ]

    return (
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Dịch vụ</Text>
        <View style={styles.actionGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCardContainer}
              onPress={() => router.push(action.route as any)}
            >
              <View style={styles.actionCard}>
                {action.badge && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{action.badge}</Text>
                  </View>
                )}
                <View style={styles.actionIconContainer}>
                  <Ionicons name={action.icon as any} size={28} color="#6366f1" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="medical" size={48} color="#6366f1" />
          </View>
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.loadingDot, { animationDelay: "0ms" }]} />
            <View style={[styles.loadingDot, { animationDelay: "150ms" }]} />
            <View style={[styles.loadingDot, { animationDelay: "300ms" }]} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} colors={["#6366f1"]} tintColor="#6366f1" />
        }
      >
        {renderHeader()}
        {renderQuickStats()}
        {renderAlerts()}
        {renderChildren()}
        {renderUpcomingEvents()}
        {renderRecentBlogs()}
        {renderQuickActions()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },

  // Header Styles
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "400",
  },
  profileButton: {
    marginLeft: 16,
  },
  profileButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Stats Section
  statsContainer: {
    padding: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "500",
  },

  // Alerts Section
  alertsSection: {
    marginTop: 20,
  },
  alertCount: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  alertCard: {
    width: 280,
    marginRight: 12,
  },
  alertCardContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  alertDate: {
    fontSize: 12,
    color: "#9ca3af",
  },

  // Children Section
  childSection: {
    marginTop: 20,
  },
  childCard: {
    width: 280,
    marginRight: 12,
  },
  childCardContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  childImageContainer: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  childAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#f3f4f6",
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    bottom: 0,
    right: 10,
    borderWidth: 3,
    borderColor: "#fff",
  },
  statusGood: {
    backgroundColor: "#10b981",
  },
  statusWarning: {
    backgroundColor: "#f59e0b",
  },
  statusError: {
    backgroundColor: "#ef4444",
  },
  childInfo: {
    alignItems: "center",
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
    textAlign: "center",
  },
  childClass: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  childCode: {
    fontSize: 12,
    color: "#6366f1",
    marginBottom: 12,
    fontWeight: "500",
  },
  childStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 12,
  },
  childStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  childStatText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  recentActivity: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
  noChildrenCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noChildrenIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noChildrenText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 20,
    fontWeight: "500",
  },
  addChildButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addChildText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Events Section
  eventsSection: {
    padding: 20,
    marginTop: 20,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#6366f1",
    marginBottom: 4,
    fontWeight: "500",
  },
  eventDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },

  // Blogs Section
  blogsSection: {
    marginTop: 20,
  },
  blogCard: {
    width: 280,
    marginRight: 12,
  },
  blogCardContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  blogImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  blogInfo: {
    padding: 16,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    lineHeight: 22,
  },
  blogDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  blogSummary: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },

  // Quick Actions
  quickActions: {
    padding: 20,
    marginTop: 20,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCardContainer: {
    width: (width - 60) / 2,
    marginBottom: 16,
    position: "relative",
  },
  actionCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  actionBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "500",
  },

  bottomSpacing: {
    height: 30,
  },
})
