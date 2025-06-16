import { Stack } from 'expo-router'

export default function NurseLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="students" options={{ headerShown: true }} />
      <Stack.Screen name="vaccinations" options={{ headerShown: true }} />
      <Stack.Screen name="checkups" options={{ headerShown: true }} />
      <Stack.Screen name="medicines" options={{ headerShown: true }} />
      <Stack.Screen name="incidents" options={{ headerShown: true }} />
    </Stack>
  )
}
