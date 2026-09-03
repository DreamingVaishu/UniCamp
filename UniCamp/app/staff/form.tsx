import { supabase } from "@/lib/supabase";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";


export default function Form() {
    const [department, setDepartment] = useState("");
    const [course, setCourse] = useState("");
    const [division, setDivision] = useState("");
    const [semester, setSemester] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Check fields
        if (
            !fullName.trim() ||
            !email.trim() ||
            !department ||
            !course ||
            !division ||
            !semester
        ) {
            Alert.alert(
                "Missing Information",
                "Please fill in all student details."
            );
            return;
        }

        try {
            setLoading(true);

            const { data, error } =
                await supabase.functions.invoke(
                    "provision-account",
                    {
                        body: {
                            full_name: fullName.trim(),
                            email: email.trim(),
                            department: department,
                            course: course,
                            division: division,
                            semester: Number(semester),
                        },
                    }
                );

            if (error) {
                console.log(
                    "Create student error:",
                    error
                );

                Alert.alert(
                    "Error",
                    error.message
                );

                return;
            }

            console.log(
                "Created student:",
                data
            );

            Alert.alert(
                "Student Created",
                `Student ${fullName} has been created successfully.`
            );

            // Clear form
            setFullName("");
            setEmail("");
            setDepartment("");
            setCourse("");
            setDivision("");
            setSemester("");

        } catch (error) {
            console.log(
                "Unexpected error:",
                error
            );

            Alert.alert(
                "Error",
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
        >
            <ScrollView
                contentContainerStyle={{
                    padding: 15,
                    alignItems: "center",
                    paddingBottom: 120,
                }}
            >

                <Text
                    style={{
                        margin: 10,
                        fontSize: 20,
                        fontWeight: "500",
                        marginBottom: 40,
                        textAlign: "center",
                    }}
                >
                    Student Form
                </Text>

                {/* Student Name */}

                <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Student Name"
                    style={{
                        padding: 15,
                        width: "100%",
                        height: 50,
                        backgroundColor: "#c5c4c4",
                        borderRadius: 10,
                        marginBottom: 15,
                    }}
                />

                {/* Student Email */}

                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Student Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                        padding: 15,
                        width: "100%",
                        height: 50,
                        backgroundColor: "#c5c4c4",
                        borderRadius: 10,
                        marginBottom: 15,
                    }}
                />

                {/* Department */}

                <View
                    style={{
                        width: "100%",
                        backgroundColor: "#c5c4c4",
                        borderRadius: 10,
                        marginBottom: 15,
                    }}
                >
                    <Picker
                        selectedValue={department}
                        onValueChange={(value) =>
                            setDepartment(value)
                        }
                    >
                        <Picker.Item
                            label="Select Department"
                            value=""
                        />

                        <Picker.Item
                            label="Dept of CS & IT"
                            value="Dept of CS & IT"
                        />

                        <Picker.Item
                            label="Dept of management"
                            value="Dept of management"
                        />

                        <Picker.Item
                            label="Dept of Law"
                            value="Dept of Law"
                        />

                        <Picker.Item
                            label="Dept of Science"
                            value="Dept of Science"
                        />

                        <Picker.Item
                            label="Dept of nurcing"
                            value="Dept of nurcing"
                        />
                    </Picker>
                </View>

                {/* Course */}

                <View
                    style={{
                        width: "100%",
                        backgroundColor: "#c5c4c4",
                        borderRadius: 10,
                        marginBottom: 15,
                    }}
                >
                    <Picker
                        selectedValue={course}
                        onValueChange={(value) =>
                            setCourse(value)
                        }
                    >
                        <Picker.Item
                            label="Select Course"
                            value=""
                        />

                        <Picker.Item
                            label="Bsc IT"
                            value="Bsc IT"
                        />

                        <Picker.Item
                            label="BCA"
                            value="BCA"
                        />

                        <Picker.Item
                            label="Nurcing"
                            value="Nurcing"
                        />

                        <Picker.Item
                            label="LAW"
                            value="LAW"
                        />

                        <Picker.Item
                            label="B.Tech"
                            value="B.Tech"
                        />

                        <Picker.Item
                            label="MCA"
                            value="MCA"
                        />

                        <Picker.Item
                            label="M.Tech"
                            value="M.Tech"
                        />
                    </Picker>
                </View>

                {/* Division */}

                <View
                    style={{
                        width: "100%",
                        backgroundColor: "#c5c4c4",
                        borderRadius: 10,
                        marginBottom: 15,
                    }}
                >
                    <Picker
                        selectedValue={division}
                        onValueChange={(value) =>
                            setDivision(value)
                        }
                    >
                        <Picker.Item
                            label="Select Division"
                            value=""
                        />

                        <Picker.Item
                            label="A"
                            value="A"
                        />

                        <Picker.Item
                            label="B"
                            value="B"
                        />

                        <Picker.Item
                            label="C"
                            value="C"
                        />

                        <Picker.Item
                            label="D"
                            value="D"
                        />
                    </Picker>
                </View>

                {/* Semester */}

                <View
                    style={{
                        width: "100%",
                        backgroundColor: "#c5c4c4",
                        borderRadius: 10,
                        marginBottom: 15,
                    }}
                >
                    <Picker
                        selectedValue={semester}
                        onValueChange={(value) =>
                            setSemester(value)
                        }
                    >
                        <Picker.Item
                            label="Select Semester"
                            value=""
                        />

                        <Picker.Item
                            label="Semester 1"
                            value="1"
                        />

                        <Picker.Item
                            label="Semester 2"
                            value="2"
                        />

                        <Picker.Item
                            label="Semester 3"
                            value="3"
                        />

                        <Picker.Item
                            label="Semester 4"
                            value="4"
                        />

                        <Picker.Item
                            label="Semester 5"
                            value="5"
                        />

                        <Picker.Item
                            label="Semester 6"
                            value="6"
                        />

                        <Picker.Item
                            label="Semester 7"
                            value="7"
                        />

                        <Picker.Item
                            label="Semester 8"
                            value="8"
                        />
                    </Picker>
                </View>

            </ScrollView>

            {/* Submit Button */}

            <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={{
                    backgroundColor: "#000",
                    padding: 20,
                    alignItems: "center",
                    margin: 10,
                    borderRadius: 50,
                    position: "absolute",
                    bottom: 20,
                    width: "80%",
                    alignSelf: "center",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 50,
                    opacity: loading ? 0.6 : 1,
                }}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Text
                            style={{
                                color: "#fff",
                            }}
                        >
                            Submit Student
                        </Text>

                        <Feather
                            name="arrow-right"
                            color="#fff"
                            size={30}
                        />
                    </>
                )}
            </Pressable>
        </SafeAreaView>
    );
}