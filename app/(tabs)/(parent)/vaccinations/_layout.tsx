import { Stack } from "expo-router";

export default function VaccinationsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Vaccinations",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="consent"
        options={{
          title: "Vaccination Consent",
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: "Vaccination Details",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="event-detail"
        options={{
          title: "Chi tiết sự kiện tiêm chủng",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="registration"
        options={{
          title: "Đăng ký tiêm chủng",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
