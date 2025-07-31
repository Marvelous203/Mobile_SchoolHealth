import {api,CreateMedicineSubmissionRequest,MedicineItem,SchoolNurse,} from "@/lib/api";
import { checkUserPermission, showPermissionDeniedAlert, useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
} from "react-native";



// Thêm interface và helper functions mới
interface ParsedDosage {
  amount: number;
  unit: string;
  type: 'solid' | 'liquid' | 'powder'; // viên/gói vs ml/lít
}

// Hàm parse dosage thông minh với hỗ trợ phân số
const parseDosage = (dosageString: string): ParsedDosage | null => {
  if (!dosageString.trim()) return null;
  
  // Xử lý phân số đặc biệt
  let normalizedDosage = dosageString
    .replace(/½/g, '0.5')
    .replace(/¼/g, '0.25')
    .replace(/¾/g, '0.75')
    .replace(/1\/2/g, '0.5')
    .replace(/1\/4/g, '0.25')
    .replace(/3\/4/g, '0.75');
  
  // Regex để extract số và đơn vị (bao gồm số thập phân)
  const match = normalizedDosage.match(/(\d+(?:\.\d+)?)\s*(viên|ml|gói|thìa|lít|g|mg|mcg|cc)/i);
  
  if (!match) return null;
  
  const amount = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  // Kiểm tra số hợp lệ
  if (isNaN(amount) || amount <= 0) return null;
  
  // Phân loại loại thuốc
  const liquidUnits = ['ml', 'lít', 'cc'];
  const solidUnits = ['viên', 'gói', 'thìa', 'g', 'mg', 'mcg'];
  
  let type: 'solid' | 'liquid' | 'powder';
  if (liquidUnits.includes(unit)) {
    type = 'liquid';
  } else if (solidUnits.includes(unit)) {
    type = 'solid';
  } else {
    type = 'powder'; // default
  }
  
  return { amount, unit, type };
};

// Hàm tính toán quantity thông minh dựa trên loại thuốc
const calculateSmartQuantity = (dosage: string, timesPerDay: number, daysOfUse: number): number => {
  // Kiểm tra tham số đầu vào
  if (!dosage || timesPerDay <= 0 || daysOfUse <= 0) {
    return 0;
  }
  
  const parsed = parseDosage(dosage);
  
  if (!parsed) {
    // Fallback: tính theo cách cũ cho các trường hợp không parse được
    return Math.max(1, timesPerDay * daysOfUse);
  }
  
  const totalDosageNeeded = parsed.amount * timesPerDay * daysOfUse;
  
  // Đối với thuốc lỏng, thêm 10% dự phòng và làm tròn lên
  if (parsed.type === 'liquid') {
    const withBuffer = totalDosageNeeded * 1.1; // Thêm 10% dự phòng
    return Math.ceil(withBuffer);
  }
  
  // Đối với thuốc rắn (viên, gói), làm tròn lên
  return Math.ceil(totalDosageNeeded);
};

// Hàm chuyển đổi hình ảnh thành base64
const convertImageToBase64 = async (imageUri: string): Promise<string | null> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64'
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};



