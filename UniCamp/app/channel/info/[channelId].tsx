import React, { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Screen from '../../../components/Screen';
import Header from '../../../components/Header';
import CircleButton from '../../../components/CircleButton';
import Scroll from '../../../components/Scroll';
import { Empty } from '../../../components/Status';
import Row from '../../../components/Row';
import { getMe } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { ok } from '../../../lib/helpers';
import { loadNames } from '../../../lib/names';
import { openAttachment } from '../../../lib/files';
import { useLoad } from '../../../lib/useLoad';
import { C, T } from '../../../lib/theme';

export default function Info() {
  const { channelId, tab: startTab } = useLocalSearchParams<{ channelId: string; tab?: string }>();
  const [tab, setTab] = useState<'files' | 'pin' | 'members'>(startTab === 'members' ? 'members' : 'files');

  const q = useLoad(async () => {
    const channel = ok(await supabase.from('channels').select('*').eq('id', channelId).single());
    const messages = ok(await supabase.from('messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: false }));
    const names = await loadNames([channel.created_by, ...messages.map((m: any) => m.sender_id)]);

    // temporary links so image previews can show (they expire after 1 hour)
    const imagePaths = messages.filter((m: any) => m.attachment_type?.startsWith('image/')).map((m: any) => m.attachment_path);
    const signed = imagePaths.length ? (await supabase.storage.from('chat-attachments').createSignedUrls(imagePaths, 3600)).data || [] : [];
    const urls: Record<string, string> = {};
    signed.forEach((s: any) => { if (s.path) urls[s.path] = s.signedUrl; });

    // Only STAFF see the student list and can remove students (students never see it)
    const me = await getMe();
    const canManage = me?.role === 'staff';
    let members: any[] = [];
    if (canManage) {
      const rows = ok(await supabase.from('channel_members').select('user_id').eq('channel_id', channelId));
      const ids = rows.map((r: any) => r.user_id);
      members = ids.length ? ok(await supabase.from('students').select('*').in('id', ids).order('full_name')) : [];
    }

    return { channel, messages, names, urls, canManage, members };
  }, { channel: null as any, messages: [] as any[], names: {} as Record<string, string>, urls: {} as Record<string, string>, canManage: false, members: [] as any[] });

  const { channel, messages, names, urls, canManage, members } = q.data;

  const removeMember = (s: any) => Alert.alert('Remove from channel?', `${s.full_name} will no longer see this channel. They can join again from Discover.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      const { error } = await supabase.from('channel_members').delete().eq('channel_id', channelId).eq('user_id', s.id);
      if (error) Alert.alert('Not removed', 'Please try again.'); else q.reload();
    } },
  ]);
  const files = messages.filter((m: any) => m.attachment_path);
  const pinned = messages.filter((m: any) => m.pinned);
  const caption = (m: any) => (
    <Text style={{ fontSize: 11, marginTop: 12, marginBottom: 4, marginLeft: 8, color: C.text }}>
      <Text style={{ fontWeight: '700' }}>By . {names[m.sender_id] || 'User'}</Text>  {m.message || ''}
    </Text>
  );

  return (
    <Screen stack>
      <Header back large title="Channel Info"
        right={<CircleButton icon="more-vertical" label="About this channel" size={34} onPress={() => Alert.alert(channel?.name || 'Channel', channel?.description || 'No description')} />} />
      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ padding: 24, paddingTop: 20 }}>
          <Text style={[T.label, { fontSize: 11 }]}>Channel Name</Text>
          <Text style={{ fontSize: 22, color: C.text, marginTop: 2 }}>{channel?.name || ' '}</Text>
          <Text style={[T.label, { fontSize: 11, marginTop: 10 }]}>Created By</Text>
          <Text style={{ fontSize: 22, color: C.text, marginTop: 2 }}>{names[channel?.created_by] || ' '}</Text>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 8 }}>
          {([['files', 'folder', 'files'], ['pin', 'bookmark', 'Pin'], ...(canManage ? [['members', 'users', `Students (${members.length})`]] : [])] as const).map(([key, icon, label]) => (
            <Pressable key={key} onPress={() => setTab(key)} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 2, borderColor: tab === key ? C.text : 'transparent' }}>
              <Feather name={icon} size={22} color={C.text} />
              <Text style={{ fontSize: 11, marginTop: 4, color: C.text }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {!!q.error && <Empty text={q.error} error />}

        {tab === 'files' && (
          <>
            {!q.loading && files.length === 0 && <Empty text="No files shared yet." />}
            {files.map((m: any) => {
              const isImage = !!urls[m.attachment_path];
              return (
                <View key={m.id} style={{ paddingHorizontal: 8 }}>
                  {caption(m)}
                  <Pressable onPress={() => openAttachment(m.attachment_path)} style={{ backgroundColor: C.surface, borderRadius: 14, padding: 5, flexDirection: 'row', alignItems: 'center' }}>
                    {isImage
                      ? <Image source={{ uri: urls[m.attachment_path] }} style={{ width: 150, height: 150, borderRadius: 12, backgroundColor: C.tile }} />
                      : <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: C.tile, alignItems: 'center', justifyContent: 'center' }}><Feather name="file" size={34} color={C.text} /></View>}
                    <Text numberOfLines={2} style={{ flex: 1, marginLeft: 14, fontSize: 17, color: C.text }}>{isImage ? '' : m.attachment_name}</Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        )}

        {tab === 'members' && canManage && (
          <>
            {!q.loading && members.length === 0 && <Empty text="No students have joined this channel yet." />}
            {members.map((s: any) => (
              <Row key={s.id} title={s.full_name} lines={[`${s.roll_no} · ${s.course} · Div ${s.division || '-'}`]} right={
                <Pressable onPress={() => removeMember(s)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${s.full_name}`} style={{ padding: 6 }}>
                  <Feather name="user-minus" size={20} color={C.danger} />
                </Pressable>} />
            ))}
          </>
        )}

        {tab === 'pin' && (
          <>
            {!q.loading && pinned.length === 0 && <Empty text="Nothing pinned. Long-press a message in the chat to pin it." />}
            {pinned.map((m: any) => (
              <View key={m.id} style={{ paddingHorizontal: 8 }}>
                {caption({ ...m, message: '' })}
                <View style={{ backgroundColor: C.surface, borderRadius: 14, padding: 14 }}>
                  <Text style={{ fontSize: 15, color: C.text }}>{m.message || m.attachment_name}</Text>
                </View>
              </View>
            ))}
          </>
        )}

      </Scroll>
    </Screen>
  );
}
