"use client"

import { api } from "@/lib/api"
import { FontAwesome5 } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

export default function HealthProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    dob: "",
    class: "",
    allergies: "",
    chronicDiseases: "",
    vision: "",
    hearing: "",
    bloodType: "",
    height: "",
    weight: "",
    emergencyContact: "",
  })

  useEffect(() => {
    // Fetch student profile
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        // In a real app, you would get the studentId from context or params
        const studentId = "1"
        const data = await api.getStudentProfile(studentId)

        // Format the data for the form
        setProfile({
          name: data.name,
          dob: data.dob,
          class: data.class,
          allergies: data.allergies.join(", "),
          chronicDiseases: data.chronicDiseases.join(", "),
          vision: data.vision,
          hearing: data.hearing,
          bloodType: data.bloodType || "",
          height: data.height?.toString() || "",
          weight: data.weight?.toString() || "",
          emergencyContact: data.emergencyContact || "",
        })
      } catch (error) {
        console.error("Failed to load profile", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Format the data for the API
      const formattedData = {
        ...profile,
        allergies: profile.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        chronicDiseases: profile.chronicDiseases
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }

      // In a real app, you would get the studentId from context or params
      await api.updateStudentProfile("1", formattedData)

      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save profile", error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderField = (label, value, fieldName) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={profile[fieldName]}
            onChangeText={(text) => setProfile({ ...profile, [fieldName]: text })}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <Text style={styles.fieldValue}>{value || "Not specified"}</Text>
        )}
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Profile</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <FontAwesome5 name="edit" size={16} color="#1890ff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)} disabled={isSaving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            {renderField("Name", profile.name, "name")}
            {renderField("Date of Birth", profile.dob, "dob")}
            {renderField("Class", profile.class, "class")}
            {renderField("Blood Type", profile.bloodType, "bloodType")}
            {renderField("Emergency Contact", profile.emergencyContact, "emergencyContact")}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Information</Text>
          <View style={styles.card}>
            {renderField("Allergies", profile.allergies, "allergies")}
            {renderField("Chronic Diseases", profile.chronicDiseases, "chronicDiseases")}
            {renderField("Vision", profile.vision, "vision")}
            {renderField("Hearing", profile.hearing, "hearing")}
            {renderField("Height (cm)", profile.height, "height")}
            {renderField("Weight (kg)", profile.weight, "weight")}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical History</Text>
          <View style={styles.card}>
            <Text style={styles.emptyText}>No medical history records available.</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  editButtonText: {
    color: "#1890ff",
    marginLeft: 5,
    fontWeight: "500",
  },
  editActions: {
    flexDirection: "row",
  },
  cancelButton: {
    padding: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveButtonDisabled: {
    backgroundColor: "#bae7ff",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  emptyText: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
})
