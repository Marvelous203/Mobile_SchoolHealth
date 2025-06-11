"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function RecordVaccinationScreen() {
  const { sessionId, studentId } = useLocalSearchParams()
  const [lotNumber, setLotNumber] = useState("")
  const [reaction, setReaction] = useState("none")
  const [notes, setNotes] = useState("")
  const [followUpRequired, setFollowUpRequired] = useState(false)

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
    notes: "No allergies",
  }

  const handleSubmit = () => {
    // In a real app, you would send this data to your backend
    console.log("Vaccination recorded:", {
      sessionId,
      studentId,
      lotNumber,
      reaction,
      notes,
      followUpRequired,
      date: new Date().toISOString(),
    })

    // Navigate back to the session details
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Vaccination</Text>
          <Text style={styles.subtitle}>{sessionData.name}</Text>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <FontAwesome5 name="user" size={16} color="#1890ff" />
            <Text style={styles.studentName}>{studentData.name}</Text>
          </View>
          <Text style={styles.studentClass}>Class: {studentData.class}</Text>
          {studentData.notes && <Text style={styles.studentNotes}>Notes: {studentData.notes}</Text>}
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lot Number*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter vaccine lot number"
              value={lotNumber}
              onChangeText={setLotNumber}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reaction</Text>
            <View style={styles.reactionOptions}>
              <TouchableOpacity
                style={[styles.reactionOption, reaction === "none" && styles.selectedReaction]}
                onPress={() => setReaction("none")}
              >
                <Text style={[styles.reactionText, reaction === "none" && styles.selectedReactionText]}>None</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reactionOption, reaction === "mild" && styles.selectedReaction]}
                onPress={() => setReaction("mild")}
              >
                <Text style={[styles.reactionText, reaction === "mild" && styles.selectedReactionText]}>Mild</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reactionOption, reaction === "moderate" && styles.selectedReaction]}
                onPress={() => setReaction("moderate")}
              >
                <Text style={[styles.reactionText, reaction === "moderate" && styles.selectedReactionText]}>
                  Moderate
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reactionOption, reaction === "severe" && styles.selectedReaction]}
                onPress={() => setReaction("severe")}
              >
                <Text style={[styles.reactionText, reaction === "severe" && styles.selectedReactionText]}>Severe</Text>
              </TouchableOpacity>
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
            <Text style={styles.toggleLabel}>Follow-up Required</Text>
            <Switch
              value={followUpRequired}
              onValueChange={setFollowUpRequired}
              trackColor={{ false: "#d9d9d9", true: "#b7eb8f" }}
              thumbColor={followUpRequired ? "#52c41a" : "#f5f5f5"}
            />
          </View>

          {followUpRequired && (
            <View style={styles.followUpInfo}>
              <FontAwesome5 name="info-circle" size={16} color="#faad14" style={styles.infoIcon} />
              <Text style={styles.followUpText}>
                A follow-up will be scheduled to check for any delayed reactions or complications.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, !lotNumber && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!lotNumber}
          >
            <Text style={styles.submitButtonText}>Record Vaccination</Text>
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
  studentNotes: {
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
  reactionOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reactionOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedReaction: {
    backgroundColor: "#e6f7ff",
    borderColor: "#1890ff",
  },
  reactionText: {
    fontSize: 14,
    color: "#666",
  },
  selectedReactionText: {
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
  followUpInfo: {
    flexDirection: "row",
    backgroundColor: "#fffbe6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffe58f",
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  followUpText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    lineHeight: 20,
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
