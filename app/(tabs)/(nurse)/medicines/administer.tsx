"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function AdministerMedicineScreen() {
  const { scheduleId } = useLocalSearchParams()
  const [dosageGiven, setDosageGiven] = useState("")
  const [reaction, setReaction] = useState("none")
  const [notes, setNotes] = useState("")
  const [followUpRequired, setFollowUpRequired] = useState(false)

  // Mock data - in a real app, you would fetch this based on the scheduleId
  const scheduleData = {
    id: scheduleId,
    studentId: "s3",
    studentName: "Michael Brown",
    class: "5B",
    medicine: "Antibiotics",
    dosage: "250mg",
    timeSlot: "afternoon",
    scheduledTime: "1:00 PM",
    submissionId: "ms3",
    parentNotes: "Please give with food to avoid stomach upset",
    allergies: [],
    chronicConditions: ["Asthma"],
  }

  const reactions = [
    { key: "none", label: "No Reaction", color: "#52c41a" },
    { key: "mild", label: "Mild Reaction", color: "#faad14" },
    { key: "moderate", label: "Moderate Reaction", color: "#ff7a45" },
    { key: "severe", label: "Severe Reaction", color: "#f5222d" },
  ]

  const handleAdminister = () => {
    // In a real app, you would send this data to your backend
    console.log("Medicine administered:", {
      scheduleId,
      dosageGiven,
      reaction,
      notes,
      followUpRequired,
      administeredBy: "Current Nurse",
      administeredAt: new Date().toISOString(),
    })

    // Navigate back to the daily schedule
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Administer Medicine</Text>
          <Text style={styles.subtitle}>Record medicine administration</Text>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <FontAwesome5 name="user" size={16} color="#1890ff" />
            <Text style={styles.studentName}>{scheduleData.studentName}</Text>
          </View>
          <Text style={styles.studentClass}>Class: {scheduleData.class}</Text>

          {scheduleData.allergies.length > 0 && (
            <View style={styles.alertSection}>
              <View style={styles.alertHeader}>
                <FontAwesome5 name="exclamation-triangle" size={14} color="#f5222d" />
                <Text style={styles.alertTitle}>Allergies</Text>
              </View>
              <View style={styles.allergyTags}>
                {scheduleData.allergies.map((allergy, index) => (
                  <View key={index} style={styles.allergyTag}>
                    <Text style={styles.allergyText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {scheduleData.chronicConditions.length > 0 && (
            <View style={styles.alertSection}>
              <View style={styles.alertHeader}>
                <FontAwesome5 name="heartbeat" size={14} color="#1890ff" />
                <Text style={styles.alertTitle}>Medical Conditions</Text>
              </View>
              <View style={styles.conditionTags}>
                {scheduleData.chronicConditions.map((condition, index) => (
                  <View key={index} style={styles.conditionTag}>
                    <Text style={styles.conditionText}>{condition}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.medicineCard}>
          <View style={styles.medicineHeader}>
            <FontAwesome5 name="pills" size={16} color="#1890ff" />
            <Text style={styles.medicineName}>{scheduleData.medicine}</Text>
          </View>
          <View style={styles.medicineDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Prescribed Dosage:</Text>
              <Text style={styles.detailValue}>{scheduleData.dosage}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time Slot:</Text>
              <Text style={styles.detailValue}>
                {scheduleData.timeSlot.charAt(0).toUpperCase() + scheduleData.timeSlot.slice(1)} (
                {scheduleData.scheduledTime})
              </Text>
            </View>
            {scheduleData.parentNotes && (
              <View style={styles.parentNotesSection}>
                <Text style={styles.parentNotesLabel}>Parent Instructions:</Text>
                <Text style={styles.parentNotesText}>{scheduleData.parentNotes}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.administrationForm}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dosage Given*</Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter dosage (prescribed: ${scheduleData.dosage})`}
              value={dosageGiven}
              onChangeText={setDosageGiven}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student Reaction</Text>
            <View style={styles.reactionOptions}>
              {reactions.map((reactionOption) => (
                <TouchableOpacity
                  key={reactionOption.key}
                  style={[
                    styles.reactionOption,
                    reaction === reactionOption.key && {
                      backgroundColor: reactionOption.color,
                      borderColor: reactionOption.color,
                    },
                  ]}
                  onPress={() => setReaction(reactionOption.key)}
                >
                  <Text style={[styles.reactionText, reaction === reactionOption.key && styles.selectedReactionText]}>
                    {reactionOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Administration Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter any observations or notes about the administration"
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
                A follow-up reminder will be set to monitor the student's response to the medication.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.administerButton, !dosageGiven && styles.administerButtonDisabled]}
            onPress={handleAdminister}
            disabled={!dosageGiven}
          >
            <FontAwesome5 name="check" size={16} color="#fff" />
            <Text style={styles.administerButtonText}>Confirm Administration</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.safetyReminder}>
          <View style={styles.safetyHeader}>
            <FontAwesome5 name="shield-alt" size={16} color="#1890ff" />
            <Text style={styles.safetyTitle}>Safety Reminder</Text>
          </View>
          <Text style={styles.safetyText}>
            • Verify student identity before administration{"\n"}• Check for any allergic reactions{"\n"}• Ensure proper
            dosage as prescribed{"\n"}• Monitor student for 15 minutes after administration{"\n"}• Document any unusual
            reactions immediately
          </Text>
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
    borderRadius: 10,
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
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  studentClass: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  alertSection: {
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  allergyTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  allergyTag: {
    backgroundColor: "#fff1f0",
    borderWidth: 1,
    borderColor: "#ffccc7",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  allergyText: {
    color: "#f5222d",
    fontSize: 12,
    fontWeight: "500",
  },
  conditionTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  conditionTag: {
    backgroundColor: "#e6f7ff",
    borderWidth: 1,
    borderColor: "#91d5ff",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  conditionText: {
    color: "#1890ff",
    fontSize: 12,
    fontWeight: "500",
  },
  medicineCard: {
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
  medicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  medicineDetails: {
    paddingLeft: 24,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  parentNotesSection: {
    marginTop: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    padding: 8,
  },
  parentNotesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  parentNotesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  administrationForm: {
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
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  reactionOption: {
    width: "48%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  reactionText: {
    fontSize: 14,
    color: "#666",
  },
  selectedReactionText: {
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
  administerButton: {
    backgroundColor: "#52c41a",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  administerButtonDisabled: {
    backgroundColor: "#d9d9d9",
  },
  administerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  safetyReminder: {
    backgroundColor: "#e6f7ff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#91d5ff",
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#1890ff",
  },
  safetyText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
})
