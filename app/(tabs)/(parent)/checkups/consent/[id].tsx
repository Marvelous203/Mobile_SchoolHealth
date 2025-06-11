import { api } from "@/lib/api"
import { useLocalSearchParams, router } from "expo-router"
import { useEffect, useState } from "react"
import { StyleSheet, Text, View, ScrollView, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "@/components/ui/Button"

interface CheckupSession {
  id: string
  name: string
  date: string
  description: string
  status: string
}

export default function ConsentDetailScreen() {
  const { id } = useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<CheckupSession | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true)
        const data = await api.getHealthCheckSession(id as string)
        setSession(data)
      } catch (error) {
        console.error("Failed to load session details", error)
        Alert.alert("Lỗi", "Không thể tải thông tin phiên khám")
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [id])

  const handleConsent = async () => {
    try {
      setIsLoading(true)
      await api.provideCheckupConsent(id as string)
      Alert.alert("Thành công", "Bạn đã đồng ý cho phép khám sức khỏe")
      router.back()
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xử lý yêu cầu. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Đang tải...</Text>
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Không tìm thấy thông tin phiên khám</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>{session.name}</Text>
        <Text style={styles.date}>Ngày khám: {session.date}</Text>
        <Text style={styles.description}>{session.description}</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            onPress={handleConsent} 
            loading={isLoading}
            style={styles.button}
          >
            Đồng ý
          </Button>
          <Button 
            onPress={() => router.back()} 
            variant="secondary"
            style={styles.button}
          >
            Quay lại
          </Button>
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
    marginBottom: 12
  },
  description: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    lineHeight: 24
  },
  buttonContainer: {
    gap: 12
  },
  button: {
    width: "100%"
  }
})