import { Stack } from "expo-router";

export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Dịch vụ Y tế",
        }}
      />
      {/* Health Checkups */}
      <Stack.Screen
        name="checkups"
        options={{
          title: "Khám sức khỏe",
        }}
      />
      {/* Health Records */}
      <Stack.Screen
        name="records"
        options={{
          title: "Hồ sơ sức khỏe",
        }}
      />
      {/* Medical Events - existing */}
      <Stack.Screen
        name="medical-events"
        options={{
          title: "Sự kiện y tế",
        }}
      />
      {/* Medicines - existing */}
      <Stack.Screen
        name="medicines"
        options={{
          title: "Thuốc",
        }}
      />
      {/* Vaccine Results */}
      <Stack.Screen
        name="vaccine-results"
        options={{
          title: "Kết quả Vaccine",
        }}
      />
      <Stack.Screen
        name="medical-check-results"
        options={{
          title: "Kết quả khám sức khỏe",
        }}
      />
    </Stack>
  );
}
