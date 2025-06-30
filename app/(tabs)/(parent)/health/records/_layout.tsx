import { Stack } from "expo-router";

export default function RecordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Hồ sơ sức khỏe",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Tạo hồ sơ sức khỏe",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          title: "Chi tiết hồ sơ",
        }}
      />
    </Stack>
  );
}
