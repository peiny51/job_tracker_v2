import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import { Stack } from "expo-router";

import {
  configureApi
} from "@job-tracker/shared";


// Configure the shared API client once when the mobile app starts.
configureApi(
  process.env.EXPO_PUBLIC_API_URL
    ?? "http://10.0.2.2:5270"
);


// One QueryClient is shared by the entire app.
// It stores query caches and coordinates refetching/invalidation.
const queryClient = new QueryClient();


export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false
        }}
      />
    </QueryClientProvider>
  );
}