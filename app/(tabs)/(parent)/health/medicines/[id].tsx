import { api, MedicineSubmissionDetailResponse } from '@/lib/api'
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
} from 'react-native'

export default function MedicineSubmissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [submission, setSubmission] = useState<MedicineSubmissionDetailResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)

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
        {/* Header với trạng thái */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Đơn thuốc #{submission._id.slice(-6)}</Text>
            <Text style={styles.headerDate}>Tạo ngày: {formatDate(submission.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
            <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
          </View>
        </View>

        {/* Thông tin người tạo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người tạo</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#666" />
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{submission.parentId.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{submission.parentId.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.infoLabel}>Điện thoại:</Text>
              <Text style={styles.infoValue}>{submission.parentId.phone}</Text>
            </View>
          </View>
        </View>

        {/* Thông tin y tá phụ trách */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Y tá phụ trách</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={20} color="#666" />
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{submission.schoolNurseId.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{submission.schoolNurseId.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.infoLabel}>Điện thoại:</Text>
              <Text style={styles.infoValue}>{submission.schoolNurseId.phone}</Text>
            </View>
          </View>
        </View>

        {/* Danh sách thuốc */}
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
                  <Text style={styles.medicineValue}>{medicine.timeSlots.join(', ')}</Text>
                </View>
                
                <View style={styles.medicineRow}>
                  <Text style={styles.medicineLabel}>Thời gian:</Text>
                  <Text style={styles.medicineValue}>
                    {formatDateOnly(medicine.startDate)} - {formatDateOnly(medicine.endDate)}
                  </Text>
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
            </View>
          ))}
        </View>

        {/* Thông tin thời gian */}
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
})