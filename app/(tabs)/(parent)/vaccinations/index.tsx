"use client"

import { api } from "@/lib/api"
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View, RefreshControl, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get('window')

export default function VaccinationsScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [vaccineEvents, setVaccineEvents] = useState([])
  const [vaccinationSessions, setVaccinationSessions] = useState([])
  const [vaccinationHistory, setVaccinationHistory] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState('events')

  const loadData = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      // Load vaccine events from new API
      const eventsResponse = await api.searchVaccineEvents(page, 10)
      if (refresh || page === 1) {
        setVaccineEvents(eventsResponse.pageData)
      } else {
        setVaccineEvents(prev => [...prev, ...eventsResponse.pageData])
      }
      setCurrentPage(eventsResponse.pageInfo.pageNum)
      setTotalPages(eventsResponse.pageInfo.totalPages)

      // Load existing vaccination sessions (keep for backward compatibility)
      try {
        const sessions = await api.getVaccinationSessions()
        setVaccinationSessions(sessions)
      } catch (error) {
        console.log('No vaccination sessions available:', error)
        setVaccinationSessions([])
      }

      // Load vaccination history
      try {
        const studentId = "1" // In real app, get from context
        const history = await api.getVaccinationHistory(studentId)
        setVaccinationHistory(history)
      } catch (error) {
        console.log('No vaccination history available:', error)
        setVaccinationHistory([])
      }
    } catch (error) {
      console.error("Failed to load vaccination data", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadMoreData = () => {
    if (currentPage < totalPages && !isLoading) {
      loadData(currentPage + 1, false)
    }
  }

  const refreshData = () => {
    loadData(1, true)
  }

  useEffect(() => {
    loadData()
  }, [])

  const renderVaccineEventItem = ({ item }) => {
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

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return (
      <TouchableOpacity
        style={[styles.modernCard, { borderLeftColor: getStatusColor(item.status) }]}
        onPress={() => {
          router.push(`/(tabs)/(parent)/vaccinations/event-detail?id=${item._id}`)
        }}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.vaccineIcon, { backgroundColor: getStatusBgColor(item.status) }]}>
              <Ionicons name="medical" size={24} color={getStatusColor(item.status)} />
            </View>
            <View style={[styles.statusContainer, { backgroundColor: getStatusBgColor(item.status) }]}>
              <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.vaccineName} numberOfLines={1}>💉 {item.vaccineName}</Text>
          
          <View style={styles.eventInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>{item.location}</Text>
            </View>
            
            <View style={styles.dateContainer}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Bắt đầu</Text>
                <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
                <Text style={styles.timeValue}>{formatTime(item.startDate)}</Text>
              </View>
              <View style={styles.dateSeparator} />
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Kết thúc</Text>
                <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
                <Text style={styles.timeValue}>{formatTime(item.endDate)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.deadlineInfo}>
              <Ionicons name="time-outline" size={14} color="#D0021B" />
              <Text style={styles.deadlineText}>Hạn ĐK: {formatDate(item.registrationDeadline)}</Text>
            </View>
            <TouchableOpacity style={[styles.detailButton, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.detailButtonText}>Chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderTabButton = (tabKey, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTabButton]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tabKey ? '#4A90E2' : '#8e8e93'} 
      />
      <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  )

  const renderEmptyState = (message, icon) => (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color="#e1e8ed" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  )

  if (isLoading && vaccineEvents.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="medical" size={48} color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải thông tin tiêm chủng...</Text>
        </View>
      </SafeAreaView>
    )
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
              <Text style={styles.subtitle}>Quản lý sức khỏe con em</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('events', 'Sự kiện', 'calendar-outline')}
        {renderTabButton('sessions', 'Phiên tiêm', 'medical-outline')}
        {renderTabButton('history', 'Lịch sử', 'time-outline')}
      </View>

      <View style={styles.content}>
        {activeTab === 'events' && (
          <FlatList
            data={vaccineEvents}
            renderItem={renderVaccineEventItem}
            keyExtractor={(item, index) => `event-${item._id || index}`}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshData}
                colors={['#4A90E2']}
                tintColor={'#4A90E2'}
              />
            }
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.1}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => renderEmptyState('Chưa có sự kiện tiêm chủng nào', 'calendar-outline')}
          />
        )}
        
        {activeTab === 'sessions' && (
          <View style={styles.tabContent}>
            {vaccinationSessions.length > 0 ? (
              <FlatList
                data={vaccinationSessions}
                renderItem={({ item }) => (
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <Ionicons name="medical-outline" size={20} color="#4A90E2" />
                      <Text style={styles.sessionTitle}>{item.name}</Text>
                    </View>
                    <Text style={styles.sessionDate}>{item.date}</Text>
                  </View>
                )}
                keyExtractor={(item, index) => `session-${index}`}
                contentContainerStyle={styles.listContainer}
              />
            ) : (
              renderEmptyState('Chưa có phiên tiêm chủng nào', 'medical-outline')
            )}
          </View>
        )}
        
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            {vaccinationHistory.length > 0 ? (
              <FlatList
                data={vaccinationHistory}
                renderItem={({ item }) => (
                  <View style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#7ED321" />
                      <Text style={styles.historyTitle}>{item.name}</Text>
                    </View>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                )}
                keyExtractor={(item, index) => `history-${index}`}
                contentContainerStyle={styles.listContainer}
              />
            ) : (
              renderEmptyState('Chưa có lịch sử tiêm chủng', 'time-outline')
            )}
          </View>
        )}
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
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#E8F4FD',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#8e8e93',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
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
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vaccineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  vaccineName: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  eventInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  dateBox: {
    flex: 1,
    alignItems: 'center',
  },
  dateSeparator: {
    width: 2,
    height: 30,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
  },
  dateLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  timeValue: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deadlineText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#D0021B',
    fontWeight: '500',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  sessionDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#7ED321',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
})
