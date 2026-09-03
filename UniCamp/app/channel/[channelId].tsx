import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function ChatScreen() {
    const { channelId } = useLocalSearchParams<{ channelId: string }>();
    const [channelData, setChannelData] = useState(null);
    const [createdbyData, setCreatedbyData] = useState(null);
    // const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const [sending, setSending] =
        useState(false);

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);
            }
        };

        getUser();
    }, []);


    useEffect(() => {
        const fletchChannelData = async () => {
            try {
                const { data, error } = await supabase
                    .from("channels")
                    .select("*")
                    .eq("id", channelId)
                    .single();
                if (data) {
                    setChannelData(data);
                }
            } catch (error) {
                console.error("Error fetching channel data:", error);
            } finally {
                // setLoading(false);
            }
        };
        fletchChannelData();
    }, [channelId]);


    useEffect(() => {
        const creatorname = async () => {
            try {
                const createdby = channelData?.created_by;
                const { data: creator, error } = await supabase
                    .from("staff")
                    .select("username")
                    .eq("id", createdby)
                    .maybeSingle();
                setCreatedbyData(creator?.username);
            } finally {
                // setLoading(false);
            }
        }
        creatorname();
    }, [channelData]);


    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("channel_id", channelId)
                .order("created_at", { ascending: true });
            if (data) {
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
        // setTimeout(fetchMessages, 5000); // Poll every 5 seconds
    };

    useEffect(() => {
        fetchMessages();
    }, [channelId]);

    const sendmessage = async () => {
        const text = message.trim();
        if (!text) {
            return;
        }
        if (!userId) {
            console.error("User not logged in");
            return;
        }
        if (!channelId) {
            console.error("Channel ID is missing");
            return;
        }
        setSending(true);

        const { data, error } = await supabase
            .from("messages")
            .insert({
                channel_id: channelId,
                sender_id: userId,
                message: text,
            })
            .select()
            .single()
        if (error) {
            console.error("Error sending message:", error);
            setSending(false);
            return;
        }
        setMessages((previous) => [
            ...previous,
            data,
        ]);

        setMessage("");
        setSending(false);
    };


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderColor: '#ccc' }}>
                <Text>{channelData?.name}</Text>
                <Text>by {createdbyData}</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                renderItem={({ item }) => {
                    const isMyMessage = item.sender_id === userId;
                    return (
                        <View style={[styles.messageRow, isMyMessage && styles.myMessageRow]}>
                            <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
                                <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>{item.message}</Text>
                                <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>{item.created_at}</Text>
                            </View>
                        </View>
                    );
                }}
            />
            <View style={{ flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 1, borderColor: '#ccc' }}>

                <TextInput
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 20,
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        marginRight: 10,
                    }}
                    placeholder="Type a message..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                />
                <Pressable
                    onPress={sendmessage}
                    disabled={
                        sending ||
                        !message.trim()
                    }
                >
                    <Text style={{ color: "#000" }}>
                        ➤
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({

    messageList: {
        padding: 15,
        paddingBottom: 20,
    },

    messageRow: {
        width: "100%",
        alignItems: "flex-start",
        marginBottom: 10,
    },

    myMessageRow: {
        alignItems: "flex-end",
    },

    messageBubble: {
        maxWidth: "80%",
        backgroundColor: "#eeeeee",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },

    myMessageBubble: {
        backgroundColor: "#007AFF",
    },

    messageText: {
        fontSize: 15,
        color: "#222",
    },

    myMessageText: {
        color: "#fff",
    },

    messageTime: {
        fontSize: 10,
        color: "#888",
        alignSelf: "flex-end",
        marginTop: 4,
    },

    myMessageTime: {
        color: "#dceeff",
    },

    attachment: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
        paddingVertical: 5,
    },

    attachmentName: {
        marginLeft: 8,
        color: "#333",
        flexShrink: 1,
    },

    myAttachmentName: {
        color: "#fff",
    },

});