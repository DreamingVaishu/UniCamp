import { router, usePathname } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

// Every screen that is part of the "student section" (Students, Attendance,
// Results) shows this same bar so staff can jump between them.
const tabs = [
  { label: "Students", path: "/staff/students" },
  { label: "Attendance", path: "/staff/attendence" },
  { label: "Results", path: "/staff/results" },
];

export default function StudentTopNav() {
  const pathname = usePathname();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#eee",
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 10,
        padding: 4,
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.path;

        return (
          <Pressable
            key={tab.path}
            onPress={() => router.replace(tab.path as any)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: active ? "#000" : "transparent",
            }}
          >
            <Text
              style={{
                color: active ? "#fff" : "#000",
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
