"use client"

import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// Mock data
const studentsData = [
  {
    id: "1",
    name: "John Smith",
    class: "5A",
    age: 10,
    allergies: ["Peanuts", "Dust"],
    chronicConditions: [],
  },
  {
    id: "2",
    name: "Emily Johnson",
    class: "5A",
    age: 10,
    allergies: [],
    chronicConditions: [],
  },
  {
    id: "3",
    name: "Michael Brown",
    class: "5B",
    age: 10,
    allergies: [],
    chronicConditions: ["Asthma"],
  },
  {
    id: "4",
    name: "Sophia Davis",
    class: "5B",
    age: 10,
    allergies: [],
    chronicConditions: ["Asthma"],
  },
  {
    id: "5",
    name: "Daniel Wilson",
    class: "5C",
    age: 10,
    allergies: ["Penicillin"],
    chronicConditions: [],
  },
  {
    id: "6",
    name: "Olivia Martinez",
    class: "5C",
    age: 10,
    allergies: [],
    chronicConditions: ["Diabetes"],
  },
  {
    id: "7",
    name: "William Taylor",
    class: "5A",
    age: 10,
    allergies: ["Shellfish"],
    chronicConditions: [],
  },
  {
    id: "8",
    name: "Ava Anderson",
    class: "5B",
    age: 10,
    allergies: [],
    chronicConditions: [],
  },
]

export default function StudentsScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState("All")

  const classes = ["All", "5A", "5B", "5C"]

  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = selectedClass === "All" || student.class === selectedClass
    return matchesSearch && matchesClass
  })

  const renderStudentItem = ({ item }) => {
    const hasAllergies = item.allergies.length > 0
    const hasChronicConditions = item.chronicConditions.length > 0
    const hasMedicalAlerts = hasAllergies || hasChronicConditions

    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => router.push(`/(nurse)/students/student-details?id=${item.id}`)}
      >
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentClass}>Class: {item.class}</Text>
          {hasMedicalAlerts && (
            <View style={styles.alertsContainer}>
              {hasAllergies && (
                <View style={styles.alertBadge}>
                  <FontAwesome5 name="allergies" size={10} color="#fff" />
                  <Text style={styles.alertText}>Allergies</Text>
                </View>
              )}
              {hasChronicConditions && (
                <View style={[styles.alertBadge, { backgroundColor: "#1890ff" }]}>
                  <FontAwesome5 name="heartbeat" size={10} color="#fff" />
                  <Text style={styles.alertText}>Medical</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <FontAwesome5 name="chevron-right" size={16} color="#ccc" />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
              <FontAwesome5 name="times" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.classFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classFilterContent}>
          {classes.map((classItem) => (
            <TouchableOpacity
              key={classItem}
              style={[styles.classButton, selectedClass === classItem && styles.selectedClassButton]}
              onPress={() => setSelectedClass(classItem)}
            >
              <Text style={[styles.classButtonText, selectedClass === classItem && styles.selectedClassButtonText]}>
                {classItem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="search" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No students found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  classFilter: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  classFilterContent: {
    paddingHorizontal: 12,
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: "#f5f5f5",
  },
  selectedClassButton: {
    backgroundColor: "#1890ff",
  },
  classButtonText: {
    fontSize: 14,
    color: "#666",
  },
  selectedClassButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  listContainer: {
    padding: 16,
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginBottom: 6,
  },
  alertsContainer: {
    flexDirection: "row",
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5222d",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  alertText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
})
