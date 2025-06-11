"use client"

import { api } from "@/lib/api"
import { FontAwesome5 } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function MedicinesScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [medicines, setMedicines] = useState([])

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        setIsLoading(true)
        // In a real app, you would get the studentId from context
        const studentId = "1"
        const data = await api.getMedicineSubmissions(studentId)
        setMedicines(data)
      } catch (error) {
        console.error("Failed to load medicines", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMedicines()
  }, [])

  const renderMedicineItem = ({ item }) => {
    let statusColor = "#1890ff"
    let statusText = "Pending"

    if (item.status === "approved") {
      statusColor = "#52c41a"
      statusText = "Approved"
    } else if (item.status === "completed") {
      statusColor = "#d9d9d9"
      statusText = "Completed"
    }

    return (
      <TouchableOpacity
        style={styles.medicineCard}
        onPress={() => router.push(`/(parent)/medicines/details?id=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.medicineName}>{item.medicineName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.dosageContainer}>
          <FontAwesome5 name="prescription-bottle-alt" size={14} color="#666" />
          <Text style={styles.dosageText}>
            {item.dosage} - {item.timesPerDay}x daily
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Start:</Text>
          <Text style={styles.dateValue}>{item.startDate}</Text>
          <Text style={styles.dateLabel}>End:</Text>
          <Text style={styles.dateValue}>{item.endDate}</Text>
        </View>

        {item.notes && <Text style={styles.notesText}>Notes: {item.notes}</Text>}

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => router.push(`/(parent)/medicines/details?id=${item.id}`)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medicines</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/(parent)/medicines/submit")}>
          <FontAwesome5 name="plus" size={14} color="#fff" />
          <Text style={styles.addButtonText}>Submit New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading medicines...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {medicines.length > 0 ? (
            <FlatList
              data={medicines}
              renderItem={renderMedicineItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="prescription-bottle-alt" size={40} color="#d9d9d9" />
              <Text style={styles.emptyText}>No medicine submissions yet</Text>
              <TouchableOpacity style={styles.submitButton} onPress={() => router.push("/(parent)/medicines/submit")}>
                <Text style={styles.submitButtonText}>Submit Medicine</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1890ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  dosageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dosageText: {
    fontSize: 14,
    marginLeft: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 15,
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    fontStyle: "italic",
  },
  detailsButton: {
    alignSelf: "flex-end",
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  detailsButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#1890ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
})
