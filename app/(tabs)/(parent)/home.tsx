"use client"

import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { Link, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"


export default function ParentHome() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [children, setChildren] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [healthUpdates, setHealthUpdates] = useState<any[]>([])
  const [vaccineEvents, setVaccineEvents] = useState<any[]>([])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log('👨‍👩‍👧‍👦 Loading parent home data...')
      
      // Load user profile
      const userProfileResponse = await api.getCurrentUser()
      console.log('Current user profile response:', userProfileResponse)
      
      // Extract data from response
      const userProfile = userProfileResponse.data || userProfileResponse
      setProfile(userProfile)
      console.log('✅ Parent profile loaded:', userProfile)
      
      // Load children data using real API
      if (userProfile.studentIds && userProfile.studentIds.length > 0) {
        console.log('📚 Loading student data for IDs:', userProfile.studentIds)
        const childrenData = []
        
        for (const studentId of userProfile.studentIds) {
          try {
            const studentResponse = await api.getStudentById(studentId)
            const studentData = studentResponse.data || studentResponse
            
            // Transform student data for display
            const childInfo = {
              id: studentData._id,
              name: studentData.fullName,
              class: studentData.classInfo?.name || 'Unknown Class',
              avatar: studentData.avatar || 'https://via.placeholder.com/60',
              healthStatus: 'good', // Default status, can be updated based on health data
              studentCode: studentData.studentCode,
              gender: studentData.gender,
              dob: studentData.dob,
              classId: studentData.classId,
              parentInfos: studentData.parentInfos
            }
            
            childrenData.push(childInfo)
            console.log(`✅ Student ${studentData.fullName} loaded successfully`)
          } catch (error) {
            console.error(`❌ Failed to load student ${studentId}:`, error)
            // Add placeholder data for failed requests
            childrenData.push({
              id: studentId,
              name: 'Unknown Student',
              class: 'Unknown Class',
              avatar: 'https://via.placeholder.com/60',
              healthStatus: 'unknown',
              error: true
            })
          }
        }
        
        setChildren(childrenData)
        console.log('👶 All children data loaded:', childrenData)
      }
      
      // TODO: Load alerts when API is available
      setAlerts([
        {
          id: 1,
          type: "vaccination",
          title: "Vaccination Consent Required",
          description: "Annual flu vaccination is scheduled for October 15. Please provide your consent.",
          priority: "high",
          date: "2023-10-15"
        },
        {
          id: 2,
          type: "checkup",
          title: "Health Checkup Scheduled",
          description: "Annual health checkup is scheduled for September 20. Please provide your consent.",
          priority: "medium",
          date: "2023-09-20"
        }
      ])
      
      setHealthUpdates([
        {
          id: 1,
          title: "Latest Health Checkup",
          date: "September 5, 2023",
          height: "135 cm",
          weight: "32 kg",
          vision: "20/20 (Normal)"
        }
      ])
      
    } catch (error) {
      console.error('❌ Failed to load parent home data:', error)
      Alert.alert('Lỗi', 'Không thể tải thông tin trang chủ')
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#1890ff']}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {profile?.fullName || user?.name || "Parent"}!</Text>
              <Text style={styles.schoolName}>Lincoln Elementary School</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <MaterialIcons name="logout" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.childSection}>
          <Text style={styles.sectionTitle}>Your Children ({children.length})</Text>
          {children.length > 0 ? (
            children.map((child) => (
              <TouchableOpacity 
                key={child.id} 
                style={styles.childCard}
                onPress={() => {
                  // Navigate to student detail page
                  router.push(`/(tabs)/(parent)/student-detail?studentId=${child.id}`)
                }}
              >
                <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childClass}>{child.class}</Text>
                  {child.studentCode && (
                    <Text style={styles.childCode}>Code: {child.studentCode}</Text>
                  )}
                  <View style={styles.healthStatus}>
                    <View style={[
                      styles.statusIndicator, 
                      child.error ? styles.statusError :
                      child.healthStatus === 'good' ? styles.statusGood : styles.statusWarning
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: child.error ? '#f5222d' :
                        child.healthStatus === 'good' ? '#52c41a' : '#faad14' }
                    ]}>
                      {child.error ? 'Error loading data' :
                       child.healthStatus === 'good' ? 'Good' : 'Needs Attention'}
                    </Text>
                  </View>
                  <View style={styles.tapToViewContainer}>
                    <Text style={styles.tapToView}>Nhấn để xem chi tiết</Text>
                    <MaterialIcons name="arrow-forward-ios" size={12} color="#1890ff" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noChildrenCard}>
              <Text style={styles.noChildrenText}>No children registered</Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionCards}>
            <Link href="/(tabs)/(parent)/health/medicines/submit" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="pills" size={24} color="#1890ff" />
                <Text style={styles.actionText}>Submit Medicine</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(parent)/health-profile" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="file-medical-alt" size={24} color="#52c41a" />
                <Text style={styles.actionText}>Health Profile</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(parent)/vaccinations" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="syringe" size={24} color="#fa8c16" />
                <Text style={styles.actionText}>Vaccinations</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(parent)/checkups" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <MaterialIcons name="health-and-safety" size={24} color="#f5222d" />
                <Text style={styles.actionText}>Health Checkups</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.alerts}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <FontAwesome5 
                  name="exclamation-circle" 
                  size={18} 
                  color={alert.priority === 'high' ? '#f5222d' : '#faad14'} 
                />
                <Text style={styles.alertTitle}>{alert.title}</Text>
              </View>
              <Text style={styles.alertDescription}>{alert.description}</Text>
              <Link 
                href={`/(tabs)/(parent)/${alert.type === 'vaccination' ? 'vaccinations' : 'checkups'}/consent?id=${alert.id}`} 
                asChild
              >
                <TouchableOpacity style={[
                  styles.alertButton,
                  alert.priority === 'medium' ? styles.yellowButton : null
                ]}>
                  <Text style={styles.alertButtonText}>Review & Consent</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ))}
        </View>

        <View style={styles.healthUpdates}>
          <Text style={styles.sectionTitle}>Health Updates</Text>
          {healthUpdates.map((update) => (
            <View key={update.id} style={styles.updateCard}>
              <Text style={styles.updateTitle}>{update.title}</Text>
              <Text style={styles.updateDate}>{update.date}</Text>
              <View style={styles.updateDetail}>
                <Text style={styles.updateLabel}>Height:</Text>
                <Text style={styles.updateValue}>{update.height}</Text>
              </View>
              <View style={styles.updateDetail}>
                <Text style={styles.updateLabel}>Weight:</Text>
                <Text style={styles.updateValue}>{update.weight}</Text>
              </View>
              <View style={styles.updateDetail}>
                <Text style={styles.updateLabel}>Vision:</Text>
                <Text style={styles.updateValue}>{update.vision}</Text>
              </View>
              <Link href={`/(tabs)/(parent)/checkups/results?id=${update.id}`} asChild>
                <TouchableOpacity style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreText}>View Full Report</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ))}
        </View>

        <View style={styles.schoolInfo}>
          <Text style={styles.sectionTitle}>School Health Resources</Text>
          <TouchableOpacity style={styles.resourceItem}>
            <MaterialIcons name="article" size={20} color="#1890ff" />
            <Text style={styles.resourceText}>School Health Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <MaterialIcons name="event" size={20} color="#1890ff" />
            <Text style={styles.resourceText}>Vaccination Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <MaterialIcons name="people" size={20} color="#1890ff" />
            <Text style={styles.resourceText}>Meet Our Health Team</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Debug Info */}
        {__DEV__ && profile && (
          <View style={styles.debugSection}>
            <Text style={styles.sectionTitle}>Debug Info</Text>
            <View style={styles.debugCard}>
              <Text style={styles.debugText}>Email: {profile.email}</Text>
              <Text style={styles.debugText}>Phone: {profile.phone}</Text>
              <Text style={styles.debugText}>Role: {profile.role}</Text>
              <Text style={styles.debugText}>Student IDs: {profile.studentIds?.join(', ')}</Text>
              <Text style={styles.debugText}>Created: {new Date(profile.createdAt).toLocaleDateString('vi-VN')}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
  },
  schoolName: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  childSection: {
    padding: 20,
  },
  childCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  noChildrenCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noChildrenText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
  },
  childClass: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  childId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusError: {
    backgroundColor: '#f5222d',
  },
  tapToView: {
    fontSize: 11,
    color: '#1890ff',
    fontStyle: 'italic',
    marginTop: 4,
  },
  healthStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusGood: {
    backgroundColor: "#52c41a",
  },
  statusWarning: {
    backgroundColor: "#faad14",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  quickActions: {
    padding: 20,
  },
  actionCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  alerts: {
    padding: 20,
  },
  alertCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  alertDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  alertButton: {
    backgroundColor: "#f5222d",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  yellowButton: {
    backgroundColor: "#faad14",
  },
  alertButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  healthUpdates: {
    padding: 20,
  },
  updateCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  updateDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  updateDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  updateLabel: {
    fontSize: 14,
    color: "#666",
  },
  updateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  viewMoreButton: {
    marginTop: 10,
    alignItems: "center",
  },
  viewMoreText: {
    color: "#1890ff",
    fontWeight: "500",
  },
  schoolInfo: {
    padding: 20,
    paddingBottom: 40,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  debugSection: {
    padding: 20,
    paddingBottom: 40,
  },
  debugCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    fontFamily: "monospace",
  },
  actionButton: {
    backgroundColor: '#f5222d',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  vaccineEvents: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  viewAllText: {
    color: "#1890ff",
    fontSize: 14,
    fontWeight: "500",
  },
  vaccineEventCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  eventStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  eventVaccineName: {
    fontSize: 14,
    color: "#1890ff",
    fontWeight: "500",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: "#666",
  },
  viewMoreButton: {
    marginTop: 10,
    alignItems: "center",
  },
  viewMoreText: {
    color: "#1890ff",
    fontWeight: "500",
  },
  schoolInfo: {
    padding: 20,
    paddingBottom: 40,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  debugSection: {
    padding: 20,
    paddingBottom: 40,
  },
  debugCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    fontFamily: "monospace",
  },
  actionButton: {
    backgroundColor: '#f5222d',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
})
