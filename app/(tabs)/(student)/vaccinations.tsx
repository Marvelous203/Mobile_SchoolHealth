import { FontAwesome5 } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function StudentVaccinations() {
  // Mock data - in a real app, you would fetch this from your backend
  const vaccinationData = [
    {
      id: "1",
      name: "Annual Flu Vaccination",
      date: "October 15, 2023",
      status: "upcoming",
      description:
        "Seasonal influenza vaccination to protect against the most common flu strains expected this season.",
    },
    {
      id: "2",
      name: "MMR Booster",
      date: "November 10, 2023",
      status: "upcoming",
      description: "Measles, Mumps, and Rubella booster shot for continued immunity.",
    },
    {
      id: "3",
      name: "Tetanus Booster",
      date: "January 20, 2024",
      status: "upcoming",
      description: "Tetanus, Diphtheria, Pertussis (Tdap) booster.",
    },
    {
      id: "4",
      name: "HPV Vaccination (Dose 1)",
      date: "September 5, 2023",
      status: "completed",
      description: "First dose of Human Papillomavirus vaccine.",
      result: {
        administeredBy: "Nurse Sarah Johnson",
        administeredDate: "September 5, 2023",
        lotNumber: "HPV-2023-789",
        reaction: "None",
        notes: "No adverse reactions observed.",
      },
    },
    {
      id: "5",
      name: "Hepatitis B (Dose 3)",
      date: "March 15, 2023",
      status: "completed",
      description: "Final dose of Hepatitis B vaccine series.",
      result: {
        administeredBy: "Nurse Robert Chen",
        administeredDate: "March 15, 2023",
        lotNumber: "HBV-2023-456",
        reaction: "Mild soreness at injection site",
        notes: "Mild soreness reported, resolved within 24 hours.",
      },
    },
  ]

  const vaccinationHistory = [
    { name: "DTaP", date: "June 15, 2013", age: "2 months" },
    { name: "Polio (IPV)", date: "June 15, 2013", age: "2 months" },
    { name: "Hepatitis B (Dose 1)", date: "At birth", age: "Newborn" },
    { name: "Hepatitis B (Dose 2)", date: "June 15, 2013", age: "2 months" },
    { name: "MMR (Dose 1)", date: "May 20, 2014", age: "12 months" },
    { name: "Varicella", date: "May 20, 2014", age: "12 months" },
    { name: "DTaP (Booster)", date: "May 15, 2017", age: "4 years" },
    { name: "Polio (IPV) (Booster)", date: "May 15, 2017", age: "4 years" },
  ]

  const renderVaccinationItem = (item : any) => {
    let statusColor = "#faad14"
    let statusIcon = "calendar-alt"
    let statusText = "Upcoming"

    if (item.status === "completed") {
      statusColor = "#52c41a"
      statusIcon = "check-double"
      statusText = "Completed"
    }

    return (
      <View key={item.id} style={styles.vaccinationCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.vaccinationName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesome5 name={statusIcon} size={12} color="#fff" />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.vaccinationDate}>Date: {item.date}</Text>
        <Text style={styles.vaccinationDescription}>{item.description}</Text>

        {item.status === "completed" && item.result && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Vaccination Results</Text>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Administered By:</Text>
              <Text style={styles.resultValue}>{item.result.administeredBy}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Date:</Text>
              <Text style={styles.resultValue}>{item.result.administeredDate}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Reaction:</Text>
              <Text style={styles.resultValue}>{item.result.reaction}</Text>
            </View>
            {item.result.notes && (
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Notes:</Text>
                <Text style={styles.resultValue}>{item.result.notes}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>My Vaccinations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming & Recent Vaccinations</Text>
          {vaccinationData.map((item) => renderVaccinationItem(item))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vaccination History</Text>
          <View style={styles.historyCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Vaccine</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Age</Text>
            </View>
            {vaccinationHistory.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{item.age}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <FontAwesome5 name="info-circle" size={18} color="#1890ff" />
              <Text style={styles.infoTitle}>Why Vaccinations Are Important</Text>
            </View>
            <Text style={styles.infoText}>
              Vaccinations help protect you from serious diseases by stimulating your immune system to create antibodies
              against certain bacteria or viruses. They are an important part of keeping you and your community healthy.
            </Text>
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
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
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
    lineHeight: 20,
    marginBottom: 12,
  },
  resultSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  resultValue: {
    fontSize: 14,
    flex: 1,
  },
  historyCard: {
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
  infoSection: {
    margin: 16,
    marginTop: 0,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#e6f7ff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#91d5ff",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#1890ff",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
})
