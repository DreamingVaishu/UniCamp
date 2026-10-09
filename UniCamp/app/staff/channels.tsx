import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import CircleButton from '../../components/CircleButton';
import Scroll from '../../components/Scroll';
import Sheet from '../../components/Sheet';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Row from '../../components/Row';
import { Empty, Loading } from '../../components/Status';
import { supabase } from '../../lib/supabase';
import { loadStaff } from '../../lib/staff';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C } from '../../lib/theme';

export default function Channels() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const q = useLoad(async () => {
    const staff = await loadStaff();
    const channels = ok(await supabase.from('channels').select('*').eq('department', staff.department).order('created_at', { ascending: false }));
    return { staff, channels };
  }, { staff: null as any, channels: [] as any[] });

  const create = async () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Enter a channel name.');
    setSaving(true);
    const { staff } = q.data;
    const { data, error } = await supabase.from('channels').insert({ name: name.trim(), description: desc.trim(), department: staff.department, created_by: staff.id }).select().single();
    if (!error) await supabase.from('channel_members').insert({ channel_id: data.id, user_id: staff.id });
    setSaving(false);
    if (error) return Alert.alert('Not created', 'Please try again.');
    setName(''); setDesc(''); setShow(false); q.reload();
  };

  return (
    <Screen>
      <Header title="Channels" right={<CircleButton icon="plus" label="Create channel" onPress={() => setShow(true)} />} />
      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : <>
          {!!q.error && <Empty text={q.error} error />}
          {!q.error && q.data.channels.length === 0 && <Empty text="No channels yet. Tap + to create one." />}
          {q.data.channels.map((c: any) => (
            <Row key={c.id} title={c.name} lines={[c.description]} onPress={() => router.push({ pathname: '/channel/[channelId]', params: { channelId: c.id } })}
              right={
                <Pressable onPress={() => router.push({ pathname: '/channel/info/[channelId]', params: { channelId: c.id, tab: 'members' } })} hitSlop={10}
                  accessibilityRole="button" accessibilityLabel={`Members of ${c.name}`} style={{ padding: 8 }}>
                  <Feather name="users" size={20} color={C.text} />
                </Pressable>} />
          ))}
        </>}
      </Scroll>

      <Sheet visible={show} title="Create channel" onClose={() => setShow(false)}>
        <Field label="Channel name" value={name} onChangeText={setName} />
        <Field label="Description" value={desc} onChangeText={setDesc} multiline />
        <Button title="Create channel" onPress={create} loading={saving} style={{ marginTop: 20 }} />
      </Sheet>
    </Screen>
  );
}
