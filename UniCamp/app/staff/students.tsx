import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { getCurrentStaff } from "../../lib/getstaff";
import { supabase } from "../../lib/supabase";

export default function Students() {
    const [staff, setStaff] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        const loadStaff = async () => {
            const data = await getCurrentStaff();
            setStaff(data);
        };

        loadStaff();

    }, []);

    // Get students after staff has loaded
    useEffect(() => {
        if (!staff?.dept) return;

        const loadData = async () => {
            const { data, error } = await supabase
                .from("students")
                .select("*")
                .eq("department", staff.dept)
                .order("full_name", { ascending: true });

            if (error) {
                console.log(error);
                return;
            }

            setStudents(data || []);
        };

        loadData();
    }, [staff]);

    const handlecreate = () => {
        router.replace("/staff/form")
    }


    return (
        <SafeAreaView style={{ flex: 1}}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 20 , padding: 10}}>Students</Text>
            {students.map((student: any) => (
                <View key={student.id} style={{ padding: 10, backgroundColor: "#ccc", width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text>{student.full_name}</Text>
                </View>
            ))}
            <Pressable onPress={handlecreate} style={{ backgroundColor: "#000", padding: 20, alignItems: "center", margin: 10, borderRadius: 50, position: "absolute", bottom: 20, right: 20 }}>
                <Feather name="plus" style={{ color: "#fff" }} size={30} /></Pressable>
        </SafeAreaView>
    );
}