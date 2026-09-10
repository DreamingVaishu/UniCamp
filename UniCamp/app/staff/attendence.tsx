import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StudentTopNav from "../../components/StudentTopNav";
import { getCurrentStaff } from "../../lib/getstaff";
import { supabase } from "../../lib/supabase";

const statusOptions = ["present", "absent", "late"] as const;
const today = new Date().toISOString().slice(0, 10); 

export default function Attendence() {
    const [staff, setStaff] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);

    const [course, setCourse] = useState("");
    const [division, setDivision] = useState("");
    const [attendance, setAttendance] = useState<{ [studentId: string]: string }>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadStaff = async () => {
            const data = await getCurrentStaff();
            setStaff(data);
        };
        loadStaff();
    }, []);

    // Load every student in the department once, filter in memory below
    useEffect(() => {
        const loadStudents = async () => {
            if (!staff?.dept) return;

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

        loadStudents();
    }, [staff]);

    const filteredStudents = students.filter((student) => {
        if (course && student.course !== course) return false;
        if (division && student.division !== division) return false;
        return true;
    });

    // Whenever the filtered list changes, pull in today's existing marks
    // (if any) so re-opening the screen shows what was already recorded
    useEffect(() => {
        const loadExisting = async () => {
            const ids = filteredStudents.map((s) => s.id);
            if (ids.length === 0) return;

            const { data, error } = await supabase
                .from("attendance")
                .select("student_id, status")
                .eq("date", today)
                .in("student_id", ids);

            if (error) {
                console.log(error);
                return;
            }

            const existing: { [studentId: string]: string } = {};
            (data || []).forEach((row) => {
                existing[row.student_id] = row.status;
            });
            setAttendance((prev) => ({ ...existing, ...prev }));
        };

        loadExisting();
    }, [course, division, students]);

    const markStatus = (studentId: string, status: string) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const saveAttendance = async () => {
        const rows = filteredStudents
            .filter((student) => attendance[student.id])
            .map((student) => ({
                student_id: student.id,
                department: staff.dept,
                date: today,
                status: attendance[student.id],
                marked_by: staff.id,
            }));

        if (rows.length === 0) {
            Alert.alert("Nothing to save", "Mark at least one student first");
            return;
        }

        setSaving(true);

        const { error } = await supabase
            .from("attendance")
            .upsert(rows, { onConflict: "student_id,date" });

        setSaving(false);

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        Alert.alert("Saved", `Attendance recorded for ${rows.length} student(s)`);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 20, padding: 10 }}>Attendance</Text>

            <StudentTopNav />

            <View style={{ flexDirection: "row", marginHorizontal: 10, gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: "#eee", borderRadius: 10 }}>
                    <Picker selectedValue={course} onValueChange={setCourse}>
                        <Picker.Item label="All Courses" value="" />
                        <Picker.Item label="Bsc IT" value="Bsc IT" />
                        <Picker.Item label="BCA" value="BCA" />
                        <Picker.Item label="Nurcing" value="Nurcing" />
                        <Picker.Item label="LAW" value="LAW" />
                        <Picker.Item label="B.Tech" value="B.Tech" />
                        <Picker.Item label="MCA" value="MCA" />
                        <Picker.Item label="M.Tech" value="M.Tech" />
                    </Picker>
                </View>

                <View style={{ flex: 1, backgroundColor: "#eee", borderRadius: 10 }}>
                    <Picker selectedValue={division} onValueChange={setDivision}>
                        <Picker.Item label="All Divisions" value="" />
                        <Picker.Item label="A" value="A" />
                        <Picker.Item label="B" value="B" />
                        <Picker.Item label="C" value="C" />
                        <Picker.Item label="D" value="D" />
                    </Picker>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 100 }}>
                {filteredStudents.length === 0 && (
                    <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
                        No students match this filter
                    </Text>
                )}

                {filteredStudents.map((student) => (
                    <View
                        key={student.id}
                        style={{
                            backgroundColor: "#f2f2f2",
                            borderRadius: 10,
                            padding: 12,
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ fontSize: 15, marginBottom: 8 }}>{student.full_name}</Text>

                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {statusOptions.map((status) => {
                                const active = attendance[student.id] === status;
                                return (
                                    <Pressable
                                        key={status}
                                        onPress={() => markStatus(student.id, status)}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 8,
                                            borderRadius: 8,
                                            alignItems: "center",
                                            backgroundColor: active ? "#000" : "#ddd",
                                        }}
                                    >
                                        <Text style={{ color: active ? "#fff" : "#333", fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
                                            {status}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Pressable
                onPress={saveAttendance}
                disabled={saving}
                style={{
                    backgroundColor: "#000",
                    padding: 18,
                    alignItems: "center",
                    borderRadius: 12,
                    position: "absolute",
                    bottom: 20,
                    left: 10,
                    right: 10,
                    opacity: saving ? 0.6 : 1,
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                    {saving ? "Saving..." : "Save Attendance"}
                </Text>
            </Pressable>
        </SafeAreaView>
    );
}
