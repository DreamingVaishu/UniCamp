import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import Sheet from '../../components/Sheet';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { Empty } from '../../components/Status';
import { NoticeBox, ProfileBanner } from '../../components/ProfileBanner';
import { supabase } from '../../lib/supabase';
import { loadStaff } from '../../lib/staff';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C, T } from '../../lib/theme';

export default function Home() {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const q = useLoad(async () => {
    const staff = await loadStaff();
    const notices = ok(await supabase.from('announcements').select('*').eq('department', staff.department).order('created_at', { ascending: false }));
    return { staff, notices };
  }, { staff: null as any, notices: [] as any[] });
  const { staff, notices } = q.data;

  const post = async () => {
    if (!title.trim() || !desc.trim()) return Alert.alert('Missing details', 'Add a title and a description.');
    setSaving(true);
    const { error } = await supabase.from('announcements').insert({ title: title.trim(), description: desc.trim(), department: staff.department, created_by: staff.id });
    setSaving(false);
    if (error) return Alert.alert('Not published', 'Please try again.');
    setTitle(''); setDesc(''); setShow(false); q.reload();
  };

  return (
    <Screen>
      <Header title="CSMU" />
      <Scroll load={q}>
        <ProfileBanner label="Staff name" name={staff?.username} image={staff?.profile_image} subtitle={staff?.staff_id ? `Staff ID · ${staff.staff_id}` : undefined} />
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}>
          {!!q.error && <Empty text={q.error} error />}
          <View style={{ borderWidth: 1, borderColor: '#C7C2CE', backgroundColor: '#E3E1E6', marginTop: 10 }}>
            <View style={{ minHeight: 42, backgroundColor: '#B5A3C9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 }}>
              <Text style={{ color: '#332842', fontSize: 14, fontWeight: '700' }}>Staff Information</Text>
            </View>
            {[
              ['Name', staff?.username],
              ['Staff ID', staff?.staff_id],
              ['Employee No', staff?.employee_number],
              ['Department', staff?.department],
              ['Email', staff?.email],
            ].map(([label, value]) => (
              <View key={label} style={{ flexDirection: 'row', paddingHorizontal: 11, paddingVertical: 8, gap: 6 }}>
                <Text style={{ color: '#45434A', fontSize: 13 }}>{label}:</Text>
                <Text style={{ color: C.text, fontSize: 13, flex: 1 }}>{value || '—'}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 12 }}>
            <Text style={[T.label, { color: C.text }]}>Notice</Text>
            <Pressable onPress={() => setShow(true)} accessibilityRole="button" style={{ backgroundColor: C.dark, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ color: C.white, fontSize: 12 }}>New notice</Text>
            </Pressable>
          </View>
          <NoticeBox items={notices} />
        </View>
      </Scroll>

      <Sheet visible={show} title="New notice" onClose={() => setShow(false)}>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Description" value={desc} onChangeText={setDesc} multiline />
        <Button title="Publish" onPress={post} loading={saving} style={{ marginTop: 20 }} />
      </Sheet>
    </Screen>
  );
}
