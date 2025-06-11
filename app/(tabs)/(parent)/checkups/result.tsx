"use client"

import { api } from "@/lib/api"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function HealthCheckResultsScreen() {
  const { id } = useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [checkupData, setCheckupData] = useState(null)
  const [checkupResult, setCheckupResult] = useState(null)

  useEffect(() => {
    const loadCheckupData = async () => {
      try {
        setIsLoading(true)
        const data = await api.getHealthCheckSession(id)
        setCheckupData(data)

        // In a real app, you would get the studentId from context
        const studentId = "1"
        const result = await api.getHealthCheckResult(id, studentId)
        setCheckupResult(result)
      } catch (error) {
        console.error("Failed to load health checkup results", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadCheckupData()
    }
  }, [id])

  const handleBookConsultation = () => {
    router.push(`/(parent)/checkups/booking?checkupId=${id}`)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading health checkup results...</Text>
      </SafeAreaView>
    )
  }

  if (!checkupData || !checkupResult) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text>Health checkup results not found.</Text>
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
            <Text style={styles.title}>{checkupData.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: checkupResult.abnormal ? "#ff4d4f" : "#52c41a" }]}>
              <Text style={styles.statusText}>{checkupResult.abnormal ? "Abnormal" : "Normal"}</Text>
            </View>
          </View>

          <Text style={styles.date}>Date: {checkupResult.date}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Measurements</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <MaterialIcons name="height" size={24} color="#1890ff" />
                <Text style={styles.metricValue}>{checkupResult.height} cm</Text>
                <Text style={styles.metricLabel}>Height</Text>
              </View>

              <View style={styles.metricCard}>
                <FontAwesome5 name="weight" size={20} color="#1890ff" />
                <Text style={styles.metricValue}>{checkupResult.weight} kg</Text>
                <Text style={styles.metricLabel}>Weight</Text>
              </View>

              <View style={styles.metricCard}>
                <MaterialIcons name="speed" size={24} color="#1890ff" />
                <Text style={styles.metricValue}>{checkupResult.bmi}</Text>
                <Text style={styles.metricLabel}>BMI</Text>
              </View>

              <View style={styles.metricCard}>
                <FontAwesome5 name="heartbeat" size={20} color="#1890ff" />
                <Text style={styles.metricValue}>{checkupResult.heartRate}</Text>
                <Text style={styles.metricLabel}>Heart Rate</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vision & Hearing</Text>
            <View style={styles.resultRow}>
              <View style={styles.resultItem}>
                <FontAwesome5 name="eye" size={16} color="#666" />
                <Text style={styles.resultLabel}>Vision:</Text>
              </View>
              <Text style={styles.resultValue}>{checkupResult.vision}</Text>
            </View>

            <View style={styles.resultRow}>
              <View style={styles.resultItem}>
                <FontAwesome5 name="assistive-listening-systems" size={16} color="#666" />
                <Text style={styles.resultLabel}>Hearing:</Text>
              </View>
              <Text style={styles.resultValue}>{checkupResult.hearing}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nurse's Assessment</Text>
            <View style={styles.assessmentCard}>
              <Text style={styles.assessmentText}>{checkupResult.assessment}</Text>
            </View>
          </View>

          {checkupResult.recommendations && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <View style={styles.recommendationsCard}>
                <Text style={styles.recommendationsText}>{checkupResult.recommendations}</Text>
              </View>
            </View>
          )}

          {checkupResult.abnormal && (
            <View style={styles.abnormalSection}>
              <View style={styles.abnormalHeader}>
                <FontAwesome5 name="exclamation-triangle" size={18} color="#ff4d4f" />
                <Text style={styles.abnormalTitle}>Abnormal Findings</Text>
              </View>
              <Text style={styles.abnormalText}>
                Some abnormal findings were detected during this checkup. It is recommended to schedule a consultation
                with the school nurse for further discussion.
              </Text>
              <TouchableOpacity style={styles.consultationButton} onPress={handleBookConsultation}>
                <Text style={styles.consultationButtonText}>Book Consultation</Text>
              </TouchableOpacity>
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
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: "#666",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  assessmentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
  assessmentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
  recommendationsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  abnormalSection: {
    backgroundColor: "#fff1f0",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ffccc7",
  },
  abnormalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  abnormalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff4d4f",
    marginLeft: 8,
  },
  abnormalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  consultationButton: {
    backgroundColor: "#ff4d4f",
    borderRadius: 5,
    padding: 12,
    alignItems: "center",
  },
  consultationButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
})
