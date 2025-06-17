import { api, CreateMedicineSubmissionRequest, MedicineItem, SchoolNurse } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

// Import auth context (giả sử bạn có)
import { useAuth } from '@/lib/auth'

export default function CreateMedicineScreen() {
  const [loading, setLoading] = useState(false)
  const [loadingNurses, setLoadingNurses] = useState(false)
  const [loadingUserData, setLoadingUserData] = useState(true)
  const [showNurseModal, setShowNurseModal] = useState(false)
  const [schoolNurses, setSchoolNurses] = useState<SchoolNurse[]>([])
  const [selectedNurse, setSelectedNurse] = useState<SchoolNurse | null>(null)
  const [nurseSearchQuery, setNurseSearchQuery] = useState('')
  const { user } = useAuth()
  
  // Thêm các state này
  const [userProfile, setUserProfile] = useState<any>(null)
  const [studentData, setStudentData] = useState<any>(null)
  
  const [medicine, setMedicine] = useState<MedicineItem>({
    name: '',
    dosage: '',
    usageInstructions: '',
    quantity: 1,
    timesPerDay: 1,
    timeSlots: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    note: '',
    reason: ''
  })
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)

  // Cập nhật useEffect để load cả nurses và user data
  useEffect(() => {
    loadUserAndStudentData()
    loadSchoolNurses()
  }, [])

  // Thêm hàm này
  const loadUserAndStudentData = async () => {
    try {
      setLoadingUserData(true)
      console.log('🔄 Loading user and student data...')
      
      // Load user profile
      const userProfileResponse = await api.getCurrentUser()
      const profile = userProfileResponse.data || userProfileResponse
      setUserProfile(profile)
      console.log('✅ User profile loaded:', profile)
      
      // Load student data nếu có studentIds
      if (profile.studentIds && profile.studentIds.length > 0) {
        const studentId = profile.studentIds[0] // Lấy student đầu tiên
        console.log('📚 Loading student data for ID:', studentId)
        
        const studentResponse = await api.getStudentById(studentId)
        const student = studentResponse.data || studentResponse
        setStudentData(student)
        console.log('✅ Student data loaded:', student)
      } else {
        console.log('❌ No studentIds found in profile')
        Alert.alert('Lỗi', 'Không tìm thấy thông tin học sinh trong tài khoản của bạn.')
      }
    } catch (error) {
      console.error('❌ Failed to load user/student data:', error)
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng. Vui lòng thử lại.')
    } finally {
      setLoadingUserData(false)
    }
  }

  const loadSchoolNurses = async (query?: string) => {
    try {
      setLoadingNurses(true)
      const response = await api.searchSchoolNurses(1, 20, query)
      setSchoolNurses(response.pageData)
      
      // Tự động chọn nurse đầu tiên nếu chưa có nurse nào được chọn
      if (!selectedNurse && response.pageData.length > 0) {
        setSelectedNurse(response.pageData[0])
      }
    } catch (error) {
      console.error('Load school nurses error:', error)
      Alert.alert('Lỗi', 'Không thể tải danh sách y tá trường')
    } finally {
      setLoadingNurses(false)
    }
  }

  const handleNurseSearch = (query: string) => {
    setNurseSearchQuery(query)
    if (query.trim()) {
      loadSchoolNurses(query)
    } else {
      loadSchoolNurses()
    }
  }

  const selectNurse = (nurse: SchoolNurse) => {
    setSelectedNurse(nurse)
    setShowNurseModal(false)
  }

  const handleTimeSlotChange = (index: number, value: string) => {
    const newTimeSlots = [...medicine.timeSlots]
    newTimeSlots[index] = value
    setMedicine({ ...medicine, timeSlots: newTimeSlots })
  }

  const addTimeSlot = () => {
    if (medicine.timeSlots.length < 6) {
      setMedicine({
        ...medicine,
        timeSlots: [...medicine.timeSlots, '12:00']
      })
    }
  }

  const removeTimeSlot = (index: number) => {
    if (medicine.timeSlots.length > 1) {
      const newTimeSlots = medicine.timeSlots.filter((_, i) => i !== index)
      setMedicine({ ...medicine, timeSlots: newTimeSlots })
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 Submit button pressed!')
    
    // Validation
    if (!medicine.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thuốc')
      return
    }
    
    if (!medicine.endDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày kết thúc')
      return
    }

    if (new Date(medicine.endDate) <= new Date(medicine.startDate)) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu')
      return
    }

    if (!selectedNurse) {
      Alert.alert('Lỗi', 'Vui lòng chọn y tá trường')
      return
    }

    // Kiểm tra có thông tin user và student không - SỬA LẠI ĐIỀU KIỆN
    console.log('🔍 Checking data:', {
      userProfileId: userProfile?._id,
      studentDataId: studentData?._id,
      userProfile: userProfile,
      studentData: studentData
    })
    
    if (!userProfile?._id || !studentData?._id) {
      console.log('❌ Missing data - userProfile:', userProfile, 'studentData:', studentData)
      Alert.alert('Lỗi', 'Không tìm thấy thông tin học sinh. Vui lòng thử tải lại trang.')
      return
    }

    setLoading(true)
    
    try {
      const request: CreateMedicineSubmissionRequest = {
        parentId: userProfile._id,
        studentId: studentData._id,
        schoolNurseId: selectedNurse._id,
        medicines: [medicine]
      }
      
      console.log('💊 Creating medicine submission:', request)
      console.log('👨‍👩‍👧‍👦 Parent ID:', userProfile._id)
      console.log('👶 Student ID:', studentData._id)
      console.log('👩‍⚕️ Nurse ID:', selectedNurse._id)
      
      const response = await api.createMedicineSubmission(request)
      console.log('📋 API Response:', response)
      
      if (response.success) {
        Alert.alert(
          'Thành công',
          `Đơn thuốc cho ${studentData.fullName} đã được tạo thành công. Y tá trường sẽ xem xét và phê duyệt.`,
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        )
      } else {
        Alert.alert('Lỗi', response.message || 'Có lỗi xảy ra khi tạo đơn thuốc')
      }
    } catch (error: any) {
      console.error('❌ Create medicine submission error:', error)
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi tạo đơn thuốc')
    } finally {
      setLoading(false)
    }
  }

  const renderNurseItem = ({ item }: { item: SchoolNurse }) => (
    <TouchableOpacity
      style={[
        styles.nurseItem,
        selectedNurse?._id === item._id && styles.selectedNurseItem
      ]}
      onPress={() => selectNurse(item)}
    >
      <View style={styles.nurseInfo}>
        <Text style={styles.nurseName}>{item.fullName}</Text>
        <Text style={styles.nurseEmail}>{item.email}</Text>
        <Text style={styles.nursePhone}>{item.phone}</Text>
      </View>
      {selectedNurse?._id === item._id && (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          {/* Hiển thị thông tin học sinh */}
          {studentData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin học sinh</Text>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentData.fullName}</Text>
                <Text style={styles.studentDetails}>
                  Lớp: {studentData.classInfo?.name || 'N/A'} • Mã HS: {studentData.studentCode}
                </Text>
              </View>
            </View>
          )}
          
          {/* Chọn y tá trường */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Y tá trường phụ trách</Text>
            
            <TouchableOpacity 
              style={styles.nurseSelector}
              onPress={() => setShowNurseModal(true)}
            >
              <View style={styles.nurseSelectorContent}>
                {selectedNurse ? (
                  <View>
                    <Text style={styles.selectedNurseName}>{selectedNurse.fullName}</Text>
                    <Text style={styles.selectedNurseEmail}>{selectedNurse.email}</Text>
                  </View>
                ) : (
                  <Text style={styles.nursePlaceholder}>Chọn y tá trường</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Thông tin thuốc */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin thuốc</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên thuốc *</Text>
              <TextInput
                style={styles.input}
                value={medicine.name}
                onChangeText={(text) => setMedicine({ ...medicine, name: text })}
                placeholder="Nhập tên thuốc"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Liều lượng</Text>
              <TextInput
                style={styles.input}
                value={medicine.dosage}
                onChangeText={(text) => setMedicine({ ...medicine, dosage: text })}
                placeholder="Ví dụ: 1 viên, 5ml"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hướng dẫn sử dụng</Text>
              <TextInput
                style={styles.input}
                value={medicine.usageInstructions}
                onChangeText={(text) => setMedicine({ ...medicine, usageInstructions: text })}
                placeholder="Ví dụ: Uống sau ăn"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Số lượng</Text>
                <TextInput
                  style={styles.input}
                  value={medicine.quantity.toString()}
                  onChangeText={(text) => setMedicine({ ...medicine, quantity: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Số lần/ngày</Text>
                <TextInput
                  style={styles.input}
                  value={medicine.timesPerDay.toString()}
                  onChangeText={(text) => {
                    const times = parseInt(text) || 1
                    const defaultTimes = {
                      1: ['08:00'],
                      2: ['08:00', '20:00'],
                      3: ['08:00', '12:00', '20:00'],
                      4: ['08:00', '12:00', '16:00', '20:00'],
                      5: ['08:00', '11:00', '14:00', '17:00', '20:00'],
                      6: ['08:00', '10:00', '12:00', '14:00', '16:00', '20:00']
                    }
                    
                    setMedicine({
                      ...medicine,
                      timesPerDay: times,
                      timeSlots: defaultTimes[times as keyof typeof defaultTimes] || ['08:00']
                    })
                  }}
                  keyboardType="numeric"
                  placeholder="3"
                />
              </View>
            </View>
          </View>

          {/* Thời gian uống thuốc */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thời gian uống thuốc</Text>
              {medicine.timeSlots.length < 6 && (
                <TouchableOpacity onPress={addTimeSlot} style={styles.addButton}>
                  <Ionicons name="add" size={20} color="#4CAF50" />
                </TouchableOpacity>
              )}
            </View>
            
            {medicine.timeSlots.map((time, index) => (
              <View key={index} style={styles.timeSlotRow}>
                <Text style={styles.timeLabel}>Lần {index + 1}:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={(text) => handleTimeSlotChange(index, text)}
                  placeholder="HH:MM"
                />
                {medicine.timeSlots.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeTimeSlot(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="remove-circle" size={24} color="#f44336" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Thời gian điều trị */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian điều trị</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Ngày bắt đầu</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateText}>{medicine.startDate}</Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Ngày kết thúc *</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={[styles.dateText, !medicine.endDate && styles.placeholder]}>
                    {medicine.endDate || 'Chọn ngày'}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Ghi chú */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú và lý do</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={medicine.note}
                onChangeText={(text) => setMedicine({ ...medicine, note: text })}
                placeholder="Ghi chú thêm về cách sử dụng thuốc"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lý do sử dụng</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={medicine.reason}
                onChangeText={(text) => setMedicine({ ...medicine, reason: text })}
                placeholder="Lý do cần sử dụng thuốc này"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Nút submit */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Đang tạo...' : 'Tạo đơn thuốc'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal chọn y tá */}
        <Modal
          visible={showNurseModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn y tá trường</Text>
              <TouchableOpacity
                onPress={() => setShowNurseModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={nurseSearchQuery}
                onChangeText={handleNurseSearch}
                placeholder="Tìm kiếm y tá theo tên, email..."
              />
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            </View>
            
            {loadingNurses ? (
              <View style={styles.loadingContainer}>
                <Text>Đang tải...</Text>
              </View>
            ) : (
              <FlatList
                data={schoolNurses}
                renderItem={renderNurseItem}
                keyExtractor={(item) => item._id}
                style={styles.nurseList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </SafeAreaView>
        </Modal>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={new Date(medicine.startDate)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false)
              if (selectedDate) {
                setMedicine({ 
                  ...medicine, 
                  startDate: selectedDate.toISOString().split('T')[0] 
                })
              }
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={medicine.endDate ? new Date(medicine.endDate) : new Date()}
            mode="date"
            display="default"
            minimumDate={new Date(medicine.startDate)}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false)
              if (selectedDate) {
                setMedicine({ 
                  ...medicine, 
                  endDate: selectedDate.toISOString().split('T')[0] 
                })
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  // Nurse selector styles
  nurseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  nurseSelectorContent: {
    flex: 1,
  },
  selectedNurseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedNurseEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  nursePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nurseList: {
    flex: 1,
  },
  nurseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedNurseItem: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  nurseInfo: {
    flex: 1,
  },
  nurseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nurseEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  nursePhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Existing styles...
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  buttonContainer: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

const medicinePresets = [
  {
    name: 'Paracetamol',
    dosage: '1 viên',
    usageInstructions: 'Uống sau ăn',
    timesPerDay: 3,
    timeSlots: ['08:00', '12:00', '20:00']
  },
  {
    name: 'Vitamin C',
    dosage: '1 viên',
    usageInstructions: 'Uống sau ăn',
    timesPerDay: 1,
    timeSlots: ['08:00']
  },
  {
    name: 'Thuốc ho',
    dosage: '5ml',
    usageInstructions: 'Uống khi ho',
    timesPerDay: 2,
    timeSlots: ['08:00', '20:00']
  }
]

const applyPreset = (preset: any) => {
  setMedicine({
    ...medicine,
    ...preset,
    quantity: medicine.quantity // Giữ nguyên số lượng
  })
}

const commonDosages = ['1 viên', '2 viên', '5ml', '10ml', '1 gói', '1/2 viên']
const commonInstructions = [
  'Uống sau ăn',
  'Uống trước ăn',
  'Uống khi đói',
  'Uống khi cần thiết',
  'Uống trước khi ngủ'
]
const commonReasons = [
  'Sốt',
  'Đau đầu',
  'Ho',
  'Cảm lạnh',
  'Đau bụng',
  'Bổ sung vitamin'
]
{/* Preset Selection */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Chọn mẫu có sẵn (tùy chọn)</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {medicinePresets.map((preset, index) => (
      <TouchableOpacity
        key={index}
        style={styles.presetCard}
        onPress={() => applyPreset(preset)}
      >
        <Text style={styles.presetName}>{preset.name}</Text>
        <Text style={styles.presetDetails}>{preset.dosage} - {preset.timesPerDay} lần/ngày</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>

const handleMedicineNameChange = (name: string) => {
  setMedicine({ ...medicine, name })
  
  // Auto-suggest based on medicine name
  const lowerName = name.toLowerCase()
  if (lowerName.includes('paracetamol') || lowerName.includes('acetaminophen')) {
    setMedicine(prev => ({
      ...prev,
      name,
      dosage: prev.dosage || '1 viên',
      usageInstructions: prev.usageInstructions || 'Uống sau ăn',
      timesPerDay: prev.timesPerDay || 3
    }))
  }
  // Thêm các logic tương tự cho các loại thuốc khác
}