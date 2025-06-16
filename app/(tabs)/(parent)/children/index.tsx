import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function ChildrenScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [children, setChildren] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadChildren = async () => {
    try {
      setIsLoading(true)
      const userProfileResponse = await api.getCurrentUser()
      const userProfile = userProfileResponse.data || userProfileResponse
      
      if (userProfile.studentIds && userProfile.studentIds.length > 0) {
        const childrenData = []
        
        for (const studentId of userProfile.studentIds) {
          try {
            const studentResponse = await api.getStudentById(studentId)
            const studentData = studentResponse.data || studentResponse
            
            const childInfo = {
              id: studentData._id,
              name: studentData.fullName,
              class: studentData.classInfo?.name || 'Unknown Class',
              avatar: studentData.avatar || 'https://via.placeholder.com/60',
              healthStatus: 'good',
              studentCode: studentData.studentCode,
              gender: studentData.gender,
              dob: studentData.dob,
              classId: studentData.classId,
            }
            
            childrenData.push(childInfo)
          } catch (error) {
            console.error(`Failed to load student ${studentId}:`, error)
          }
        }
        
        setChildren(childrenData)
      }
    } catch (error) {
      console.error('Failed to load children:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      await loadChildren()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadChildren()
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải thông tin con em...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Con em của tôi</Text>
        <Text style={styles.headerSubtitle}>{children.length} học sinh</Text>
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#1890ff']}
          />
        }
      >
        {children.length > 0 ? (
          children.map((child) => (
            <TouchableOpacity 
              key={child.id} 
              style={styles.childCard}
              onPress={() => router.push(`/(tabs)/(parent)/children/${child.id}`)}
            >
              <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childClass}>{child.class}</Text>
                <Text style={styles.childCode}>Mã HS: {child.studentCode}</Text>
                <View style={styles.healthStatus}>
                  <View style={[styles.statusIndicator, styles.statusGood]} />
                  <Text style={styles.statusText}>Tình trạng tốt</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={20} color="#1890ff" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noChildrenCard}>
            <MaterialIcons name="child-care" size={48} color="#d9d9d9" />
            <Text style={styles.noChildrenText}>Chưa có thông tin con em</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8c8c8c',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8c8c8c',
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 4,
  },
  childClass: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 2,
  },
  childCode: {
    fontSize: 12,
    color: '#1890ff',
    marginBottom: 8,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusGood: {
    backgroundColor: '#52c41a',
  },
  statusText: {
    fontSize: 12,
    color: '#52c41a',
  },
  noChildrenCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  noChildrenText: {
    fontSize: 16,
    color: '#8c8c8c',
    marginTop: 12,
  },
})