import { Stack } from "expo-router"

export default function VaccinationsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Vaccinations",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="consent"
        options={{
          title: "Vaccination Consent",
          headerShown: true,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: "Vaccination Details",
          headerShown: true,
        }}
      />
    </Stack>
  )
}
