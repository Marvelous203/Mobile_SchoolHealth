import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function MedicineManagementScreen() {
  // Mock data for today's overview
  const todayOverview = {
    date: "May 21, 2023",
    totalScheduled: 24,
    administered: 18,
    pending: 6,
    missed: 0,
    newSubmissions: 3,
    approvalsPending: 5,
  }

  const upcomingMedicines = [
    {
      id: "1",
      studentName: "John Smith",
      class: "5A",
      medicine: "Allergy Medication",
      dosage: "5ml",
      timeSlot: "afternoon",
      scheduledTime: "1:00 PM",
      status: "pending",
    },
    {
      id: "2",
      studentName: "Emily Johnson",
      class: "5A",
      medicine: "Asthma Inhaler",
      dosage: "2 puffs",
      timeSlot: "afternoon",
      scheduledTime: "1:30 PM",
      status: "pending",
    },
    {
      id: "3",
      studentName: "Michael Brown",
      class: "5B",
      medicine: "Antibiotics",
      dosage: "250mg",
      timeSlot: "afternoon",
      scheduledTime: "2:00 PM",
      status: "pending",
    },
  ]

  const recentSubmissions = [
    {
      id: "1",
      studentName: "Sophia Davis",
      class: "5B",
      medicine: "Pain Relief",
      submittedBy: "Parent - Maria Davis",
      submittedAt: "2 hours ago",
      status: "pending_approval",
    },
    {
      id: "2",
      studentName: "Daniel Wilson",
      class: "5C",
      medicine: "Vitamin D",
      submittedBy: "Parent - Sarah Wilson",
      submittedAt: "4 hours ago",
      status: "approved",
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Medicine Management</Text>
          <Text style={styles.subtitle}>Today: {todayOverview.date}</Text>
        </View>

        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FontAwesome5 name="pills" size={20} color="#1890ff" />
              <Text style={styles.statValue}>{todayOverview.totalScheduled}</Text>
              <Text style={styles.statLabel}>Total Scheduled</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome5 name="check-circle" size={20} color="#52c41a" />
              <Text style={styles.statValue}>{todayOverview.administered}</Text>
              <Text style={styles.statLabel}>Administered</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome5 name="clock" size={20} color="#faad14" />
              <Text style={styles.statValue}>{todayOverview.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome5 name="exclamation-triangle" size={20} color="#f5222d" />
              <Text style={styles.statValue}>{todayOverview.missed}</Text>
              <Text style={styles.statLabel}>Missed</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(nurse)/medicines/daily-schedule")}
            >
              <FontAwesome5 name="calendar-day" size={24} color="#1890ff" />
              <Text style={styles.actionText}>Daily Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(nurse)/medicines/submissions")}>
              <FontAwesome5 name="file-medical" size={24} color="#52c41a" />
              <Text style={styles.actionText}>Submissions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(nurse)/medicines/history")}>
              <FontAwesome5 name="history" size={24} color="#faad14" />
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <FontAwesome5 name="cog" size={24} color="#666" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Medicines</Text>
            <TouchableOpacity onPress={() => router.push("/(nurse)/medicines/daily-schedule")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingMedicines.map((medicine) => (
            <TouchableOpacity
              key={medicine.id}
              style={styles.medicineCard}
              onPress={() => router.push(`/(nurse)/medicines/administer?scheduleId=${medicine.id}`)}
            >
              <View style={styles.medicineInfo}>
                <Text style={styles.medicineName}>{medicine.medicine}</Text>
                <Text style={styles.studentInfo}>
                  {medicine.studentName} ({medicine.class})
                </Text>
                <Text style={styles.medicineDetails}>
                  {medicine.dosage} • {medicine.scheduledTime}
                </Text>
              </View>
              <View style={styles.medicineActions}>
                <View style={[styles.timeSlotBadge, { backgroundColor: "#1890ff" }]}>
                  <Text style={styles.timeSlotText}>{medicine.timeSlot}</Text>
                </View>
                <TouchableOpacity
                  style={styles.administerButton}
                  onPress={() => router.push(`/(nurse)/medicines/administer?scheduleId=${medicine.id}`)}
                >
                  <FontAwesome5 name="pills" size={12} color="#fff" />
                  <Text style={styles.administerButtonText}>Give</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.submissionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Submissions</Text>
            <TouchableOpacity onPress={() => router.push("/(nurse)/medicines/submissions")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentSubmissions.map((submission) => (
            <View key={submission.id} style={styles.submissionCard}>
              <View style={styles.submissionInfo}>
                <Text style={styles.submissionMedicine}>{submission.medicine}</Text>
                <Text style={styles.submissionStudent}>
                  {submission.studentName} ({submission.class})
                </Text>
                <Text style={styles.submissionDetails}>
                  By {submission.submittedBy} • {submission.submittedAt}
                </Text>
              </View>
              <View style={styles.submissionStatus}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: submission.status === "approved" ? "#52c41a" : "#faad14" },
                  ]}
                >
                  <Text style={styles.statusText}>{submission.status === "approved" ? "Approved" : "Pending"}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.preparationSection}>
          <TouchableOpacity style={styles.preparationCard}>
            <View style={styles.preparationHeader}>
              <FontAwesome5 name="calendar-plus" size={20} color="#1890ff" />
              <Text style={styles.preparationTitle}>Prepare Tomorrow's Schedule</Text>
            </View>
            <Text style={styles.preparationDescription}>
              Generate medicine schedule for tomorrow based on approved submissions
            </Text>
            <View style={styles.preparationAction}>
              <Text style={styles.preparationButtonText}>Prepare Schedule</Text>
              <FontAwesome5 name="arrow-right" size={14} color="#1890ff" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  upcomingSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  viewAllText: {
    color: "#1890ff",
    fontSize: 14,
    fontWeight: "500",
  },
  medicineCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 14,
    color: "#666",
  },
  medicineActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  timeSlotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeSlotText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  administerButton: {
    backgroundColor: "#52c41a",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  administerButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  submissionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  submissionCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionMedicine: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  submissionStudent: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  submissionDetails: {
    fontSize: 12,
    color: "#999",
  },
  submissionStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  preparationSection: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 30,
  },
  preparationCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  preparationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  preparationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  preparationDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  preparationAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#1890ff",
    borderRadius: 8,
  },
  preparationButtonText: {
    color: "#1890ff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
})
