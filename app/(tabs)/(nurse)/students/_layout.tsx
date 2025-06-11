import { Stack } from "expo-router"

export default function NurseStudentsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Students",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="student-details"
        options={{
          title: "Student Details",
          headerShown: true,
        }}
      />
    </Stack>
  )
}
