"use client"

import { api } from "@/lib/api"
import { router } from "expo-router"
import { useState } from "react"
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import DateTimePicker from '@react-native-community/datetimepicker'

export default function SubmitMedicineScreen() {
  const [medicineName, setMedicineName] = useState("")
  const [dosage, setDosage] = useState("")
  const [timesPerDay, setTimesPerDay] = useState("1")
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  const [notes, setNotes] = useState("")
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!medicineName.trim()) {
      newErrors.medicineName = "Medicine name is required"
    }
    
    if (!dosage.trim()) {
      newErrors.dosage = "Dosage is required"
    }
    
    if (!timesPerDay.trim() || isNaN(Number(timesPerDay)) || Number(timesPerDay) < 1) {
      newErrors.timesPerDay = "Please enter a valid number"
    }
    
    if (endDate < startDate) {
      newErrors.endDate = "End date must be after start date"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // In a real app, you would get these IDs from context
      const parentId = "parent1"
      const studentId = "1"
      
      await api.submitMedicine({
        parentId,
        studentId,
        medicineName,
        dosage,
        timesPerDay: Number(timesPerDay),
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        notes,
      })
      
      Alert.alert(
        "Success", 
        "Your medicine submission has been sent to the school nurse.",
        [{ text: "OK", onPress: () => router.back() }]
      )
    } catch (error) {
      console.error("Failed to submit medicine", error)
      Alert.alert("Error", "Failed to submit medicine. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit Medicine Request</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Medicine Name</Text>
        <TextInput
          style={styles.input}
          value={medicineName}
          onChangeText={setMedicineName}
          placeholder="Enter medicine name"
        />
        {errors.medicineName && (
          <Text style={styles.errorText}>{errors.medicineName}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dosage</Text>
        <TextInput
          style={styles.input}
          value={dosage}
          onChangeText={setDosage}
          placeholder="Enter dosage (e.g., 500mg)"
        />
        {errors.dosage && (
          <Text style={styles.errorText}>{errors.dosage}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Times Per Day</Text>
        <TextInput
          style={styles.input}
          value={timesPerDay}
          onChangeText={setTimesPerDay}
          keyboardType="numeric"
          placeholder="Enter number of times per day"
        />
        {errors.timesPerDay && (
          <Text style={styles.errorText}>{errors.timesPerDay}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text>{formatDate(startDate)}</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            onChange={(event, date) => {
              setShowStartDatePicker(false)
              if (date) setStartDate(date)
            }}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text>{formatDate(endDate)}</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            onChange={(event, date) => {
              setShowEndDatePicker(false)
              if (date) setEndDate(date)
            }}
          />
        )}
        {errors.endDate && (
          <Text style={styles.errorText}>{errors.endDate}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Enter any additional notes"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})