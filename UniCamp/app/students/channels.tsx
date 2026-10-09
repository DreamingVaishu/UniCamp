import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import CircleButton from '../../components/CircleButton';
import SearchBar from '../../components/SearchBar';
import Scroll from '../../components/Scroll';
import Row from '../../components/Row';
import { Empty, Loading } from '../../components/Status';
import { supabase } from '../../lib/supabase';
import { userId } from '../../lib/auth';
import { ok } from '../../lib/helpers';
import { useLoad } from '../../lib/useLoad';
import { C, T } from '../../lib/theme';

export default function Channels() {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [joining, setJoining] = useState('');

  // Channels of my department, split into "joined" and "discover"
  const q = useLoad(async () => {
    const id = await userId();
    const me = ok(await supabase.from('students').select('department').eq('id', id).single());
    const mine = ok(await supabase.from('channel_members').select('channel_id').eq('user_id', id));
    const all = ok(await supabase.from('channels').select('*').eq('department', me.department).order('created_at', { ascending: false }));
    const ids = mine.map((m: any) => m.channel_id);
    return { joined: all.filter((c: any) => ids.includes(c.id)), discover: all.filter((c: any) => !ids.includes(c.id)) };
  }, { joined: [] as any[], discover: [] as any[] });

  const join = async (channelId: string) => {
    setJoining(channelId);
    const { error } = await supabase.from('channel_members').insert({ channel_id: channelId, user_id: await userId() });
    setJoining('');
    if (error) return Alert.alert('Could not join', 'Please try again.');
    q.reload();
  };

  const match = (c: any) => c.name.toLowerCase().includes(search.trim().toLowerCase());
  const joined = q.data.joined.filter(match);
  const discover = q.data.discover.filter(match);
  const open = (id: string) => router.push({ pathname: '/channel/[channelId]', params: { channelId: id } });

  return (
    <Screen>
      <Header title="Channels" right={<CircleButton icon={showSearch ? 'x' : 'search'} label="Search channels" onPress={() => { setShowSearch(!showSearch); setSearch(''); }} />} />
      {showSearch && <SearchBar value={search} onChange={setSearch} placeholder="Search channels" />}

      <Scroll load={q} contentContainerStyle={{ paddingBottom: 24 }}>
        {q.loading ? <Loading /> : (
          <>
            {!!q.error && <Empty text={q.error} error />}
            <View style={{ marginTop: 4 }}>
              {joined.map(c => <Row key={c.id} title={c.name} lines={[c.description]} onPress={() => open(c.id)} />)}
              {joined.length === 0 && !q.error && <Empty text={search ? 'No joined channel matches your search.' : 'You have not joined any channel yet.'} />}
            </View>

            <Text style={[T.section, { margin: 10, marginTop: 28 }]}>Discover</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5 }}>
              {discover.map(c => (
                <View key={c.id} style={{ width: '50%', padding: 3 }}>
                  <View style={{ backgroundColor: C.surface, minHeight: 156, padding: 12 }}>
                    <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: '500', color: C.text }}>{c.name}</Text>
                    <Text numberOfLines={3} style={{ color: C.muted, marginTop: 4, fontSize: 12 }}>{c.description}</Text>
                    <Pressable onPress={() => join(c.id)} disabled={joining === c.id} accessibilityRole="button" accessibilityLabel={`Join ${c.name}`}
                      style={{ position: 'absolute', right: 12, bottom: 12, backgroundColor: C.dark, borderRadius: 5, paddingHorizontal: 18, paddingVertical: 5, opacity: joining === c.id ? 0.5 : 1 }}>
                      <Text style={{ color: C.white, fontSize: 12 }}>{joining === c.id ? 'Joining' : 'Join'}</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            {discover.length === 0 && !q.error && <Empty text="No new channels to discover." />}
          </>
        )}
      </Scroll>
    </Screen>
  );
}
