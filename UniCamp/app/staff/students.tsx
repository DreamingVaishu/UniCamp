import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import StudentTopNav from "../../components/StudentTopNav";
import { getCurrentStaff } from "../../lib/getstaff";
import { supabase } from "../../lib/supabase";

export default function Students() {
    const [staff, setStaff] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editDivision, setEditDivision] = useState("");
    const [editSemester, setEditSemester] = useState("");

    useEffect(() => {
        const loadStaff = async () => {
            const data = await getCurrentStaff();
            setStaff(data);
        };

        loadStaff();
    }, []);

    // Pulled out so we can call it again after an edit or a delete
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

    useEffect(() => {
        loadStudents();
    }, [staff]);

    const handlecreate = () => {
        router.replace("/staff/form");
    };

    // Simple client side filter, good enough for a class-sized list
    const filteredStudents = students.filter((student) =>
        student.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    const openEdit = (student: any) => {
        setSelectedStudent(student);
        setEditName(student.full_name || "");
        setEditEmail(student.email || "");
        setEditDivision(student.division || "");
        setEditSemester(student.semester ? String(student.semester) : "");
        setEditModalVisible(true);
    };

    const saveEdit = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        const { error } = await supabase
            .from("students")
            .update({
                full_name: editName.trim(),
                email: editEmail.trim(),
                division: editDivision,
                semester: editSemester ? Number(editSemester) : null,
            })
            .eq("id", selectedStudent.id);

        if (error) {
            Alert.alert("Error", error.message);
            return;
        }

        setEditModalVisible(false);
        loadStudents();
    };

    const handleDelete = (student: any) => {
        Alert.alert(
            "Delete Student",
            `Remove ${student.full_name} from the department? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from("students")
                            .delete()
                            .eq("id", student.id);

                        if (error) {
                            Alert.alert("Error", error.message);
                            return;
                        }

                        loadStudents();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 20, padding: 10 }}>Students</Text>

            <StudentTopNav />

            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search student by name..."
                style={{
                    backgroundColor: "#e2e2e2",
                    borderRadius: 10,
                    padding: 12,
                    marginHorizontal: 10,
                    marginBottom: 10,
                }}
            />

            {filteredStudents.map((student: any) => (
                <View
                    key={student.id}
                    style={{
                        padding: 12,
                        marginHorizontal: 10,
                        marginBottom: 8,
                        backgroundColor: "#f2f2f2",
                        borderRadius: 10,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Text style={{ fontSize: 15 }}>{student.full_name}</Text>

                    <View style={{ flexDirection: "row", gap: 18 }}>
                        <Pressable onPress={() => openEdit(student)}>
                            <Feather name="edit-2" size={20} color="#000" />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(student)}>
                            <Feather name="trash-2" size={20} color="#c0392b" />
                        </Pressable>
                    </View>
                </View>
            ))}

            {filteredStudents.length === 0 && (
                <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
                    No students found
                </Text>
            )}

            <Pressable
                onPress={handlecreate}
                style={{
                    backgroundColor: "#000",
                    padding: 20,
                    alignItems: "center",
                    margin: 10,
                    borderRadius: 50,
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                }}
            >
                <Feather name="plus" style={{ color: "#fff" }} size={30} />
            </Pressable>

            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <View style={{ width: "85%", backgroundColor: "#fff", padding: 20, borderRadius: 10 }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Edit Student</Text>

                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Full Name"
                            style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
                        />
                        <TextInput
                            value={editEmail}
                            onChangeText={setEditEmail}
                            placeholder="Email"
                            autoCapitalize="none"
                            style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
                        />
                        <TextInput
                            value={editDivision}
                            onChangeText={setEditDivision}
                            placeholder="Division"
                            style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
                        />
                        <TextInput
                            value={editSemester}
                            onChangeText={setEditSemester}
                            placeholder="Semester"
                            keyboardType="number-pad"
                            style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }}
                        />

                        <Pressable
                            onPress={() => setEditModalVisible(false)}
                            style={{ backgroundColor: "#ccc", padding: 10, alignItems: "center", borderRadius: 5, marginBottom: 10 }}
                        >
                            <Text>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={saveEdit}
                            style={{ backgroundColor: "#000", padding: 10, alignItems: "center", borderRadius: 5 }}
                        >
                            <Text style={{ color: "#fff" }}>Save Changes</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
