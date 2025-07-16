import { api, MedicineSubmission } from '@/lib/api'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
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

export default function MedicinesScreen() {
  const [medicineSubmissions, setMedicineSubmissions] = useState<MedicineSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const handleCreateMedicine = () => {
    router.push('/health/medicines/create')
  }

  const loadCurrentUser = async () => {
    try {
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

  const loadMedicineSubmissions = async (page: number = 1, isRefresh: boolean = false) => {
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
        parentId: user._id, // Sử dụng _id thay vì id
        pageNum: page,
        pageSize: 10
      })

      console.log('💊 Medicine submissions response:', response)

      if (response && response.pageData) {
        if (isRefresh || page === 1) {
          setMedicineSubmissions(response.pageData)
        } else {
          setMedicineSubmissions(prev => [...prev, ...response.pageData])
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
  }

  const onRefresh = () => {
    setPageNum(1)
    loadMedicineSubmissions(1, true)
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = pageNum + 1
      setPageNum(nextPage)
      loadMedicineSubmissions(nextPage)
    }
  }

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
 const renderMedicineItem = (item: MedicineSubmission) => (
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
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  )

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
        <Text style={styles.headerTitle}>Quản lý thuốc</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreateMedicine}
        >
          <MaterialIcons name="add" size={24} color="#1890ff" />
        </TouchableOpacity>
      </View>
      
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
    alignItems: 'flex-end',
  },
})