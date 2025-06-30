import { Stack } from "expo-router";

export default function AppointmentsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Lịch hẹn",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          headerShown: false,
          title: "Đặt lịch hẹn",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          title: "Chi tiết lịch hẹn",
        }}
      />
    </Stack>
  );
}
