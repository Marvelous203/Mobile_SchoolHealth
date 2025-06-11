"use client"

import { api } from "@/lib/api"
import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function VaccinationsScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [vaccinationSessions, setVaccinationSessions] = useState([])
  const [vaccinationHistory, setVaccinationHistory] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        // Fetch upcoming vaccination sessions
        const sessions = await api.getVaccinationSessions()
        setVaccinationSessions(sessions)

        // Fetch vaccination history
        // In a real app, you would get the studentId from context or params
        const studentId = "1"
        const history = await api.getVaccinationHistory(studentId)
        setVaccinationHistory(history)
      } catch (error) {
        console.error("Failed to load vaccination data", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const renderVaccinationItem = ({ item }) => {
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
        style={styles.vaccinationCard}
        onPress={() => {
          if (item.status === "pending") {
            router.push(`/(tabs)/(parent)/vaccinations/consent?id=${item.id}`)
          } else {
            router.push(`/(tabs)/(parent)/vaccinations/details?id=${item.id}`)
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.vaccinationName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesome5 name={statusIcon} size={12} color="#fff" />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.vaccinationDate}>Scheduled: {item.date}</Text>
        <Text style={styles.vaccinationDescription}>{item.description}</Text>

        <View style={styles.cardFooter}>
          {item.status === "pending" ? (
            <TouchableOpacity
              style={styles.consentButton}
              onPress={() => router.push(`/(tabs)/(parent)/vaccinations/consent?id=${item.id}`)}
            >
              <Text style={styles.consentButtonText}>Provide Consent</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => router.push(`/(tabs)/(parent)/vaccinations/details?id=${item.id}`)}
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderHistoryItem = ({ item }) => {
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyName}>{item.name}</Text>
          <View style={[styles.historyBadge, { backgroundColor: "#52c41a" }]}>
            <Text style={styles.historyBadgeText}>Completed</Text>
          </View>
        </View>
        <Text style={styles.historyDate}>Date: {item.date}</Text>
        <Text style={styles.historyNotes}>{item.notes}</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading vaccinations...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vaccinations</Text>
        <Text style={styles.subtitle}>Review and manage your child's vaccinations</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Upcoming Vaccinations</Text>
        {vaccinationSessions.length > 0 ? (
          <FlatList
            data={vaccinationSessions}
            renderItem={renderVaccinationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming vaccinations scheduled.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, styles.historyTitle]}>Vaccination History</Text>
        {vaccinationHistory.length > 0 ? (
          <FlatList
            data={vaccinationHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No vaccination history available.</Text>
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
  vaccinationCard: {
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
  vaccinationName: {
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
  vaccinationDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  vaccinationDescription: {
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
    marginBottom: 8,
  },
  historyNotes: {
    fontSize: 14,
    color: "#333",
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
