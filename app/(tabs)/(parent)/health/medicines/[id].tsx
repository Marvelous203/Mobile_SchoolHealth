import AsyncStorage from '@react-native-async-storage/async-storage'
import { api, } from '@/lib/api'
import { MedicineSubmissionDetailResponse } from '@/lib/types'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from 'react-native'

export default function MedicineSubmissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [submission, setSubmission] = useState<MedicineSubmissionDetailResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadSubmissionDetail()
    }
  }, [id])

  const loadSubmissionDetail = async () => {
    try {
      setLoading(true)
      console.log('📋 Loading submission detail for ID:', id)
      
      const response = await api.getMedicineSubmissionById(id as string)
      
      if (response.success && response.data) {
        setSubmission(response.data)
        console.log('✅ Submission detail loaded:', response.data)
        
        // Thêm log chi tiết cho slotStatus
        response.data.medicines.forEach((medicine, index) => {
          console.log(`🔍 Medicine ${index} slotStatus:`, medicine.slotStatus)
          console.log(`📊 SlotStatus length:`, medicine.slotStatus?.length || 0)
        })
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn thuốc')
      }
    } catch (error: any) {
      console.error('❌ Error loading submission detail:', error)
      Alert.alert('Lỗi', error.message || 'Không thể tải thông tin đơn thuốc')
    } finally {
      setLoading(false)
    }
  }

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

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return '#4CAF50'
      case 'missed': return '#f44336'
      case 'pending': return '#FF9800'
      default: return '#999'
    }
  }

  const getSlotStatusText = (status: string) => {
    switch (status) {
      case 'taken': return 'Đã uống'
      case 'missed': return 'Bỏ lỡ'
      case 'pending': return 'Chờ uống'
      default: return status
    }
  }

  const getSlotStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return 'checkmark-circle'
      case 'missed': return 'close-circle'
      case 'pending': return 'time'
      default: return 'help-circle'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }
  
  const formatTimeSlots = (timeSlots: string[]) => {
    return timeSlots.map(timeSlot => {
      try {
        if (timeSlot.includes('T') && timeSlot.includes('Z')) {
          const timePart = timeSlot.split('T')[1].split(':').slice(0, 2).join(':')
          return timePart
        }
        
        const date = new Date(timeSlot)
        if (isNaN(date.getTime())) {
          return timeSlot
        }
        
        return date.toISOString().split('T')[1].split(':').slice(0, 2).join(':')
      } catch {
        return timeSlot
      }
    }).join(', ')
  }

  const formatSlotTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  const renderSlotStatus = (slotStatus: any[]) => {
    if (!slotStatus || slotStatus.length === 0) {
      return null
    }

    return (
      <View style={styles.slotStatusContainer}>
        <Text style={styles.slotStatusTitle}>Trạng thái uống thuốc:</Text>
        {slotStatus.map((slot, index) => (
          <View key={slot._id || index} style={styles.slotStatusCard}>
            <View style={styles.slotStatusHeader}>
              <View style={styles.slotTimeContainer}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.slotTime}>{formatSlotTime(slot.time)}</Text>
              </View>
              <View style={[styles.slotStatusBadge, { backgroundColor: getSlotStatusColor(slot.status) }]}>
                <Ionicons 
                  name={getSlotStatusIcon(slot.status) as any} 
                  size={12} 
                  color="#fff" 
                />
                <Text style={styles.slotStatusText}>{getSlotStatusText(slot.status)}</Text>
              </View>
            </View>
            
            {slot.note && (
              <View style={styles.slotNoteContainer}>
                <Ionicons name="document-text-outline" size={14} color="#666" />
                <Text style={styles.slotNote}>{slot.note}</Text>
              </View>
            )}
            
            {slot.image && (
              <View style={styles.slotImageContainer}>
                <Text style={styles.slotImageLabel}>Hình ảnh xác nhận:</Text>
                <TouchableOpacity 
                  style={styles.slotImageThumbnail}
                  onPress={() => {
                    // Xử lý URL: loại bỏ khoảng trắng, backtick và ký tự đặc biệt
                    const cleanUrl = slot.image.trim().replace(/`/g, '')
                    setSelectedImage(cleanUrl)
                  }}
                >
                  <Image 
                    source={{ uri: slot.image.trim().replace(/`/g, '') }} 
                    style={styles.slotImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="eye" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    )
  }

  const handleReuseMedicine = async () => {
    if (!submission) return
    
    try {
      const reuseData = {
        medicines: submission.medicines.map(medicine => ({
          name: medicine.name,
          dosage: medicine.dosage,
          usageInstructions: medicine.usageInstructions,
          quantity: medicine.quantity,
          timesPerDay: medicine.timesPerDay,
          timeSlots: medicine.timeSlots,
          note: medicine.note,
          reason: medicine.reason
        })),
        schoolNurseId: submission.schoolNurse?._id
      }
      
      await AsyncStorage.setItem('medicineReuseData', JSON.stringify(reuseData))
      
      router.push({
        pathname: '/health/medicines/create',
        params: { reuse: 'true' }
      })
    } catch (error) {
      console.error('Error preparing reuse data:', error)
      Alert.alert('Lỗi', 'Không thể tái sử dụng đơn thuốc này')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!submission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff4d4f" />
          <Text style={styles.errorText}>Không tìm thấy thông tin đơn thuốc</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Đơn thuốc #{submission._id.slice(-6)}</Text>
            <Text style={styles.headerDate}>Tạo ngày: {formatDate(submission.createdAt)}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.reuseButton}
              onPress={handleReuseMedicine}
            >
              <Ionicons name="copy" size={16} color="#4CAF50" />
              <Text style={styles.reuseButtonText}>Tái sử dụng</Text>
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
              <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người tạo</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#666" />
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{submission.parent?.fullName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{submission.parent?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.infoLabel}>Điện thoại:</Text>
              <Text style={styles.infoValue}>{submission.parent?.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Y tá phụ trách</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={20} color="#666" />
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{submission.schoolNurse?.fullName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{submission.schoolNurse?.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.infoLabel}>Điện thoại:</Text>
              <Text style={styles.infoValue}>{submission.schoolNurse?.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {submission.student && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin học sinh</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="school" size={20} color="#666" />
                <Text style={styles.infoLabel}>Họ tên:</Text>
                <Text style={styles.infoValue}>{submission.student.fullName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color="#666" />
                <Text style={styles.infoLabel}>Mã học sinh:</Text>
                <Text style={styles.infoValue}>{submission.student.studentIdCode}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="home" size={20} color="#666" />
                <Text style={styles.infoLabel}>Lớp:</Text>
                <Text style={styles.infoValue}>{submission.student.classId?.name || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách thuốc ({submission.medicines.length})</Text>
          {submission.medicines.map((medicine, index) => (
            <View key={medicine._id} style={styles.medicineCard}>
              <View style={styles.medicineHeader}>
                <Text style={styles.medicineName}>{medicine.name}</Text>
                <Text style={styles.medicineQuantity}>SL: {medicine.quantity}</Text>
              </View>
              
              <View style={styles.medicineDetails}>
                <View style={styles.medicineRow}>
                  <Text style={styles.medicineLabel}>Liều lượng:</Text>
                  <Text style={styles.medicineValue}>{medicine.dosage}</Text>
                </View>
                
                <View style={styles.medicineRow}>
                  <Text style={styles.medicineLabel}>Cách dùng:</Text>
                  <Text style={styles.medicineValue}>{medicine.usageInstructions}</Text>
                </View>
                
                <View style={styles.medicineRow}>
                  <Text style={styles.medicineLabel}>Số lần/ngày:</Text>
                  <Text style={styles.medicineValue}>{medicine.timesPerDay} lần</Text>
                </View>
                
                <View style={styles.medicineRow}>
                  <Text style={styles.medicineLabel}>Giờ uống:</Text>
                  <Text style={styles.medicineValue}>{formatTimeSlots(medicine.timeSlots)}</Text>
                </View>
                
                {medicine.reason && (
                  <View style={styles.medicineRow}>
                    <Text style={styles.medicineLabel}>Lý do:</Text>
                    <Text style={styles.medicineValue}>{medicine.reason}</Text>
                  </View>
                )}
                
                {medicine.note && (
                  <View style={styles.medicineRow}>
                    <Text style={styles.medicineLabel}>Ghi chú:</Text>
                    <Text style={styles.medicineValue}>{medicine.note}</Text>
                  </View>
                )}
              </View>
              
              {renderSlotStatus(medicine.slotStatus)}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thời gian</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.infoLabel}>Ngày tạo:</Text>
              <Text style={styles.infoValue}>{formatDate(submission.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="refresh" size={20} color="#666" />
              <Text style={styles.infoLabel}>Cập nhật:</Text>
              <Text style={styles.infoValue}>{formatDate(submission.updatedAt)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setSelectedImage(null)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  medicineQuantity: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  medicineDetails: {
    gap: 8,
  },
  medicineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  medicineLabel: {
    fontSize: 14,
    color: '#666',
    minWidth: 100,
  },
  medicineValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  slotStatusContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  slotStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  slotStatusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  slotStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  slotStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  slotNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  slotNote: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    flex: 1,
    fontStyle: 'italic',
  },
  slotImageContainer: {
    marginTop: 8,
  },
  slotImageLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  slotImageThumbnail: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  slotImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: '90%',
    height: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
})