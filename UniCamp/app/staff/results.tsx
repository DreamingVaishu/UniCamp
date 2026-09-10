import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StudentTopNav from "../../components/StudentTopNav";

export default function Results() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 20, padding: 10 }}>Students</Text>

            <StudentTopNav />
        
            <View style={{ padding: 20 }}>
                <Text style={{ color: "#888" }}>Results will show up here.</Text>
            </View>
        </SafeAreaView>
    );
}
