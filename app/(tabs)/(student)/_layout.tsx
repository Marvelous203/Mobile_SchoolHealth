import { Stack } from "expo-router";

export default function StudentLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: true }} />
      <Stack.Screen name="health-profile" options={{ headerShown: true }} />
      <Stack.Screen name="vaccinations" options={{ headerShown: true }} />
      <Stack.Screen name="checkups" options={{ headerShown: true }} />
    </Stack>
  )
}
