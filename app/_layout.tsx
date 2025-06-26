import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import DeepLinkHandler from "../components/DeepLinkHandler";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <DeepLinkHandler>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          {/* Xóa dòng này: <Stack.Screen name="student-profile" options={{ headerShown: true }} /> */}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </DeepLinkHandler>
  );
}
