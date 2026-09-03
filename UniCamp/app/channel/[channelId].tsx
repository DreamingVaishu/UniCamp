import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
    const [attachment, setAttachment] = useState<any>(null);

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

                if (error) {
                    console.error("Error fetching channel:", error);
                    return;
                }

                setChannelData(data);
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
        if (!text && !attachment) {
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

        try {
            let attachmentpath = null;
            if (attachment) {
                const fileExt = attachment.name?.split(".").pop() || "file";
                const filePath =
                    `${channelId}/${userId}/${Date.now()}.${fileExt}`;
                const response = await fetch(attachment.uri);
                const arrayBuffer = await response.arrayBuffer();

                const { error: errorfile } = await supabase.storage
                    .from("chat-attachments")
                    .upload(filePath, arrayBuffer, {
                        contentType: attachment.mimeType || "application/octet-stream",
                        upsert: false,
                    });
                if (errorfile) {
                    console.error("Attachment upload error:", errorfile);
                    return;
                }
                attachmentpath = filePath;
            }

            const { data, error } = await supabase
                .from("messages")
                .insert({
                    channel_id: channelId,
                    sender_id: userId,

                    // Text
                    message: text || null,

                    // Attachment
                    attachment_path: attachmentpath,
                    attachment_name: attachment?.name || null,
                    attachment_type: attachment?.mimeType || null,
                    attachment_size: attachment?.size || null,
                })
                .select()
                .single();

            if (error) {
                console.error(error)
                if (attachmentpath) {
                    await supabase.storage
                        .from("chat-attachments")
                        .remove([attachmentpath])
                }
                return
            }
            setMessages((previous) => [
                ...previous,
                data,
            ]);
            setMessage("");
            setAttachment(null);
        } finally { setSending(false); }
    };

    const attachmentpicker = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            })
            if (result.canceled) return;
            const file = result.assets[0];
            setAttachment(file)
            console.log("attachmnt ", file)
        } finally {

        }
    }

    const openAttachment = async (item: any) => {
    if (!item.attachment_path) return;

    try {
        const { data, error } = await supabase.storage
            .from("chat-attachments")
            .createSignedUrl(item.attachment_path, 60 * 5);

        if (error) {
            console.error("Error creating attachment URL:", error);
            return;
        }

        if (!data?.signedUrl) {
            console.error("No signed URL returned");
            return;
        }

        await WebBrowser.openBrowserAsync(data.signedUrl);

    } catch (error) {
        console.error("Error opening attachment:", error);
    }
};

    return (
        <SafeAreaView style={{ flex: 1 }}>

            {/* Header */}
            <View
                style={{
                    padding: 20,
                    borderBottomWidth: 1,
                    borderColor: "#ccc",
                }}
            >
                <Text>{channelData?.name}</Text>
                <Text>by {createdbyData}</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >

                {/* Messages */}
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    renderItem={({ item }) => {
                        const isMyMessage = item.sender_id === userId;

                        return (
                            <View
                                style={[
                                    styles.messageRow,
                                    isMyMessage && styles.myMessageRow,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.messageBubble,
                                        isMyMessage && styles.myMessageBubble,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.messageText,
                                            isMyMessage && styles.myMessageText,
                                        ]}
                                    >
                                        {item.attachment_path && (
                                            <Pressable
                                                style={styles.attachmentCard}
                                                onPress={() => openAttachment(item)}
                                            >
                                                <Text style={styles.attachmentIcon}>
                                                    📎
                                                </Text>

                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={styles.attachmentName}
                                                        numberOfLines={1}
                                                    >
                                                        {item.attachment_name}
                                                    </Text>

                                                    <Text style={styles.attachmentType}>
                                                        {item.attachment_type || "File"}
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        )}
                                        {item.message}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.messageTime,
                                            isMyMessage && styles.myMessageTime,
                                        ]}
                                    >
                                        {item.created_at}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />

                {/* Selected attachment */}
                {attachment && (
                    <View style={styles.selectedAttachment}>

                        <Text
                            style={styles.selectedAttachmentName}
                            numberOfLines={1}
                        >
                            📎 {attachment.name}
                        </Text>

                        <Pressable
                            onPress={() => setAttachment(null)}
                        >
                            <Text style={styles.removeAttachment}>
                                ✕
                            </Text>
                        </Pressable>

                    </View>
                )}

                {/* Input area */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 10,
                        borderTopWidth: 1,
                        borderColor: "#ccc",
                    }}
                >

                    <TextInput
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: "#ccc",
                            borderRadius: 20,
                            paddingHorizontal: 15,
                            paddingVertical: 10,
                            marginRight: 5,
                        }}
                        placeholder="Type a message..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />


                    <Pressable
                        style={styles.attachmentButton}
                        onPress={attachmentpicker}
                    >
                        <Text style={styles.attachmentIcon}>
                            📎
                        </Text>
                    </Pressable>


                    <Pressable
                        style={[
                            styles.sendButton,
                            (!message.trim() || sending) &&
                            styles.sendButtonDisabled,
                        ]}
                        onPress={sendmessage}
                        disabled={
                            sending ||
                            (!message.trim() && !attachment)
                        }
                    >
                        <Text style={{ color: "#000" }}>
                            ➤
                        </Text>
                    </Pressable>

                </View>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderColor: "#ccc",
    },

    attachmentButton: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
    },

    attachmentIcon: {
        fontSize: 22,
    },

    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginHorizontal: 5,
        maxHeight: 100,
    },

    selectedAttachment: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: "#f5f5f5",
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },

    selectedAttachmentName: {
        flex: 1,
        fontSize: 13,
        color: "#333",
    },

    removeAttachment: {
        fontSize: 18,
        color: "#777",
        marginLeft: 10,
    },

    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#007AFF",
        alignItems: "center",
        justifyContent: "center",
    },

    sendButtonDisabled: {
        opacity: 0.4,
    },

    sendText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },

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