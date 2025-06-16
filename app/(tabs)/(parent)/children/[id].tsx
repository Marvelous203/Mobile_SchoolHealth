import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'
import { api } from '@/lib/api'

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const loadStudentData = async () => {
    try {
      setIsLoading(true)
      console.log('📚 Loading student detail for ID:', id)
      
      const studentResponse = await api.getStudentById(id)
      const studentData = studentResponse.data || studentResponse
      
      setStudent(studentData)
      console.log('✅ Student detail loaded:', studentData)
      
    } catch (error) {
      console.error('❌ Failed to load student detail:', error)
      Alert.alert('Lỗi', 'Không thể tải thông tin học sinh')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      await loadStudentData()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadStudentData()
    }
  }, [id])

  const quickActions = [
    {
      title: 'Hồ sơ sức khỏe',
      icon: 'file-medical-alt',
      color: '#52c41a',
      onPress: () => router.push(`/(tabs)/(parent)/children/${id}/health`),
    },
    {
      title: 'Lịch sử khám',
      icon: 'stethoscope',
      color: '#1890ff',
      onPress: () => router.push(`/(tabs)/(parent)/health/checkups?studentId=${id}`),
    },
    {
      title: 'Tiêm chủng',
      icon: 'syringe',
      color: '#fa8c16',
      onPress: () => router.push(`/(tabs)/(parent)/health/vaccinations?studentId=${id}`),
    },
    {
      title: 'Thuốc men',
      icon: 'pills',
      color: '#f5222d',
      onPress: () => router.push(`/(tabs)/(parent)/health/medicines?studentId=${id}`),
    },
  ]

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải thông tin học sinh...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy thông tin học sinh</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#1890ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết học sinh</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#1890ff']}
          />
        }
      >
        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <Image 
            source={{ uri: student.avatar || 'https://via.placeholder.com/80' }} 
            style={styles.studentAvatar} 
          />
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{student.fullName}</Text>
            <Text style={styles.studentClass}>{student.classInfo?.name || 'Unknown Class'}</Text>
            <Text style={styles.studentCode}>Mã HS: {student.studentCode}</Text>
            <Text style={styles.studentGender}>Giới tính: {student.gender}</Text>
            <Text style={styles.studentDob}>Ngày sinh: {student.dob}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <FontAwesome5 name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Status Overview */}
        <View style={styles.healthOverviewSection}>
          <Text style={styles.sectionTitle}>Tình trạng sức khỏe</Text>
          <View style={styles.healthStatusCard}>
            <View style={styles.healthStatusItem}>
              <FontAwesome5 name="heartbeat" size={16} color="#52c41a" />
              <Text style={styles.healthStatusText}>Tình trạng tốt</Text>
            </View>
            <View style={styles.healthStatusItem}>
              <FontAwesome5 name="calendar-check" size={16} color="#1890ff" />
              <Text style={styles.healthStatusText}>Khám gần nhất: 15/10/2023</Text>
            </View>
            <View style={styles.healthStatusItem}>
              <FontAwesome5 name="syringe" size={16} color="#fa8c16" />
              <Text style={styles.healthStatusText}>Tiêm chủng đầy đủ</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8c8c8c',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#8c8c8c',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 16,
    color: '#1890ff',
    marginBottom: 4,
  },
  studentCode: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 2,
  },
  studentGender: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 2,
  },
  studentDob: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  quickActionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#262626',
    textAlign: 'center',
  },
  healthOverviewSection: {
    marginBottom: 16,
  },
  healthStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthStatusText: {
    fontSize: 14,
    color: '#262626',
    marginLeft: 8,
  },
})