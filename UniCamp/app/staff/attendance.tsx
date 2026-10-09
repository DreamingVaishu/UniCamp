import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import Row from '../../components/Row';
import EnumPicker from '../../components/EnumPicker';
import { Empty, Loading } from '../../components/Status';
import { ATTENDANCE_STATUSES, COURSES, DIVISIONS } from '../../lib/enums';
import { supabase } from '../../lib/supabase';
import { loadStaff } from '../../lib/staff';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C, T } from '../../lib/theme';

const COLORS: Record<string, string> = { present: C.teal, absent: '#9B4A4A', late: '#8F7A3E' };

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [course, setCourse] = useState('');     // '' = all courses
  const [division, setDivision] = useState(''); // '' = all divisions

  const q = useLoad(async () => {
    const staff = await loadStaff();
    const students = ok(await supabase.from('students').select('*').eq('department', staff.department).order('full_name'));
    const marks = ok(await supabase.from('attendance').select('*').eq('department', staff.department).eq('date', today));
    const status: Record<string, string> = {};
    marks.forEach((m: any) => (status[m.student_id] = m.status));
    return { staff, students, status };
  }, { staff: null as any, students: [] as any[], status: {} as Record<string, string> });

  const { staff, status } = q.data;
  // the list shown = students that match the chosen course and division
  const students = q.data.students.filter((s: any) => (!course || s.course === course) && (!division || s.division === division));
  const count = (v: string) => students.filter((s: any) => status[s.id] === v).length;

  const mark = async (student: any, value: string) => {
    const old = ok(await supabase.from('attendance').select('id').eq('student_id', student.id).eq('date', today).maybeSingle());
    const { error } = old
      ? await supabase.from('attendance').update({ status: value }).eq('id', old.id)
      : await supabase.from('attendance').insert({ student_id: student.id, department: student.department, date: today, status: value, marked_by: staff.id });
    if (error) Alert.alert('Not saved', 'Could not mark attendance. Try again.'); else q.reload();
  };

  return (
    <Screen>
      <Header title="Attendance" />
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 14 }}>
        <View style={{ flex: 1 }}><EnumPicker label="Course" value={course} options={COURSES} onChange={setCourse} placeholder="All courses" /></View>
        <View style={{ flex: 1 }}><EnumPicker label="Division" value={division} options={DIVISIONS} onChange={setDivision} placeholder="All divisions" /></View>
      </View>
      <Text style={[T.small, { paddingHorizontal: 18, marginVertical: 12 }]}>
        {new Date().toLocaleDateString('en-IN')}  ·  {students.length} students  ·  Present {count('present')}  ·  Absent {count('absent')}  ·  Late {count('late')}
      </Text>

      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : <>
          {!!q.error && <Empty text={q.error} error />}
          {!q.error && students.length === 0 && <Empty text={course || division ? 'No students in this course and division.' : 'No students in your department yet.'} />}
          {students.map((s: any) => (
            <Row key={s.id} title={s.full_name} lines={[`${s.roll_no} · ${s.course} · Div ${s.division || '-'}`]} right={
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {ATTENDANCE_STATUSES.map(v => {
                  const on = status[s.id] === v;
                  return (
                    <Pressable key={v} onPress={() => mark(s, v)} accessibilityRole="button" accessibilityLabel={`Mark ${s.full_name} ${v}`} accessibilityState={{ selected: on }}
                      style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: on ? COLORS[v] : C.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '600', color: on ? C.white : C.text }}>{v[0].toUpperCase()}</Text>
                    </Pressable>
                  );
                })}
              </View>} />
          ))}
        </>}
      </Scroll>
    </Screen>
  );
}
