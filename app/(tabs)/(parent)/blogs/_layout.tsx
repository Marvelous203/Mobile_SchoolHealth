import { Stack } from 'expo-router'

export default function BlogsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Blog Y tế' 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Chi tiết bài viết',
          presentation: 'card'
        }} 
      />
    </Stack>
  )
}