import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { C } from '../lib/theme';

// Full-width grey list row with a thin gap under it (channels, students, staff ...)
export default function Row({ title, lines = [], right, onPress }: {
  title: string; lines?: (string | undefined | null)[]; right?: React.ReactNode; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({ backgroundColor: C.surface, minHeight: 84, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 4, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: '500', color: C.text }}>{title}</Text>
        {lines.filter(Boolean).map((l, i) => <Text key={i} numberOfLines={2} style={{ color: C.muted, marginTop: 4 }}>{l}</Text>)}
      </View>
      {right}
    </Pressable>
  );
}
