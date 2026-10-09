import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import CircleButton from './CircleButton';
import Initials from './Initials';
import { getMe } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { C, T } from '../lib/theme';

// Top bar.  Normal page: menu icon + title.   Inner page (`back`): round back button.
// `right` is any button you want on the right side.
export default function Header({ title, back, right, large }: {
  title: string; back?: boolean; right?: React.ReactNode; large?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <>
    <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 14 }}>
      {back
        ? <CircleButton icon="chevron-left" label="Go back" size={34} onPress={() => router.back()} />
        : <Pressable onPress={() => setMenu(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open menu">
            <Feather name="menu" size={26} color={C.text} />
          </Pressable>}
      <Text numberOfLines={1} style={[T.title, { flex: 1 }, large && { fontSize: 22 }]}>{title}</Text>
      {right}
    </View>
    {!back && <Menu visible={menu} onClose={() => setMenu(false)} />}
    </>
  );
}

// Side drawer: profile, role-specific navigation, and log out.
function Menu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [me, setMe] = useState<any>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => { if (visible) getMe().then(setMe); }, [visible]);

  const p = me?.profile || {};
  const name = p.full_name || p.username || p.name || '';
  const menuItems: { label: string; path: string; icon: React.ComponentProps<typeof Feather>['name'] }[] =
    me?.role === 'admin'
      ? [
          { label: 'Dashboard', path: '/admin/home', icon: 'home' },
          { label: 'Staff', path: '/admin/staff', icon: 'users' },
          { label: 'Students', path: '/admin/students', icon: 'user-check' },
          { label: 'Fee Management', path: '/admin/fees', icon: 'credit-card' },
        ]
      : me?.role === 'staff'
      ? [
          { label: 'Dashboard', path: '/staff/home', icon: 'home' },
          { label: 'Students', path: '/staff/students', icon: 'users' },
          { label: 'Attendance', path: '/staff/attendance', icon: 'check-square' },
          { label: 'Results', path: '/staff/results', icon: 'book-open' },
          { label: 'Channels', path: '/staff/channels', icon: 'message-square' },
        ]
      : [
          { label: 'Home', path: '/students/home', icon: 'home' },
          { label: 'Channels', path: '/students/channels', icon: 'message-square' },
          { label: 'Fees', path: '/students/fees', icon: 'credit-card' },
          { label: 'Results', path: '/students/results', icon: 'award' },
          { label: 'Profile', path: '/students/profile', icon: 'user' },
        ];

  const navigate = (path: string) => {
    onClose();
    router.navigate(path as any);
  };
  const logout = async () => {
    onClose();
    await supabase.auth.signOut();
    router.replace('/autho');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: 300, maxWidth: '86%', backgroundColor: C.bg, height: '100%' }}>
          <View style={{ backgroundColor: C.purple, paddingTop: insets.top + 24, padding: 24 }}>
            <Initials name={name} image={p.profile_image} size={64} />
            <Text style={{ color: C.white, fontSize: 18, marginTop: 12 }}>{name || 'UniCamp'}</Text>
            <Text style={{ color: '#E7E2EF', marginTop: 2 }}>{p.email || ''}</Text>
            {me && <Text style={{ color: '#E7E2EF', marginTop: 4, textTransform: 'capitalize' }}>{me.role}</Text>}
          </View>
          <View style={{ paddingTop: 12, flex: 1 }}>
            {menuItems.map(item => (
              <Pressable
                key={item.path}
                onPress={() => navigate(item.path)}
                accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 15, backgroundColor: pressed ? '#E8E3ED' : 'transparent' })}
              >
                <Feather name={item.icon} size={20} color={C.text} />
                <Text style={{ fontSize: 15, color: C.text, fontWeight: '500' }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={logout} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#D9D5DE', marginBottom: insets.bottom }}>
            <Feather name="log-out" size={20} color={C.danger} />
            <Text style={{ fontSize: 16, color: C.danger }}>Log out</Text>
          </Pressable>
        </View>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#0007' }} accessibilityRole="button" accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}