export default function CreateMedicineScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showCustomTimesInput, setShowCustomTimesInput] = useState(false);
  const [loadingNurses, setLoadingNurses] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [schoolNurses, setSchoolNurses] = useState<SchoolNurse[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<SchoolNurse | null>(null);
  const [nurseSearchQuery, setNurseSearchQuery] = useState("");
  const dosageSuggestions = [
    "1 viên",
    "½ viên", 
    "2 viên",
    "5ml",
    "10ml",
    "1 gói",
    "Theo chỉ định"
  ];
  const { user } = useAuth();

  // User and student data
  const [userProfile, setUserProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Multiple medicines state
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      name: "",
      dosage: "",
      usageInstructions: "",
      quantity: 1,
      timesPerDay: 1,
      timeShifts: ["morning"],
      note: "",
      reason: "",
    },
  ]);

  const [currentMedicineIndex, setCurrentMedicineIndex] = useState(0);
  
  // Thêm state cho smart calculation
  const [showDosageHelper, setShowDosageHelper] = useState(false);
  const [daysOfUse, setDaysOfUse] = useState(1);
  
  // State cho ca gửi thuốc và ảnh đơn thuốc
  const [shiftSendMedicine, setShiftSendMedicine] = useState<string>('afternoon');
  const [prescriptionImage, setPrescriptionImage] = useState<string>('');

  useEffect(() => {
    loadUserAndStudentData();
  }, []); // Chỉ gọi một lần khi component mount

  useEffect(() => {
    loadSchoolNurses();
  }, []); // Chỉ gọi một lần khi component mount

  useEffect(() => {
    // Xử lý dữ liệu tái sử dụng
    if (params.reuse === 'true') {
      loadReuseData()
    }
  }, [params.reuse]); // Chỉ khi params.reuse thay đổi

  const loadReuseData = async () => {
    try {
      const reuseDataString = await AsyncStorage.getItem('medicineReuseData')
      if (reuseDataString) {
        const reuseData = JSON.parse(reuseDataString)
        if (reuseData.medicines && Array.isArray(reuseData.medicines)) {
          // Đảm bảo timeShifts tồn tại cho các medicine đã lưu
          const processedMedicines = reuseData.medicines.map(medicine => ({
            ...medicine,
            timeShifts: medicine.timeShifts || ['morning'] // Default nếu không có timeShifts
          }))
          
          setMedicines(processedMedicines)
          console.log('✅ Reuse data loaded and processed:', processedMedicines)
        }
        // Xóa dữ liệu sau khi sử dụng
        await AsyncStorage.removeItem('medicineReuseData')
      }
    } catch (error) {
      console.error('Error loading reuse data:', error)
    }
  }

  const loadUserAndStudentData = useCallback(async () => {
    // Tránh gọi lại nếu đã có dữ liệu
    if (userProfile && students.length > 0) {
      return
    }

    try {
      setLoadingUserData(true);
      console.log("🔄 Loading user and student data...");

      // Load user profile
      const userProfileResponse = await api.getCurrentUser();
      const profile = (userProfileResponse as any).data || userProfileResponse;
      setUserProfile(profile);
      console.log("✅ User profile loaded:", profile);

      // Load all students data if available
      if (profile.studentIds && Array.isArray(profile.studentIds) && profile.studentIds.length > 0) {
        console.log("📚 Loading students data for IDs:", profile.studentIds);

        const studentPromises = profile.studentIds.map((studentId: string) =>
          api.getStudentById(studentId)
        );

        const studentResponses = await Promise.all(studentPromises);
        const loadedStudents = studentResponses.map(
          (response) => response.data || response
        );

        setStudents(loadedStudents);
        setSelectedStudent(loadedStudents[0]); // Auto-select first student
        console.log("✅ Students data loaded:", loadedStudents);
      } else {
        console.log("❌ No studentIds found in profile");
        Alert.alert(
          "Lỗi",
          "Không tìm thấy thông tin học sinh trong tài khoản của bạn."
        );
      }
    } catch (error) {
      console.error("❌ Failed to load user/student data:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải thông tin người dùng. Vui lòng thử lại."
      );
    } finally {
      setLoadingUserData(false);
    }
  }, [userProfile, students.length]); // Dependency array để tránh gọi lại không cần thiết

  const loadSchoolNurses = useCallback(async (query?: string) => {
    try {
      setLoadingNurses(true);
      const response = await api.searchSchoolNurses(1, 20, query);
      const nurses = response.pageData || [];
      setSchoolNurses(nurses);

      // Tự động chọn y tá từ reuse data chỉ khi cần thiết
      if (params.reuse === 'true' && !selectedNurse) {
        try {
          const reuseDataString = await AsyncStorage.getItem('medicineReuseData')
          if (reuseDataString) {
            const reuseData = JSON.parse(reuseDataString)
            if (reuseData.schoolNurseId) {
              const targetNurse = nurses.find(nurse => nurse._id === reuseData.schoolNurseId)
              if (targetNurse) {
                setSelectedNurse(targetNurse)
                console.log('✅ Nurse auto-selected from reuse data:', targetNurse.fullName)
                return
              }
            }
          }
        } catch (error) {
          console.error('Error setting nurse from reuse data:', error)
        }
      }

      if (!selectedNurse && nurses.length > 0) {
        setSelectedNurse(nurses[0]);
      }
    } catch (error) {
      console.error("Load school nurses error:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách y tá trường");
    } finally {
      setLoadingNurses(false);
    }
  }, [params.reuse, selectedNurse]);

  const handleNurseSearch = (query: string) => {
    setNurseSearchQuery(query);
    if (query.trim()) {
      loadSchoolNurses(query);
    } else {
      loadSchoolNurses();
    }
  };

  const selectNurse = (nurse: SchoolNurse) => {
    setSelectedNurse(nurse);
    setShowNurseModal(false);
  };

  // Helper functions for medicine management
  const getCurrentMedicine = () => medicines[currentMedicineIndex];

  // Cập nhật hàm updateCurrentMedicine với tính năng tự động tính toán
  const updateCurrentMedicine = (updates: Partial<MedicineItem>) => {
    const newMedicines = [...medicines];
    const currentMedicine = newMedicines[currentMedicineIndex];
    const updatedMedicine = {
      ...currentMedicine,
      ...updates,
    };
    
    // Tự động tính toán số lượng khi thay đổi liều lượng hoặc số lần/ngày
    if (updates.dosage !== undefined || updates.timesPerDay !== undefined) {
      const finalDosage = updates.dosage !== undefined ? updates.dosage : currentMedicine.dosage;
      const finalTimesPerDay = updates.timesPerDay !== undefined ? updates.timesPerDay : currentMedicine.timesPerDay;
      
      // Chỉ tự động tính toán nếu có đủ thông tin và liều lượng hợp lệ
      if (finalDosage && finalTimesPerDay > 0) {
        const smartQuantity = calculateSmartQuantity(
          finalDosage,
          finalTimesPerDay,
          daysOfUse
        );
        
        // Chỉ cập nhật quantity nếu tính toán thành công (> 0)
        if (smartQuantity > 0) {
          updatedMedicine.quantity = smartQuantity;
        }
      }
    }
    
    newMedicines[currentMedicineIndex] = updatedMedicine;
    setMedicines(newMedicines);
  };

  const addNewMedicine = () => {
    const newMedicine: MedicineItem = {
      name: "",
      dosage: "",
      usageInstructions: "",
      quantity: 1,
      timesPerDay: 1,
      timeShifts: ["morning"],
      note: "",
      reason: "",
    };
    setMedicines([...medicines, newMedicine]);
    setCurrentMedicineIndex(medicines.length);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      const newMedicines = medicines.filter((_, i) => i !== index);
      setMedicines(newMedicines);
      if (currentMedicineIndex >= newMedicines.length) {
        setCurrentMedicineIndex(newMedicines.length - 1);
      } else if (currentMedicineIndex > index) {
        setCurrentMedicineIndex(currentMedicineIndex - 1);
      }
    }
  };

  const isShiftAvailable = (shift: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    
    switch (shift) {
      case 'morning':
        // Ca sáng: 6h - 11h - có thể chọn nếu chưa qua 11h
        return currentHour <= 11;
      case 'afternoon':
        // Ca trưa: 11h - 15h - có thể chọn nếu chưa qua 15h
        return currentHour <= 15;
      case 'evening':
        // Ca chiều: 15h - 21h - có thể chọn nếu chưa qua 21h
        return currentHour <= 21;
      default:
        return true;
    }
  };

  const getShiftTimeRange = (shift: string) => {
    switch (shift) {
      case 'morning': return '6h - 11h';
      case 'afternoon': return '11h - 15h';
      case 'evening': return '15h - 21h';
      default: return '';
    }
  };

  const handleTimeShiftChange = (shift: string, isSelected: boolean) => {
    const currentMedicine = getCurrentMedicine();
    let newTimeShifts = [...currentMedicine.timeShifts];
    
    if (isSelected) {
      // Thêm ca nếu chưa có
      if (!newTimeShifts.includes(shift)) {
        newTimeShifts.push(shift);
      }
    } else {
      // Xóa ca nếu có
      newTimeShifts = newTimeShifts.filter(s => s !== shift);
    }
    
    // Đảm bảo ít nhất có 1 ca
    if (newTimeShifts.length === 0) {
      Alert.alert(
        'Cần chọn ít nhất 1 ca',
        'Vui lòng chọn ít nhất một ca uống thuốc.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Cập nhật timeShifts
    updateCurrentMedicine({ 
      timeShifts: newTimeShifts
    });
  };

  const getShiftDisplayName = (shift: string) => {
    const shiftNames = {
      morning: "Sáng",
      afternoon: "Trưa", 
      evening: "Chiều"
    };
    return shiftNames[shift] || shift;
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn hình ảnh');
        return;
      }

      // Show action sheet
      Alert.alert(
        'Chọn hình ảnh',
        'Bạn muốn chọn hình ảnh từ đâu?',
        [
          {
            text: 'Thư viện ảnh',
            onPress: () => pickImageFromLibrary()
          },
          {
            text: 'Chụp ảnh',
            onPress: () => takePhoto()
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi yêu cầu quyền truy cập');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        if (base64Image) {
          updateCurrentMedicine({ image: base64Image });
        } else {
          Alert.alert('Lỗi', 'Không thể chuyển đổi hình ảnh');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn hình ảnh');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        if (base64Image) {
          updateCurrentMedicine({ image: base64Image });
        } else {
          Alert.alert('Lỗi', 'Không thể chuyển đổi hình ảnh');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chụp ảnh');
    }
  };

  const handlePrescriptionImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn hình ảnh');
        return;
      }

      // Show action sheet
      Alert.alert(
        'Chọn ảnh đơn thuốc',
        'Bạn muốn chọn ảnh đơn thuốc từ đâu?',
        [
          {
            text: 'Thư viện ảnh',
            onPress: () => pickPrescriptionFromLibrary()
          },
          {
            text: 'Chụp ảnh',
            onPress: () => takePrescriptionPhoto()
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi yêu cầu quyền truy cập');
    }
  };

  const pickPrescriptionFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        if (base64Image) {
          setPrescriptionImage(base64Image);
        } else {
          Alert.alert('Lỗi', 'Không thể chuyển đổi ảnh đơn thuốc');
        }
      }
    } catch (error) {
      console.error('Error picking prescription image:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn ảnh đơn thuốc');
    }
  };

  const takePrescriptionPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        if (base64Image) {
          setPrescriptionImage(base64Image);
        } else {
          Alert.alert('Lỗi', 'Không thể chuyển đổi ảnh đơn thuốc');
        }
      }
    } catch (error) {
      console.error('Error taking prescription photo:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chụp ảnh đơn thuốc');
    }
  };

  const handleSubmit = async () => {
    console.log("🚀 Submit button pressed!");

    // Check user permission first
    if (!checkUserPermission(user)) {
      showPermissionDeniedAlert();
      return;
    }

    // Validation for all medicines
    for (let i = 0; i < medicines.length; i++) {
      const medicine = medicines[i];
      if (!medicine.name.trim()) {
        Alert.alert("Lỗi", `Vui lòng nhập tên thuốc cho thuốc thứ ${i + 1}`);
        setCurrentMedicineIndex(i);
        return;
      }
      
      // Kiểm tra số lượng ca phải bằng với timesPerDay
      if (medicine.timeShifts.length !== medicine.timesPerDay) {
        Alert.alert(
          "Lỗi", 
          `Thuốc thứ ${i + 1}: Số ca được chọn (${medicine.timeShifts.length}) phải bằng với số lần/ngày (${medicine.timesPerDay}). Vui lòng điều chỉnh lại.`
        );
        setCurrentMedicineIndex(i);
        return;
      }
      
      // Kiểm tra các ca được chọn có phù hợp với thời gian hiện tại không
      const invalidShifts = medicine.timeShifts.filter(shift => !isShiftAvailable(shift));
      if (invalidShifts.length > 0) {
        const invalidShiftNames = invalidShifts.map(shift => `${getShiftDisplayName(shift)} (${getShiftTimeRange(shift)})`);
        Alert.alert(
          "Thời gian không hợp lệ",
          `Thuốc thứ ${i + 1}: Các ca sau không phù hợp với thời gian hiện tại:\n${invalidShiftNames.join(', ')}\n\nVui lòng chọn lại các ca phù hợp.`
        );
        setCurrentMedicineIndex(i);
        return;
      }
    }

    if (!selectedNurse) {
      Alert.alert("Lỗi", "Vui lòng chọn y tá trường");
      return;
    }

    if (!userProfile?._id || !selectedStudent?._id) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin học sinh. Vui lòng thử tải lại trang."
      );
      return;
    }

    setLoading(true);

    try {
      // Format medicines data với timeShifts và image
      const formattedMedicines = medicines.map(medicine => {
        return {
          name: medicine.name,
          dosage: medicine.dosage,
          usageInstructions: medicine.usageInstructions,
          quantity: medicine.quantity,
          timesPerDay: medicine.timesPerDay,
          timeShifts: medicine.timeShifts,
          note: medicine.note,
          reason: medicine.reason,
          image: medicine.image
        };
      });

      const request: CreateMedicineSubmissionRequest = {
        parentId: userProfile._id,
        studentId: selectedStudent._id,
        schoolNurseId: selectedNurse._id,
        medicines: formattedMedicines,
        shiftSendMedicine: shiftSendMedicine,
        image: prescriptionImage,
      };

      console.log("💊 Creating medicine submission:", JSON.stringify(request, null, 2));

      const response = await api.createMedicineSubmission(request);
      console.log("📋 API Response:", response);

      if (response.success) {
        Alert.alert(
          "Thành công",
          `Đơn thuốc với ${medicines.length} loại thuốc cho ${selectedStudent.fullName} đã được tạo thành công. Y tá trường sẽ xem xét và phê duyệt.`,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Lỗi",
          response.message || "Có lỗi xảy ra khi tạo đơn thuốc"
        );
      }
    } catch (error: any) {
      console.error("❌ Create medicine submission error:", error);
      Alert.alert("Lỗi", error.message || "Có lỗi xảy ra khi tạo đơn thuốc");
    } finally {
      setLoading(false);
    }
  };

  const renderNurseItem = ({ item }: { item: SchoolNurse }) => (
    <TouchableOpacity
      style={[
        styles.nurseItem,
        selectedNurse?._id === item._id && styles.selectedNurseItem,
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
  );

  const renderMedicineTabs = () => (
    <View style={styles.medicineTabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {medicines.map((medicine, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.medicineTab,
              currentMedicineIndex === index && styles.activeMedicineTab,
            ]}
            onPress={() => setCurrentMedicineIndex(index)}
          >
            <Text
              style={[
                styles.medicineTabText,
                currentMedicineIndex === index && styles.activeMedicineTabText,
              ]}
            >
              Thuốc {index + 1}
            </Text>
            {medicine.name && (
              <Text
                style={[
                  styles.medicineTabName,
                  currentMedicineIndex === index &&
                    styles.activeMedicineTabName,
                ]}
                numberOfLines={1}
              >
                {medicine.name}
              </Text>
            )}
            {medicines.length > 1 && (
              <TouchableOpacity
                style={styles.removeMedicineButton}
                onPress={() => removeMedicine(index)}
              >
                <Ionicons name="close" size={16} color="#ff4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addMedicineTab}
          onPress={addNewMedicine}
        >
          <Ionicons name="add" size={20} color="#4CAF50" />
          <Text style={styles.addMedicineTabText}>Thêm thuốc</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const currentMedicine = getCurrentMedicine();

  if (loadingUserData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.content}>
          {/* Student Selection */}
          {students.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn học sinh</Text>
              {students.length > 1 ? (
                <View>
                  {students.map((student, index) => (
                    <TouchableOpacity
                      key={student._id}
                      style={[
                        styles.studentCard,
                        selectedStudent?._id === student._id &&
                          styles.selectedStudentCard,
                      ]}
                      onPress={() => setSelectedStudent(student)}
                    >
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {student.fullName}
                        </Text>
                        <Text style={styles.studentDetails}>
                          Lớp: {student.classInfo?.name || "N/A"} • Mã HS:{" "}
                          {student.studentIdCode}
                        </Text>
                      </View>
                      {selectedStudent?._id === student._id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#4CAF50"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{students[0].fullName}</Text>
                  <Text style={styles.studentDetails}>
                    Lớp: {students[0].classInfo?.name || "N/A"} • Mã HS:{" "}
                    {students[0].studentIdCode}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* School Nurse Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Y tá trường phụ trách</Text>
            <TouchableOpacity
              style={styles.nurseSelector}
              onPress={() => setShowNurseModal(true)}
            >
              <View style={styles.nurseSelectorContent}>
                {selectedNurse ? (
                  <View>
                    <Text style={styles.selectedNurseName}>
                      {selectedNurse.fullName}
                    </Text>
                    <Text style={styles.selectedNurseEmail}>
                      {selectedNurse.email}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.nursePlaceholder}>Chọn y tá trường</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Shift Send Medicine Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ca gửi thuốc</Text>
            <Text style={styles.helperText}>Chọn ca bạn sẽ gửi thuốc đến trường</Text>
            <View style={styles.shiftSendContainer}>
              {[
                { value: 'morning', label: 'Sáng (6h - 11h)', icon: 'sunny' },
                { value: 'afternoon', label: 'Trưa (11h - 15h)', icon: 'partly-sunny' },
                { value: 'evening', label: 'Chiều (15h - 21h)', icon: 'moon' }
              ].map((shift) => (
                <TouchableOpacity
                  key={shift.value}
                  style={[
                    styles.shiftSendButton,
                    shiftSendMedicine === shift.value && styles.shiftSendButtonSelected
                  ]}
                  onPress={() => setShiftSendMedicine(shift.value)}
                >
                  <View style={styles.shiftSendContent}>
                    <Ionicons 
                      name={shift.icon as any} 
                      size={20} 
                      color={shiftSendMedicine === shift.value ? '#4CAF50' : '#666'} 
                    />
                    <Text style={[
                      styles.shiftSendText,
                      shiftSendMedicine === shift.value && styles.shiftSendTextSelected
                    ]}>
                      {shift.label}
                    </Text>
                  </View>
                  {shiftSendMedicine === shift.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prescription Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh đơn thuốc</Text>
            <TouchableOpacity
              style={styles.prescriptionImageButton}
              onPress={handlePrescriptionImagePicker}
            >
              {prescriptionImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.imageSelectedText}>Đã chọn ảnh đơn thuốc</Text>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setPrescriptionImage('')}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons name="document-text" size={24} color="#666" />
                  <Text style={styles.imagePickerText}>Chụp ảnh đơn thuốc</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>Chụp ảnh đơn thuốc của bác sĩ để y tá dễ kiểm tra</Text>
          </View>

          {/* Medicine Tabs */}
          {renderMedicineTabs()}

          {/* Current Medicine Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Thông tin thuốc {currentMedicineIndex + 1}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên thuốc *</Text>
              <TextInput
                style={styles.input}
                value={currentMedicine.name}
                onChangeText={(text) => updateCurrentMedicine({ name: text })}
                placeholder="Nhập tên thuốc"
              />
            </View>

            {/* <View style={styles.inputGroup}>
              <Text style={styles.label}>Hình ảnh thuốc</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => handleImagePicker()}
              >
                {currentMedicine.image ? (
                  <View style={styles.imagePreviewContainer}>
                    <Text style={styles.imageSelectedText}>Đã chọn hình ảnh</Text>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => updateCurrentMedicine({ image: undefined })}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePickerContent}>
                    <Ionicons name="camera" size={24} color="#666" />
                    <Text style={styles.imagePickerText}>Chọn hình ảnh thuốc</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.helperText}>Chụp hoặc chọn hình ảnh thuốc để dễ nhận biết</Text>
            </View> */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Liều lượng</Text>
              <View style={styles.dosageContainer}>
                <TextInput
                  style={[styles.input, styles.dosageInput]}
                  value={currentMedicine.dosage}
                  onChangeText={(text) => updateCurrentMedicine({ dosage: text })}
                  placeholder="Ví dụ: 1 viên, 5ml, 2 gói"
                />
                <TouchableOpacity 
                  style={styles.helperButton}
                  onPress={() => setShowDosageHelper(!showDosageHelper)}
                >
                  <Ionicons name="help-circle" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>
              
              {showDosageHelper && (
                <View style={styles.dosageHelper}>
                  <Text style={styles.helperTitle}>Hướng dẫn nhập liều lượng:</Text>
                  <Text style={styles.helperText}>• Thuốc viên: "1 viên", "2 viên"</Text>
                  <Text style={styles.helperText}>• Thuốc lỏng: "5ml", "10ml", "1 thìa"</Text>
                  <Text style={styles.helperText}>• Thuốc bột: "1 gói", "2g"</Text>
                </View>
              )}
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.suggestionsScroll}
              >
                {dosageSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => updateCurrentMedicine({ dosage: suggestion })}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hướng dẫn sử dụng</Text>
              <TextInput
                style={styles.input}
                value={currentMedicine.usageInstructions}
                onChangeText={(text) =>
                  updateCurrentMedicine({ usageInstructions: text })
                }
                placeholder="Ví dụ: Uống sau ăn"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Số lần/ngày</Text>
                <View style={styles.radioGroup}>
                  {[1, 2, 3].map((times) => (
                    <TouchableOpacity
                      key={times}
                      style={[styles.radioButton, currentMedicine.timesPerDay === times && styles.radioButtonSelected]}
                      onPress={() => {
                        const defaultTimes = {
                          1: ["08:00"],
                          2: ["08:00", "20:00"],
                          3: ["08:00", "12:00", "20:00"],
                        };
                        
                        // Cập nhật timeShifts dựa trên số lần uống (bỏ qua validation thời gian)
                        const defaultShifts = {
                          1: ['morning'],
                          2: ['morning', 'evening'],
                          3: ['morning', 'afternoon', 'evening']
                        };
                        
                        updateCurrentMedicine({
                          timesPerDay: times,
                          timeShifts: defaultShifts[times as keyof typeof defaultShifts] || ['morning']
                        });
                      }}
                    >
                      <View style={[styles.radio, currentMedicine.timesPerDay === times && styles.radioSelected]} />
                      <Text style={styles.radioText}>{times} lần/ngày</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.radioButton, currentMedicine.timesPerDay > 3 && styles.radioButtonSelected]}
                    onPress={() => setShowCustomTimesInput(true)}
                  >
                    <View style={[styles.radio, currentMedicine.timesPerDay > 3 && styles.radioSelected]} />
                    <Text style={styles.radioText}>Khác</Text>
                  </TouchableOpacity>
                </View>
              </View>


            </View>
{/* 
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số ngày sử dụng</Text>
              <TextInput
                style={[styles.input]}
                value={daysOfUse.toString()}
                onChangeText={(text) => {
                  const days = parseInt(text) || 1;
                  setDaysOfUse(days);
                  
                  // Tự động tính toán lại số lượng khi thay đổi số ngày
                  if (currentMedicine.dosage && currentMedicine.timesPerDay > 0) {
                    const smartQuantity = calculateSmartQuantity(
                      currentMedicine.dosage,
                      currentMedicine.timesPerDay,
                      days
                    );
                    if (smartQuantity > 0) {
                      updateCurrentMedicine({ quantity: smartQuantity });
                    }
                  }
                }}
                keyboardType="numeric"
                placeholder="7"
              />
              <Text style={styles.helperText}>Số ngày dự kiến sử dụng thuốc</Text>
            </View> */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tổng số lượng cần cấp</Text>
              <TextInput
                style={[styles.input]}
                value={currentMedicine.quantity.toString()}
                onChangeText={(text) => {
                  const quantity = parseInt(text) || 0;
                  updateCurrentMedicine({ quantity });
                }}
                keyboardType="numeric"
                placeholder="15"
              />
              
 
            </View>
          </View>

          {/* Time Shifts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ca uống thuốc</Text>
            <Text style={styles.helperText}>Chọn các ca trong ngày cần uống thuốc</Text>
            
            <View style={styles.timeShiftsContainer}>
              {['morning', 'afternoon', 'evening'].map((shift) => {
                const isSelected = currentMedicine.timeShifts.includes(shift);
                return (
                  <TouchableOpacity
                    key={shift}
                    style={[
                      styles.shiftButton, 
                      isSelected && styles.shiftButtonSelected
                    ]}
                    onPress={() => handleTimeShiftChange(shift, !isSelected)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <View style={styles.shiftInfo}>
                      <Text style={[
                        styles.shiftText, 
                        isSelected && styles.shiftTextSelected
                      ]}>
                        {getShiftDisplayName(shift)}
                      </Text>
                      <Text style={styles.shiftTimeText}>
                        {getShiftTimeRange(shift)}
                      </Text>
                    </View>

                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Text style={styles.selectedShiftsText}>
              Đã chọn: {currentMedicine.timeShifts.map(shift => getShiftDisplayName(shift)).join(', ')}
            </Text>
            
            {/* Validation Status */}
            <View style={[
              styles.validationStatus,
              currentMedicine.timeShifts.length === currentMedicine.timesPerDay 
                ? styles.validationSuccess 
                : styles.validationError
            ]}>
              <Ionicons 
                name={currentMedicine.timeShifts.length === currentMedicine.timesPerDay ? "checkmark-circle" : "warning"} 
                size={16} 
                color={currentMedicine.timeShifts.length === currentMedicine.timesPerDay ? "#4CAF50" : "#ff9800"} 
              />
              <Text style={[
                styles.validationText,
                currentMedicine.timeShifts.length === currentMedicine.timesPerDay 
                  ? styles.validationTextSuccess 
                  : styles.validationTextError
              ]}>
                {currentMedicine.timeShifts.length === currentMedicine.timesPerDay 
                  ? `Đã chọn đủ ${currentMedicine.timesPerDay} ca theo yêu cầu` 
                  : `Cần chọn ${currentMedicine.timesPerDay} ca, hiện tại: ${currentMedicine.timeShifts.length} ca`
                }
              </Text>
            </View>
          </View>



          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú và lý do</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={currentMedicine.note}
                onChangeText={(text) => updateCurrentMedicine({ note: text })}
                placeholder="Ghi chú thêm về cách sử dụng thuốc"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lý do sử dụng</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={currentMedicine.reason}
                onChangeText={(text) => updateCurrentMedicine({ reason: text })}
                placeholder="Lý do cần sử dụng thuốc này"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading
                ? "Đang tạo..."
                : `Tạo đơn thuốc (${medicines.length} loại)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nurse Selection Modal */}
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
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={nurseSearchQuery}
                onChangeText={handleNurseSearch}
                placeholder="Tìm kiếm y tá theo tên, email..."
              />
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
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
              />
            )}
          </SafeAreaView>
        </Modal>


      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  radioGroup: {
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButtonSelected: {
    backgroundColor: '#f0fff4',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#4CAF50',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dosageInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  helperButton: {
    padding: 8,
    marginLeft: 8,
  },
  dosageHelper: {
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  calculationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calculationText: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
  },
  liquidWarning: {
    fontSize: 12,
    color: '#fd7e14',
    marginTop: 4,
    fontStyle: 'italic',
  },
  suggestionsScroll: {
    flexGrow: 0,
  },
  suggestionChip: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  studentInfo: {
    alignItems: "center",
  },
  studentName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: "#666",
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedStudentCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0fff4",
  },
  // Medicine tabs styles
  medicineTabsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineTab: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    position: "relative",
  },
  activeMedicineTab: {
    backgroundColor: "#4CAF50",
  },
  medicineTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  activeMedicineTabText: {
    color: "#fff",
  },
  medicineTabName: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
  },
  activeMedicineTabName: {
    color: "#fff",
  },
  removeMedicineButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addMedicineTab: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
  },
  addMedicineTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 4,
  },
  // Nurse selector styles
  nurseSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  nurseSelectorContent: {
    flex: 1,
  },
  selectedNurseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedNurseEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  nursePlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
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
  nurseList: {
    flex: 1,
  },
  nurseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedNurseItem: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  nurseInfo: {
    flex: 1,
  },
  nurseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  nurseEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  nursePhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  // Form styles
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  timeSlotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: "#666",
    width: 60,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  placeholder: {
    color: "#999",
  },
  buttonContainer: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  autoCalculationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fff4",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  autoCalculationText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 8,
    flex: 1,
  },
  smartCalculationContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  smartCalculateButton: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4CAF50",
    alignItems: "center",
  },
  smartCalculateText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "500",
  },
  autoCalculationNote: {
    fontSize: 12,
    color: "#4CAF50",
    fontStyle: "italic",
    marginTop: 4,
    backgroundColor: "#f0fff4",
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  // Time Shifts styles
  timeShiftsContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  shiftButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  shiftButtonSelected: {
    backgroundColor: "#f0fff4",
    borderColor: "#4CAF50",
  },
  shiftButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkboxDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  },
  shiftInfo: {
    flex: 1,
  },
  shiftText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  shiftTextSelected: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  shiftTextDisabled: {
    color: "#999",
  },
  shiftTimeText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  shiftTimeTextDisabled: {
    color: "#ccc",
  },
  selectedShiftsText: {
     fontSize: 12,
     color: "#666",
     fontStyle: "italic",
     marginTop: 8,
   },
   // Validation Status styles
   validationStatus: {
     flexDirection: "row",
     alignItems: "center",
     paddingVertical: 8,
     paddingHorizontal: 12,
     borderRadius: 6,
     marginTop: 8,
   },
   validationSuccess: {
     backgroundColor: "#f0fff4",
     borderWidth: 1,
     borderColor: "#4CAF50",
   },
   validationError: {
     backgroundColor: "#fff8e1",
     borderWidth: 1,
     borderColor: "#ff9800",
   },
   validationText: {
     fontSize: 12,
     marginLeft: 6,
     flex: 1,
   },
   validationTextSuccess: {
     color: "#4CAF50",
   },
   validationTextError: {
     color: "#ff9800",
   },
   // Image Picker styles
   imagePickerButton: {
     borderWidth: 1,
     borderColor: "#ddd",
     borderRadius: 8,
     paddingVertical: 16,
     paddingHorizontal: 12,
     backgroundColor: "#fff",
     borderStyle: "dashed",
   },
   imagePickerContent: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "center",
   },
   imagePickerText: {
     fontSize: 16,
     color: "#666",
     marginLeft: 8,
   },
   imagePreviewContainer: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "space-between",
   },
   imageSelectedText: {
     fontSize: 16,
     color: "#4CAF50",
     fontWeight: "500",
   },
   removeImageButton: {
     padding: 4,
   },
   // Shift Send Medicine styles
   shiftSendContainer: {
     marginTop: 8,
   },
   shiftSendButton: {
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "space-between",
     paddingVertical: 12,
     paddingHorizontal: 16,
     marginBottom: 8,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: "#ddd",
     backgroundColor: "#fff",
   },
   shiftSendButtonSelected: {
     backgroundColor: "#f0fff4",
     borderColor: "#4CAF50",
   },
   shiftSendContent: {
     flexDirection: "row",
     alignItems: "center",
     flex: 1,
   },
   shiftSendText: {
     fontSize: 16,
     color: "#333",
     marginLeft: 12,
     fontWeight: "500",
   },
   shiftSendTextSelected: {
     color: "#4CAF50",
     fontWeight: "600",
   },
   // Prescription Image styles
   prescriptionImageButton: {
     borderWidth: 1,
     borderColor: "#ddd",
     borderRadius: 8,
     paddingVertical: 16,
     paddingHorizontal: 12,
     backgroundColor: "#fff",
     borderStyle: "dashed",
     marginBottom: 8,
   },
   helperText: {
     fontSize: 12,
     color: "#666",
     fontStyle: "italic",
     marginTop: 4,
   },
});
