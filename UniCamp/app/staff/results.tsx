import React, { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
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
import { RESULT_STATUSES, SEMESTERS } from '../../lib/enums';
import { supabase } from '../../lib/supabase';
import { loadStaff } from '../../lib/staff';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C } from '../../lib/theme';

const PASS_MARK = 40;
const STATUS_COLOR: Record<string, string> = { pass: C.teal, fail: '#9B4A4A', absent: C.muted, withheld: '#8F7A3E' };

export default function Results() {
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);   // the result being edited (null = adding new)
  const [student, setStudent] = useState('');          // "roll no · name"
  const [semester, setSemester] = useState<string>(SEMESTERS[0]);
  const [subject, setSubject] = useState('');
  const [marks, setMarks] = useState('');
  const [status, setStatus] = useState('');            // '' = decide from marks
  const [published, setPublished] = useState(true);   // students only see published results
  const [saving, setSaving] = useState(false);

  const q = useLoad(async () => {
    const staff = await loadStaff();
    const students = ok(await supabase.from('students').select('*').eq('department', staff.department).order('full_name'));
    const ids = students.map((s: any) => s.id);
    const results = ids.length ? ok(await supabase.from('results').select('*').in('student_id', ids).order('created_at', { ascending: false }).limit(300)) : [];
    return { staff, students, results };
  }, { staff: null as any, students: [] as any[], results: [] as any[] });
  const { staff, students, results } = q.data;

  const label = (s: any) => `${s.roll_no} · ${s.full_name}`;
  const studentOf = (id: string) => students.find((s: any) => s.id === id);

  const list = results.filter((r: any) => {
    const text = `${r.subject_name} ${studentOf(r.student_id)?.full_name || ''} ${studentOf(r.student_id)?.roll_no || ''}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });

  const openAdd = () => { setEditing(null); setStudent(''); setSemester(SEMESTERS[0]); setSubject(''); setMarks(''); setStatus(''); setPublished(true); setShow(true); };
  const openEdit = (r: any) => {
    setEditing(r); setStudent(label(studentOf(r.student_id) || {})); setSemester(String(r.semester));
    setSubject(r.subject_name); setMarks(String(Number(r.total_marks))); setStatus(r.status); setPublished(!!r.published); setShow(true);
  };

  const save = async () => {
    const total = Number(marks);
    const chosen = editing ? studentOf(editing.student_id) : students.find((s: any) => label(s) === student);
    if (!chosen || !subject.trim() || marks === '' || !Number.isFinite(total) || total < 0 || total > 100)
      return Alert.alert('Check details', 'Pick a student, enter the subject and marks between 0 and 100.');

    const finalStatus = status || (total >= PASS_MARK ? 'pass' : 'fail');
    setSaving(true);
    const fields = { semester: Number(semester), subject_name: subject.trim(), total_marks: total, status: finalStatus, published };
    const { error } = editing
      ? await supabase.from('results').update(fields).eq('id', editing.id)
      : await supabase.from('results').insert({ ...fields, student_id: chosen.id, course: chosen.course, created_by: staff.id });
    setSaving(false);
    if (error) return Alert.alert('Not saved', 'Please try again.');
    setShow(false); q.reload();
  };

  return (
    <Screen>
      <Header title="Results" right={<CircleButton icon="plus" label="Add result" onPress={openAdd} />} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search student or subject" />

      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : <>
          {!!q.error && <Empty text={q.error} error />}
          {!q.error && list.length === 0 && <Empty text={search ? 'No result matches your search.' : 'No results yet. Tap + to add one.'} />}
          {list.map((r: any) => {
            const s = studentOf(r.student_id);
            return (
              <Row key={r.id} title={`${r.subject_name} · Sem ${r.semester}`} lines={[s ? `${s.full_name} · ${s.roll_no}` : '', `${Number(r.total_marks)} marks${r.published ? '' : '  ·  Draft (hidden from student)'}`]} onPress={() => openEdit(r)}
                right={<View style={{ backgroundColor: STATUS_COLOR[r.status] || C.muted, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text style={{ color: C.white, fontSize: 12, textTransform: 'capitalize' }}>{r.status}</Text>
                </View>} />
            );
          })}
        </>}
      </Scroll>

      <Sheet visible={show} title={editing ? 'Edit result' : 'Add result'} onClose={() => setShow(false)}>
        {editing
          ? <Field label="Student" value={student} editable={false} />
          : <EnumPicker label="Student" value={student} options={students.map(label)} onChange={setStudent} placeholder="Choose student" />}
        <EnumPicker label="Semester" value={semester} options={SEMESTERS} onChange={setSemester} />
        <Field label="Subject" value={subject} onChangeText={setSubject} />
        <Field label="Total marks (out of 100)" value={marks} onChangeText={t => setMarks(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" />
        <EnumPicker label="Status" value={status} options={RESULT_STATUSES} onChange={setStatus} placeholder={`Auto (pass at ${PASS_MARK}+)`} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, color: C.text }}>Publish to student</Text>
            <Text style={{ fontSize: 12, color: C.muted }}>{published ? 'Student can see this result.' : 'Saved as draft. Student cannot see it yet.'}</Text>
          </View>
          <Switch value={published} onValueChange={setPublished} trackColor={{ true: C.teal }} accessibilityLabel="Publish to student" />
        </View>
        <Button title={editing ? 'Save changes' : 'Add result'} onPress={save} loading={saving} style={{ marginTop: 22 }} />
      </Sheet>
    </Screen>
  );
}
