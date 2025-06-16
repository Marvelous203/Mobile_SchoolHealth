"use client"

import { api } from "@/lib/api"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get('window')

export default function VaccineEventDetailScreen() {
  const { id } = useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState(null)

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setIsLoading(true)
        const response = await api.getVaccineEventById(id as string)
        setEventData(response.data)
      } catch (error) {
        console.error("Failed to load vaccine event data", error)
        Alert.alert("Lỗi", "Không thể tải thông tin sự kiện tiêm chủng")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadEventData()
    }
  }, [id])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#4A90E2'
      case 'ongoing': return '#7ED321'
      case 'completed': return '#9B9B9B'
      case 'cancelled': return '#D0021B'
      default: return '#F5A623'
    }
  }

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'upcoming': return '#E8F4FD'
      case 'ongoing': return '#F0FDF4'
      case 'completed': return '#F5F5F5'
      case 'cancelled': return '#FEF2F2'
      default: return '#FFFBEB'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra'
      case 'ongoing': return 'Đang diễn ra'
      case 'completed': return 'Đã hoàn thành'
      case 'cancelled': return 'Đã hủy'
      default: return 'Không xác định'
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="medical" size={48} color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải thông tin sự kiện...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#D0021B" />
          <Text style={styles.errorText}>Không tìm thấy thông tin sự kiện</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.headerContainer, { backgroundColor: getStatusColor(eventData.status) }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.heroSection}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusText(eventData.status)}</Text>
          </View>
          <Text style={styles.eventTitle}>{eventData.title}</Text>
          <Text style={styles.vaccineNameHero}>💉 {eventData.vaccineName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
            </View>
            <Text style={styles.description}>{eventData.description}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Địa điểm</Text>
            </View>
            <View style={styles.locationCard}>
              <Ionicons name="location-outline" size={24} color="#4A90E2" />
              <Text style={styles.locationText}>{eventData.location}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Thời gian</Text>
            </View>
            
            <View style={styles.timeCard}>
              <View style={styles.timeRow}>
                <View style={styles.timeIcon}>
                  <Ionicons name="play-circle" size={20} color="#7ED321" />
                </View>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Bắt đầu</Text>
                  <Text style={styles.timeValue}>{formatDate(eventData.startDate)}</Text>
                  <Text style={styles.timeDetail}>{formatTime(eventData.startDate)}</Text>
                </View>
              </View>
              
              <View style={styles.timeDivider} />
              
              <View style={styles.timeRow}>
                <View style={styles.timeIcon}>
                  <Ionicons name="stop-circle" size={20} color="#D0021B" />
                </View>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Kết thúc</Text>
                  <Text style={styles.timeValue}>{formatDate(eventData.endDate)}</Text>
                  <Text style={styles.timeDetail}>{formatTime(eventData.endDate)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alarm" size={20} color="#D0021B" />
              <Text style={styles.sectionTitle}>Hạn đăng ký</Text>
            </View>
            <View style={styles.deadlineCard}>
              <Ionicons name="time-outline" size={24} color="#D0021B" />
              <View style={styles.deadlineInfo}>
                <Text style={styles.deadlineDate}>{formatDate(eventData.registrationDeadline)}</Text>
                <Text style={styles.deadlineTime}>{formatTime(eventData.registrationDeadline)}</Text>
              </View>
            </View>
          </View>

          {eventData.requirements && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Yêu cầu</Text>
              </View>
              <Text style={styles.requirements}>{eventData.requirements}</Text>
            </View>
          )}

          {eventData.notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Ghi chú</Text>
              </View>
              <Text style={styles.notes}>{eventData.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.registerButton, { backgroundColor: getStatusColor(eventData.status) }]}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.registerButtonText}>Đăng ký tham gia</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  vaccineNameHero: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: -15,
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 25,
    paddingHorizontal: 20,
    minHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 15,
  },
  locationText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    fontWeight: '500',
  },
  timeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  timeDetail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  timeDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#D0021B',
  },
  deadlineInfo: {
    marginLeft: 12,
    flex: 1,
  },
  deadlineDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  deadlineTime: {
    fontSize: 14,
    color: '#D0021B',
    marginTop: 2,
    fontWeight: '500',
  },
  requirements: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 15,
  },
  notes: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 15,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})