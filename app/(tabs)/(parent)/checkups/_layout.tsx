import { Stack } from "expo-router"

export default function CheckupsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Health Checkups",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="consent/[id]"
        options={{
          title: "Checkup Consent",
          headerShown: true,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="results/[id]"
        options={{
          title: "Checkup Results",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="booking"
        options={{
          title: "Book Consultation",
          headerShown: true,
          presentation: "modal",
        }}
      />
    </Stack>
  )
}
