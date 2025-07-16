import { api } from "@/lib/api"
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
  RefreshControl,
  ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MedicineSubmission, MedicineSubmissionDetailResponse } from "@/lib/types"

export default function MedicineHistoryScreen() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  // Add proper typing for state
  const [medicines, setMedicines] = useState<MedicineSubmission[]>([])
  const [refreshing, setRefreshing] = useState(false)
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

      const params: MedicineSubmissionDetailResponse = {
        parentId: user?._id,
        pageNum: page,
        pageSize: pageSize
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
  }, [user])

  const onRefresh = () => {
    setRefreshing(true)
    loadMedicines(1, true)
  }

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadMedicines(currentPage + 1)
    }
  }

  // Type the render function parameter
  const renderMedicineHistoryItem = ({ item }: { item: MedicineSubmission }) => {
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
        style={styles.historyCard}
        onPress={() => router.push(`/health/medicines/${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="prescription-bottle-alt" size={20} color="#1890ff" />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.medicineName} numberOfLines={1}>
              {item.medicines?.length > 0 ? `${item.medicines.length} loại thuốc` : 'Đơn thuốc'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <FontAwesome5 name={statusIcon} size={8} color="#fff" />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
          
          <Text style={styles.dosageText}>
            {item.medicines?.slice(0, 2).map(med => med.name).join(', ')}
          </Text>
          
          <View style={styles.dateRow}>
            <MaterialIcons name="event" size={14} color="#999" />
            <Text style={styles.dateText}>
              Tạo ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardRight}>
          <MaterialIcons name="chevron-right" size={20} color="#bfbfbf" />
        </View>
      </TouchableOpacity>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#1890ff" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{medicines.length}</Text>
          <Text style={styles.summaryLabel}>Tổng đơn thuốc</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {medicines.filter(m => m.status === 'completed').length}
          </Text>
          <Text style={styles.summaryLabel}>Đã hoàn thành</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {medicines.filter(m => m.status === 'pending').length}
          </Text>
          <Text style={styles.summaryLabel}>Đang chờ</Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch sử uống thuốc</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {medicines.length > 0 ? (
            <FlatList
              data={medicines}
              renderItem={renderMedicineHistoryItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              ListHeaderComponent={renderHeader}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="prescription-bottle-alt" size={60} color="#d9d9d9" />
              <Text style={styles.emptyTitle}>Chưa có lịch sử uống thuốc</Text>
              <Text style={styles.emptySubtitle}>Lịch sử các đơn thuốc sẽ hiển thị tại đây</Text>
            </View>
          )}
        </View>
      )}
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1890ff",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#f0f0f0",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardLeft: {
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  dosageText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  cardRight: {
    marginLeft: 8,
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
  },
})