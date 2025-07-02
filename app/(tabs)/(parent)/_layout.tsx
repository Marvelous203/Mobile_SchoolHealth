import ServiceFAB from "@/components/ServiceFAB";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

export default function ParentLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#1890ff",
          tabBarInactiveTintColor: "#8c8c8c",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10, // Giảm font size để vừa 5 tabs
            fontWeight: "500",
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Trang chủ",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="children"
          options={{
            title: "Con em",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="child" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Sức khỏe",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons
                name="health-and-safety"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="blogs"
          options={{
            title: "Blog Y tế",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="article" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Hồ sơ",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            href: null,
          }}
        />
        {/* Ẩn các tabs không cần thiết */}
        <Tabs.Screen
          name="checkups"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="medicines"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="vaccinations"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="student-detail"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <ServiceFAB />
    </View>
  );
}
