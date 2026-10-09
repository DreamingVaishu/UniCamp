import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '../lib/supabase';

export default function Layout() {
  // Load the icon fonts before any screen shows, so icons are never blank.
  // (If loading fails we still open the app instead of staying on a blank screen.)
  const [fontsLoaded, fontError] = useFonts({ ...Feather.font, ...MaterialCommunityIcons.font });

  // If the session ends (logout, expired), send the user back to login.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') router.replace('/autho');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!fontsLoaded && !fontError) return null;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }} /></>;
}
