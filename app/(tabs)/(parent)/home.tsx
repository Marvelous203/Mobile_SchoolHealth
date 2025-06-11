"use client"

import { useAuth } from "@/lib/auth"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { Link } from "expo-router"
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ParentHome() {
  const { user, logout } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name || "Parent"}!</Text>
              <Text style={styles.schoolName}>Lincoln Elementary School</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <MaterialIcons name="logout" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.childSection}>
          <Text style={styles.sectionTitle}>Your Child</Text>
          <View style={styles.childCard}>
            <Image source={{ uri: "https://via.placeholder.com/60" }} style={styles.childAvatar} />
            <View style={styles.childInfo}>
              <Text style={styles.childName}>John Doe</Text>
              <Text style={styles.childClass}>Class 5A</Text>
              <View style={styles.healthStatus}>
                <View style={[styles.statusIndicator, styles.statusGood]} />
                <Text style={styles.statusText}>Health Status: Good</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionCards}>
            <Link href="/(tabs)/(parent)/medicines/submit" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="pills" size={24} color="#1890ff" />
                <Text style={styles.actionText}>Submit Medicine</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(parent)/health-profile" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="file-medical-alt" size={24} color="#52c41a" />
                <Text style={styles.actionText}>Health Profile</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(parent)/vaccinations" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="syringe" size={24} color="#fa8c16" />
                <Text style={styles.actionText}>Vaccinations</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(parent)/checkups" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <MaterialIcons name="health-and-safety" size={24} color="#f5222d" />
                <Text style={styles.actionText}>Health Checkups</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.alerts}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <FontAwesome5 name="exclamation-circle" size={18} color="#f5222d" />
              <Text style={styles.alertTitle}>Vaccination Consent Required</Text>
            </View>
            <Text style={styles.alertDescription}>
              Annual flu vaccination is scheduled for October 15. Please provide your consent.
            </Text>
            <Link href="/(tabs)/(parent)/vaccinations/consent?id=1" asChild>
              <TouchableOpacity style={styles.alertButton}>
                <Text style={styles.alertButtonText}>Review & Consent</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <FontAwesome5 name="exclamation-circle" size={18} color="#faad14" />
              <Text style={styles.alertTitle}>Health Checkup Scheduled</Text>
            </View>
            <Text style={styles.alertDescription}>
              Annual health checkup is scheduled for September 20. Please provide your consent.
            </Text>
            <Link href="/(tabs)/(parent)/checkups/consent?id=1" asChild>
              <TouchableOpacity style={[styles.alertButton, styles.yellowButton]}>
                <Text style={styles.alertButtonText}>Review & Consent</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.healthUpdates}>
          <Text style={styles.sectionTitle}>Health Updates</Text>
          <View style={styles.updateCard}>
            <Text style={styles.updateTitle}>Latest Health Checkup</Text>
            <Text style={styles.updateDate}>September 5, 2023</Text>
            <View style={styles.updateDetail}>
              <Text style={styles.updateLabel}>Height:</Text>
              <Text style={styles.updateValue}>135 cm</Text>
            </View>
            <View style={styles.updateDetail}>
              <Text style={styles.updateLabel}>Weight:</Text>
              <Text style={styles.updateValue}>32 kg</Text>
            </View>
            <View style={styles.updateDetail}>
              <Text style={styles.updateLabel}>Vision:</Text>
              <Text style={styles.updateValue}>20/20 (Normal)</Text>
            </View>
            <Link href="/(tabs)/(parent)/checkups/results?id=1" asChild>
              <TouchableOpacity style={styles.viewMoreButton}>
                <Text style={styles.viewMoreText}>View Full Report</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.schoolInfo}>
          <Text style={styles.sectionTitle}>School Health Resources</Text>
          <TouchableOpacity style={styles.resourceItem}>
            <MaterialIcons name="article" size={20} color="#1890ff" />
            <Text style={styles.resourceText}>School Health Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <MaterialIcons name="event" size={20} color="#1890ff" />
            <Text style={styles.resourceText}>Vaccination Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <MaterialIcons name="people" size={20} color="#1890ff" />
            <Text style={styles.resourceText}>Meet Our Health Team</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
  },
  schoolName: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  childSection: {
    padding: 20,
  },
  childCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: "600",
  },
  childClass: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  healthStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusGood: {
    backgroundColor: "#52c41a",
  },
  statusText: {
    fontSize: 14,
    color: "#52c41a",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  quickActions: {
    padding: 20,
  },
  actionCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  alerts: {
    padding: 20,
  },
  alertCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  alertDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  alertButton: {
    backgroundColor: "#f5222d",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  yellowButton: {
    backgroundColor: "#faad14",
  },
  alertButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  healthUpdates: {
    padding: 20,
  },
  updateCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  updateDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  updateDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  updateLabel: {
    fontSize: 14,
    color: "#666",
  },
  updateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  viewMoreButton: {
    marginTop: 10,
    alignItems: "center",
  },
  viewMoreText: {
    color: "#1890ff",
    fontWeight: "500",
  },
  schoolInfo: {
    padding: 20,
    paddingBottom: 40,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
})
