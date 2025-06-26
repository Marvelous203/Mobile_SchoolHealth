import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Platform } from "react-native";

interface DeepLinkHandlerProps {
  children: React.ReactNode;
}

export default function DeepLinkHandler({ children }: DeepLinkHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log("🔗 Deep link received:", url);

      try {
        // Parse URL with better error handling
        const parsed = Linking.parse(url);
        const { hostname, path, queryParams } = parsed;

        console.log("🔍 Parsed URL:", {
          url,
          hostname,
          path,
          queryParams,
          platform: Platform.OS,
        });

        // Handle different URL formats:
        // 1. schoolmedical://vaccine-registration?params
        // 2. schoolmedical://medical-check-registration?params
        // 3. http://localhost:3000/vaccine-registration?params
        // 4. https://domain.com/vaccine-registration?params

        const isVaccineRegistration =
          path === "/vaccine-registration" ||
          hostname === "vaccine-registration" ||
          url.includes("vaccine-registration");

        const isMedicalCheckRegistration =
          path === "/medical-check-registration" ||
          hostname === "medical-check-registration" ||
          url.includes("medical-check-registration");

        if (isVaccineRegistration) {
          console.log("💉 Processing vaccine registration deep link");

          // Extract parameters from URL
          let params: Record<string, string> = {};

          // Try to get params from queryParams first
          if (queryParams) {
            Object.keys(queryParams).forEach((key) => {
              const value = queryParams[key];
              if (typeof value === "string") {
                params[key] = value;
              }
            });
          }

          // If no params in queryParams, try to parse from URL string
          if (Object.keys(params).length === 0 && url.includes("?")) {
            const urlParts = url.split("?");
            if (urlParts.length > 1) {
              const searchParams = new URLSearchParams(urlParts[1]);
              searchParams.forEach((value, key) => {
                params[key] = value;
              });
            }
          }

          console.log("📋 Extracted parameters:", params);

          // Build navigation route
          const routeParams = new URLSearchParams();
          if (params.eventId) routeParams.append("eventId", params.eventId);
          if (params.registrationId)
            routeParams.append("registrationId", params.registrationId);
          if (params.studentId)
            routeParams.append("studentId", params.studentId);
          if (params.parentId) routeParams.append("parentId", params.parentId);

          const paramString = routeParams.toString();
          const route = `/(tabs)/(parent)/vaccinations/registration${
            paramString ? "?" + paramString : ""
          }`;

          console.log("🚀 Navigating to route:", route);

          // Navigate with delay to ensure proper initialization
          setTimeout(() => {
            try {
              router.push(route as any);
              console.log("✅ Navigation successful");
            } catch (navError) {
              console.error("❌ Navigation error:", navError);
              Alert.alert(
                "Lỗi điều hướng",
                "Không thể mở trang xác nhận tiêm chủng. Vui lòng thử lại.",
                [{ text: "OK" }]
              );
            }
          }, 200);

          return; // Exit early after handling
        }

        if (isMedicalCheckRegistration) {
          console.log("🏥 Processing medical check registration deep link");

          // Extract parameters from URL
          let params: Record<string, string> = {};

          // Try to get params from queryParams first
          if (queryParams) {
            Object.keys(queryParams).forEach((key) => {
              const value = queryParams[key];
              if (typeof value === "string") {
                params[key] = value;
              }
            });
          }

          // If no params in queryParams, try to parse from URL string
          if (Object.keys(params).length === 0 && url.includes("?")) {
            const urlParts = url.split("?");
            if (urlParts.length > 1) {
              const searchParams = new URLSearchParams(urlParts[1]);
              searchParams.forEach((value, key) => {
                params[key] = value;
              });
            }
          }

          console.log("📋 Extracted medical check parameters:", params);

          // Build navigation route
          const routeParams = new URLSearchParams();
          if (params.registrationId)
            routeParams.append("registrationId", params.registrationId);
          if (params.eventId) routeParams.append("eventId", params.eventId);
          if (params.studentId)
            routeParams.append("studentId", params.studentId);
          if (params.parentId) routeParams.append("parentId", params.parentId);

          const paramString = routeParams.toString();
          const route = `/(tabs)/(parent)/checkups/consent/${
            params.registrationId || "new"
          }${paramString ? "?" + paramString : ""}`;

          console.log("🚀 Navigating to medical check route:", route);

          // Navigate with delay to ensure proper initialization
          setTimeout(() => {
            try {
              router.push(route as any);
              console.log("✅ Medical check navigation successful");
            } catch (navError) {
              console.error("❌ Medical check navigation error:", navError);
              Alert.alert(
                "Lỗi điều hướng",
                "Không thể mở trang xác nhận khám sức khỏe. Vui lòng thử lại.",
                [{ text: "OK" }]
              );
            }
          }, 200);

          return; // Exit early after handling
        }

        // Handle other deep links here in the future
        console.log("ℹ️ Unhandled deep link:", url);
      } catch (error) {
        console.error("❌ Deep link parsing error:", error);
        Alert.alert(
          "Lỗi liên kết",
          "Không thể xử lý liên kết này. Vui lòng thử lại.",
          [{ text: "OK" }]
        );
      }
    };

    // Handle initial URL when app is opened from deep link
    const getInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log("🚀 Initial deep link URL:", initialUrl);
          // Add delay to ensure app is fully initialized
          setTimeout(() => {
            handleDeepLink(initialUrl);
          }, 1000);
        }
      } catch (error) {
        console.error("❌ Get initial URL error:", error);
      }
    };

    // Handle URLs when app is already running
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("📱 URL event received:", event.url);
      handleDeepLink(event.url);
    });

    // Initialize
    getInitialUrl();

    // Cleanup
    return () => {
      subscription?.remove();
    };
  }, [router]);

  // Helper function to test deep linking (for development)
  const testDeepLink = (testUrl: string) => {
    console.log("🧪 Testing deep link:", testUrl);
    const parsed = Linking.parse(testUrl);
    console.log("🧪 Test result:", parsed);
  };

  // Expose test function globally for debugging
  if (__DEV__) {
    (global as any).testDeepLink = testDeepLink;
  }

  return <>{children}</>;
}
