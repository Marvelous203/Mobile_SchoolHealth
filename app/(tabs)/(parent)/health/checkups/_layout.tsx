import { Stack } from "expo-router";

export default function CheckupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Khám sức khỏe",
        }}
      />
      <Stack.Screen
        name="registration"
        options={{
          title: "Đăng ký khám sức khỏe",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="detail"
        options={{
          title: "Chi tiết sự kiện khám",
        }}
      />
    </Stack>
  );
}
