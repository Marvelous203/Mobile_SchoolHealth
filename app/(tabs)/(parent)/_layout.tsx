import ServiceFAB from "@/components/ServiceFAB";
import { FontAwesome5, Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View, Animated, TouchableOpacity, Pressable } from "react-native";
import { useRef, useEffect } from "react";

// Custom animated tab icon component with enhanced animations
const AnimatedTabIcon = ({ IconComponent, name, size, color, focused }: {
  IconComponent: any;
  name: string;
  size: number;
  color: string;
  focused: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 200,
          friction: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 8,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { rotate: rotate },
          { translateY: bounceTranslate },
        ],
        opacity: opacityAnim,
      }}
    >
      <IconComponent name={name} size={size} color={color} />
    </Animated.View>
  );
};

// Enhanced tab button with press animation
const AnimatedTabButton = ({ children, onPress, accessibilityState, style }: any) => {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      accessibilityState={accessibilityState}
    >
      <Animated.View
        style={{
          transform: [{ scale: pressAnim }],
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};

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
            zIndex: 10,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            marginTop: 2,
          },
          headerShown: false,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Trang chủ",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                IconComponent={MaterialCommunityIcons}
                name="home-variant"
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="blogs"
          options={{
            title: "Blog Y tế",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                IconComponent={MaterialCommunityIcons}
                name="newspaper-variant"
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="children"
          options={{
            title: "Con em",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                IconComponent={MaterialCommunityIcons}
                name="human-child"
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Sức khỏe",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                IconComponent={MaterialCommunityIcons}
                name="heart-pulse"
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Hồ sơ",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                IconComponent={MaterialCommunityIcons}
                name="account-circle"
                size={size}
                color={color}
                focused={focused}
              />
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
