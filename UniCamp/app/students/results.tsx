import React from 'react';
import { Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import { Empty, Loading } from '../../components/Status';
import { supabase } from '../../lib/supabase';
import { userId } from '../../lib/auth';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C, T } from '../../lib/theme';

const STATUS_COLOR: Record<string, string> = { pass: C.teal, fail: '#9B4A4A', absent: C.muted, withheld: '#8F7A3E' };

export default function Results() {
  // Only results that staff have published
  const q = useLoad(async () =>
    ok(await supabase.from('results').select('*').eq('student_id', await userId()).eq('published', true).order('semester').order('subject_name')),
    [] as any[]);

  const semesters = Array.from(new Set(q.data.map((r: any) => r.semester)));

  return (
    <Screen>
      <Header title="Results" />
      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : <>
          {!!q.error && <Empty text={q.error} error />}
          {!q.error && q.data.length === 0 && <Empty text="No results published yet." />}
          {semesters.map(sem => (
            <View key={sem} style={{ marginBottom: 12 }}>
              <Text style={[T.section, { margin: 14, marginBottom: 8 }]}>Semester {sem}</Text>
              {q.data.filter((r: any) => r.semester === sem).map((r: any) => (
                <View key={r.id} style={{ backgroundColor: C.surface, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: C.text }}>{r.subject_name}</Text>
                    <Text style={[T.small, { marginTop: 3 }]}>{Number(r.total_marks)} marks{r.grade ? `  ·  Grade ${r.grade}` : ''}</Text>
                  </View>
                  <View style={{ backgroundColor: STATUS_COLOR[r.status] || C.muted, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ color: C.white, fontSize: 12, textTransform: 'capitalize' }}>{r.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </>}
      </Scroll>
    </Screen>
  );
}
