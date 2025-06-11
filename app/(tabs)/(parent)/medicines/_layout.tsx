import { Stack } from "expo-router"

export default function MedicinesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Medicines",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="submit"
        options={{
          title: "Submit Medicine",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: "Medicine Details",
          headerShown: true,
        }}
      />
    </Stack>
  )
}
