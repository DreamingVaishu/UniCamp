import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentStaff } from "../../lib/getstaff";

export default function Channels() {
    const [staff, setStaff] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    // const [loading, setLoading] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [channeljoin, setChanneljoin] = useState<any[]>([]);
    const [notJoinedChannels, setNotJoinedChannels] = useState<any[]>([]);

    useEffect(() => {
        const loadStaff = async () => {
            const data = await getCurrentStaff();

            if (!data) {
                console.log("Staff not found");
                return;
            }

            setStaff(data);
        };

        loadStaff();
    }, []);

    const loadinchannel = async () => {
        // if (!staff?.dept) return(
        //     return(
        //         <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        //             <Text style={{ fontSize: 18, color: "#5f5f5f" }}>Loading channels...</Text>
        //         </SafeAreaView>
        //     );
        // );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            console.log("User not logged in");
            return;
        }

        const { data: channelsdata, error: channelError } =
            await supabase
                .from("channels")
                .select("*")
                .eq("department", staff.dept);

        if (channelError) {
            console.log("Channel error:", channelError);
            return;
        }

        const { data: memberData, error: memberError } =
            await supabase
                .from("channel_members")
                .select("channel_id")
                .eq("user_id", user.id);

        if (memberError) {
            console.log("Member error:", memberError);
            return;
        }

        const idwhicharejoined = (memberData || []).map(
            (member) => member.channel_id
        );

        const joined = (channelsdata || []).filter(
            (channel) => idwhicharejoined.includes(channel.id)
        );

        const notJoined = (channelsdata || []).filter(
            (channel) => !idwhicharejoined.includes(channel.id)
        );

        setChannels(channelsdata || []);
        setChanneljoin(joined);
        setNotJoinedChannels(notJoined);
    };
    useEffect(() => {
        if (!staff?.dept) return;

        loadinchannel();
    }, [staff]);
    const createChannel = async () => {
        if (!name.trim() || !description.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        if (!staff?.dept) {
            Alert.alert("Error", "Staff department not found");
            return;
        }

        try {
            // setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                Alert.alert("Error", "User is not logged in");
                return;
            }


            const { data: channel, error: channelError } =
                await supabase
                    .from("channels")
                    .insert({
                        name: name.trim(),
                        description: description.trim(),
                        created_by: user.id,
                        department: staff.dept,
                    })
                    .select()
                    .single();

            if (channelError) {
                console.log("Channel creation error:", channelError);

                Alert.alert(
                    "Error",
                    channelError.message
                );

                return;
            }

            console.log("Channel created:", channel);


            const { error: memberError } = await supabase
                .from("channel_members")
                .insert({
                    channel_id: channel.id,
                    user_id: user.id,
                });

            if (memberError) {
                console.log(
                    "Member creation error:",
                    memberError
                );

                Alert.alert(
                    "Error",
                    memberError.message
                );

                return;
            }
            Alert.alert(
                "Success",
                "Channel created successfully"
            );


            setName("");
            setDescription("");
            setModalVisible(false);

        } catch (error) {
            console.log("Create channel error:", error);

            Alert.alert(
                "Error",
                "Something went wrong"
            );

        } finally {
            // setLoading(false);
        }
    };

    const Channeljoin = async (channelId: string) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            Alert.alert("Error", "You are not logged in");
            return;
        }

        const { error } = await supabase
            .from("channel_members")
            .insert({
                channel_id: channelId,
                user_id: user.id,
            });

        if (error) {
            console.log("Join error:", error);
            Alert.alert("Error", error.message);
            return;
        }

        await loadinchannel();

    };
    const redirectchannel = (channelId: string) => {
        // console.log("Redirecting to channel:", channelId);
        router.push({
            pathname: "/channel/[channelId]",
            params: {
                channelId: channelId,
            },
        });
    };

    // const joinChannel = async (channelId: string) => {
    //     const {
    //         data: { user },
    //     } = await supabase.auth.getUser();

    //     if (!user) {
    //         Alert.alert("Error", "You are not logged in");
    //         return;
    //     }

    //     const { error } = await supabase
    //         .from("channel_members")
    //         .insert({
    //             channel_id: channelId,
    //             user_id: user.id,
    //         });

    //     if (error) {
    //         console.log("Join error:", error);
    //         Alert.alert("Error", error.message);
    //         return;
    //     }

    //     Alert.alert("Success", "You joined the channel");

    //     // Refresh the channel data
    //     if (staff?.dept) {
    //         const {
    //             data: memberData,
    //         } = await supabase
    //             .from("channel_members")
    //             .select("channel_id")
    //             .eq("user_id", user.id);

    //         const joinedIds = (memberData || []).map(
    //             (member) => member.channel_id
    //         );

    //         const joined = channels.filter(
    //             (channel) =>
    //                 joinedIds.includes(channel.id)
    //         );

    //         const notJoined = channels.filter(
    //             (channel) =>
    //                 !joinedIds.includes(channel.id)
    //         );

    //         setJoinedChannels(joined);
    //         setNotJoinedChannels(notJoined);
    //     }
    // };



    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginVertical: 10, padding: 10 }}>Channels</Text>
            <View style={{ flexDirection: "row" }}>
                <TextInput placeholder="Search channels..." style={{ width: "65%", borderWidth: 1, borderColor: "#ccc", backgroundColor: "#ccc", padding: 10, paddingInline: 20, margin: 10, borderRadius: 10, }}></TextInput>
                <Pressable style={{ backgroundColor: "#000", justifyContent: "center", borderRadius: 10, paddingInline: 20, margin: 10 }} onPress={() => setModalVisible(true)}>
                    <Text style={{ color: "#fff", fontWeight: 500, fontSize: 15 }}>Create +</Text>
                </Pressable>
            </View>
            <View style={{ flex: 1, padding: 15 }}>
                <Text style={{ fontSize: 15, fontWeight: "bold" }}>
                    My Channels
                </Text>

                {channeljoin.map((channel) => (
                    <Pressable onPress={() => redirectchannel(channel.id)} style={{ backgroundColor: "#ccc", padding: 10, borderRadius: 10, marginVertical: 10 }} key={channel.id}>
                        <Text style={{ fontSize: 15, fontWeight: "bold" }}>{channel.name}</Text>
                        <Text style={{ fontSize: 12, color: "#5f5f5f" }}>{channel.description}</Text>
                    </Pressable>
                ))}
            </View>
            <Text
                style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    marginTop: 20,
                }}
            >
                Available Channels
            </Text>

            {notJoinedChannels.map((channel) => (
                <View
                    key={channel.id}

                    style={{
                        backgroundColor: "#eee",
                        padding: 10,
                        borderRadius: 10,
                        marginVertical: 10,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            fontWeight: "bold",
                        }}
                    >
                        {channel.name}
                    </Text>

                    <Text
                        style={{
                            fontSize: 12,
                            color: "#5f5f5f",
                            marginTop: 3,
                        }}
                    >
                        {channel.description}
                    </Text>

                    <Pressable
                        onPress={() => Channeljoin(channel.id)}
                        style={{
                            backgroundColor: "#000",
                            padding: 8,
                            borderRadius: 8,
                            marginTop: 10,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Text
                            style={{
                                color: "#fff",
                                fontWeight: "bold",
                            }}
                        >
                            Join
                        </Text>
                    </Pressable>
                </View>
            ))}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <View style={{ width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 10 }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Create Channel</Text>
                        <TextInput value={name} onChangeText={setName} placeholder="Channel Name" style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }} />
                        <TextInput value={description} onChangeText={setDescription} placeholder="Channel Description" multiline numberOfLines={4} style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 }} />
                        <Pressable onPress={() => setModalVisible(false)} style={{ backgroundColor: "#ccc", padding: 10, alignItems: "center", borderRadius: 5, marginBottom: 10 }}>
                            <Text>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={createChannel} style={{ backgroundColor: "#000", padding: 10, alignItems: "center", borderRadius: 5 }}>
                            <Text style={{ color: "#fff" }}>Create</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}