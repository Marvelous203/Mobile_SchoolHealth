"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function PostVaccinationFollowUpScreen() {
  const { sessionId, studentId } = useLocalSearchParams()
  const [symptoms, setSymptoms] = useState({
    fever: false,
    pain: false,
    swelling: false,
    rash: false,
    fatigue: false,
    other: false,
  })
  const [otherSymptoms, setOtherSymptoms] = useState("")
  const [notes, setNotes] = useState("")
  const [severity, setSeverity] = useState("mild")

  // Mock data - in a real app, you would fetch this based on the IDs
  const sessionData = {
    id: sessionId,
    name: "Annual Flu Vaccination",
    date: "October 15, 2023",
  }

  const studentData = {
    id: studentId,
    name: "John Smith",
    class: "5A",
    vaccinationDate: "October 15, 2023",
  }

  const toggleSymptom = (symptom) => {
    setSymptoms((prev) => ({
      ...prev,
      [symptom]: !prev[symptom],
    }))
  }

  const handleSubmit = () => {
    // In a real app, you would send this data to your backend
    console.log("Follow-up recorded:", {
      sessionId,
      studentId,
      symptoms,
      otherSymptoms,
      severity,
      notes,
      date: new Date().toISOString(),
    })

    // Navigate back to the session details
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Post-Vaccination Follow-up</Text>
          <Text style={styles.subtitle}>{sessionData.name}</Text>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <FontAwesome5 name="user" size={16} color="#1890ff" />
            <Text style={styles.studentName}>{studentData.name}</Text>
          </View>
          <Text style={styles.studentClass}>Class: {studentData.class}</Text>
          <Text style={styles.vaccinationDate}>Vaccinated on: {studentData.vaccinationDate}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observed Symptoms</Text>
            <Text style={styles.sectionSubtitle}>Select all that apply</Text>

            <View style={styles.symptomsGrid}>
              <TouchableOpacity
                style={[styles.symptomButton, symptoms.fever && styles.selectedSymptom]}
                onPress={() => toggleSymptom("fever")}
              >
                <FontAwesome5
                  name="thermometer-half"
                  size={16}
                  color={symptoms.fever ? "#fff" : "#666"}
                  style={styles.symptomIcon}
                />
                <Text style={[styles.symptomText, symptoms.fever && styles.selectedSymptomText]}>Fever</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.symptomButton, symptoms.pain && styles.selectedSymptom]}
                onPress={() => toggleSymptom("pain")}
              >
                <FontAwesome5
                  name="band-aid"
                  size={16}
                  color={symptoms.pain ? "#fff" : "#666"}
                  style={styles.symptomIcon}
                />
                <Text style={[styles.symptomText, symptoms.pain && styles.selectedSymptomText]}>Pain</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.symptomButton, symptoms.swelling && styles.selectedSymptom]}
                onPress={() => toggleSymptom("swelling")}
              >
                <FontAwesome5
                  name="dot-circle"
                  size={16}
                  color={symptoms.swelling ? "#fff" : "#666"}
                  style={styles.symptomIcon}
                />
                <Text style={[styles.symptomText, symptoms.swelling && styles.selectedSymptomText]}>Swelling</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.symptomButton, symptoms.rash && styles.selectedSymptom]}
                onPress={() => toggleSymptom("rash")}
              >
                <FontAwesome5
                  name="allergies"
                  size={16}
                  color={symptoms.rash ? "#fff" : "#666"}
                  style={styles.symptomIcon}
                />
                <Text style={[styles.symptomText, symptoms.rash && styles.selectedSymptomText]}>Rash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.symptomButton, symptoms.fatigue && styles.selectedSymptom]}
                onPress={() => toggleSymptom("fatigue")}
              >
                <FontAwesome5
                  name="bed"
                  size={16}
                  color={symptoms.fatigue ? "#fff" : "#666"}
                  style={styles.symptomIcon}
                />
                <Text style={[styles.symptomText, symptoms.fatigue && styles.selectedSymptomText]}>Fatigue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.symptomButton, symptoms.other && styles.selectedSymptom]}
                onPress={() => toggleSymptom("other")}
              >
                <FontAwesome5
                  name="plus"
                  size={16}
                  color={symptoms.other ? "#fff" : "#666"}
                  style={styles.symptomIcon}
                />
                <Text style={[styles.symptomText, symptoms.other && styles.selectedSymptomText]}>Other</Text>
              </TouchableOpacity>
            </View>

            {symptoms.other && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Specify Other Symptoms</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter other symptoms"
                  value={otherSymptoms}
                  onChangeText={setOtherSymptoms}
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Severity</Text>
            <View style={styles.severityOptions}>
              <TouchableOpacity
                style={[styles.severityOption, severity === "mild" && styles.selectedSeverity]}
                onPress={() => setSeverity("mild")}
              >
                <Text style={[styles.severityText, severity === "mild" && styles.selectedSeverityText]}>Mild</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.severityOption, severity === "moderate" && styles.selectedSeverity]}
                onPress={() => setSeverity("moderate")}
              >
                <Text style={[styles.severityText, severity === "moderate" && styles.selectedSeverityText]}>
                  Moderate
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.severityOption, severity === "severe" && styles.selectedSeverity]}
                onPress={() => setSeverity("severe")}
              >
                <Text style={[styles.severityText, severity === "severe" && styles.selectedSeverityText]}>Severe</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter any additional observations or notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Follow-up Report</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
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
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  studentClass: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  vaccinationDate: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  symptomButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  selectedSymptom: {
    backgroundColor: "#1890ff",
    borderColor: "#1890ff",
  },
  symptomIcon: {
    marginRight: 8,
  },
  symptomText: {
    fontSize: 14,
    color: "#666",
  },
  selectedSymptomText: {
    color: "#fff",
    fontWeight: "500",
  },
  inputContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  severityOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  severityOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedSeverity: {
    backgroundColor: "#e6f7ff",
    borderColor: "#1890ff",
  },
  severityText: {
    fontSize: 14,
    color: "#666",
  },
  selectedSeverityText: {
    color: "#1890ff",
    fontWeight: "600",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
