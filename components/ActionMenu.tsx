import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50;

type ServiceOption = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
};

const SERVICES: ServiceOption[] = [
  {
    id: "appointment",
    icon: "calendar",
    label: "Đặt lịch hẹn",
    route: "/appointments/create",
    color: "#4CAF50",
  },
  {
    id: "vaccine",
    icon: "shield-checkmark",
    label: "Đăng ký tiêm chủng",
    route: "/vaccinations/registration",
    color: "#2196F3",
  },
  {
    id: "health-check",
    icon: "fitness",
    label: "Đăng ký khám sức khỏe",
    route: "/checkups/booking",
    color: "#9C27B0",
  },
  {
    id: "medicine",
    icon: "medical",
    label: "Gửi thuốc",
    route: "/medicines/submit",
    color: "#FF9800",
  },
];

interface ActionMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ isVisible, onClose }) => {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const active = useSharedValue(false);

  const scrollTo = useCallback((destination: number) => {
    "worklet";
    active.value = destination !== 0;
    translateY.value = withSpring(destination, { damping: 50 });
  }, []);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      translateY.value = Math.max(MAX_TRANSLATE_Y, translateY.value);
    })
    .onEnd(() => {
      if (translateY.value > -SCREEN_HEIGHT / 3) {
        scrollTo(0);
      } else if (translateY.value < -SCREEN_HEIGHT / 1.5) {
        scrollTo(MAX_TRANSLATE_Y);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y],
      [25, 5],
      Extrapolate.CLAMP
    );

    return {
      borderRadius,
      transform: [{ translateY: translateY.value }],
    };
  });

  React.useEffect(() => {
    if (isVisible) {
      scrollTo(-SCREEN_HEIGHT / 2);
    } else {
      scrollTo(0);
    }
  }, [isVisible, scrollTo]);

  const handleServicePress = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Reanimated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
        <View style={styles.line} />
        <Text style={styles.title}>Dịch vụ y tế</Text>
        <View style={styles.servicesGrid}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceItem}
              onPress={() => handleServicePress(service.route)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: service.color },
                ]}
              >
                <Ionicons name={service.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Reanimated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    height: SCREEN_HEIGHT,
    width: "100%",
    backgroundColor: "white",
    position: "absolute",
    top: SCREEN_HEIGHT,
    borderRadius: 25,
    zIndex: 999,
  },
  line: {
    width: 75,
    height: 4,
    backgroundColor: "grey",
    alignSelf: "center",
    marginVertical: 15,
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  serviceItem: {
    width: "45%",
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
});

export default ActionMenu;
