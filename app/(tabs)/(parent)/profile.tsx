import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5 } from '@expo/vector-icons'
import { api, UserProfile } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function ParentProfile() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      console.log('👨‍👩‍👧‍👦 Loading parent profile...')
      const response = await api.getCurrentUser()
      // Lấy data từ response.data thay vì response trực tiếp
      const userProfile = response.data
      setProfile(userProfile)
      console.log('✅ Parent profile loaded:', userProfile)
    } catch (error) {
      console.error('❌ Failed to load parent profile:', error)
      Alert.alert('Lỗi', 'Không thể tải thông tin profile')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    try {
      setIsRefreshing(true)
      await loadProfile()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    )
  }

  useEffect(() => {
    loadProfile()
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshProfile}
            colors={['#1890ff']}
          />
        }
      >
        {/* Profile content */}
        {profile && (
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: profile.avatar || 'https://via.placeholder.com/80' }} 
              style={styles.profileAvatar} 
            />
            <Text style={styles.profileName}>{profile.fullName}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            <Text style={styles.profilePhone}>{profile.phone}</Text>
            
            {/* Thêm thông tin về số con */}
            <View style={styles.childrenInfo}>
              <Text style={styles.childrenLabel}>Số con: {profile.studentIds?.length || 0}</Text>
            </View>
          </View>
        )}
        
        {/* Settings and actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
            <FontAwesome5 name="sign-out-alt" size={20} color="#f5222d" />
            <Text style={[styles.actionText, { color: '#f5222d' }]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
  },
  refreshButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f6ffed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#52c41a',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    color: '#ff7875',
    marginLeft: 5,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#262626',
    fontWeight: '500',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  childName: {
    fontSize: 16,
    color: '#262626',
    fontWeight: '500',
  },
  childInfo: {
    fontSize: 14,
    color: '#8c8c8c',
    marginTop: 2,
  },
  actionSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1890ff',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  editButtonText: {
    color: '#1890ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4d4f',
    borderRadius: 8,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})