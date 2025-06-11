import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// Mock data
const incidents = [
  {
    id: "1",
    studentName: "Emily Johnson",
    class: "5A",
    type: "fever",
    description: "Temperature of 101°F. Parent contacted.",
    date: "May 21, 2023",
    time: "10:30 AM",
  },
  {
    id: "2",
    studentName: "Michael Brown",
    class: "5B",
    type: "injury",
    description: "Minor scrape on knee during recess. Cleaned and bandaged.",
    date: "May 21, 2023",
    time: "11:45 AM",
  },
  {
    id: "3",
    studentName: "Sophia Davis",
    class: "5B",
    type: "other",
    description: "Asthma flare-up. Used prescribed inhaler.",
    date: "May 20, 2023",
    time: "1:15 PM",
  },
  {
    id: "4",
    studentName: "Daniel Wilson",
    class: "5C",
    type: "injury",
    description: "Twisted ankle during PE. Applied ice and elevated.",
    date: "May 19, 2023",
    time: "2:30 PM",
  },
  {
    id: "5",
    studentName: "John Smith",
    class: "5A",
    type: "fever",
    description: "Complained of headache and had temperature of 100.2°F. Rested in office.",
    date: "May 18, 2023",
    time: "9:45 AM",
  },
]

export default function IncidentsScreen() {
  const renderIncidentItem = ({ item }) => {
    let typeColor = "#f5222d"
    let typeIcon = "thermometer-half"

    if (item.type === "injury") {
      typeIcon = "band-aid"
    } else if (item.type === "other") {
      typeColor = "#faad14"
      typeIcon = "first-aid"
    }

    return (
      <TouchableOpacity
        style={styles.incidentCard}
        onPress={() => router.push(`/(nurse)/incidents/incident-details?id=${item.id}`)}
      >
        <View style={styles.incidentHeader}>
          <View style={[styles.typeContainer, { backgroundColor: typeColor }]}>
            <FontAwesome5 name={typeIcon} size={12} color="#fff" />
            <Text style={styles.typeText}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Text style={styles.studentName}>{item.studentName}</Text>
        <Text style={styles.studentClass}>Class: {item.class}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.time}>Time: {item.time}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Incidents</Text>
        <Text style={styles.subtitle}>View and manage student medical incidents</Text>
      </View>

      <FlatList
        data={incidents}
        renderItem={renderIncidentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/(nurse)/incidents/record-incident")}>
        <FontAwesome5 name="plus" size={16} color="#fff" />
        <Text style={styles.addButtonText}>Record New Incident</Text>
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
  incidentCard: {
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
  incidentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#f5222d",
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
