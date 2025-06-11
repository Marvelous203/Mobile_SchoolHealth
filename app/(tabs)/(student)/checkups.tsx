import { FontAwesome5 } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function StudentCheckups() {
  // Mock data - in a real app, you would fetch this from your backend
  const checkupData = [
    {
      id: "1",
      name: "Annual Health Checkup",
      date: "September 20, 2023",
      status: "completed",
      description: "Comprehensive health assessment including growth, vision, hearing, and general wellness.",
      results: {
        height: "135 cm",
        weight: "32 kg",
        bmi: "17.5",
        vision: "Left: 20/40, Right: 20/30",
        hearing: "Normal",
        bloodPressure: "110/70 mmHg",
        heartRate: "85 bpm",
        notes:
          "Overall health is good. Vision shows slight myopia in the left eye. Recommend follow-up with an optometrist.",
        abnormalFindings: [
          {
            area: "Vision",
            finding: "Mild myopia in left eye",
            recommendation: "Follow-up with optometrist recommended",
          },
        ],
        performedBy: "Nurse Sarah Johnson",
      },
    },
    {
      id: "2",
      name: "Dental Screening",
      date: "November 5, 2023",
      status: "upcoming",
      description: "Basic dental examination to identify potential issues and promote oral hygiene.",
    },
    {
      id: "3",
      name: "Vision Screening",
      date: "December 10, 2023",
      status: "upcoming",
      description: "Assessment of visual acuity and eye health.",
    },
  ]

  const checkupHistory = [
    { name: "Annual Health Checkup", date: "September 15, 2022", result: "Normal" },
    { name: "Dental Screening", date: "November 10, 2022", result: "Normal" },
    { name: "Vision Screening", date: "December 5, 2022", result: "Normal" },
    { name: "Annual Health Checkup", date: "September 10, 2021", result: "Normal" },
    { name: "Dental Screening", date: "November 5, 2021", result: "Cavity detected" },
  ]

  const renderCheckupItem = (item) => {
    let statusColor = "#faad14"
    let statusIcon = "calendar-alt"
    let statusText = "Upcoming"

    if (item.status === "completed") {
      statusColor = item.results?.abnormalFindings?.length > 0 ? "#ff4d4f" : "#52c41a"
      statusIcon = item.results?.abnormalFindings?.length > 0 ? "exclamation-circle" : "check-double"
      statusText = item.results?.abnormalFindings?.length > 0 ? "Abnormal" : "Normal"
    }

    return (
      <View key={item.id} style={styles.checkupCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.checkupName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesome5 name={statusIcon} size={12} color="#fff" />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.checkupDate}>Date: {item.date}</Text>
        <Text style={styles.checkupDescription}>{item.description}</Text>

        {item.status === "completed" && item.results && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Checkup Results</Text>
            <View style={styles.resultGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Height</Text>
                <Text style={styles.resultValue}>{item.results.height}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Weight</Text>
                <Text style={styles.resultValue}>{item.results.weight}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>BMI</Text>
                <Text style={styles.resultValue}>{item.results.bmi}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Vision</Text>
                <Text style={styles.resultValue}>{item.results.vision}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Hearing</Text>
                <Text style={styles.resultValue}>{item.results.hearing}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Blood Pressure</Text>
                <Text style={styles.resultValue}>{item.results.bloodPressure}</Text>
              </View>
            </View>

            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{item.results.notes}</Text>

            {item.results.abnormalFindings && item.results.abnormalFindings.length > 0 && (
              <View style={styles.abnormalSection}>
                <Text style={styles.abnormalTitle}>Abnormal Findings</Text>
                {item.results.abnormalFindings.map((finding, index) => (
                  <View key={index} style={styles.abnormalItem}>
                    <View style={styles.abnormalHeader}>
                      <FontAwesome5 name="exclamation-circle" size={14} color="#ff4d4f" />
                      <Text style={styles.abnormalArea}>{finding.area}</Text>
                    </View>
                    <Text style={styles.abnormalFinding}>{finding.finding}</Text>
                    <Text style={styles.abnormalRecommendation}>{finding.recommendation}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.performedBy}>Performed by: {item.results.performedBy}</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>My Health Checkups</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming & Recent Checkups</Text>
          {checkupData.map((item) => renderCheckupItem(item))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checkup History</Text>
          <View style={styles.historyCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Checkup</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Result</Text>
            </View>
            {checkupHistory.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 1, color: item.result !== "Normal" ? "#ff4d4f" : "#52c41a", fontWeight: "500" },
                  ]}
                >
                  {item.result}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <FontAwesome5 name="info-circle" size={18} color="#1890ff" />
              <Text style={styles.infoTitle}>Why Regular Checkups Matter</Text>
            </View>
            <Text style={styles.infoText}>
              Regular health checkups help detect potential health issues before they become serious. They also help
              track your growth and development, ensuring you're staying healthy as you grow.
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
    marginBottom: 12,
  },
  resultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  resultItem: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  abnormalSection: {
    backgroundColor: "#fff1f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffccc7",
  },
  abnormalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cf1322",
    marginBottom: 8,
  },
  abnormalItem: {
    marginBottom: 8,
  },
  abnormalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  abnormalArea: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  abnormalFinding: {
    fontSize: 14,
    marginBottom: 2,
    paddingLeft: 20,
  },
  abnormalRecommendation: {
    fontSize: 14,
    color: "#cf1322",
    fontWeight: "500",
    paddingLeft: 20,
  },
  performedBy: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
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
