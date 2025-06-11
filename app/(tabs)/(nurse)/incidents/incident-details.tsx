import { FontAwesome5 } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function IncidentDetailsScreen() {
  const { id } = useLocalSearchParams()

  // Mock data - in a real app, you would fetch this based on the ID
  const incidentData = {
    id: id,
    studentName: "Emily Johnson",
    class: "5A",
    type: "fever",
    description: "Temperature of 101°F. Student complained of headache and fatigue.",
    treatment:
      "Student rested in the health office. Temperature monitored every 30 minutes. Parent contacted and picked up student.",
    date: "May 21, 2023",
    time: "10:30 AM",
    parentNotified: true,
    parentContactTime: "10:45 AM",
    parentResponse: "Mother will pick up student at 11:15 AM.",
    followUp: "Parent advised to consult with pediatrician if fever persists for more than 24 hours.",
    nurseNotes: "Student appeared uncomfortable but was alert and responsive. No other symptoms reported.",
    recordedBy: "Nurse Sarah Johnson",
  }

  let typeColor = "#f5222d"
  let typeIcon = "thermometer-half"

  if (incidentData.type === "injury") {
    typeIcon = "band-aid"
  } else if (incidentData.type === "other") {
    typeColor = "#faad14"
    typeIcon = "first-aid"
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.typeContainer, { backgroundColor: typeColor }]}>
            <FontAwesome5 name={typeIcon} size={16} color="#fff" />
            <Text style={styles.typeText}>
              {incidentData.type.charAt(0).toUpperCase() + incidentData.type.slice(1)}
            </Text>
          </View>
          <Text style={styles.dateTime}>
            {incidentData.date} at {incidentData.time}
          </Text>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <FontAwesome5 name="user" size={16} color="#1890ff" />
            <Text style={styles.studentName}>{incidentData.studentName}</Text>
          </View>
          <Text style={styles.studentClass}>Class: {incidentData.class}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailText}>{incidentData.description}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Treatment Provided</Text>
            <Text style={styles.detailText}>{incidentData.treatment}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Parent Notification</Text>
            <View style={styles.notificationInfo}>
              <View
                style={[
                  styles.notificationStatus,
                  { backgroundColor: incidentData.parentNotified ? "#52c41a" : "#f5222d" },
                ]}
              >
                <Text style={styles.notificationStatusText}>
                  {incidentData.parentNotified ? "Parent Notified" : "Not Notified"}
                </Text>
              </View>
              {incidentData.parentNotified && (
                <Text style={styles.notificationTime}>at {incidentData.parentContactTime}</Text>
              )}
            </View>
            {incidentData.parentResponse && <Text style={styles.parentResponse}>{incidentData.parentResponse}</Text>}
          </View>

          {incidentData.followUp && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Follow-up</Text>
              <Text style={styles.detailText}>{incidentData.followUp}</Text>
            </View>
          )}

          {incidentData.nurseNotes && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nurse Notes</Text>
              <Text style={styles.detailText}>{incidentData.nurseNotes}</Text>
            </View>
          )}

          <View style={styles.recordInfo}>
            <Text style={styles.recordedBy}>Recorded by: {incidentData.recordedBy}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={() => console.log("Edit incident")}>
            <FontAwesome5 name="edit" size={16} color="#fff" />
            <Text style={styles.buttonText}>Edit Incident</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followUpButton} onPress={() => console.log("Add follow-up")}>
            <FontAwesome5 name="clipboard-check" size={16} color="#fff" />
            <Text style={styles.buttonText}>Add Follow-up</Text>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  typeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: "500",
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  studentClass: {
    fontSize: 14,
    color: "#666",
  },
  detailsCard: {
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
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#666",
  },
  detailText: {
    fontSize: 16,
    lineHeight: 22,
  },
  notificationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  notificationTime: {
    fontSize: 14,
    marginLeft: 8,
    color: "#666",
  },
  parentResponse: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 4,
  },
  recordInfo: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 8,
  },
  recordedBy: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  editButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 8,
  },
  followUpButton: {
    backgroundColor: "#52c41a",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
})
