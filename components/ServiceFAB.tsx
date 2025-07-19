import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BUTTON_SIZE = 56;

interface FABItemProps {
  icon: React.ReactNode;
  onPress: () => void;
  position: number;
  isOpen: boolean;
  label: string;
}

const FABItem = ({ icon, onPress, position, isOpen, label }: FABItemProps) => {
  const animation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      delay: position * 50,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [isOpen, position]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -BUTTON_SIZE * (position + 1) - 8 * position],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.fabItem,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <View style={styles.fabItemContainer}>
        <Text style={styles.fabLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: "#e91e63" }]}
          onPress={onPress}
        >
          {icon}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function ServiceFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const fabItems = [
    {
      icon: <MaterialIcons name="medical-services" size={24} color="#fff" />,
      onPress: () => router.push("/(tabs)/(parent)/health/checkups"),
      label: "Khám sức khỏe",
    },
    {
      icon: <FontAwesome5 name="syringe" size={24} color="#fff" />,
      onPress: () => router.push("/(tabs)/(parent)/vaccinations"),
      label: "Tiêm chủng",
    },
    {
      icon: <MaterialIcons name="event" size={24} color="#fff" />,
      onPress: () => router.push("/appointments/create"),
      label: "Đặt lịch hẹn",
    },
    {
      icon: <MaterialIcons name="medication" size={24} color="#fff" />,
      onPress: () => router.push("/(tabs)/(parent)/health/medicines"),
      label: "Uống thuốc",
    },
  ];

  return (
    <View style={[styles.container, { pointerEvents: 'box-none' }]}>
      {fabItems.map((item, index) => (
        <FABItem
          key={index}
          icon={item.icon}
          onPress={() => {
            item.onPress();
            setIsOpen(false);
          }}
          position={index}
          isOpen={isOpen}
          label={item.label}
        />
      ))}
      <TouchableOpacity
        style={[styles.fabButton, styles.mainButton]}
        onPress={toggleMenu}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: isOpen ? "45deg" : "0deg",
              },
            ],
          }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100, // Tăng từ 80 lên 100
    right: 16,
    alignItems: "flex-end",
  },
  fabButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainButton: {
    backgroundColor: "#4CAF50",
  },
  fabItem: {
    position: "absolute",
    right: 0,
    alignItems: "flex-end",
  },
  fabItemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fabLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: "500",
    marginRight: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});
