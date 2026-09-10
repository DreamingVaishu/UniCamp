import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function Home() {
  const [student, setStudent] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const loadStudent = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setStudent(data);
    };

    loadStudent();
  }, []);

  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!student?.department) return;

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("department", student.department)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Announcements error:", error);
        return;
      }

      setAnnouncements(data || []);
    };

    loadAnnouncements();
  }, [student]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 15 }}>Welcome!</Text>
        <Text style={{ fontSize: 25, fontWeight: "500", marginBottom: 20 }}>
          {student?.full_name}
        </Text>

        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Announcements</Text>

        {announcements.length === 0 && (
          <Text style={{ color: "#888" }}>No announcements yet</Text>
        )}

        {announcements.map((item) => (
          <View key={item.id} style={{ backgroundColor: "#f2f2f2", padding: 15, borderRadius: 10, marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.title}</Text>
            <Text style={{ color: "#444", marginTop: 5 }}>{item.message}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
