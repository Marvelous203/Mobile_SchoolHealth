import { Stack } from "expo-router"

export default function VaccinationsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Vaccination Sessions",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Session Details",
          headerShown: true,
        }}
      />
    </Stack>
  )
}