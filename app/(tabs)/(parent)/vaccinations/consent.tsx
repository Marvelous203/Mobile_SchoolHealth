"use client"

import { api } from "@/lib/api"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function VaccinationConsentScreen() {
  const { id } = useLocalSearchParams()
  const [consentGiven, setConsentGiven] = useState(false)
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vaccinationData, setVaccinationData] = useState(null)

  useEffect(() => {
    const loadVaccinationData = async () => {
      try {
        setIsLoading(true)
        const data = await api.getVaccinationSession(id)
        setVaccinationData(data)
      } catch (error) {
        console.error("Failed to load vaccination data", error)
        Alert.alert("Error", "Failed to load vaccination information. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadVaccinationData()
    }
  }, [id])

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // In a real app, you would get the studentId from context
      const studentId = "1"

      await api.submitVaccinationConsent({
        sessionId: id,
        studentId,
        consent: consentGiven,
        notes: additionalNotes,
      })

      Alert.alert("Success", `Your consent has been ${consentGiven ? "provided" : "declined"}.`, [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (error) {
      console.error("Failed to submit consent", error)
      Alert.alert("Error", "Failed to submit your consent. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading vaccination information...</Text>
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
          <Text style={styles.title}>{vaccinationData.name}</Text>
          <Text style={styles.date}>Scheduled: {vaccinationData.date}</Text>

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contraindications</Text>
            <Text style={styles.warningText}>
              Please consult with your healthcare provider if any of the following apply:
            </Text>
            {vaccinationData.contraindications.map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any allergies or other information the nurse should know?"
              multiline
              numberOfLines={4}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
            />
          </View>

          <View style={styles.consentSection}>
            <Text style={styles.consentTitle}>Consent</Text>
            <View style={styles.consentToggle}>
              <Text style={styles.consentText}>I give consent for my child to receive this vaccination</Text>
              <Switch
                value={consentGiven}
                onValueChange={setConsentGiven}
                trackColor={{ false: "#d9d9d9", true: "#b7eb8f" }}
                thumbColor={consentGiven ? "#52c41a" : "#f5f5f5"}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? "Submitting..." : "Submit Consent Form"}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
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
  warningText: {
    fontSize: 14,
    color: "#fa8c16",
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  consentSection: {
    marginBottom: 20,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  consentToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  consentText: {
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#bae7ff",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
