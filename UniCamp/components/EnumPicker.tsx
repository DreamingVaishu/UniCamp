import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Sheet from './Sheet';
import { C, T } from '../lib/theme';

// Simple reusable dropdown. Options are passed from lib/enums.ts or the screen itself.
export default function EnumPicker({ label, value, options, onChange, placeholder }: {
  label: string; value: string; options: readonly string[]; onChange: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const choices = placeholder ? ['', ...options] : options;
  const pick = (v: string) => { onChange(v); setOpen(false); };

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[T.label, { marginBottom: 5 }]}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`${label}: ${value || placeholder}`}
        style={{ minHeight: 46, backgroundColor: C.field, borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 15, color: value ? C.text : '#8A8A90' }}>{value || placeholder}</Text>
        <Feather name="chevron-down" size={18} color={C.muted} />
      </Pressable>
      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        {choices.map(o => (
          <Pressable key={o || 'none'} onPress={() => pick(o)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
            <Text style={{ flex: 1, fontSize: 16, color: C.text }}>{o || placeholder}</Text>
            {o === value && <Feather name="check" size={18} color={C.text} />}
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}
