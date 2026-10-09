import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Initials from '../../components/Initials';
import { Info } from '../../components/ProfileBanner';
import { supabase } from '../../lib/supabase';
import { C } from '../../lib/theme';

export default function Profile() {
  const [student, setStudent] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', auth.user.id)
      .maybeSingle();

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    setStudent(data);
    setPhone(data?.phone || '');
    setLoading(false);
  };

  const save = async () => {
    if (!student?.id) {
      Alert.alert('Error', 'Student profile was not found.');
      return;
    }

    if (password && password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('students')
      .update({ phone: phone.trim() })
      .eq('id', student.id);

    if (error) {
      setSaving(false);
      Alert.alert('Could not save', error.message);
      return;
    }

    if (password) {
      const { error: passwordError } = await supabase.auth.updateUser({ password });

      if (passwordError) {
        setSaving(false);
        Alert.alert('Password not changed', passwordError.message);
        return;
      }

      setPassword('');
    }

    setSaving(false);
    await load();
    Alert.alert('Saved', 'Your profile is updated.');
  };

  return (
    <Screen>
      <Header title="Profile" />

      <Scroll contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {loading ? <ActivityIndicator style={{ marginTop: 48 }} color={C.purple} size="large" /> : (
          <>
            <View style={{ alignItems: 'center', marginBottom: 18, backgroundColor: C.surface, borderRadius: 18, paddingVertical: 22, paddingHorizontal: 16 }}>
              <Initials name={student?.full_name} image={student?.profile_image} size={110} />
              <Text style={{ fontSize: 22, fontWeight: '700', marginTop: 12, color: C.text }}>
                {student?.full_name || ' '}
              </Text>
              <Text style={{ color: C.muted }}>{student?.email}</Text>
            </View>

            <Info label="Roll no" value={student?.roll_no} />
            <Info label="Admission no" value={student?.admission_no} />
            <Info
              label="Course"
              value={student ? `${student.course} · Div ${student.division || '-'} · Sem ${student.semester || '-'}` : ''}
            />

            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Leave empty to keep current"
            />

            <Button title="Save" onPress={save} loading={saving} disabled={!student} style={{ marginTop: 22 }} />
          </>
        )}
      </Scroll>
    </Screen>
  );
}
