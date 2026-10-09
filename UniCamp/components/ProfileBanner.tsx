import React from 'react';
import { Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Initials from './Initials';
import { C, T } from '../lib/theme';

// Profile header shared by student and staff home screens.
export function ProfileBanner({ name, image, subtitle, label = 'Student name' }: { name?: string; image?: string | null; subtitle?: string; label?: string }) {
  return (
    <View style={{ marginTop: 8, marginBottom: 26 }}>
      <View style={{ height: 126, backgroundColor: C.purple, paddingHorizontal: 24, justifyContent: 'center', overflow: 'hidden' }}>
        <Feather name="book-open" size={90} color="#FFFFFF12" style={{ position: 'absolute', left: 150 }} />
        <Text style={{ color: '#D1C4DF', fontSize: 12 }}>{label}</Text>
        <Text numberOfLines={2} style={{ color: C.white, fontSize: 20, fontWeight: '500', marginTop: 4, maxWidth: '57%' }}>{name || 'Welcome'}</Text>
        {!!subtitle && <Text numberOfLines={1} style={{ color: '#E6DDEC', fontSize: 12, marginTop: 8 }}>{subtitle}</Text>}
      </View>
      <View style={{ position: 'absolute', right: 8, top: -10, borderWidth: 5, borderColor: C.bg, borderRadius: 100, backgroundColor: C.bg, elevation: 3 }}>
        <Initials name={name} image={image} size={150} />
      </View>
    </View>
  );
}

export function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={T.label}>{label}</Text>
      <Text style={[T.value, { marginTop: 3 }]}>{value || '—'}</Text>
    </View>
  );
}

export function NoticeBox({ items, emptyText = 'No notices yet.' }: { items: any[]; emptyText?: string }) {
  return (
    <View style={{ gap: 10 }}>
      {items.length === 0 && <View style={{ backgroundColor: C.surface, borderRadius: 12, minHeight: 94, justifyContent: 'center', padding: 18 }}><Text style={{ color: C.muted, textAlign: 'center' }}>{emptyText}</Text></View>}
      {items.map((n) => (
        <View key={n.id} style={{ backgroundColor: C.surface, borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#D1D1D6' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{n.title}</Text>
          <Text style={{ marginTop: 5, color: C.text, lineHeight: 20 }}>{n.description}</Text>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 9 }}>{new Date(n.created_at).toLocaleDateString('en-IN')}</Text>
        </View>
      ))}
    </View>
  );
}
