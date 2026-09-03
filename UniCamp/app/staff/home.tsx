import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentStaff } from "../../lib/getstaff";

export default function Home() {
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    const loadStaff = async () => {
      const data = await getCurrentStaff();

      console.log("Staff:", data);

      setStaff(data);
    };

    loadStaff();
  }, []);

  return (
    <SafeAreaView style={{flex: 1}}>
      <View>
        <Text style={{}}>welcome ! {staff?.username}</Text>
      </View>
    </SafeAreaView>
  );
}