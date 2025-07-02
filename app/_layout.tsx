import { AuthProvider } from "@/lib/auth";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
