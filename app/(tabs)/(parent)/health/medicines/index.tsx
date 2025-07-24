import { api } from '@/lib/api'
import { MedicineSubmission } from '@/lib/types'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// Interface mở rộng để bao gồm thông tin học sinh
interface MedicineSubmissionWithStudent extends MedicineSubmission {
  studentInfo?: {
    _id: string
    fullName: string
    studentCode: string
    studentIdCode: string
    classInfo?: {
      _id: string
      name: string
    }
  }
}

export default function MedicinesScreen() {
  const [medicineSubmissions, setMedicineSubmissions] = useState<MedicineSubmissionWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  // Cache thông tin học sinh để tránh gọi API lặp lại
  const [studentCache, setStudentCache] = useState<Record<string, any>>({})

  const handleCreateMedicine = () => {
    router.push('/health/medicines/create')
  }

  // Thay thế useEffect hiện tại
  useEffect(() => {
    loadMedicineSubmissions()
  }, []) // Đảm bảo dependency array rỗng
  
  // Tối ưu hóa loadCurrentUser để tránh gọi lại không cần thiết
  const loadCurrentUser = async () => {
    try {
      // Kiểm tra cache trước khi gọi API
      if (currentUser && currentUser._id) {
        return currentUser
      }
      
      // Xóa dữ liệu cũ trong AsyncStorage để đảm bảo lấy dữ liệu mới
      await AsyncStorage.removeItem('userData')
      
      // Gọi API để lấy dữ liệu mới
      console.log('Fetching current user profile from API...')
      const response = await api.getCurrentUser()
      
      if (response && response.success && response.data) {
        console.log('✅ Parent profile loaded:', response.data)
        
        // Lưu dữ liệu mới vào AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(response.data))
        setCurrentUser(response.data)
        return response.data
      }
      
    } catch (error) {
      console.error('Error loading user data:', error)
    }
    return null
  }

  // Wrap các hàm với useCallback
  // Hàm fetch thông tin học sinh
  const fetchStudentInfo = async (studentId: string) => {
    // Kiểm tra cache trước
    if (studentCache[studentId]) {
      return studentCache[studentId]
    }

    try {
      console.log('📚 Fetching student info for ID:', studentId)
      const response = await api.getStudentById(studentId)
      
      if (response && response.data) {
        const studentInfo = {
          _id: response.data._id,
          fullName: response.data.fullName,
          studentCode: response.data.studentCode,
          classInfo: response.data.classInfo ? {
            _id: response.data.classInfo._id,
            name: response.data.classInfo.name
          } : undefined
        }
        
        // Lưu vào cache
        setStudentCache(prev => ({
          ...prev,
          [studentId]: studentInfo
        }))
        
        return studentInfo
      }
    } catch (error) {
      console.error('❌ Error fetching student info:', error)
    }
    
    return null
  }

  // Cập nhật hàm loadMedicineSubmissions
  const loadMedicineSubmissions = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
  
      const user = await loadCurrentUser()
      console.log('User for API call:', user)
      
      if (!user || !user._id) {
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng')
        return
      }
  
      // Kiểm tra ID có đúng định dạng MongoDB ObjectId không
      if (user._id.length !== 24) {
        console.error('Invalid user ID format:', user._id)
        Alert.alert('Lỗi', 'ID người dùng không hợp lệ')
        return
      }
  
      console.log('🔍 Searching medicine submissions with parentId:', user._id)
  
      const response = await api.searchMedicineSubmissions({
        parentId: user._id,
        pageNum: page,
        pageSize: 10
      })
  
      console.log('💊 Medicine submissions response:', response)
  
      if (response && response.pageData) {
        // Fetch thông tin học sinh cho từng đơn thuốc
        const submissionsWithStudentInfo = await Promise.all(
          response.pageData.map(async (submission: MedicineSubmission) => {
            const studentInfo = await fetchStudentInfo(submission.studentId)
            return {
              ...submission,
              studentInfo
            } as MedicineSubmissionWithStudent
          })
        )
        
        if (isRefresh || page === 1) {
          setMedicineSubmissions(submissionsWithStudentInfo)
        } else {
          setMedicineSubmissions(prev => [...prev, ...submissionsWithStudentInfo])
        }
        
        setHasMore(page < response.pageInfo.totalPages)
      }
    } catch (error: any) {
      console.error('Error loading medicine submissions:', error)
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách đơn thuốc')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentUser, studentCache])
  
  const onRefresh = useCallback(() => {
    setPageNum(1)
    loadMedicineSubmissions(1, true)
  }, [loadMedicineSubmissions])
  
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = pageNum + 1
      setPageNum(nextPage)
      loadMedicineSubmissions(nextPage)
    }
  }, [hasMore, loading, pageNum, loadMedicineSubmissions])

  useEffect(() => {
    loadMedicineSubmissions()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'approved': return '#4CAF50'
      case 'completed': return '#2196F3'
      default: return '#999'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt'
      case 'approved': return 'Đã duyệt'
      case 'completed': return 'Hoàn thành'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }
  const handleReuseMedicine = async (item: MedicineSubmission) => {
    try {
      // Lưu dữ liệu vào AsyncStorage với timeSlots đã được format
      const reuseData = {
        medicines: item.medicines.map(medicine => ({
          name: medicine.name,
          dosage: medicine.dosage,
          usageInstructions: medicine.usageInstructions,
          quantity: medicine.quantity,
          timesPerDay: medicine.timesPerDay,
          // Chuyển đổi timeSlots về format HH:MM
          timeSlots: medicine.timeSlots.map(timeSlot => {
            try {
              const date = new Date(timeSlot)
              if (isNaN(date.getTime())) {
                return timeSlot
              }
              return date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            } catch {
              return timeSlot
            }
          }),
          note: medicine.note,
          reason: medicine.reason
        })),
        schoolNurseId: item.schoolNurse?._id
      }
      
      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('medicineReuseData', JSON.stringify(reuseData))
      
      // Chuyển đến màn hình tạo với flag reuse
      router.push({
        pathname: '/health/medicines/create',
        params: { reuse: 'true' }
      })
    } catch (error) {
      console.error('Error preparing reuse data:', error)
      Alert.alert('Lỗi', 'Không thể tái sử dụng đơn thuốc này')
    }
  }
  
  // Cập nhật hàm renderMedicineItem để hiển thị thông tin học sinh
  const renderMedicineItem = (item: MedicineSubmissionWithStudent) => (
    <TouchableOpacity 
      key={item._id} 
      style={styles.medicineItem}
      onPress={() => router.push(`/health/medicines/${item._id}`)}
    >
      <View style={styles.medicineHeader}>
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineTitle}>
            {item.medicines.length} loại thuốc
          </Text>
          {/* Hiển thị thông tin học sinh */}
          {item.studentInfo && (
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                 {item.studentInfo.fullName}
              </Text>
              <Text style={styles.studentDetails}>
                 {item.studentInfo.studentIdCode}
                {item.studentInfo.classInfo && ` •  ${item.studentInfo.classInfo.name}`}
              </Text>
            </View>
          )}
          <Text style={styles.medicineDate}>
            Tạo ngày: {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.medicineDetails}>
        {item.medicines.slice(0, 2).map((medicine, index) => (
          <Text key={index} style={styles.medicineDetailText}>
            • {medicine.name} - {medicine.dosage}
          </Text>
        ))}
        {item.medicines.length > 2 && (
          <Text style={styles.moreText}>
            +{item.medicines.length - 2} thuốc khác
          </Text>
        )}
      </View>
      
      <View style={styles.medicineFooter}>
        <TouchableOpacity 
          style={styles.reuseButton}
          onPress={(e) => {
            e.stopPropagation()
            handleReuseMedicine(item)
          }}
        >
          <Ionicons name="copy" size={16} color="#4CAF50" />
          <Text style={styles.reuseButtonText}>Tái sử dụng</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>

      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
          const paddingToBottom = 20
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore()
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Header với nút tạo đơn thuốc */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quản lý thuốc</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateMedicine}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.createButtonText}>Tạo đơn thuốc</Text>
          </TouchableOpacity>
        </View>

        {/* Thông tin hướng dẫn */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.infoTitle}>Hướng dẫn sử dụng</Text>
          </View>
          <Text style={styles.infoText}>
            • Tạo đơn thuốc cho con em khi cần thiết{"\n"}
            • Điền đầy đủ thông tin về thuốc và liều lượng{"\n"}
            • Y tá trường sẽ xem xét và phê duyệt đơn thuốc{"\n"}
            • Theo dõi tình trạng đơn thuốc trong danh sách
          </Text>
        </View>

        {/* Danh sách đơn thuốc */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn thuốc gần đây</Text>
          
          {loading && medicineSubmissions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : medicineSubmissions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có đơn thuốc nào</Text>
              <Text style={styles.emptySubText}>Nhấn "Tạo đơn thuốc" để bắt đầu</Text>
            </View>
          ) : (
            <View>
              {medicineSubmissions.map(renderMedicineItem)}
              {loading && (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Thêm styles mới cho thông tin học sinh
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
  content: {
    flex: 1,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  medicineItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicineDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  medicineDetails: {
    marginBottom: 8,
  },
  medicineDetailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  medicineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    },
    reuseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    },
    reuseButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
    },
      studentInfo: {
    marginVertical: 4,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: 12,
    color: '#666',
  },
  },
)