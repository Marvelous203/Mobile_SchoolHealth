import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { Tabs } from "expo-router"

export default function NurseLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1890ff",
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 60,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Incidents",
          tabBarIcon: ({ color }) => <FontAwesome5 name="first-aid" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vaccinations"
        options={{
          title: "Vaccines",
          tabBarIcon: ({ color }) => <FontAwesome5 name="syringe" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkups"
        options={{
          title: "Checkups",
          tabBarIcon: ({ color }) => <MaterialIcons name="health-and-safety" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-graduate" size={20} color={color} />,
        }}
      />
    </Tabs>
  )
}
