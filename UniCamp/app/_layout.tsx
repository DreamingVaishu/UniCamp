import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* All target screens inside this layout will now have hidden headers */}
    </Stack>
  );
}
