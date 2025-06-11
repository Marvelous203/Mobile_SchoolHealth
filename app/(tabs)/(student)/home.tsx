import { useAuth } from "@/lib/auth"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { Link, router } from "expo-router"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function StudentHome() {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace("/(tabs)/(auth)/login")
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Student!</Text>
            <Text style={styles.schoolName}>Lincoln Elementary School</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <FontAwesome5 name="sign-out-alt" size={20} color="#f5222d" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>My Health</Text>
          <View style={styles.actionCards}>
            <Link href="/(tabs)/(student)/health-profile" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="file-medical-alt" size={24} color="#52c41a" />
                <Text style={styles.actionText}>Health Profile</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(student)/vaccinations" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <FontAwesome5 name="syringe" size={24} color="#fa8c16" />
                <Text style={styles.actionText}>Vaccinations</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/(student)/checkups" asChild>
              <TouchableOpacity style={styles.actionCard}>
                <MaterialIcons name="health-and-safety" size={24} color="#f5222d" />
                <Text style={styles.actionText}>Health Checkups</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity style={styles.actionCard}>
              <FontAwesome5 name="first-aid" size={24} color="#1890ff" />
              <Text style={styles.actionText}>First Aid Tips</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.upcomingEvents}>
          <Text style={styles.sectionTitle}>Upcoming Health Events</Text>
          <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <FontAwesome5 name="syringe" size={18} color="#fa8c16" />
              <Text style={styles.eventTitle}>Annual Flu Vaccination</Text>
            </View>
            <Text style={styles.eventDate}>October 15, 2023</Text>
            <Text style={styles.eventDescription}>
              The annual flu vaccination will be administered to all consented students. Please make sure your parent
              has submitted the consent form.
            </Text>
          </View>
          <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <FontAwesome5 name="tooth" size={18} color="#1890ff" />
              <Text style={styles.eventTitle}>Dental Screening</Text>
            </View>
            <Text style={styles.eventDate}>November 5, 2023</Text>
            <Text style={styles.eventDescription}>
              A dental professional will conduct a basic dental examination to check for cavities and other dental
              issues.
            </Text>
          </View>
        </View>

        <View style={styles.healthTips}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <FontAwesome5 name="hand-sparkles" size={18} color="#52c41a" />
              <Text style={styles.tipTitle}>Proper Hand Washing</Text>
            </View>
            <Text style={styles.tipDescription}>
              Remember to wash your hands with soap and water for at least 20 seconds, especially before eating and
              after using the restroom.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <FontAwesome5 name="apple-alt" size={18} color="#f5222d" />
              <Text style={styles.tipTitle}>Healthy Eating</Text>
            </View>
            <Text style={styles.tipDescription}>
              Try to include fruits and vegetables in every meal. They provide essential vitamins and minerals that help
              your body grow strong.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <FontAwesome5 name="running" size={18} color="#1890ff" />
              <Text style={styles.tipTitle}>Stay Active</Text>
            </View>
            <Text style={styles.tipDescription}>
              Aim for at least 60 minutes of physical activity every day. This can include playing sports, riding a
              bike, or just running around with friends.
            </Text>
          </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  logoutText: {
    color: "#f5222d",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
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
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
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
  upcomingEvents: {
    padding: 20,
    paddingTop: 0,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  healthTips: {
    padding: 20,
    paddingTop: 0,
  },
  tipCard: {
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
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
})
