import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const BUTTON_SIZE = 56;

interface FABItemProps {
  icon: React.ReactNode;
  onPress: () => void;
  position: number;
  isOpen: boolean;
}

const FABItem = ({ icon, onPress, position, isOpen }: FABItemProps) => {
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
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: "#e91e63" }]}
        onPress={onPress}
      >
        {icon}
      </TouchableOpacity>
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
    <View style={styles.container}>
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
    bottom: 80,
    right: 16,
    alignItems: "center",
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
  },
});
