import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerStyle: { backgroundColor: "#0F766E" }, headerTintColor: "white" }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
