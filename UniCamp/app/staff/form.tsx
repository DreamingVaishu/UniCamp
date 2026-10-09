import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import Field from '../../components/Field';
import Button from '../../components/Button';
import EnumPicker from '../../components/EnumPicker';
import { COURSES, DEPARTMENTS, DIVISIONS, SEMESTERS } from '../../lib/enums';
import { supabase } from '../../lib/supabase';

// Add student. The account is created by the `provision-account` edge function (needs a secret key, so it can't run in the app).
export default function Form() {
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', department: DEPARTMENTS[0] as string, course: COURSES[0] as string, division: DIVISIONS[0] as string, semester: SEMESTERS[0] as string });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof f) => (v: string) => setF({ ...f, [key]: v });

  const save = async () => {
    if (!f.name.trim() || !f.email.trim() || !f.password) return Alert.alert('Missing details', 'Name, email and password are required.');
    if (f.password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('provision-account', {
      body: { action: 'create_student', full_name: f.name.trim(), email: f.email.trim().toLowerCase(), password: f.password, phone: f.phone.trim(), department: f.department, course: f.course, division: f.division, semester: Number(f.semester) },
    });
    setSaving(false);
    if (error || data?.error) return Alert.alert('Not created', data?.error || 'Please try again.');
    Alert.alert('Created', 'Student account created.');
    router.replace('/staff/students');
  };

  return (
    <Screen stack>
      <Header back large title="Add student" />
      <Scroll contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
        <Field label="Full name" value={f.name} onChangeText={set('name')} />
        <Field label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Temporary password" value={f.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" />
        <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <EnumPicker label="Department" value={f.department} options={DEPARTMENTS} onChange={set('department')} />
        <EnumPicker label="Course" value={f.course} options={COURSES} onChange={set('course')} />
        <EnumPicker label="Division" value={f.division} options={DIVISIONS} onChange={set('division')} />
        <EnumPicker label="Semester" value={f.semester} options={SEMESTERS} onChange={set('semester')} />
        <Button title="Create student" onPress={save} loading={saving} style={{ marginTop: 24 }} />
      </Scroll>
    </Screen>
  );
}
