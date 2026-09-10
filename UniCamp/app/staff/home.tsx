import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { getCurrentStaff } from "../../lib/getstaff";
import { supabase } from "../../lib/supabase";

export default function Home() {
  const [staff, setStaff] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadStaff = async () => {
      const data = await getCurrentStaff();
      console.log("Staff:", data);
      setStaff(data);
    };

    loadStaff();
  }, []);

  // Pulled out so we can call it again right after posting
  const loadAnnouncements = async () => {
    if (!staff?.dept) return;

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("department", staff.dept)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Announcements error:", error);
      return;
    }

    setAnnouncements(data || []);
  };

  useEffect(() => {
    loadAnnouncements();
  }, [staff]);

  const postAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please add a title and a message");
      return;
    }

    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      description: message.trim(),
      department: staff.dept,
      created_by: staff.id,
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setTitle("");
    setMessage("");
    setModalVisible(false);
    loadAnnouncements();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 40 }}>
        <View style={{ margin: 10 }}>
          <Text style={{ fontSize: 15 }}>Welcome!</Text>
          <Text style={{ fontSize: 25, fontWeight: "500" }}>{staff?.username}</Text>
        </View>

        <View style={{ flexDirection: "row", padding: 10, backgroundColor: "#0c4a90", borderRadius: 10, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#9b9b9b", width: 140, marginRight: 10, height: 200, borderRadius: 8 }}></View>
          <View style={{ width: 200, height: 200, backgroundColor: "#4461c150", position: "absolute", bottom: -25, right: -25, borderRadius: 100 }}></View>
          <View style={{ flexDirection: "column" }}>
            <Text style={{ color: "#c3c3c3" }}>name</Text>
            <Text style={{ color: "#fff", fontSize: 20 }}>{staff?.username}</Text>
            <Text style={{ color: "#c3c3c3" }}>Staff ID</Text>
            <Text style={{ color: "#fff", fontSize: 20 }}>{staff?.staff_id}</Text>
            <Text style={{ color: "#c3c3c3" }}>Employe ID</Text>
            <Text style={{ color: "#fff", fontSize: 20 }}>{staff?.employee_number}</Text>
            <Text style={{ color: "#c3c3c3" }}>Department</Text>
            <Text style={{ color: "#fff", fontSize: 20 }}>{staff?.dept}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 25, paddingHorizontal: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Announcements</Text>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={{ backgroundColor: "#000", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Feather name="plus" color="#fff" size={16} />
            <Text style={{ color: "#fff", marginLeft: 5, fontWeight: "500" }}>New</Text>
          </Pressable>
        </View>

        {announcements.length === 0 && (
          <Text style={{ color: "#888", padding: 10 }}>No announcements yet</Text>
        )}

        {announcements.map((item) => (
          <View key={item.id} style={{ backgroundColor: "#f2f2f2", padding: 15, borderRadius: 10, marginHorizontal: 10, marginTop: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.title}</Text>
            <Text style={{ color: "#444", marginTop: 5 }}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: "85%", backgroundColor: "#fff", padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>New Announcement</Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
            />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Write your announcement..."
              multiline
              numberOfLines={4}
              style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5, height: 100, textAlignVertical: "top" }}
            />

            <Pressable
              onPress={() => setModalVisible(false)}
              style={{ backgroundColor: "#ccc", padding: 10, alignItems: "center", borderRadius: 5, marginBottom: 10 }}
            >
              <Text>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={postAnnouncement}
              style={{ backgroundColor: "#000", padding: 10, alignItems: "center", borderRadius: 5 }}
            >
              <Text style={{ color: "#fff" }}>Publish</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
