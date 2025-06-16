import { api } from "@/lib/api"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get('window')

export default function StudentDetail() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>()
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const loadStudentData = async () => {
    try {
      setIsLoading(true)
      console.log('📚 Loading student detail for ID:', studentId)
      
      const studentResponse = await api.getStudentById(studentId)
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
    if (studentId) {
      loadStudentData()
    }
  }, [studentId])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết học sinh</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết học sinh</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#f5222d" />
          <Text style={styles.errorText}>Không tìm thấy thông tin học sinh</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Basic Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color="#1890ff" />
          <Text style={styles.infoLabel}>Họ và tên:</Text>
          <Text style={styles.infoValue}>{student.fullName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="badge" size={20} color="#1890ff" />
          <Text style={styles.infoLabel}>Mã học sinh:</Text>
          <Text style={styles.infoValue}>{student.studentCode}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="wc" size={20} color="#1890ff" />
          <Text style={styles.infoLabel}>Giới tính:</Text>
          <Text style={styles.infoValue}>{student.gender === 'male' ? 'Nam' : 'Nữ'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="cake" size={20} color="#1890ff" />
          <Text style={styles.infoLabel}>Ngày sinh:</Text>
          <Text style={styles.infoValue}>
            {student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="school" size={20} color="#1890ff" />
          <Text style={styles.infoLabel}>Lớp:</Text>
          <Text style={styles.infoValue}>{student.classInfo?.name || 'Chưa phân lớp'}</Text>
        </View>
      </View>

      {/* Parent Info Card */}
      {student.parentInfos && student.parentInfos.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Thông tin phụ huynh</Text>
          {student.parentInfos.map((parent: any, index: number) => (
            <View key={index} style={styles.parentInfo}>
              <View style={styles.parentHeader}>
                <MaterialIcons name="family-restroom" size={20} color="#52c41a" />
                <Text style={styles.parentType}>
                  {parent.type === 'father' ? 'Bố' : parent.type === 'mother' ? 'Mẹ' : 'Người giám hộ'}
                </Text>
              </View>
              <View style={styles.parentDetails}>
                <Text style={styles.parentName}>{parent.fullName}</Text>
                <Text style={styles.parentContact}>📞 {parent.phone}</Text>
                <Text style={styles.parentContact}>✉️ {parent.email}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <FontAwesome5 name="file-medical-alt" size={24} color="#52c41a" />
            <Text style={styles.quickActionText}>Hồ sơ sức khỏe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <FontAwesome5 name="syringe" size={24} color="#fa8c16" />
            <Text style={styles.quickActionText}>Tiêm chủng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <FontAwesome5 name="pills" size={24} color="#1890ff" />
            <Text style={styles.quickActionText}>Thuốc</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialIcons name="health-and-safety" size={24} color="#f5222d" />
            <Text style={styles.quickActionText}>Khám sức khỏe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderHealthTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Tình trạng sức khỏe</Text>
        <View style={styles.healthStatus}>
          <View style={styles.healthIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#52c41a' }]} />
            <Text style={styles.healthStatusText}>Tốt</Text>
          </View>
          <Text style={styles.healthNote}>Cập nhật lần cuối: Hôm nay</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Chỉ số sức khỏe gần nhất</Text>
        <View style={styles.healthMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Chiều cao</Text>
            <Text style={styles.metricValue}>135 cm</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Cân nặng</Text>
            <Text style={styles.metricValue}>32 kg</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Thị lực</Text>
            <Text style={styles.metricValue}>20/20</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Thính lực</Text>
            <Text style={styles.metricValue}>Bình thường</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Lịch sử y tế</Text>
        <View style={styles.medicalHistory}>
          <View style={styles.historyItem}>
            <View style={styles.historyDate}>
              <Text style={styles.historyDateText}>15/10</Text>
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Khám sức khỏe định kỳ</Text>
              <Text style={styles.historyDescription}>Kết quả: Bình thường</Text>
            </View>
          </View>
          <View style={styles.historyItem}>
            <View style={styles.historyDate}>
              <Text style={styles.historyDateText}>01/09</Text>
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Tiêm vaccine cúm</Text>
              <Text style={styles.historyDescription}>Hoàn thành</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )

  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Sự kiện y tế sắp tới</Text>
        <View style={styles.eventsList}>
          <View style={styles.eventItem}>
            <View style={[styles.eventIndicator, { backgroundColor: '#f5222d' }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>Tiêm vaccine HPV</Text>
              <Text style={styles.eventDate}>25/12/2024</Text>
              <Text style={styles.eventDescription}>Cần có mặt lúc 8:00 AM</Text>
            </View>
            <TouchableOpacity style={styles.eventAction}>
              <Text style={styles.eventActionText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.eventItem}>
            <View style={[styles.eventIndicator, { backgroundColor: '#faad14' }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>Khám sức khỏe định kỳ</Text>
              <Text style={styles.eventDate}>30/12/2024</Text>
              <Text style={styles.eventDescription}>Khám tổng quát cuối năm</Text>
            </View>
            <TouchableOpacity style={styles.eventAction}>
              <Text style={styles.eventActionText}>Đặt lịch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Lịch sử sự kiện</Text>
        <View style={styles.eventsList}>
          <View style={styles.eventItem}>
            <View style={[styles.eventIndicator, { backgroundColor: '#52c41a' }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>Khám sức khỏe đầu năm học</Text>
              <Text style={styles.eventDate}>15/09/2024</Text>
              <Text style={styles.eventDescription}>Đã hoàn thành</Text>
            </View>
            <TouchableOpacity style={styles.eventAction}>
              <Text style={styles.eventActionText}>Xem kết quả</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết học sinh</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#1890ff']}
          />
        }
      >
        {/* Student Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: student.avatar || 'https://via.placeholder.com/120' }} 
              style={styles.avatar} 
            />
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: '#52c41a' }]} />
            </View>
          </View>
          <Text style={styles.studentName}>{student.fullName}</Text>
          <Text style={styles.studentClass}>{student.classInfo?.name || 'Chưa phân lớp'}</Text>
          <Text style={styles.studentCode}>Mã HS: {student.studentCode}</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Tổng quan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'health' && styles.activeTab]}
            onPress={() => setActiveTab('health')}
          >
            <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>
              Sức khỏe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Sự kiện
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'events' && renderEventsTab()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1890ff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  moreButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  studentCode: {
    fontSize: 14,
    color: '#999',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1890ff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1890ff',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  parentInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  parentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#52c41a',
    marginLeft: 8,
  },
  parentDetails: {
    marginLeft: 28,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  parentContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  healthStatus: {
    alignItems: 'center',
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthStatusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#52c41a',
    marginLeft: 8,
  },
  healthNote: {
    fontSize: 14,
    color: '#666',
  },
  healthMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  medicalHistory: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyDate: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1890ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyDateText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  historyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 14,
    color: '#666',
  },
  eventsList: {
    marginTop: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  eventIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: '500',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
    color: '#666',
  },
  eventAction: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  eventActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
})