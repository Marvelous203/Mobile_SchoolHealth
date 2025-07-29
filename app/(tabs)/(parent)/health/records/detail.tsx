import { api, getVaccineTypeById, Student } from "@/lib/api";
import { HealthRecord } from "@/lib/types";
import { FontAwesome5 } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HealthRecordDetailScreen() {
  const router = useRouter();
  const { recordId, studentName, studentId, allRecordIds } =
    useLocalSearchParams<{
      recordId: string;
      studentName: string;
      studentId: string;
      allRecordIds?: string;
    }>();

  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [allHealthRecords, setAllHealthRecords] = useState<HealthRecord[]>([]);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [vaccineDetails, setVaccineDetails] = useState<{[key: string]: any}>({});
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Clone health record
  const handleCloneRecord = () => {
    setShowActionMenu(false);
    Alert.alert(
      "Sao chép hồ sơ",
      "Bạn có muốn sao chép hồ sơ sức khỏe này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Sao chép",
          onPress: () => {
            // Navigate to create screen with pre-filled data
            router.push({
              pathname: "/(tabs)/(parent)/health/records/create",
              params: {
                studentId: healthRecord?.studentId,
                cloneData: JSON.stringify({
                  vision: healthRecord?.vision || '',
                  hearing: healthRecord?.hearing || '',
                  height: healthRecord?.height || '',
                  weight: healthRecord?.weight || '',
                  chronicDiseases: healthRecord?.chronicDiseases || [],
                  allergies: healthRecord?.allergies || [],
                  pastTreatments: healthRecord?.pastTreatments || [],
                  vaccinationHistory: healthRecord?.vaccinationHistory || [],
                })
              }
            });
          }
        }
      ]
    );
  };

  // Export health record
  const handleExportRecord = async () => {
    setShowActionMenu(false);
    try {
      // Check if essential data is available
      if (!healthRecord) {
        Alert.alert("Lỗi", "Không có dữ liệu hồ sơ sức khỏe để xuất");
        return;
      }

      if (!studentInfo && !studentName) {
        Alert.alert("Lỗi", "Không có thông tin học sinh để xuất");
        return;
      }

      // Log data for debugging
      console.log('Export data check:');
      console.log('- healthRecord:', healthRecord ? 'Available' : 'NULL');
      console.log('- studentInfo:', studentInfo ? 'Available' : 'NULL');
      console.log('- studentName:', studentName || 'NULL');
      console.log('- schoolYear:', healthRecord?.schoolYear || 'NULL');
      console.log('- studentIdCode:', studentInfo?.studentIdCode || 'NULL');

      const exportData = {
        studentInfo: {
          fullName: studentInfo?.fullName || studentName || 'Không có tên',
          studentIdCode: studentInfo?.studentIdCode || 'Không có mã',
        },
        healthRecord: {
          schoolYear: healthRecord?.schoolYear || 'Không có năm học',
          vision: healthRecord?.vision || 'Chưa kiểm tra',
          hearing: healthRecord?.hearing || 'Chưa kiểm tra',
          height: healthRecord?.height || 'Chưa đo',
          weight: healthRecord?.weight || 'Chưa đo',
          chronicDiseases: healthRecord?.chronicDiseases || [],
          allergies: healthRecord?.allergies || [],
          pastTreatments: healthRecord?.pastTreatments || [],
          vaccinationHistory: healthRecord?.vaccinationHistory || [],
          createdAt: healthRecord?.createdAt || new Date().toISOString(),
          updatedAt: healthRecord?.updatedAt || new Date().toISOString(),
        },
        exportedAt: new Date().toISOString(),
        version: "1.0"
      };

      // Log export data for debugging
      console.log('Final export data:', JSON.stringify(exportData, null, 2));

      const fileName = `health_record_${studentInfo?.studentIdCode || 'unknown'}_${healthRecord?.schoolYear || 'unknown'}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Xuất hồ sơ sức khỏe'
          });
          Alert.alert("Thành công", "Đã xuất hồ sơ sức khỏe thành công!");
        } catch (shareError) {
          console.log('Share failed, offering clipboard option:', shareError);
          // If sharing fails, offer clipboard option
          Alert.alert(
            "Lỗi chia sẻ",
            "Không thể chia sẻ file. Bạn có muốn copy nội dung vào clipboard để dán vào Google Drive không?",
            [
              { text: "Hủy", style: "cancel" },
              {
                text: "Copy vào Clipboard",
                onPress: async () => {
                  await Clipboard.setString(JSON.stringify(exportData, null, 2));
                  Alert.alert("Thành công", "Đã copy nội dung hồ sơ vào clipboard. Bạn có thể dán vào Google Drive hoặc ứng dụng khác.");
                }
              }
            ]
          );
        }
      } else {
        // Fallback: offer both file save and clipboard options
        Alert.alert(
          "Chọn cách xuất",
          "Chọn phương thức xuất hồ sơ:",
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Lưu file",
              onPress: () => {
                Alert.alert(
                  "File đã được tạo", 
                  `File đã được lưu tại: ${fileUri}\n\nBạn có thể tìm file này trong thư mục Documents của ứng dụng.`
                );
              }
            },
            {
              text: "Copy vào Clipboard",
              onPress: async () => {
                await Clipboard.setString(JSON.stringify(exportData, null, 2));
                Alert.alert("Thành công", "Đã copy nội dung hồ sơ vào clipboard. Bạn có thể dán vào Google Drive hoặc ứng dụng khác.");
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert("Lỗi", "Không thể xuất hồ sơ sức khỏe");
    }
  };

  // Import health record
  const handleImportRecord = async () => {
    setShowActionMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const importData = JSON.parse(fileContent);
        
        // Validate import data structure
        if (!importData.healthRecord) {
          Alert.alert("Lỗi", "File không đúng định dạng hồ sơ sức khỏe");
          return;
        }

        Alert.alert(
          "Nhập hồ sơ",
          `Bạn có muốn nhập dữ liệu từ hồ sơ của ${importData.studentInfo?.fullName || 'học sinh'} không?\n\nLưu ý: Dữ liệu hiện tại sẽ được thay thế.`,
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Nhập",
              onPress: () => {
                // Navigate to create screen with imported data
                router.push({
                  pathname: "/(tabs)/(parent)/health/records/create",
                  params: {
                    studentId: healthRecord?.studentId,
                    importData: JSON.stringify(importData.healthRecord)
                  }
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert("Lỗi", "Không thể đọc file. Vui lòng kiểm tra định dạng file.");
    }
  };

  // Load vaccine details for vaccination history
  const loadVaccineDetails = async (vaccinationHistory: any[]) => {
    const details: {[key: string]: any} = {};
    
    for (const vaccination of vaccinationHistory) {
      if (vaccination.vaccineTypeId && !details[vaccination.vaccineTypeId]) {
        try {
          const response = await getVaccineTypeById(vaccination.vaccineTypeId);
          if (response.success && response.data) {
            details[vaccination.vaccineTypeId] = response.data;
          }
        } catch (error) {
          console.error('Error loading vaccine details:', error);
        }
      }
    }
    
    setVaccineDetails(details);
  };

  useEffect(() => {
    if (recordId) {
      loadHealthRecords();
    }
  }, [recordId]);

  const loadHealthRecords = async () => {
    try {
      setLoading(true);

      // If we have multiple record IDs, load all of them
      if (allRecordIds) {
        const recordIds: string[] = JSON.parse(allRecordIds);
        console.log("📚 Loading multiple records:", recordIds);

        const recordPromises = recordIds.map((id) =>
          api.getHealthRecordById(id)
        );
        const responses = await Promise.all(recordPromises);

        const records = responses
          .filter((response) => response.success && response.data)
          .map((response) => response.data)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setAllHealthRecords(records);

        // Set the main record (latest one)
        const mainRecord =
          records.find((r) => r._id === recordId) || records[0];
        setHealthRecord(mainRecord);
        setSelectedYear(mainRecord.schoolYear);

        // Load vaccine details for vaccination history
        if (mainRecord.vaccinationHistory && mainRecord.vaccinationHistory.length > 0) {
          loadVaccineDetails(mainRecord.vaccinationHistory);
        }

        console.log("📊 All records loaded:", records.length);
      } else {
        // Load single record (fallback)
        const response = await api.getHealthRecordById(recordId!);
        if (response.success && response.data) {
          setHealthRecord(response.data);
          setAllHealthRecords([response.data]);
          setSelectedYear(response.data.schoolYear);
          
          // Load vaccine details for vaccination history
          if (response.data.vaccinationHistory && response.data.vaccinationHistory.length > 0) {
            loadVaccineDetails(response.data.vaccinationHistory);
          }
        }
      }

      // Load student info
      if (studentId) {
        console.log("👤 Fetching student info for ID:", studentId);
        await loadStudentInfo(studentId);
      }
    } catch (error: any) {
      console.error("❌ Load health record detail error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tải chi tiết hồ sơ sức khỏe"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadStudentInfo = async (studentId: string) => {
    try {
      console.log("📚 Loading student profile for ID:", studentId);
      const studentResponse = await api.getStudentProfile(studentId);

      if (studentResponse.success && studentResponse.data) {
        setStudentInfo(studentResponse.data);
        console.log("✅ Student info loaded:", studentResponse.data);
      } else {
        console.log("⚠️ Failed to load student info:", studentResponse);
      }
    } catch (error: any) {
      console.error("❌ Load student info error:", error);
      // Don't show alert for student info error, just log it
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getHealthStatus = (record: HealthRecord) => {
    const hasIssues =
      record.chronicDiseases.length > 0 || record.allergies.length > 0;
    return hasIssues ? "Cần theo dõi" : "Tốt";
  };

  const getHealthStatusColor = (record: HealthRecord) => {
    const hasIssues =
      record.chronicDiseases.length > 0 || record.allergies.length > 0;
    return hasIssues ? "#ff7875" : "#52c41a";
  };

  const renderInfoSection = (
    title: string,
    icon: string,
    children: React.ReactNode,
    iconColor: string = "#1890ff"
  ) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name={icon as any} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const renderInfoItem = (
    label: string,
    value: string | null,
    isImportant = false
  ) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}: </Text>
      <Text
        style={[
          styles.infoValue,
          isImportant && styles.importantValue,
          !value && styles.noDataValue,
        ]}
      >
        {value || "Chưa có thông tin"}
      </Text>
    </View>
  );

  const renderListSection = (
    title: string,
    items: string[],
    icon: string,
    emptyText: string,
    iconColor: string = "#1890ff",
    itemStyle?: any
  ) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name={icon as any} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View
          style={[styles.countBadge, { backgroundColor: iconColor + "20" }]}
        >
          <Text style={[styles.countText, { color: iconColor }]}>
            {items.length}
          </Text>
        </View>
      </View>
      <View style={styles.sectionContent}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <View key={index} style={[styles.listItem, itemStyle]}>
              <FontAwesome5
                name="circle"
                size={6}
                color={iconColor}
                style={styles.bulletIcon}
              />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyListText}>{emptyText}</Text>
        )}
      </View>
    </View>
  );

  const renderVaccinationSection = (
    title: string,
    vaccinations: any[],
    icon: string,
    emptyText: string,
    iconColor: string = "#13c2c2"
  ) => (
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name={icon as any} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View
          style={[styles.countBadge, { backgroundColor: iconColor + "20" }]}
        >
          <Text style={[styles.countText, { color: iconColor }]}>
            {vaccinations.length}
          </Text>
        </View>
      </View>
      <View style={styles.sectionContent}>
        {vaccinations.length > 0 ? (
          vaccinations.map((vaccine, index) => {
            // Get vaccine details from API if available
            const vaccineDetail = vaccine.vaccineTypeId ? vaccineDetails[vaccine.vaccineTypeId] : null;
            
            // Handle both string and object formats for backward compatibility
            let vaccineName = '';
            let dateAdministered = undefined;
            let provider = undefined;
            let notes = undefined;
            
            if (typeof vaccine === 'string') {
              vaccineName = vaccine;
            } else if (typeof vaccine === 'object') {
              // Use vaccine detail name if available, otherwise fallback to existing logic
              if (vaccineDetail && vaccineDetail.name) {
                vaccineName = vaccineDetail.name;
              } else if (vaccine.vaccineName) {
                vaccineName = vaccine.vaccineName;
              } else if (vaccine._id && Object.keys(vaccine).some(key => !isNaN(Number(key)))) {
                // Reconstruct string from indexed object
                const keys = Object.keys(vaccine).filter(key => !isNaN(Number(key))).sort((a, b) => Number(a) - Number(b));
                vaccineName = keys.map(key => vaccine[key]).join('');
              } else {
                vaccineName = 'Vaccine không xác định';
              }
              
              dateAdministered = vaccine.dateAdministered || vaccine.injectedAt;
              provider = vaccine.provider;
              notes = vaccine.notes || vaccine.note;
            }
            
            return (
              <View key={index} style={[styles.listItem, { borderColor: iconColor + "30" }]}>
                <FontAwesome5
                  name="syringe"
                  size={12}
                  color={iconColor}
                  style={styles.bulletIcon}
                />
                <View style={{ flex: 1 }}>
                   <Text style={[styles.listItemText, { fontWeight: '600' }]}>{vaccineName}</Text>
                   
                   {/* Show vaccine code from API detail */}
                   {vaccineDetail && vaccineDetail.code && (
                     <Text style={[styles.listItemText, { fontSize: 12, color: '#1890ff', marginTop: 2, fontWeight: '500' }]}>
                       Mã vaccine: {vaccineDetail.code}
                     </Text>
                   )}
                   
                   {/* Show vaccine description from API detail */}
                   {vaccineDetail && vaccineDetail.description && (
                     <Text style={[styles.listItemText, { fontSize: 12, color: '#52c41a', marginTop: 2 }]}>
                       Mô tả: {vaccineDetail.description}
                     </Text>
                   )}
                   
                   {/* Show vaccine type from API detail */}
                   {vaccineDetail && vaccineDetail.type && (
                     <Text style={[styles.listItemText, { fontSize: 12, color: '#722ed1', marginTop: 2 }]}>
                       Loại: {vaccineDetail.type}
                     </Text>
                   )}
                   
                   {/* Show manufacturer from API detail */}
                   {vaccineDetail && vaccineDetail.manufacturer && (
                     <Text style={[styles.listItemText, { fontSize: 12, color: '#fa8c16', marginTop: 2 }]}>
                       Nhà sản xuất: {vaccineDetail.manufacturer}
                     </Text>
                   )}
                   
                   {dateAdministered && (
                     <Text style={[styles.listItemText, { fontSize: 12, color: '#8c8c8c', marginTop: 2 }]}>
                       Ngày tiêm: {new Date(dateAdministered).toLocaleDateString('vi-VN')}
                     </Text>
                   )}
                   {provider && (
                     <Text style={[styles.listItemText, { fontSize: 12, color: '#8c8c8c', marginTop: 2 }]}>
                       Nơi tiêm: {provider}
                     </Text>
                   )}
                   {notes && (
                     <Text style={[styles.listItemText, { fontSize: 12, color: '#8c8c8c', marginTop: 2, fontStyle: 'italic' }]}>
                       Ghi chú: {notes}
                     </Text>
                   )}
                 </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyListText}>{emptyText}</Text>
        )}
      </View>
    </View>
  );

  // Switch to different year record
  const switchToYear = (year: string) => {
    const record = allHealthRecords.find((r) => r.schoolYear === year);
    if (record) {
      setHealthRecord(record);
      setSelectedYear(year);
      
      // Load vaccine details for the new record's vaccination history
      if (record.vaccinationHistory && record.vaccinationHistory.length > 0) {
        loadVaccineDetails(record.vaccinationHistory);
      } else {
        setVaccineDetails({}); // Clear vaccine details if no vaccination history
      }
    }
  };

  // Get available years
  const getAvailableYears = () => {
    return allHealthRecords.map((r) => r.schoolYear).sort();
  };

  const renderYearSelector = () => {
    const availableYears = getAvailableYears();

    if (availableYears.length <= 1) return null;

    return (
      <View style={styles.yearSelector}>
        <Text style={styles.yearSelectorTitle}>Năm học:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.yearList}
        >
          {availableYears.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.selectedYearButton,
              ]}
              onPress={() => switchToYear(year)}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.selectedYearButtonText,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.loadingText}>Đang tải chi tiết hồ sơ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!healthRecord) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={64} color="#ff4d4f" />
          <Text style={styles.errorTitle}>Không tìm thấy hồ sơ</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#1890ff", "#69c0ff"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backIcon}
              onPress={() => router.back()}
            >
              <FontAwesome5 name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <FontAwesome5 name="book-medical" size={24} color="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Hồ Sơ Sức Khỏe</Text>
                <Text style={styles.headerSubtitle}>
                  {studentInfo?.fullName || studentName || "Đang tải..."}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getHealthStatusColor(healthRecord) },
                ]}
              >
                <FontAwesome5
                  name={
                    getHealthStatus(healthRecord) === "Tốt"
                      ? "check"
                      : "exclamation"
                  }
                  size={12}
                  color="#fff"
                />
              </View>
              
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowActionMenu(!showActionMenu)}
              >
                <FontAwesome5 name="ellipsis-v" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Action Menu */}
      {showActionMenu && (
        <>
          <TouchableOpacity
            style={styles.actionMenuOverlay}
            onPress={() => setShowActionMenu(false)}
            activeOpacity={1}
          />
          <View style={styles.actionMenu}>
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={handleCloneRecord}
          >
            <FontAwesome5 name="copy" size={16} color="#1890ff" />
            <Text style={styles.actionMenuText}>Sao chép hồ sơ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={handleExportRecord}
          >
            <FontAwesome5 name="download" size={16} color="#52c41a" />
            <Text style={styles.actionMenuText}>Xuất hồ sơ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={handleImportRecord}
          >
            <FontAwesome5 name="upload" size={16} color="#fa8c16" />
            <Text style={styles.actionMenuText}>Nhập hồ sơ</Text>
          </TouchableOpacity>
           </View>
         </>
       )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Year Selector */}
        {renderYearSelector()}

        {/* Student Information */}
        {/* {renderInfoSection(
          "Thông tin học sinh",
          "user-graduate",
          <View>
            {renderInfoItem(
              "Họ và tên",
              studentInfo?.fullName || studentName || null,
              true
            )}
            {renderInfoItem("Mã học sinh", studentInfo?.studentIdCode || null)}
            {renderInfoItem("Năm học", healthRecord.schoolYear, true)}
            {renderInfoItem(
              "Ngày tạo hồ sơ",
              formatDate(healthRecord.createdAt)
            )}
            {renderInfoItem(
              "Cập nhật lần cuối",
              formatDate(healthRecord.updatedAt)
            )}
          </View>,
          "#1890ff"
        )} */}

        {/* Thông tin tổng quan */}
        {renderInfoSection(
          "Thông tin tổng quan",
          "info-circle",
          <>
            {renderInfoItem(
              "Tên học sinh",
              studentInfo?.fullName || studentName || "Đang tải...",
              true
            )}
            {studentInfo &&
              renderInfoItem("Mã học sinh", studentInfo.studentIdCode, true)}
            {renderInfoItem("Năm học", healthRecord.schoolYear)}
            {renderInfoItem(
              "Trạng thái sức khỏe",
              getHealthStatus(healthRecord),
              true
            )}
            {renderInfoItem(
              "Cập nhật lần cuối",
              formatDate(healthRecord.updatedAt)
            )}
          </>
        )}

        {/* Thông tin thể chất */}
        {renderInfoSection(
          "Thông tin thể chất",
          "user-md",
          <>
            {renderInfoItem("Thị lực", healthRecord.vision)}
            {renderInfoItem("Thính lực", healthRecord.hearing)}
            {renderInfoItem("Chiều cao(cm)", healthRecord.height)}
            {renderInfoItem("Cân nặng(kg)", healthRecord.weight)}
          </>,
          "#52c41a"
        )}

        {/* Bệnh mãn tính */}
        {renderListSection(
          "Bệnh mãn tính",
          healthRecord.chronicDiseases,
          "heartbeat",
          "Không có bệnh mãn tính nào được ghi nhận",
          "#fa8c16",
          { backgroundColor: "#fff7e6", borderColor: "#ffd591" }
        )}

        {/* Dị ứng */}
        {renderListSection(
          "Dị ứng",
          healthRecord.allergies,
          "exclamation-triangle",
          "Không có dị ứng nào được ghi nhận",
          "#ff4d4f",
          { backgroundColor: "#fff1f0", borderColor: "#ffccc7" }
        )}

        {/* Tiền sử điều trị */}
        {renderListSection(
          "Tiền sử điều trị",
          healthRecord.pastTreatments,
          "history",
          "Chưa có tiền sử điều trị nào được ghi nhận",
          "#722ed1"
        )}

        {/* Lịch sử tiêm chủng */}
        {renderVaccinationSection(
          "Lịch sử tiêm chủng",
          healthRecord.vaccinationHistory,
          "syringe",
          "Chưa có thông tin tiêm chủng",
          "#13c2c2"
        )}

        {/* Thông tin hệ thống */}
        {renderInfoSection(
          "Thông tin hệ thống",
          "cog",
          <>
            {/* {renderInfoItem("ID hồ sơ", healthRecord._id)} */}
            {renderInfoItem("Tạo lúc", formatDate(healthRecord.createdAt))}
            {renderInfoItem("Cập nhật lúc", formatDate(healthRecord.updatedAt))}
          </>,
          "#8c8c8c"
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenu: {
    position: "absolute",
    top: 80,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    paddingVertical: 8,
    zIndex: 2,
    minWidth: 160,
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionMenuText: {
     fontSize: 14,
     color: "#262626",
     fontWeight: "500",
   },
   actionMenuOverlay: {
     position: "absolute",
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     zIndex: 1,
     backgroundColor: "transparent",
   },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 2,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#262626",
    marginLeft: 12,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionContent: {
    padding: 20,
    paddingTop: 0,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 14,
    color: "#8c8c8c",
    minWidth: 120,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    color: "#262626",
    fontWeight: "500",
    flex: 1,
  },
  importantValue: {
    fontWeight: "bold",
    color: "#1890ff",
  },
  noDataValue: {
    color: "#bfbfbf",
    fontStyle: "italic",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  bulletIcon: {
    marginTop: 6,
    marginRight: 12,
  },
  listItemText: {
    fontSize: 14,
    color: "#262626",
    flex: 1,
    lineHeight: 20,
  },
  emptyListText: {
    fontSize: 14,
    color: "#bfbfbf",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8c8c8c",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff4d4f",
    marginTop: 16,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 40,
  },
  yearSelector: {
    marginBottom: 16,
  },
  yearSelectorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 8,
  },
  yearList: {
    flexDirection: "row",
  },
  yearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#262626",
  },
  selectedYearButton: {
    backgroundColor: "#1890ff",
  },
  selectedYearButtonText: {
    color: "#fff",
  },
});
