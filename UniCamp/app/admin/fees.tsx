import React, { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
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
import { COURSES, DEPARTMENTS, FEE_TYPES, SEMESTERS } from '../../lib/enums';
import { supabase } from '../../lib/supabase';
import { money, ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C } from '../../lib/theme';

const blank = { title: '', academic_year: '', amount: '' };

function academicYears() {
  const year = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => `${year + i}-${year + i + 1}`);
}

function feeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1) + ' fee';
}

export default function Fees() {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ ...blank, academic_year: academicYears()[0] });
  const [department, setDepartment] = useState<string>('');
  const [course, setCourse] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [feeType, setFeeType] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const q = useLoad(async () =>
    ok(await supabase.from('fee_structures').select('*').order('created_at', { ascending: false })),
    [] as any[],
  );

  const years = useMemo(() => {
    const fromDatabase = q.data.map((item: any) => item.academic_year).filter(Boolean);
    return [...new Set([...academicYears(), ...fromDatabase])].sort();
  }, [q.data]);

  const set = (key: keyof typeof blank) => (value: string) => {
    setF(current => ({ ...current, [key]: value }));
  };

  const closeForm = () => {
    setShow(false);
    setF({ ...blank, academic_year: academicYears()[0] });
    setDepartment('');
    setCourse('');
    setSemester('');
    setFeeType('');
  };

  const create = async () => {
    if (!department || !course || !semester || !feeType || !f.academic_year) {
      Alert.alert('Missing details', 'Choose department, course, semester, fee type and academic year.');
      return;
    }

    const amount = Number(f.amount);
    if (!f.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Check amount', 'Enter a fee amount greater than ₹0.');
      return;
    }

    const title = f.title.trim() || `${feeLabel(feeType)} · ${course} · Semester ${semester}`;
    const legacyAmountFields: Record<string, number> = {
      tuition_fee: feeType === 'tuition' ? amount : 0,
      admission_fee: feeType === 'admission' ? amount : 0,
      exam_fee: feeType === 'exam' ? amount : 0,
      transport_fee: feeType === 'transport' ? amount : 0,
      // The original schema has no separate library_fee column, so library is kept in other_fee too.
      other_fee: ['other', 'library'].includes(feeType) ? amount : 0,
    };

    setSaving(true);
    const { data: feePlan, error } = await supabase
      .from('fee_structures')
      .insert({
        title,
        academic_year: f.academic_year,
        department,
        course,
        semester: Number(semester),
        fee_type: feeType,
        amount,
        ...legacyAmountFields,
      })
      .select('id')
      .single();

    if (error || !feePlan) {
      setSaving(false);
      Alert.alert('Not saved', error?.message || 'Could not create the fee plan.');
      return;
    }

    // Assign the selected fee only to students in this department, course and semester.
    const { data: matchingStudents, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('department', department)
      .eq('course', course)
      .eq('semester', Number(semester));

    if (studentError) {
      setSaving(false);
      closeForm();
      q.reload();
      Alert.alert('Fee plan created', `The plan was saved, but student assignment failed: ${studentError.message}`);
      return;
    }

    if (matchingStudents?.length) {
      const assignments = matchingStudents.map((student: { id: string }) => ({
        student_id: student.id,
        fee_structure_id: feePlan.id,
        amount,
        fee_type: feeType,
        academic_year: f.academic_year,
        status: 'pending',
      }));
      const { error: assignmentError } = await supabase.from('student_fees').insert(assignments);
      if (assignmentError) {
        setSaving(false);
        closeForm();
        q.reload();
        Alert.alert('Fee plan created', `The plan was saved, but student fee records could not be created: ${assignmentError.message}`);
        return;
      }
    }

    setSaving(false);
    closeForm();
    q.reload();
    Alert.alert('Fee plan created', `${feeLabel(feeType)} saved. ${matchingStudents?.length ?? 0} matching student(s) assigned.`);
  };

  return (
    <Screen>
      <Header title="Fees" right={<CircleButton icon="plus" label="New fee plan" onPress={() => setShow(true)} />} />
      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : <>
          {!!q.error && <Empty text={q.error} error />}
          {!q.error && q.data.length === 0 && <Empty text="No fee plans yet. Tap + to add one." />}
          {q.data.map((item: any) => (
            <Row
              key={item.id}
              title={item.title}
              lines={[
                `${item.department} · ${item.course} · Sem ${item.semester ?? '—'}`,
                `${item.fee_type ? feeLabel(item.fee_type) : 'Fee plan'} · ${item.academic_year}`,
              ]}
              right={<Text style={{ fontSize: 18, color: C.text }}>{money(Number(item.amount ?? Number(item.tuition_fee || 0) + Number(item.admission_fee || 0) + Number(item.exam_fee || 0) + Number(item.transport_fee || 0) + Number(item.other_fee || 0)))}</Text>}
            />
          ))}
        </>}
      </Scroll>

      <Sheet visible={show} title="Create fee structure" onClose={closeForm}>
        <EnumPicker label="Department" value={department} options={DEPARTMENTS} onChange={setDepartment} placeholder="Select department" />
        <EnumPicker label="Course" value={course} options={COURSES} onChange={setCourse} placeholder="Select course" />
        <EnumPicker label="Semester" value={semester} options={SEMESTERS} onChange={setSemester} placeholder="Select semester" />
        <EnumPicker label="Type of fee" value={feeType} options={FEE_TYPES} onChange={setFeeType} placeholder="Select fee type" />
        <EnumPicker label="Academic year" value={f.academic_year} options={years} onChange={set('academic_year')} placeholder="Select academic year" />
        <Field label="Fee amount (₹)" value={f.amount} onChangeText={value => set('amount')(value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="Enter amount" />
        <Field label="Fee structure title (optional)" value={f.title} onChangeText={set('title')} placeholder="Auto-generated if left blank" />
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>
          The fee is assigned to students matching the selected department, course and semester.
        </Text>
        <Button title="Save fee structure" onPress={create} loading={saving} style={{ marginTop: 22 }} />
      </Sheet>
    </Screen>
  );
}
