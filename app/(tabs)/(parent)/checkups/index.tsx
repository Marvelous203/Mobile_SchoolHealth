"use client"

import { api } from "@/lib/api"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface HealthCheckSession {
  id: string
  name: string
  date: string
  description: string
  status: 'pending' | 'approved' | 'completed'
}

interface HealthCheckHistory {
  id: string
  name: string
  date: string
  abnormal: boolean
  height: number
  weight: number
  vision: string
}

export default function CheckupsScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [checkupSessions, setCheckupSessions] = useState<HealthCheckSession[]>([])
  const [checkupHistory, setCheckupHistory] = useState<HealthCheckHistory[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // Fetch upcoming health check sessions
        const sessions = await api.getHealthCheckSessions()
        setCheckupSessions(sessions)

        // Fetch health check history
        // In a real app, you would get the studentId from context or params
        const studentId = "1"
        const history = await api.getHealthCheckHistory(studentId)
        setCheckupHistory(history)
      } catch (error) {
        console.error("Failed to load health checkup data", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const navigateToConsent = (id: string) => router.push(`/(parent)/checkups/consent?id=${id}`)
  const navigateToResults = (id: string) => router.push(`/(parent)/checkups/results?id=${id}`)

  const renderCheckupItem = ({ item }: { item: HealthCheckSession }) => {
    let statusColor = "#f5222d"
    let statusIcon = "clock"
    let statusText = "Consent Required"

    if (item.status === "approved") {
      statusColor = "#faad14"
      statusIcon = "check-circle"
      statusText = "Consent Approved"
    } else if (item.status === "completed") {
      statusColor = "#52c41a"
      statusIcon = "check-double"
      statusText = "Completed"
    }

    return (
      <TouchableOpacity
        style={styles.checkupCard}
        onPress={() => item.status === "pending" ? navigateToConsent(item.id) : navigateToResults(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.checkupName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesome5 name={statusIcon} size={12} color="#fff" />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.checkupDate}>Scheduled: {item.date}</Text>
        <Text style={styles.checkupDescription}>{item.description}</Text>

        <View style={styles.cardFooter}>
          {item.status === "pending" ? (
            <TouchableOpacity
              style={styles.consentButton}
              onPress={() => navigateToConsent(item.id)}
            >
              <Text style={styles.consentButtonText}>Provide Consent</Text>
            </TouchableOpacity>
          ) : item.status === "completed" ? (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => navigateToResults(item.id)}
            >
              <Text style={styles.detailsButtonText}>View Results</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>Consent Provided</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderHistoryItem = ({ item }: { item: HealthCheckHistory }) => {
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => navigateToResults(item.id)}
      >
        <View style={styles.historyHeader}>
          <Text style={styles.historyName}>{item.name}</Text>
          <View
            style={[
              styles.historyBadge,
              {
                backgroundColor: item.abnormal ? "#ff4d4f" : "#52c41a",
              },
            ]}
          >
            <Text style={styles.historyBadgeText}>{item.abnormal ? "Abnormal" : "Normal"}</Text>
          </View>
        </View>
        <Text style={styles.historyDate}>Date: {item.date}</Text>

        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <MaterialIcons name="height" size={16} color="#666" />
            <Text style={styles.metricText}>{item.height} cm</Text>
          </View>
          <View style={styles.metricItem}>
            <FontAwesome5 name="weight" size={14} color="#666" />
            <Text style={styles.metricText}>{item.weight} kg</Text>
          </View>
          <View style={styles.metricItem}>
            <FontAwesome5 name="eye" size={14} color="#666" />
            <Text style={styles.metricText}>{item.vision}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigateToResults(item.id)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading health checkups...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Checkups</Text>
        <Text style={styles.subtitle}>Review and manage your child's health checkups</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Upcoming Checkups</Text>
        {checkupSessions.length > 0 ? (
          <FlatList
            data={checkupSessions}
            renderItem={renderCheckupItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming health checkups scheduled.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, styles.historyTitle]}>Checkup History</Text>
        {checkupHistory.length > 0 ? (
          <FlatList
            data={checkupHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No health checkup history available.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  historyTitle: {
    marginTop: 30,
  },
  listContainer: {
    paddingBottom: 10,
  },
  historyContainer: {
    paddingBottom: 20,
  },
  checkupCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  checkupName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  checkupDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  checkupDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  consentButton: {
    backgroundColor: "#1890ff",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  consentButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  detailsButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detailsButtonText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 14,
  },
  approvedBadge: {
    backgroundColor: "#d9f7be",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  approvedText: {
    color: "#52c41a",
    fontWeight: "500",
    fontSize: 14,
  },
  historyItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyName: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  historyDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  metricsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  metricText: {
    fontSize: 14,
    marginLeft: 5,
  },
  viewButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  viewButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },
})
