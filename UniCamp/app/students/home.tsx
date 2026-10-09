import React from 'react';
import { View } from 'react-native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import { Empty } from '../../components/Status';
import { NoticeBox, ProfileBanner } from '../../components/ProfileBanner';
import Feather from '@expo/vector-icons/Feather';
import { supabase } from '../../lib/supabase';
import { userId } from '../../lib/auth';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { Text } from 'react-native';
import { C, T } from '../../lib/theme';

export default function Home() {
  const q = useLoad(async () => {
    const id = await userId();
    const student = ok(await supabase.from('students').select('*').eq('id', id).single());
    const notices = ok(await supabase.from('announcements').select('*').eq('department', student.department).order('created_at', { ascending: false }).limit(5));
    return { student, notices };
  }, { student: null as any, notices: [] as any[] });

  const { student, notices } = q.data;

  return (
    <Screen>
      <Header title="CSMU" />
      <Scroll load={q}>
        <ProfileBanner name={student?.full_name} image={student?.profile_image} subtitle={student?.roll_no ? `Roll No · ${student.roll_no}` : undefined} />
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}>
          {!!q.error && <Empty text={q.error} error />}
          <View style={{ borderWidth: 1, borderColor: '#C7C2CE', backgroundColor: '#E3E1E6', marginTop: 10 }}>
            <View style={{ minHeight: 42, backgroundColor: '#B5A3C9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 }}>
              <Feather name="book-open" size={19} color="#4C3568" />
              <Text style={{ color: '#332842', fontSize: 14, fontWeight: '700' }}>Academic Information</Text>
            </View>
            {[
              ['Department', student?.department],
              ['Course', student?.course],
              ['Division', student?.division],
              ['Semester', student?.semester ? String(student.semester) : undefined],
              ['Roll No', student?.roll_no],
              ['Admission No', student?.admission_no],
            ].map(([label, value]) => (
              <View key={label} style={{ flexDirection: 'row', paddingHorizontal: 11, paddingVertical: 8, gap: 6 }}>
                <Text style={{ color: '#45434A', fontSize: 13 }}>{label}:</Text>
                <Text style={{ color: C.text, fontSize: 13, flex: 1 }}>{value || '—'}</Text>
              </View>
            ))}
          </View>
          <Text style={[T.section, { marginTop: 28, marginBottom: 12, letterSpacing: 0.4 }]}>NOTICE</Text>
          <NoticeBox items={notices} />
        </View>
      </Scroll>
    </Screen>
  );
}
