import React from 'react';
import { Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { C } from './theme';

type Item = [name: string, title: string, icon: React.ComponentProps<typeof Feather>['name']];

// Keep Expo Router's role-based navigation, but hide the bottom bar.
// Navigation is available from the side drawer in components/Header.tsx.
export function RoleTabs({ items, hidden = [] }: { items: Item[]; hidden?: string[] }) {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.purple,
      tabBarInactiveTintColor: '#777780',
      tabBarStyle: { display: 'none' },
    }}>
      {items.map(([name, title, icon]) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarIcon: ({ color, size }) => <Feather name={icon} size={size} color={color} />,
        }} />
      ))}
      {hidden.map(name => <Tabs.Screen key={name} name={name} options={{ href: null }} />)}
    </Tabs>
  );
}
