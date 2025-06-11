import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// Mock data
const vaccinationSessions = [
  {
    id: "1",
    name: "Annual Flu Vaccination",
    date: "October 15, 2023",
    status: "upcoming",
    totalStudents: 120,
    consentedStudents: 98,
    completedVaccinations: 0,
  },
  {
    id: "2",
    name: "MMR Booster",
    date: "November 10, 2023",
    status: "upcoming",
    totalStudents: 45,
    consentedStudents: 40,
    completedVaccinations: 0,
  },
  {
    id: "3",
    name: "Tetanus Booster",
    date: "January 20, 2024",
    status: "upcoming",
    totalStudents: 60,
    consentedStudents: 52,
    completedVaccinations: 0,
  },
  {
    id: "4",
    name: "HPV Vaccination",
    date: "September 5, 2023",
    status: "completed",
    totalStudents: 75,
    consentedStudents: 68,
    completedVaccinations: 68,
  },
]

export default function NurseVaccinationsScreen() {
  const renderSessionItem = ({ item }) => {
    let statusColor = "#faad14"
    let statusIcon = "calendar-alt"
    let statusText = "Upcoming"

    if (item.status === "in-progress") {
      statusColor = "#1890ff"
      statusIcon = "syringe"
      statusText = "In Progress"
    } else if (item.status === "completed") {
      statusColor = "#52c41a"
      statusIcon = "check-double"
      statusText = "Completed"
    }

    const progressPercentage =
      item.status === "completed" ? 100 : Math.round((item.consentedStudents / item.totalStudents) * 100)

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/(nurse)/vaccinations/session-details?id=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.sessionName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesome5 name={statusIcon} size={12} color="#fff" />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.sessionDate}>Date: {item.date}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalStudents}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.consentedStudents}</Text>
            <Text style={styles.statLabel}>Consented</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.completedVaccinations}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={styles.progressText}>{progressPercentage}% Consented</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, item.status === "completed" ? styles.viewButton : styles.manageButton]}
          onPress={() => router.push(`/(nurse)/vaccinations/session-details?id=${item.id}`)}
        >
          <Text style={styles.actionButtonText}>{item.status === "completed" ? "View Results" : "Manage Session"}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vaccination Sessions</Text>
        <Text style={styles.subtitle}>Manage school vaccination programs</Text>
      </View>

      <FlatList
        data={vaccinationSessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity style={styles.addButton}>
        <FontAwesome5 name="plus" size={16} color="#fff" />
        <Text style={styles.addButtonText}>New Vaccination Session</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for the floating button
  },
  sessionCard: {
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
  sessionName: {
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
  sessionDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1890ff",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  actionButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  manageButton: {
    backgroundColor: "#1890ff",
  },
  viewButton: {
    backgroundColor: "#52c41a",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#1890ff",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
})
