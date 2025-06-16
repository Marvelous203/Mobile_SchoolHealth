import { Stack } from 'expo-router'

export default function ChildrenLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Danh sách con em' 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Chi tiết học sinh',
          presentation: 'card'
        }} 
      />
    </Stack>
  )
}