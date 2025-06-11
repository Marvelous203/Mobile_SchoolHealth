"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function CheckupSessionDetailsScreen() {
  const { id } = useLocalSearchParams()
  const [activeTab, setActiveTab] = useState("students")

  // Mock data - in a real app, you would fetch this based on the ID
  const sessionData = {
    id: id,
    name: "Dental Screening",
    date: "November 5, 2023",
    status: "upcoming",
    description: "Basic dental examination to identify potential issues and promote oral hygiene.",
    checkItems: [
      "Dental caries check",
      "Gum health assessment",
      "Oral hygiene evaluation",
      "Orthodontic needs assessment",
    ],
    students: [
      {
        id: "s1",
        name: "John Smith",
        class: "5A",
        status: "consented",
        checked: false,
        notes: "",
      },
      {
        id: "s2",
        name: "Emily Johnson",
        class: "5A",
        status: "consented",
        checked: false,
        notes: "",
      },
      {
        id: "s3",
        name: "Michael Brown",
        class: "5B",
        status: "consented",
        checked: false,
        notes: "",
      },
      {
        id: "s4",
        name: "Sophia Davis",
        class: "5B",
        status: "declined",
        checked: false,
        notes: "Parent declined participation",
      },
      {
        id: "s5",
        name: "Daniel Wilson",
        class: "5C",
        status: "pending",
        checked: false,
        notes: "",
      },
    ],
  }

  const renderStudentItem = (item) => {
    let statusColor = "#1890ff"
    let statusText = "Consented"

    if (item.status === "declined") {
      statusColor = "#ff4d4f"
      statusText = "Declined"
    } else if (item.status === "pending") {
      statusColor = "#faad14"
      statusText = "Pending"
    } else if (item.checked) {
      statusColor = "#52c41a"
      statusText = "Completed"
    }

    return (
      <View style={styles.studentCard} key={item.id}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentClass}>Class: {item.class}</Text>
          {item.notes && <Text style={styles.studentNotes}>Note: {item.notes}</Text>}
        </View>
        <View style={styles.studentActions}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          {item.status === "consented" && !item.checked && (
            <TouchableOpacity
              style={styles.recordButton}
              onPress={() => router.push(`/(nurse)/checkups/record-checkup?sessionId=${id}&studentId=${item.id}`)}
            >
              <FontAwesome5 name="stethoscope" size={12} color="#fff" />
              <Text style={styles.recordButtonText}>Record</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{sessionData.name}</Text>
        <Text style={styles.date}>Date: {sessionData.date}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: "#faad14" }]}>
            <FontAwesome5 name="calendar-alt" size={12} color="#fff" />
            <Text style={styles.statusText}>Upcoming</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "details" && styles.activeTab]}
          onPress={() => setActiveTab("details")}
        >
          <Text style={[styles.tabText, activeTab === "details" && styles.activeTabText]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "students" && styles.activeTab]}
          onPress={() => setActiveTab("students")}
        >
          <Text style={[styles.tabText, activeTab === "students" && styles.activeTabText]}>Students</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "details" ? (
          <View style={styles.detailsContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{sessionData.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Checkup Items</Text>
              {sessionData.checkItems.map((item, index) => (
                <View key={index} style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Session Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{sessionData.students.length}</Text>
                  <Text style={styles.statLabel}>Total Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {sessionData.students.filter((s) => s.status === "consented").length}
                  </Text>
                  <Text style={styles.statLabel}>Consented</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{sessionData.students.filter((s) => s.checked).length}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {sessionData.students.filter((s) => s.status === "declined").length}
                  </Text>
                  <Text style={styles.statLabel}>Declined</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.studentsContainer}>
            <View style={styles.filterContainer}>
              <TouchableOpacity style={[styles.filterButton, styles.activeFilterButton]}>
                <Text style={styles.activeFilterText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>Consented</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>Declined</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.studentsList}>{sessionData.students.map((student) => renderStudentItem(student))}</View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            // In a real app, you would update the session status to "in-progress"
            console.log("Starting checkup session")
          }}
        >
          <FontAwesome5 name="play" size={16} color="#fff" />
          <Text style={styles.startButtonText}>Start Checkup Session</Text>
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
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
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
    marginLeft: 4,
    fontWeight: "500",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#1890ff",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#1890ff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  statsSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1890ff",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  studentsContainer: {
    padding: 16,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeFilterButton: {
    backgroundColor: "#1890ff",
  },
  filterText: {
    fontSize: 12,
    color: "#666",
  },
  activeFilterText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  studentsList: {
    marginBottom: 80, // Space for the footer button
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  studentNotes: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  studentActions: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  recordButton: {
    backgroundColor: "#1890ff",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  startButton: {
    backgroundColor: "#1890ff",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})
