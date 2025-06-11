"use client"

import { api } from "@/lib/api"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function VaccinationDetailsScreen() {
  const { id } = useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [vaccinationData, setVaccinationData] = useState(null)
  const [vaccinationResult, setVaccinationResult] = useState(null)

  useEffect(() => {
    const loadVaccinationData = async () => {
      try {
        setIsLoading(true)
        const data = await api.getVaccinationSession(id)
        setVaccinationData(data)

        // In a real app, you would get the studentId from context
        const studentId = "1"
        const result = await api.getVaccinationResult(id, studentId)
        setVaccinationResult(result)
      } catch (error) {
        console.error("Failed to load vaccination details", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadVaccinationData()
    }
  }, [id])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading vaccination details...</Text>
      </SafeAreaView>
    )
  }

  if (!vaccinationData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text>Vaccination information not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{vaccinationData.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: vaccinationData.status === "completed" ? "#52c41a" : "#faad14" },
              ]}
            >
              <Text style={styles.statusText}>
                {vaccinationData.status === "completed" ? "Completed" : "Scheduled"}
              </Text>
            </View>
          </View>

          <Text style={styles.date}>Date: {vaccinationData.date}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{vaccinationData.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vaccine Information</Text>
            {vaccinationData.details.map((detail, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{detail}</Text>
              </View>
            ))}
          </View>

          {vaccinationResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vaccination Result</Text>
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.resultValue,
                      { color: vaccinationResult.status === "completed" ? "#52c41a" : "#faad14" },
                    ]}
                  >
                    {vaccinationResult.status === "completed" ? "Completed" : "Pending"}
                  </Text>
                </View>

                {vaccinationResult.status === "completed" && (
                  <>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Administered on:</Text>
                      <Text style={styles.resultValue}>{vaccinationResult.administeredDate}</Text>
                    </View>

                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Administered by:</Text>
                      <Text style={styles.resultValue}>{vaccinationResult.administeredBy}</Text>
                    </View>

                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Batch Number:</Text>
                      <Text style={styles.resultValue}>{vaccinationResult.batchNumber}</Text>
                    </View>

                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Reaction:</Text>
                      <Text
                        style={[
                          styles.resultValue,
                          {
                            color:
                              vaccinationResult.reaction === "none"
                                ? "#52c41a"
                                : vaccinationResult.reaction === "mild"
                                  ? "#faad14"
                                  : "#f5222d",
                          },
                        ]}
                      >
                        {vaccinationResult.reaction === "none"
                          ? "None"
                          : vaccinationResult.reaction === "mild"
                            ? "Mild"
                            : "Severe"}
                      </Text>
                    </View>

                    {vaccinationResult.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Notes:</Text>
                        <Text style={styles.notesText}>{vaccinationResult.notes}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#1890ff",
    borderRadius: 5,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletPoint: {
    fontSize: 14,
    marginRight: 8,
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
  },
  resultCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesContainer: {
    marginTop: 10,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
  },
})
