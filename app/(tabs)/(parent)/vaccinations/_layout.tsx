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
      {/* <Stack.Screen
        name="details"
        options={{
          title: "Vaccination Details",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="event-detail"
        options={{
          title: "Event Detail",
          headerShown: false,
        }}
      /> */}
      <Stack.Screen
        name="registration-detail"
        options={{
          title: "Registration Detail",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
