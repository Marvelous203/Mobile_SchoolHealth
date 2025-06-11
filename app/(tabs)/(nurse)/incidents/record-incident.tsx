"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function RecordIncidentScreen() {
  const [studentName, setStudentName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [incidentType, setIncidentType] = useState("fever")
  const [description, setDescription] = useState("")
  const [treatment, setTreatment] = useState("")
  const [parentNotified, setParentNotified] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!studentName) newErrors.studentName = "Student name is required"
    if (!studentClass) newErrors.studentClass = "Class is required"
    if (!description) newErrors.description = "Description is required"
    if (!treatment) newErrors.treatment = "Treatment is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      // In a real app, you would send this data to your backend
      console.log("Incident recorded:", {
        studentName,
        studentClass,
        incidentType,
        description,
        treatment,
        parentNotified,
        date: new Date().toISOString(),
      })

      // Navigate back to incidents list
      router.back()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Medical Incident</Text>
          <Text style={styles.subtitle}>Document a student health incident</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student Name*</Text>
            <TextInput
              style={[styles.input, errors.studentName && styles.inputError]}
              placeholder="Enter student name"
              value={studentName}
              onChangeText={setStudentName}
            />
            {errors.studentName && <Text style={styles.errorText}>{errors.studentName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Class*</Text>
            <TextInput
              style={[styles.input, errors.studentClass && styles.inputError]}
              placeholder="e.g., 5A"
              value={studentClass}
              onChangeText={setStudentClass}
            />
            {errors.studentClass && <Text style={styles.errorText}>{errors.studentClass}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Incident Type*</Text>
            <View style={styles.typeOptions}>
              <TouchableOpacity
                style={[styles.typeOption, incidentType === "fever" && styles.selectedType]}
                onPress={() => setIncidentType("fever")}
              >
                <FontAwesome5
                  name="thermometer-half"
                  size={16}
                  color={incidentType === "fever" ? "#fff" : "#666"}
                  style={styles.typeIcon}
                />
                <Text style={[styles.typeText, incidentType === "fever" && styles.selectedTypeText]}>Fever</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOption, incidentType === "injury" && styles.selectedType]}
                onPress={() => setIncidentType("injury")}
              >
                <FontAwesome5
                  name="band-aid"
                  size={16}
                  color={incidentType === "injury" ? "#fff" : "#666"}
                  style={styles.typeIcon}
                />
                <Text style={[styles.typeText, incidentType === "injury" && styles.selectedTypeText]}>Injury</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOption, incidentType === "other" && styles.selectedType]}
                onPress={() => setIncidentType("other")}
              >
                <FontAwesome5
                  name="first-aid"
                  size={16}
                  color={incidentType === "other" ? "#fff" : "#666"}
                  style={styles.typeIcon}
                />
                <Text style={[styles.typeText, incidentType === "other" && styles.selectedTypeText]}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description*</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder="Describe the incident in detail"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Treatment Provided*</Text>
            <TextInput
              style={[styles.textArea, errors.treatment && styles.inputError]}
              placeholder="Describe the treatment or action taken"
              value={treatment}
              onChangeText={setTreatment}
              multiline
              numberOfLines={4}
            />
            {errors.treatment && <Text style={styles.errorText}>{errors.treatment}</Text>}
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Parent Notified</Text>
            <TouchableOpacity
              style={[styles.toggleButton, parentNotified && styles.toggleButtonActive]}
              onPress={() => setParentNotified(!parentNotified)}
            >
              <View style={[styles.toggleIndicator, parentNotified && styles.toggleIndicatorActive]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Record Incident</Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  inputError: {
    borderColor: "#ff4d4f",
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 12,
    marginTop: 4,
  },
  typeOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedType: {
    backgroundColor: "#f5222d",
    borderColor: "#f5222d",
  },
  typeIcon: {
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    color: "#666",
  },
  selectedTypeText: {
    color: "#fff",
    fontWeight: "500",
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
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  toggleButton: {
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: "#52c41a",
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  toggleIndicatorActive: {
    marginLeft: "auto",
  },
  submitButton: {
    backgroundColor: "#f5222d",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
