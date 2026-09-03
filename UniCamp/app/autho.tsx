import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Autho() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Enter email and password");
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert("Login Failed", error.message);
      return;
    }
    const user = data.user;

    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    const { data: staff } = await supabase
      .from("staff")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (staff) {
      router.replace("/staff/home");
      return;
    }

    const { data: student } = await supabase
      .from("students")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (student) {
      router.replace("/students/home");
      return;
    }

    // Account exists in Auth but isn't registered
    await supabase.auth.signOut();

    Alert.alert(
      "Access Denied",
      "This account is not registered as a staff or student."
    );
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: 600 }}>UniCamp</Text>
      <Text style={{ fontSize: 12, fontWeight: 400 }}>your univercity app</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ backgroundColor: "#d1d8d8", margin: 10, width: 350, height: 50, borderRadius: 10, padding: 10 }}
        placeholder="Registered email"></TextInput>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ backgroundColor: "#d1d8d8", width: 350, height: 50, borderRadius: 10, padding: 10 }}
        placeholder="Password"></TextInput>
      <Pressable onPress={handleLogin} style={{ backgroundColor: "#000", paddingInline: 155, padding: 15, borderRadius: 10, margin: 10 }}><Text style={{ color: "#fff", fontWeight: 500, fontSize: 15 }}>Login</Text></Pressable>
    </View>
  );
}
