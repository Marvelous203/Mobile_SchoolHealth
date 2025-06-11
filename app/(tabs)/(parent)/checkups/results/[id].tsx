import { api } from "@/lib/api"
import { useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { StyleSheet, Text, View, ScrollView, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface CheckupResult {
  id: string
  date: string
  height: number
  weight: number
  vision: string
  bloodPressure: string
  notes: string
  abnormal: boolean
}

export default function ResultDetailScreen() {
  const { id } = useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState<CheckupResult | null>(null)

  useEffect(() => {
    const loadResult = async () => {
      try {
        setIsLoading(true)
        const data = await api.getCheckupResult(id as string)
        setResult(data)
      } catch (error) {
        console.error("Failed to load checkup result", error)
        Alert.alert("Lỗi", "Không thể tải kết quả khám")
      } finally {
        setIsLoading(false)
      }
    }

    loadResult()
  }, [id])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Đang tải kết quả...</Text>
      </SafeAreaView>
    )
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Không tìm thấy kết quả khám</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Kết quả khám sức khỏe</Text>
        <Text style={styles.date}>Ngày khám: {result.date}</Text>

        <View style={styles.resultCard}>
          <View style={styles.metricRow}>
            <Text style={styles.label}>Chiều cao:</Text>
            <Text style={styles.value}>{result.height} cm</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.label}>Cân nặng:</Text>
            <Text style={styles.value}>{result.weight} kg</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.label}>Thị lực:</Text>
            <Text style={styles.value}>{result.vision}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.label}>Huyết áp:</Text>
            <Text style={styles.value}>{result.bloodPressure}</Text>
          </View>

          {result.notes && (
            <View style={styles.notes}>
              <Text style={styles.label}>Ghi chú:</Text>
              <Text style={styles.noteText}>{result.notes}</Text>
            </View>
          )}
        </View>

        <View style={[styles.statusCard, { backgroundColor: result.abnormal ? "#fff2f0" : "#f6ffed" }]}>
          <Text style={[styles.statusText, { color: result.abnormal ? "#cf1322" : "#52c41a" }]}>
            {result.abnormal ? "Cần theo dõi" : "Bình thường"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12
  },
  date: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  label: {
    fontSize: 16,
    color: "#666"
  },
  value: {
    fontSize: 16,
    fontWeight: "500"
  },
  notes: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0"
  },
  noteText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    lineHeight: 24
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500"
  }
})