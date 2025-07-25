import { Stack } from "expo-router"

export default function VaccineResultsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="detail" />
    </Stack>
  )
}