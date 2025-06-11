import { Stack } from "expo-router"

export default function NurseIncidentsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Medical Incidents",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="record-incident"
        options={{
          title: "Record Incident",
          headerShown: true,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="incident-details"
        options={{
          title: "Incident Details",
          headerShown: true,
        }}
      />
    </Stack>
  )
}
