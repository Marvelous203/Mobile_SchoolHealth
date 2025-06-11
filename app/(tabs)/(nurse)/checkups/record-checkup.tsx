"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function RecordCheckupScreen() {
  const { sessionId, studentId } = useLocalSearchParams()
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [bmi, setBmi] = useState("")
  const [vision, setVision] = useState("")
  const [hearing, setHearing] = useState("normal")
  const [bloodPressure, setBloodPressure] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [notes, setNotes] = useState("")
  const [abnormal, setAbnormal] = useState(false)
  const [abnormalFindings, setAbnormalFindings] = useState("")

  // Mock data - in a real app, you would fetch this based on the IDs
  const sessionData = {
    id: sessionId,
    name: "Annual Health Checkup",
    date: "September 20, 2023",
  }

  const studentData = {
    id: studentId,
    name: "John Smith",
    class: "5A",
    age: 10,
    previousHeight: "130 cm",
    previousWeight: "30 kg",
  }

  // Calculate BMI when height and weight change
  const calculateBMI = () => {
    if (height && weight) {
      const heightInMeters = Number.parseFloat(height) / 100
      const weightInKg = Number.parseFloat(weight)
      if (heightInMeters > 0 && weightInKg > 0) {
        const bmiValue = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
        setBmi(bmiValue)
      }
    }
  }

  const handleSubmit = () => {
    // In a real app, you would send this data to your backend
    console.log("Checkup recorded:", {
      sessionId,
      studentId,
      height,
      weight,
      bmi,
      vision,
      hearing,
      bloodPressure,
      heartRate,
      notes,
      abnormal,
      abnormalFindings,
      date: new Date().toISOString(),
    })

    // Navigate back to the session details
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Health Checkup</Text>
          <Text style={styles.subtitle}>{sessionData.name}</Text>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <FontAwesome5 name="user" size={16} color="#1890ff" />
            <Text style={styles.studentName}>{studentData.name}</Text>
          </View>
          <Text style={styles.studentClass}>Class: {studentData.class}</Text>
          <Text style={styles.studentAge}>Age: {studentData.age} years</Text>
          <View style={styles.previousData}>
            <Text style={styles.previousLabel}>Previous Height: {studentData.previousHeight}</Text>
            <Text style={styles.previousLabel}>Previous Weight: {studentData.previousWeight}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.measurementsSection}>
            <Text style={styles.sectionTitle}>Physical Measurements</Text>

            <View style={styles.measurementRow}>
              <View style={styles.measurementInput}>
                <Text style={styles.label}>Height (cm)*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter height"
                  value={height}
                  onChangeText={(text) => {
                    setHeight(text)
                    // Calculate BMI after a short delay
                    setTimeout(calculateBMI, 100)
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.measurementInput}>
                <Text style={styles.label}>Weight (kg)*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter weight"
                  value={weight}
                  onChangeText={(text) => {
                    setWeight(text)
                    // Calculate BMI after a short delay
                    setTimeout(calculateBMI, 100)
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.bmiContainer}>
              <Text style={styles.label}>BMI</Text>
              <Text style={styles.bmiValue}>{bmi || "-"}</Text>
              {bmi && (
                <View style={styles.bmiCategory}>
                  <Text style={styles.bmiCategoryText}>
                    {Number.parseFloat(bmi) < 18.5
                      ? "Underweight"
                      : Number.parseFloat(bmi) < 25
                        ? "Normal weight"
                        : Number.parseFloat(bmi) < 30
                          ? "Overweight"
                          : "Obese"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vision</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Left: 20/40, Right: 20/30"
                value={vision}
                onChangeText={setVision}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hearing</Text>
              <View style={styles.hearingOptions}>
                <TouchableOpacity
                  style={[styles.hearingOption, hearing === "normal" && styles.selectedHearing]}
                  onPress={() => setHearing("normal")}
                >
                  <Text style={[styles.hearingText, hearing === "normal" && styles.selectedHearingText]}>Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.hearingOption, hearing === "mild loss" && styles.selectedHearing]}
                  onPress={() => setHearing("mild loss")}
                >
                  <Text style={[styles.hearingText, hearing === "mild loss" && styles.selectedHearingText]}>
                    Mild Loss
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.hearingOption, hearing === "significant loss" && styles.selectedHearing]}
                  onPress={() => setHearing("significant loss")}
                >
                  <Text style={[styles.hearingText, hearing === "significant loss" && styles.selectedHearingText]}>
                    Significant Loss
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.measurementRow}>
              <View style={styles.measurementInput}>
                <Text style={styles.label}>Blood Pressure</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 110/70"
                  value={bloodPressure}
                  onChangeText={setBloodPressure}
                />
              </View>

              <View style={styles.measurementInput}>
                <Text style={styles.label}>Heart Rate (bpm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 85"
                  value={heartRate}
                  onChangeText={setHeartRate}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter any observations or notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Abnormal Findings</Text>
            <Switch
              value={abnormal}
              onValueChange={setAbnormal}
              trackColor={{ false: "#d9d9d9", true: "#ffccc7" }}
              thumbColor={abnormal ? "#ff4d4f" : "#f5f5f5"}
            />
          </View>

          {abnormal && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Abnormal Findings Details</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe abnormal findings and recommendations"
                value={abnormalFindings}
                onChangeText={setAbnormalFindings}
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, !(height && weight) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!(height && weight)}
          >
            <Text style={styles.submitButtonText}>Record Checkup Results</Text>
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
  studentAge: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  previousData: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 4,
  },
  previousLabel: {
    fontSize: 12,
    color: "#666",
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
  measurementsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  measurementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  measurementInput: {
    width: "48%",
  },
  inputContainer: {
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
  bmiContainer: {
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1890ff",
    marginBottom: 4,
  },
  bmiCategory: {
    backgroundColor: "#e6f7ff",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  bmiCategoryText: {
    fontSize: 12,
    color: "#1890ff",
    fontWeight: "500",
  },
  hearingOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hearingOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedHearing: {
    backgroundColor: "#e6f7ff",
    borderColor: "#1890ff",
  },
  hearingText: {
    fontSize: 14,
    color: "#666",
  },
  selectedHearingText: {
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
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#d9d9d9",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
