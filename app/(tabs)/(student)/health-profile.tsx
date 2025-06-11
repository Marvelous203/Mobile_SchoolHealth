import { FontAwesome5 } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function StudentHealthProfile() {
  // Mock data - in a real app, you would fetch this from your backend
  const profileData = {
    name: "John Smith",
    dob: "May 15, 2013",
    age: 10,
    class: "5A",
    bloodType: "O+",
    allergies: ["Peanuts", "Dust"],
    chronicConditions: [],
    emergencyContact: "Mary Smith (Mother) - 555-123-4567",
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
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>My Health Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <FontAwesome5 name="user" size={32} color="#1890ff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileClass}>Class: {profileData.class}</Text>
              <Text style={styles.profileAge}>Age: {profileData.age} years</Text>
            </View>
          </View>
          <Text style={styles.lastUpdated}>Last updated: {profileData.lastUpdated}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{profileData.dob}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <Text style={styles.infoValue}>{profileData.bloodType}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Emergency Contact</Text>
              <Text style={styles.infoValue}>{profileData.emergencyContact}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Allergies</Text>
              {profileData.allergies.length > 0 ? (
                <View style={styles.tagContainer}>
                  {profileData.allergies.map((allergy, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{allergy}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>None</Text>
              )}
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Chronic Conditions</Text>
              {profileData.chronicConditions.length > 0 ? (
                <View style={styles.tagContainer}>
                  {profileData.chronicConditions.map((condition, index) => (
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
          <Text style={styles.sectionTitle}>Growth History</Text>
          <View style={styles.infoCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Height</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>BMI</Text>
            </View>
            {profileData.growthData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.height}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.weight}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.bmi}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vision History</Text>
          <View style={styles.infoCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Left</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Right</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Notes</Text>
            </View>
            {profileData.visionData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.left}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.right}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.notes || "-"}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hearing History</Text>
          <View style={styles.infoCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Result</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Notes</Text>
            </View>
            {profileData.hearingData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.result}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.notes || "-"}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    marginBottom: 12,
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
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileClass: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  profileAge: {
    fontSize: 14,
    color: "#666",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
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
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#e6f7ff",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#1890ff",
    fontSize: 14,
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
