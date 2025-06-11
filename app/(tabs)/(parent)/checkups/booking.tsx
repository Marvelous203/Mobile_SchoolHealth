"use client"

import { api } from "@/lib/api"
import { FontAwesome5 } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

// Mock available time slots
const availableSlots = [
  { id: "1", day: "Monday", date: "Oct 18, 2023", slots: ["09:00 AM", "10:30 AM", "02:00 PM"] },
  { id: "2", day: "Tuesday", date: "Oct 19, 2023", slots: ["11:00 AM", "01:30 PM", "03:30 PM"] },
  { id: "3", day: "Wednesday", date: "Oct 20, 2023", slots: ["09:30 AM", "11:30 AM", "02:30 PM"] },
]

export default function BookConsultationScreen() {
  const { checkupId } = useLocalSearchParams()
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedDay || !selectedTime) {
      Alert.alert("Error", "Please select a day and time for your consultation.")
      return
    }

    try {
      setIsSubmitting(true)

      // In a real app, you would get the studentId from context
      const studentId = "1"

      await api.bookConsultation({
        checkupId,
        studentId,
        date: selectedDay.date,
        time: selectedTime,
        reason,
      })

      Alert.alert("Success", "Your consultation has been booked successfully.", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (error) {
      console.error("Failed to book consultation", error)
      Alert.alert("Error", "Failed to book your consultation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Book a Consultation</Text>
          <Text style={styles.subtitle}>
            Schedule a consultation with the school nurse to discuss your child's health checkup results.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a Day</Text>
            <View style={styles.daySelector}>
              {availableSlots.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayCard, selectedDay?.id === day.id && styles.selectedDayCard]}
                  onPress={() => {
                    setSelectedDay(day)
                    setSelectedTime(null) // Reset time selection when day changes
                  }}
                >
                  <Text style={[styles.dayName, selectedDay?.id === day.id && styles.selectedDayText]}>{day.day}</Text>
                  <Text style={[styles.dayDate, selectedDay?.id === day.id && styles.selectedDayText]}>{day.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedDay && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select a Time</Text>
              <View style={styles.timeSelector}>
                {selectedDay.slots.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.timeCard, selectedTime === time && styles.selectedTimeCard]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <FontAwesome5 name="clock" size={14} color={selectedTime === time ? "#fff" : "#666"} />
                    <Text style={[styles.timeText, selectedTime === time && styles.selectedTimeText]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Consultation</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Briefly describe your concerns or questions..."
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedDay || !selectedTime || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedDay || !selectedTime || isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? "Booking..." : "Book Consultation"}</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCard: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  selectedDayCard: {
    backgroundColor: "#1890ff",
    borderColor: "#1890ff",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 12,
    color: "#666",
  },
  selectedDayText: {
    color: "#fff",
  },
  timeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  selectedTimeCard: {
    backgroundColor: "#1890ff",
    borderColor: "#1890ff",
  },
  timeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  selectedTimeText: {
    color: "#fff",
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
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
