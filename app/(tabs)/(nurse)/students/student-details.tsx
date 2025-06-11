import { FontAwesome5 } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams()

  // Mock data - in a real app, you would fetch this based on the ID
  const studentData = {
    id: id,
    name: "John Smith",
    dob: "May 15, 2013",
    age: 10,
    class: "5A",
    bloodType: "O+",
    allergies: ["Peanuts", "Dust"],
    chronicConditions: [],
    emergencyContact: "Mary Smith (Mother) - 555-123-4567",
    secondaryContact: "Robert Smith (Father) - 555-987-6543",
    lastUpdated: "September 1, 2023",
    growthData: [
      { date: "September 2023", height: "135 cm", weight: "32 kg", bmi: "17.5" },
      { date: "March 2023", height: "132 cm", weight: "30 kg", bmi: "17.2" },
      { date: "September 2022", height: "128 cm", weight: "28 kg", bmi: "17.1" },
    ],
    visionData: [
      { date: "September 2023", left: "20/40", right: "20/30", notes: "Mild myopia in left eye" },
      { date: "September 2022", left: "20/30", right: "20/30", notes: "Normal" },
    ],
    hearingData: [
      { date: "September 2023", result: "Normal", notes: "" },
      { date: "September 2022", result: "Normal", notes: "" },
    ],
    recentIncidents: [
      {
        id: "i1",
        type: "fever",
        date: "May 10, 2023",
        description: "Temperature of 100.2°F. Rested in office.",
      },
    ],
    upcomingCheckups: [
      {
        id: "c1",
        name: "Dental Screening",
        date: "November 5, 2023",
      },
    ],
    upcomingVaccinations: [
      {
        id: "v1",
        name: "Annual Flu Vaccination",
        date: "October 15, 2023",
      },
    ],
    medicineSchedule: [
      {
        id: "m1",
        name: "Allergy Medication",
        dosage: "5ml",
        frequency: "Once daily",
        startDate: "September 1, 2023",
        endDate: "October 31, 2023",
      },
    ],
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <FontAwesome5 name="user" size={32} color="#1890ff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{studentData.name}</Text>
              <Text style={styles.profileClass}>Class: {studentData.class}</Text>
              <Text style={styles.profileAge}>Age: {studentData.age} years</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(nurse)/incidents/record-incident?studentId=${id}`)}
          >
            <FontAwesome5 name="first-aid" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Record Incident</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome5 name="pills" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Administer Medicine</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Alerts</Text>
          <View style={styles.alertsCard}>
            <View style={styles.alertItem}>
              <Text style={styles.alertLabel}>Allergies</Text>
              {studentData.allergies.length > 0 ? (
                <View style={styles.tagContainer}>
                  {studentData.allergies.map((allergy, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{allergy}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>None</Text>
              )}
            </View>
            <View style={styles.alertItem}>
              <Text style={styles.alertLabel}>Chronic Conditions</Text>
              {studentData.chronicConditions.length > 0 ? (
                <View style={styles.tagContainer}>
                  {studentData.chronicConditions.map((condition, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{condition}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>None</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{studentData.dob}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <Text style={styles.infoValue}>{studentData.bloodType}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Primary Emergency Contact</Text>
              <Text style={styles.infoValue}>{studentData.emergencyContact}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Secondary Emergency Contact</Text>
              <Text style={styles.infoValue}>{studentData.secondaryContact}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Incidents</Text>
          {studentData.recentIncidents.length > 0 ? (
            <View style={styles.incidentsCard}>
              {studentData.recentIncidents.map((incident) => (
                <TouchableOpacity
                  key={incident.id}
                  style={styles.incidentItem}
                  onPress={() => router.push(`/(nurse)/incidents/incident-details?id=${incident.id}`)}
                >
                  <View style={styles.incidentHeader}>
                    <View style={styles.incidentType}>
                      <FontAwesome5
                        name={incident.type === "fever" ? "thermometer-half" : "band-aid"}
                        size={14}
                        color="#f5222d"
                      />
                      <Text style={styles.incidentTypeText}>
                        {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.incidentDate}>{incident.date}</Text>
                  </View>
                  <Text style={styles.incidentDescription}>{incident.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent incidents</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Health Events</Text>
          <View style={styles.eventsCard}>
            {studentData.upcomingCheckups.length > 0 && (
              <View style={styles.eventSection}>
                <Text style={styles.eventSectionTitle}>Checkups</Text>
                {studentData.upcomingCheckups.map((checkup) => (
                  <View key={checkup.id} style={styles.eventItem}>
                    <FontAwesome5 name="stethoscope" size={14} color="#1890ff" style={styles.eventIcon} />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{checkup.name}</Text>
                      <Text style={styles.eventDate}>{checkup.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {studentData.upcomingVaccinations.length > 0 && (
              <View style={styles.eventSection}>
                <Text style={styles.eventSectionTitle}>Vaccinations</Text>
                {studentData.upcomingVaccinations.map((vaccination) => (
                  <View key={vaccination.id} style={styles.eventItem}>
                    <FontAwesome5 name="syringe" size={14} color="#52c41a" style={styles.eventIcon} />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{vaccination.name}</Text>
                      <Text style={styles.eventDate}>{vaccination.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicine Schedule</Text>
          {studentData.medicineSchedule.length > 0 ? (
            <View style={styles.medicineCard}>
              {studentData.medicineSchedule.map((medicine) => (
                <View key={medicine.id} style={styles.medicineItem}>
                  <View style={styles.medicineHeader}>
                    <FontAwesome5 name="pills" size={14} color="#faad14" style={styles.medicineIcon} />
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                  </View>
                  <View style={styles.medicineDetails}>
                    <Text style={styles.medicineDetail}>Dosage: {medicine.dosage}</Text>
                    <Text style={styles.medicineDetail}>Frequency: {medicine.frequency}</Text>
                    <Text style={styles.medicineDetail}>
                      Period: {medicine.startDate} to {medicine.endDate}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No medicine scheduled</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth History</Text>
          <View style={styles.growthCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Height</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>BMI</Text>
            </View>
            {studentData.growthData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.height}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.weight}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.bmi}</Text>
              </View>
            ))}
          </View>
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e6f7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileClass: {
    fontSize: 16,
    color: "#666",
    marginBottom: 2,
  },
  profileAge: {
    fontSize: 16,
    color: "#666",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
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
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  alertsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertItem: {
    marginBottom: 12,
  },
  alertLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#666",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#fff1f0",
    borderWidth: 1,
    borderColor: "#ffccc7",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#f5222d",
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  incidentsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incidentItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  incidentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  incidentType: {
    flexDirection: "row",
    alignItems: "center",
  },
  incidentTypeText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: "#f5222d",
  },
  incidentDate: {
    fontSize: 14,
    color: "#666",
  },
  incidentDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  eventsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventSection: {
    marginBottom: 16,
  },
  eventSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventIcon: {
    marginRight: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    color: "#666",
  },
  medicineCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  medicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  medicineIcon: {
    marginRight: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
  },
  medicineDetails: {
    paddingLeft: 22,
  },
  medicineDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  growthCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    fontSize: 14,
  },
})
