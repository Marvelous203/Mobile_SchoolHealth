"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function DailyMedicineScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState("2023-05-21")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("all")

  // Mock data for daily schedule
  const scheduleData = {
    date: "May 21, 2023",
    summary: {
      total: 24,
      morning: 12,
      afternoon: 12,
      administered: 18,
      pending: 6,
      missed: 0,
    },
    schedule: [
      {
        id: "1",
        studentId: "s1",
        studentName: "John Smith",
        class: "5A",
        medicine: "Allergy Medication",
        dosage: "5ml",
        timeSlot: "morning",
        scheduledTime: "9:00 AM",
        status: "administered",
        administeredBy: "Nurse Sarah",
        administeredAt: "9:05 AM",
        notes: "Taken with breakfast",
      },
      {
        id: "2",
        studentId: "s2",
        studentName: "Emily Johnson",
        class: "5A",
        medicine: "Asthma Inhaler",
        dosage: "2 puffs",
        timeSlot: "morning",
        scheduledTime: "9:30 AM",
        status: "administered",
        administeredBy: "Nurse Sarah",
        administeredAt: "9:32 AM",
      },
      {
        id: "3",
        studentId: "s3",
        studentName: "Michael Brown",
        class: "5B",
        medicine: "Antibiotics",
        dosage: "250mg",
        timeSlot: "afternoon",
        scheduledTime: "1:00 PM",
        status: "pending",
      },
      {
        id: "4",
        studentId: "s4",
        studentName: "Sophia Davis",
        class: "5B",
        medicine: "Vitamin D",
        dosage: "1000 IU",
        timeSlot: "afternoon",
        scheduledTime: "1:30 PM",
        status: "pending",
      },
      {
        id: "5",
        studentId: "s5",
        studentName: "Daniel Wilson",
        class: "5C",
        medicine: "Iron Supplement",
        dosage: "65mg",
        timeSlot: "afternoon",
        scheduledTime: "2:00 PM",
        status: "pending",
      },
    ],
  }

  const timeSlots = [
    { key: "all", label: "All" },
    { key: "morning", label: "Morning" },
    { key: "afternoon", label: "Afternoon" },
  ]

  const filteredSchedule =
    selectedTimeSlot === "all"
      ? scheduleData.schedule
      : scheduleData.schedule.filter((item) => item.timeSlot === selectedTimeSlot)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "administered":
        return "#52c41a"
      case "pending":
        return "#faad14"
      case "missed":
        return "#f5222d"
      default:
        return "#666"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "administered":
        return "check-circle"
      case "pending":
        return "clock"
      case "missed":
        return "exclamation-triangle"
      default:
        return "question-circle"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Medicine Schedule</Text>
        <Text style={styles.subtitle}>{scheduleData.date}</Text>
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{scheduleData.summary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#52c41a" }]}>{scheduleData.summary.administered}</Text>
            <Text style={styles.summaryLabel}>Given</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#faad14" }]}>{scheduleData.summary.pending}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#f5222d" }]}>{scheduleData.summary.missed}</Text>
            <Text style={styles.summaryLabel}>Missed</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterButtons}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.key}
                style={[styles.filterButton, selectedTimeSlot === slot.key && styles.activeFilterButton]}
                onPress={() => setSelectedTimeSlot(slot.key)}
              >
                <Text style={[styles.filterButtonText, selectedTimeSlot === slot.key && styles.activeFilterButtonText]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scheduleList}>
        {filteredSchedule.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.scheduleCard}
            onPress={() => {
              if (item.status === "pending") {
                router.push(`/(nurse)/medicines/administer?scheduleId=${item.id}`)
              }
            }}
          >
            <View style={styles.scheduleHeader}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <Text style={styles.studentClass}>Class: {item.class}</Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <FontAwesome5 name={getStatusIcon(item.status)} size={10} color="#fff" />
                  <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.medicineInfo}>
              <View style={styles.medicineDetails}>
                <FontAwesome5 name="pills" size={14} color="#1890ff" style={styles.medicineIcon} />
                <Text style={styles.medicineName}>{item.medicine}</Text>
              </View>
              <Text style={styles.dosageInfo}>Dosage: {item.dosage}</Text>
            </View>

            <View style={styles.timeInfo}>
              <View style={styles.timeSlotContainer}>
                <FontAwesome5 name="clock" size={12} color="#666" />
                <Text style={styles.timeSlotText}>
                  {item.timeSlot.charAt(0).toUpperCase() + item.timeSlot.slice(1)} • {item.scheduledTime}
                </Text>
              </View>
            </View>

            {item.status === "administered" && (
              <View style={styles.administeredInfo}>
                <Text style={styles.administeredText}>
                  Given by {item.administeredBy} at {item.administeredAt}
                </Text>
                {item.notes && <Text style={styles.notesText}>Notes: {item.notes}</Text>}
              </View>
            )}

            {item.status === "pending" && (
              <TouchableOpacity
                style={styles.administerButton}
                onPress={() => router.push(`/(nurse)/medicines/administer?scheduleId=${item.id}`)}
              >
                <FontAwesome5 name="pills" size={14} color="#fff" />
                <Text style={styles.administerButtonText}>Administer Medicine</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome5 name="download" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Export Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome5 name="bell" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Send Reminders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  summarySection: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1890ff",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  filterSection: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
  },
  activeFilterButton: {
    backgroundColor: "#1890ff",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  scheduleList: {
    flex: 1,
    padding: 16,
  },
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    color: "#666",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  medicineInfo: {
    marginBottom: 12,
  },
  medicineDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  medicineIcon: {
    marginRight: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "500",
  },
  dosageInfo: {
    fontSize: 14,
    color: "#666",
    paddingLeft: 22,
  },
  timeInfo: {
    marginBottom: 12,
  },
  timeSlotContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  administeredInfo: {
    backgroundColor: "#f6ffed",
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: "#b7eb8f",
  },
  administeredText: {
    fontSize: 12,
    color: "#52c41a",
    fontWeight: "500",
  },
  notesText: {
    fontSize: 12,
    color: "#52c41a",
    marginTop: 2,
  },
  administerButton: {
    backgroundColor: "#52c41a",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  administerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  bottomActions: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#1890ff",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
})
