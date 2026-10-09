import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import CircleButton from '../../components/CircleButton';
import Scroll from '../../components/Scroll';
import Sheet from '../../components/Sheet';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Row from '../../components/Row';
import EnumPicker from '../../components/EnumPicker';
import { Empty, Loading } from '../../components/Status';
import { DEPARTMENTS } from '../../lib/enums';
import { supabase } from '../../lib/supabase';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C } from '../../lib/theme';

export default function Staff() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [saving, setSaving] = useState(false);

  const q = useLoad(async () => ok(await supabase.from('staff').select('*').order('username')), [] as any[]);

  const create = async () => {
    if (!name.trim() || !email.trim() || !password) return Alert.alert('Missing details', 'Username, email and password are required.');
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('provision-account', {
      body: { action: 'create_staff', username: name.trim(), email: email.trim().toLowerCase(), password, department },
    });
    setSaving(false);
    if (error || data?.error) return Alert.alert('Not created', data?.error || 'Please try again.');
    setName(''); setEmail(''); setPassword(''); setDepartment(DEPARTMENTS[0]); setShow(false); q.reload();
    Alert.alert('Created', 'Staff account created.');
  };

  const remove = (s: any) => Alert.alert('Delete staff?', `${s.username}'s account will be removed. This cannot be undone.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      const { data, error } = await supabase.functions.invoke('provision-account', { body: { action: 'delete_staff', staff_id: s.id } });
      if (error || data?.error) Alert.alert('Not deleted', data?.error || 'Please try again.'); else q.reload();
    } },
  ]);

  return (
    <Screen>
      <Header title="Staff" right={<CircleButton icon="plus" label="Add staff" onPress={() => setShow(true)} />} />
      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : <>
          {!!q.error && <Empty text={q.error} error />}
          {!q.error && q.data.length === 0 && <Empty text="No staff yet. Tap + to add one." />}
          {q.data.map((s: any) => (
            <Row key={s.id} title={s.username} lines={[`${s.staff_id} · ${s.department}`, s.email]} right={
              <Pressable onPress={() => remove(s)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${s.username}`} style={{ padding: 6 }}>
                <Feather name="trash-2" size={19} color={C.danger} />
              </Pressable>} />
          ))}
        </>}
      </Scroll>

      <Sheet visible={show} title="Add staff" onClose={() => setShow(false)}>
        <Field label="Username" value={name} onChangeText={setName} />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Temporary password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        <EnumPicker label="Department" value={department} options={DEPARTMENTS} onChange={setDepartment} />
        <Button title="Create staff" onPress={create} loading={saving} style={{ marginTop: 22 }} />
      </Sheet>
    </Screen>
  );
}
