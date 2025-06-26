"use client";

import { useAuth } from "@/lib/auth";
import { Redirect } from "expo-router";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(tabs)/(auth)/login" />;
  }

  if (user.role === "parent") {
    return <Redirect href="/(tabs)/(parent)/home" />;
  }

  return <Redirect href="/(tabs)/(auth)/login" />;
}
