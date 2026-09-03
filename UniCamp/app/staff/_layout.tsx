import { Tabs } from "expo-router";
import Feather from "react-native-vector-icons/Feather";

export default function StaffLayout() {
  return (

    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="home"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="users"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="form"
               options={{ 
          href: null, // 👈 Hides the tab item entirely
        }} 
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="user"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: "channels",
          tabBarIcon: ({ color, size }) => (
            <Feather
              name="user"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}