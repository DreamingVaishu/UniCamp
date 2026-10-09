import React from 'react';
import { TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { C } from '../lib/theme';

export default function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={{ backgroundColor: C.field, borderRadius: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginHorizontal: 12, marginBottom: 12 }}>
      <Feather name="search" size={18} color={C.muted} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#77777C" accessibilityLabel={placeholder}
        style={{ flex: 1, height: 42, marginLeft: 8, color: C.text }} />
    </View>
  );
}
