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
      <Stack.Screen
        name="create-record"
        options={{
          title: "Tạo Hồ Sơ Sức Khỏe",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
