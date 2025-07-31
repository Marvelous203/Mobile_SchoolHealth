import { Stack } from "expo-router";

export default function MedicalEventsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Sự cố y tế",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          title: "Chi tiết Sự kiện",
        }}
      />
    </Stack>
  );
}
