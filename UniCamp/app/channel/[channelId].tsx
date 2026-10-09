import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import CircleButton from '../../components/CircleButton';
import Initials from '../../components/Initials';
import { Empty } from '../../components/Status';
import { supabase } from '../../lib/supabase';
import { openAttachment, MAX_FILE_MB } from '../../lib/files';
import { C, T } from '../../lib/theme';

export default function Chat() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const [userId, setUserId] = useState('');
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const list = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadUser();
    loadData();

    const sub = supabase
      .channel('messages-' + channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, loadData)
      .subscribe();

    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboard(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboard(false)
    );

    return () => {
      supabase.removeChannel(sub);
      show.remove();
      hide.remove();
    };
  }, [channelId]);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id || '');
  };

  const loadData = async () => {
    if (!channelId) return;

    const { data: channelData } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .maybeSingle();

    const { data: messageData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setChannel(channelData);
    setMessages(messageData || []);

    const ids = [...new Set((messageData || []).map(item => item.sender_id).filter(Boolean))];

    if (ids.length) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id,username')
        .in('id', ids);

      const { data: students } = await supabase
        .from('students')
        .select('id,full_name')
        .in('id', ids);

      const result: Record<string, string> = {};
      (staff || []).map(item => { result[item.id] = item.username || 'Staff'; });
      (students || []).map(item => { result[item.id] = item.full_name || 'Student'; });
      setNames(result);
    }

    setLoading(false);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;

    const picked = result.assets[0];
    if (picked.size && picked.size > MAX_FILE_MB * 1024 * 1024) {
      Alert.alert('File too big', `Choose a file smaller than ${MAX_FILE_MB} MB.`);
      return;
    }

    setFile(picked);
  };

  const send = async () => {
    if (sending || (!text.trim() && !file) || !userId || !channelId) return;

    setSending(true);
    let path: string | null = null;

    try {
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        path = `${channelId}/${userId}/${Date.now()}-${safeName}`;

        const bytes = await (await fetch(file.uri)).arrayBuffer();
        const { error } = await supabase.storage
          .from('chat-attachments')
          .upload(path, bytes, {
            contentType: file.mimeType || 'application/octet-stream',
          });

        if (error) {
          Alert.alert('Upload failed', error.message);
          return;
        }
      }

      const { error } = await supabase.from('messages').insert({
        channel_id: channelId,
        sender_id: userId,
        message: text.trim() || null,
        attachment_path: path,
        attachment_name: file?.name || null,
        attachment_type: file?.mimeType || null,
        attachment_size: file?.size || null,
      });

      if (error) {
        if (path) await supabase.storage.from('chat-attachments').remove([path]);
        Alert.alert('Not sent', error.message);
        return;
      }

      setText('');
      setFile(null);
      await loadData();
    } finally {
      setSending(false);
    }
  };

  const togglePin = (item: any) => {
    Alert.alert(item.pinned ? 'Unpin message?' : 'Pin message?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: item.pinned ? 'Unpin' : 'Pin',
        onPress: async () => {
          await supabase
            .from('messages')
            .update({ pinned: !item.pinned })
            .eq('id', item.id);
          loadData();
        },
      },
    ]);
  };

  const canSend = !!text.trim() || !!file;

  return (
    <Screen>
      <Header
        back
        large
        title={channel?.name || 'Channel'}
        right={
          <CircleButton
            icon="more-vertical"
            label="Channel info"
            size={34}
            onPress={() =>
              router.push({
                pathname: '/channel/info/[channelId]',
                params: { channelId: String(channelId) },
              })
            }
          />
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Empty text={loading ? '' : 'No messages yet. Say hello!'} />}
          renderItem={({ item }) => {
            const mine = item.sender_id === userId;

            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
                {!mine && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Initials name={names[item.sender_id]} size={22} />
                    <Text style={T.small}>{names[item.sender_id] || 'User'}</Text>
                  </View>
                )}

                <Pressable
                  onLongPress={() => togglePin(item)}
                  style={{
                    maxWidth: '82%',
                    minWidth: 90,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: mine ? C.teal : C.surface,
                  }}
                >
                  {!!item.message && (
                    <Text style={{ color: mine ? C.white : C.text, fontSize: 15 }}>
                      {item.message}
                    </Text>
                  )}

                  {!!item.attachment_path && (
                    <Pressable
                      onPress={() => openAttachment(item.attachment_path)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: item.message ? 8 : 0,
                      }}
                    >
                      <Feather name="paperclip" size={14} color={mine ? C.white : C.text} />
                      <Text
                        numberOfLines={1}
                        style={{
                          color: mine ? C.white : C.text,
                          textDecorationLine: 'underline',
                          flexShrink: 1,
                        }}
                      >
                        {item.attachment_name}
                      </Text>
                    </Pressable>
                  )}

                  <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    {item.pinned && <Feather name="bookmark" size={10} color={mine ? '#DDE6E8' : C.muted} />}
                    <Text style={{ fontSize: 10, color: mine ? '#DDE6E8' : C.muted }}>
                      {new Date(item.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          }}
        />

        {file && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.field, marginHorizontal: 12, marginBottom: 6, padding: 10, borderRadius: 10, gap: 8 }}>
            <Feather name="file" size={16} color={C.text} />
            <Text numberOfLines={1} style={{ flex: 1 }}>{file.name}</Text>
            <Pressable onPress={() => setFile(null)} hitSlop={10}>
              <Feather name="x" size={18} color={C.text} />
            </Pressable>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: keyboard ? 8 : insets.bottom + 8, gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.bar, borderRadius: 12, paddingHorizontal: 14 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message"
              placeholderTextColor="#6F6F74"
              multiline
              style={{ flex: 1, minHeight: 50, maxHeight: 110, fontSize: 15, color: C.text }}
            />
            <Pressable onPress={pickFile} hitSlop={10}>
              <Feather name="paperclip" size={20} color={C.text} />
            </Pressable>
          </View>

          <Pressable
            onPress={send}
            disabled={!canSend || sending}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: C.dark,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canSend && !sending ? 1 : 0.5,
            }}
          >
            <Feather name="send" size={20} color={C.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
