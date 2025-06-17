import React from "react"
import { api, MedicineSubmissionSearchParams } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get('window')

export default function MedicinesScreen() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [medicines, setMedicines] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const pageSize = 10

  const loadMedicines = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) {
        setIsLoading(true)
      } else {
        setLoadingMore(true)
      }

      const params: MedicineSubmissionSearchParams = {
        parentId: user?._id,
        pageNum: page,
        pageSize: pageSize
      }

      if (searchQuery.trim()) {
        params.query = searchQuery.trim()
      }

      if (selectedStatus !== 'all') {
        params.status = selectedStatus as any
      }

      const response = await api.searchMedicineSubmissions(params)
      
      if (page === 1 || isRefresh) {
        setMedicines(response.pageData)
      } else {
        setMedicines(prev => [...prev, ...response.pageData])
      }
      
      setCurrentPage(page)
      setTotalPages(response.pageInfo.totalPages)
    } catch (error) {
      console.error("Failed to load medicines", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (user?._id) {
      loadMedicines()
    }
  }, [user, searchQuery, selectedStatus])

  const onRefresh = () => {
    setRefreshing(true)
    loadMedicines(1, true)
  }

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadMedicines(currentPage + 1)
    }
  }

  const renderMedicineItem = ({ item }) => {
    let statusColor = "#1890ff"
    let statusText = "Đang chờ"
    let statusIcon = "clock"

    if (item.status === "approved") {
      statusColor = "#52c41a"
      statusText = "Đã duyệt"
      statusIcon = "check-circle"
    } else if (item.status === "completed") {
      statusColor = "#d9d9d9"
      statusText = "Hoàn thành"
      statusIcon = "check-circle"
    }

    return (
      <TouchableOpacity
        style={styles.medicineCard}
        onPress={() => router.push(`/(parent)/medicines/details?id=${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.medicineInfo}>
            <Text style={styles.medicineName} numberOfLines={2}>{item.medicineName}</Text>
            <View style={styles.dosageContainer}>
              <FontAwesome5 name="prescription-bottle-alt" size={12} color="#666" />
              <Text style={styles.dosageText}>
                {item.dosage} - {item.timesPerDay}x/ngày
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesome5 name={statusIcon} size={10} color="#fff" />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <MaterialIcons name="event" size={14} color="#666" />
            <Text style={styles.dateLabel}>Bắt đầu:</Text>
            <Text style={styles.dateValue}>{item.startDate}</Text>
          </View>
          <View style={styles.dateItem}>
            <MaterialIcons name="event-available" size={14} color="#666" />
            <Text style={styles.dateLabel}>Kết thúc:</Text>
            <Text style={styles.dateValue}>{item.endDate}</Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>
              <Text style={styles.notesLabel}>Ghi chú: </Text>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => router.push(`/(parent)/medicines/details?id=${item.id}`)}
          >
            <Text style={styles.detailsButtonText}>Xem chi tiết</Text>
            <FontAwesome5 name="chevron-right" size={12} color="#1890ff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lọc đơn thuốc</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <FontAwesome5 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Trạng thái:</Text>
            {['all', 'pending', 'approved', 'completed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  selectedStatus === status && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setSelectedStatus(status)
                  setShowFilterModal(false)
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedStatus === status && styles.filterOptionTextSelected
                ]}>
                  {status === 'all' ? 'Tất cả' : 
                   status === 'pending' ? 'Đang chờ' :
                   status === 'approved' ? 'Đã duyệt' : 'Hoàn thành'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#1890ff" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đơn thuốc</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push("/(parent)/health/medicines/create")}
        >
          <FontAwesome5 name="plus" size={14} color="#fff" />
          <Text style={styles.addButtonText}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome5 name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên thuốc..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <FontAwesome5 name="filter" size={16} color="#1890ff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải đơn thuốc...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {medicines.length > 0 ? (
            <FlatList
              data={medicines}
              renderItem={renderMedicineItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="prescription-bottle-alt" size={60} color="#d9d9d9" />
              <Text style={styles.emptyTitle}>Chưa có đơn thuốc nào</Text>
              <Text style={styles.emptySubtitle}>Tạo đơn thuốc đầu tiên cho con bạn</Text>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={() => router.push("/(parent)/health/medicines/create")}
              >
                <FontAwesome5 name="plus" size={16} color="#fff" />
                <Text style={styles.submitButtonText}>Tạo đơn thuốc</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      {renderFilterModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1890ff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  filterButton: {
    padding: 12,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1890ff",
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  medicineCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  medicineInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  dosageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dosageText: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  dateContainer: {
    marginBottom: 12,
    gap: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  dateValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  notesContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontWeight: "600",
    color: "#666",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  cardFooter: {
    alignItems: "flex-end",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsButtonText: {
    color: "#1890ff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1890ff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  filterSection: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  filterOptionSelected: {
    backgroundColor: "#1890ff",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#333",
  },
  filterOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
})
