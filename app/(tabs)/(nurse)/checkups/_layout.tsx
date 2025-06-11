import { Stack } from "expo-router"

export default function CheckupsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Health Checkup Sessions",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Checkup Details",
          headerShown: true,
        }}
      />
    </Stack>
  )
}
