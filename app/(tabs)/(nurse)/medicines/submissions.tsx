"use client"

import { View, Text, FlatList, StyleSheet } from "react-native"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

type MedicineSubmission = {
  id: string
  studentId: string
  studentName: string
  medicineName: string
  dosage: string
  timesPerDay: number
  startDate: string
  endDate: string
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function MedicineSubmissionsScreen() {
  const [submissions, setSubmissions] = useState<MedicineSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const response = await api.getMedicineSubmissions()
      setSubmissions(response.data)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: { item: MedicineSubmission }) => (
    <View style={styles.submissionItem}>
      <Text style={styles.studentName}>{item.studentName}</Text>
      <Text style={styles.medicineName}>{item.medicineName}</Text>
      <Text style={styles.details}>
        Dosage: {item.dosage} - {item.timesPerDay}x daily
      </Text>
      <Text style={styles.dates}>
        {new Date(item.startDate).toLocaleDateString()} - 
        {new Date(item.endDate).toLocaleDateString()}
      </Text>
      <Text style={[styles.status, styles[item.status]]}>
        {item.status.toUpperCase()}
      </Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading submissions...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medicine Submissions</Text>
      <FlatList
        data={submissions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
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
    marginBottom: 16
  },
  list: {
    gap: 16
  },
  submissionItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 8
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  medicineName: {
    fontSize: 16,
    color: '#666'
  },
  details: {
    fontSize: 14
  },
  dates: {
    fontSize: 14,
    color: '#666'
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  pending: {
    backgroundColor: '#fff3cd',
    color: '#856404'
  },
  approved: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  rejected: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  }
})