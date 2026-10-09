import React from 'react';
import { Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Scroll from '../../components/Scroll';
import { Empty } from '../../components/Status';
import { ProfileBanner, Info } from '../../components/ProfileBanner';
import { supabase } from '../../lib/supabase';
import { userId } from '../../lib/auth';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C, T } from '../../lib/theme';

const count = async (table: string) => {
  const { count: total, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return total || 0;
};

export default function Home() {
  const q = useLoad(async () => {
    const admin = ok(await supabase.from('admin').select('*').eq('id', await userId()).single());
    const [students, staff, channels, fees] = await Promise.all([
      count('students'),
      count('staff'),
      count('channels'),
      count('fee_structures'),
    ]);
    return {
      admin,
      stats: [['Students', students], ['Staff', staff], ['Channels', channels], ['Fee plans', fees]] as [string, number][],
    };
  }, { admin: null as any, stats: [] as [string, number][] });

  const { admin, stats } = q.data;

  return (
    <Screen>
      <Header title="UniCamp" />
      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        <ProfileBanner label="Administrator" name={admin?.name} image={admin?.profile_image} subtitle="University management" />
        <View style={{ paddingHorizontal: 16 }}>
          {!!q.error && <Empty text={q.error} error />}
          <View style={{ borderWidth: 1, borderColor: '#C7C2CE', backgroundColor: '#E3E1E6', marginTop: 4 }}>
            <View style={{ minHeight: 42, backgroundColor: '#B5A3C9', justifyContent: 'center', paddingHorizontal: 12 }}>
              <Text style={{ color: '#332842', fontSize: 14, fontWeight: '700' }}>Administrator Information</Text>
            </View>
            <View style={{ padding: 12 }}>
              <Info label="Name" value={admin?.name} />
              <Info label="Email" value={admin?.email} />
              <Info label="Role" value="Administrator" />
            </View>
          </View>

          <Text style={[T.section, { marginTop: 28, marginBottom: 12 }]}>OVERVIEW</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {stats.map(([label, value]) => (
              <View key={label} style={{ width: '50%', padding: 4 }}>
                <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: '#D1D1D6', borderRadius: 10, minHeight: 108, padding: 15, justifyContent: 'space-between' }}>
                  <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
                  <Text style={{ fontSize: 30, color: C.text, fontWeight: '500' }}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Scroll>
    </Screen>
  );
}
