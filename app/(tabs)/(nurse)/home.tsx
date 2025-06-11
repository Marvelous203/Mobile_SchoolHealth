import { useAuth } from "@/lib/auth"
import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function NurseHome() {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace("/(tabs)/(auth)/login")
  }

  // Mock data
  const todayData = {
    date: "May 21, 2023",
    checkups: 15,
    vaccinations: 0,
    incidents: 2,
    medicines: 8,
  }

  const upcomingEvents = [
    {
      id: "1",
      type: "checkup",
      name: "Dental Screening",
      date: "November 5, 2023",
      students: 120,
      consented: 98,
    },
    {
      id: "2",
      type: "vaccination",
      name: "Annual Flu Vaccination",
      date: "October 15, 2023",
      students: 120,
      consented: 98,
    },
  ]

  const recentIncidents = [
    {
      id: "1",
      studentName: "Emily Johnson",
      class: "5A",
      type: "fever",
      date: "May 21, 2023",
      time: "10:30 AM",
    },
    {
      id: "2",
      studentName: "Michael Brown",
      class: "5B",
      type: "injury",
      date: "May 21, 2023",
      time: "11:45 AM",
    },
  ]

  const medicineSchedule = [
    {
      id: "1",
      studentName: "John Smith",
      class: "5A",
      medicine: "Allergy Medication",
      time: "12:00 PM",
      administered: false,
    },
    {
      id: "2",
      studentName: "Sophia Davis",
      class: "5B",
      medicine: "Asthma Inhaler",
      time: "1:30 PM",
      administered: false,
    },
    {
      id: "3",
      studentName: "Daniel Wilson",
      class: "5C",
      medicine: "Antibiotics",
      time: "2:00 PM",
      administered: false,
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Nurse!</Text>
            <Text style={styles.schoolName}>Lincoln Elementary School</Text>
            <Text style={styles.date}>Today: {todayData.date}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <FontAwesome5 name="sign-out-alt" size={20} color="#f5222d" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.todaySummary}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <FontAwesome5 name="stethoscope" size={24} color="#1890ff" />
              <Text style={styles.summaryValue}>{todayData.checkups}</Text>
              <Text style={styles.summaryLabel}>Checkups</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome5 name="syringe" size={24} color="#52c41a" />
              <Text style={styles.summaryValue}>{todayData.vaccinations}</Text>
              <Text style={styles.summaryLabel}>Vaccinations</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome5 name="first-aid" size={24} color="#f5222d" />
              <Text style={styles.summaryValue}>{todayData.incidents}</Text>
              <Text style={styles.summaryLabel}>Incidents</Text>
            </View>
            <View style={styles.summaryCard}>
              <FontAwesome5 name="pills" size={24} color="#faad14" />
              <Text style={styles.summaryValue}>{todayData.medicines}</Text>
              <Text style={styles.summaryLabel}>Medicines</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(nurse)/incidents/record-incident")}
            >
              <FontAwesome5 name="first-aid" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Record Incident</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome5 name="pills" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Administer Medicine</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.upcomingEvents}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => {
                if (event.type === "checkup") {
                  router.push(`/(tabs)/(nurse)/checkups/session-details?id=${event.id}`)
                } else if (event.type === "vaccination") {
                  router.push(`/(tabs)/(nurse)/vaccinations/session-details?id=${event.id}`)
                }
              }}
            >
              <View style={styles.eventHeader}>
                <View style={styles.eventTypeContainer}>
                  <FontAwesome5 name={event.type === "checkup" ? "stethoscope" : "syringe"} size={16} color="#fff" />
                  <Text style={styles.eventType}>{event.type === "checkup" ? "Health Checkup" : "Vaccination"}</Text>
                </View>
                <Text style={styles.eventDate}>{event.date}</Text>
              </View>
              <Text style={styles.eventName}>{event.name}</Text>
              <View style={styles.eventStats}>
                <Text style={styles.eventStat}>Students: {event.students}</Text>
                <Text style={styles.eventStat}>Consented: {event.consented}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.medicineSchedule}>
          <Text style={styles.sectionTitle}>Today's Medicine Schedule</Text>
          {medicineSchedule.map((medicine) => (
            <View key={medicine.id} style={styles.medicineCard}>
              <View style={styles.medicineInfo}>
                <Text style={styles.medicineName}>{medicine.medicine}</Text>
                <Text style={styles.medicineStudent}>
                  {medicine.studentName} ({medicine.class})
                </Text>
                <Text style={styles.medicineTime}>Time: {medicine.time}</Text>
              </View>
              <TouchableOpacity
                style={[styles.medicineButton, medicine.administered ? styles.medicineAdministered : {}]}
              >
                <Text style={styles.medicineButtonText}>{medicine.administered ? "Administered" : "Administer"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.recentIncidents}>
          <Text style={styles.sectionTitle}>Recent Incidents</Text>
          {recentIncidents.map((incident) => (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={styles.incidentTypeContainer}>
                <FontAwesome5
                  name={
                    incident.type === "fever"
                      ? "thermometer-half"
                      : incident.type === "injury"
                        ? "band-aid"
                        : "first-aid"
                  }
                  size={16}
                  color="#fff"
                />
                <Text style={styles.incidentType}>
                  {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                </Text>
              </View>
              <Text style={styles.incidentStudent}>
                {incident.studentName} ({incident.class})
              </Text>
              <Text style={styles.incidentTime}>
                {incident.date} at {incident.time}
              </Text>
            </View>
          ))}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  logoutText: {
    color: "#f5222d",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
  },
  schoolName: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  todaySummary: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  summaryCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryCard: {
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
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  upcomingEvents: {
    padding: 20,
    paddingTop: 0,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1890ff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  eventType: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  eventStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eventStat: {
    fontSize: 14,
    color: "#666",
  },
  medicineSchedule: {
    padding: 20,
    paddingTop: 0,
  },
  medicineCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
  medicineStudent: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  medicineTime: {
    fontSize: 14,
    color: "#666",
  },
  medicineButton: {
    backgroundColor: "#1890ff",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  medicineAdministered: {
    backgroundColor: "#52c41a",
  },
  medicineButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  recentIncidents: {
    padding: 20,
    paddingTop: 0,
  },
  incidentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incidentTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5222d",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  incidentType: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  incidentStudent: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  incidentTime: {
    fontSize: 14,
    color: "#666",
  },
})
