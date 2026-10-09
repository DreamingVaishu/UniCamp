import React, { useEffect, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import CircleButton from '../../components/CircleButton';
import SearchBar from '../../components/SearchBar';
import Scroll from '../../components/Scroll';
import Sheet from '../../components/Sheet';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Row from '../../components/Row';
import EnumPicker from '../../components/EnumPicker';
import { Empty, Loading } from '../../components/Status';
import { DIVISIONS, SEMESTERS, STUDENT_STATUSES } from '../../lib/enums';
import { supabase } from '../../lib/supabase';
import { getCurrentStaff } from '../../lib/staff';
import { C } from '../../lib/theme';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [name, setName] = useState('');
  const [division, setDivision] = useState(DIVISIONS[0]);
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [status, setStatus] = useState(STUDENT_STATUSES[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const current = await getCurrentStaff();
      if (!current?.department) {
        setStudents([]);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('department', current.department)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not load students.');
    } finally {
      setLoading(false);
    }
  };

  const open = (student: any) => {
    if (!student?.id) return;

    setEdit(student);
    setName(student.full_name || '');
    setDivision(student.division || DIVISIONS[0]);
    setSemester(String(student.semester || 1));
    setStatus(student.status || STUDENT_STATUSES[0]);
  };

  const save = async () => {
    if (!edit?.id || !name.trim()) {
      Alert.alert('Missing name', 'Enter the student name.');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('students')
      .update({
        full_name: name.trim(),
        division,
        semester: Number(semester),
        status,
      })
      .eq('id', edit.id);

    setSaving(false);

    if (error) {
      Alert.alert('Not saved', error.message);
      return;
    }

    setEdit(null);
    load();
  };

  const remove = (student: any) => {
    if (!student?.id) return;

    Alert.alert(
      'Delete student?',
      `${student.full_name} and their login will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { data, error } = await supabase.functions.invoke(
              'provision-account',
              { body: { action: 'delete_student', student_id: student.id } }
            );

            if (error || data?.error) {
              Alert.alert('Not deleted', data?.error || error?.message || 'Please try again.');
              return;
            }

            load();
          },
        },
      ]
    );
  };

  const list = students.filter(student =>
    (student?.full_name || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <Screen>
      <Header
        title="Students"
        right={
          <CircleButton
            icon="plus"
            label="Add student"
            onPress={() => router.push('/staff/form')}
          />
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search students" />

      <Scroll contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="No students found." />
        ) : (
          list.map(student => (
            <Row
              key={student.id}
              title={student.full_name || 'Student'}
              lines={[
                `${student.roll_no || '-'} · ${student.course || '-'} · Sem ${student.semester || '-'}`,
                student.email || '',
              ]}
              onPress={() => open(student)}
              right={
                <Pressable onPress={() => remove(student)} hitSlop={10}>
                  <Feather name="trash-2" size={19} color={C.danger} />
                </Pressable>
              }
            />
          ))
        )}
      </Scroll>

      <Sheet visible={!!edit} title="Edit student" onClose={() => setEdit(null)}>
        <Field label="Full name" value={name} onChangeText={setName} />
        <EnumPicker label="Division" value={division} options={DIVISIONS} onChange={setDivision} />
        <EnumPicker label="Semester" value={semester} options={SEMESTERS} onChange={setSemester} />
        <EnumPicker label="Status" value={status} options={STUDENT_STATUSES} onChange={setStatus} />
        <Button title="Save changes" onPress={save} loading={saving} style={{ marginTop: 22 }} />
      </Sheet>
    </Screen>
  );
}
