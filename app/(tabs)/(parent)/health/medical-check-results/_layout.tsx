import { Stack } from "expo-router";

export default function MedicalCheckResultsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Kết quả khám sức khỏe",
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          title: "Chi tiết kết quả khám",
        }}
      />
    </Stack>
  );
}