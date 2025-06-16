import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome5 } from '@expo/vector-icons'
import { api, UserProfile } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function NurseProfile() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      console.log('🏥 Loading nurse profile...')
      const userProfile = await api.getCurrentUser()
      setProfile(userProfile)
      console.log('✅ Nurse profile loaded:', userProfile)
    } catch (error) {
      console.error('❌ Failed to load nurse profile:', error)
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
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshProfile}
            colors={['#1890ff']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Thông tin cá nhân</Text>
          <TouchableOpacity onPress={refreshProfile} style={styles.refreshButton}>
            <FontAwesome5 name="sync-alt" size={20} color="#1890ff" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile?.image ? (
                <Image source={{ uri: profile.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <FontAwesome5 name="user-nurse" size={40} color="#1890ff" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.fullName || 'N/A'}</Text>
              <View style={styles.roleContainer}>
                <FontAwesome5 name="user-md" size={14} color="#52c41a" />
                <Text style={styles.roleText}>Y tá</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Information Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="envelope" size={16} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || 'Chưa cập nhật'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="phone" size={16} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{profile?.phone || 'Chưa cập nhật'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin hệ thống</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="id-badge" size={16} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>ID</Text>
                <Text style={styles.infoValue}>{profile?.id || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="calendar" size={16} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày tạo</Text>
                <Text style={styles.infoValue}>
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editButton}>
            <FontAwesome5 name="edit" size={16} color="#1890ff" />
            <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome5 name="sign-out-alt" size={16} color="#ff4d4f" />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
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
  scrollView: {
    flex: 1,
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
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1890ff',
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
    color: '#52c41a',
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