import React, { useState } from 'react';
import { View } from 'react-native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import CircleButton from '../../components/CircleButton';
import SearchBar from '../../components/SearchBar';
import Scroll from '../../components/Scroll';
import Sheet from '../../components/Sheet';
import Button from '../../components/Button';
import Row from '../../components/Row';
import EnumPicker from '../../components/EnumPicker';
import { Empty, Loading } from '../../components/Status';
import { COURSES, DEPARTMENTS, STUDENT_STATUSES } from '../../lib/enums';
import { supabase } from '../../lib/supabase';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';

export default function Students() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(false);
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');

  const q = useLoad(async () => ok(await supabase.from('students').select('*').order('full_name')), [] as any[]);

  const list = q.data.filter((s: any) =>
    s.full_name.toLowerCase().includes(search.trim().toLowerCase()) &&
    (!department || s.department === department) && (!course || s.course === course) && (!status || s.status === status));
  const active = [department, course, status].filter(Boolean).length;

  return (
    <Screen>
      <Header title="Students" right={<CircleButton icon="sliders" label={`Filters${active ? `, ${active} on` : ''}`} onPress={() => setFilters(true)} />} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search students" />
      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : <>
          {!!q.error && <Empty text={q.error} error />}
          {!q.error && list.length === 0 && <Empty text="No students match." />}
          {list.map((s: any) => (
            <Row key={s.id} title={s.full_name} lines={[`${s.admission_no} · ${s.roll_no}`, `${s.department} · ${s.course} · Div ${s.division || '-'} · Sem ${s.semester || '-'}`]} />
          ))}
        </>}
      </Scroll>

      <Sheet visible={filters} title="Filter students" onClose={() => setFilters(false)}>
        <EnumPicker label="Department" value={department} options={DEPARTMENTS} onChange={setDepartment} placeholder="All departments" />
        <EnumPicker label="Course" value={course} options={COURSES} onChange={setCourse} placeholder="All courses" />
        <EnumPicker label="Status" value={status} options={STUDENT_STATUSES} onChange={setStatus} placeholder="All statuses" />
        <View style={{ height: 22 }} />
        <Button title="Show results" onPress={() => setFilters(false)} />
        <Button title="Clear filters" color="#55555B" onPress={() => { setDepartment(''); setCourse(''); setStatus(''); }} style={{ marginTop: 10 }} />
      </Sheet>
    </Screen>
  );
}
