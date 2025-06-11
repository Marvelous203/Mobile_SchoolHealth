import { Stack } from "expo-router"

export default function NurseMedicinesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Medicine Management",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="daily-schedule"
        options={{
          title: "Daily Medicine Schedule",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="administer"
        options={{
          title: "Administer Medicine",
          headerShown: true,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: "Medicine History",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="submissions"
        options={{
          title: "Medicine Submissions",
          headerShown: true,
        }}
      />
    </Stack>
  )
}
