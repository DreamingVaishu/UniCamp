import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { C } from '../lib/theme';

// Main button. `trailing` puts an arrow icon on the right (like the Login button).
export default function Button({ title, onPress, loading, disabled, trailing, color = C.black, style }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  trailing?: React.ComponentProps<typeof Feather>['name']; color?: string; style?: object;
}) {
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button"
      style={({ pressed }) => [{ height: 48, borderRadius: 12, backgroundColor: color, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={C.white} /> : <Text style={{ color: C.white, fontSize: 15, fontWeight: '600' }}>{title}</Text>}
      {trailing && !loading && <Feather name={trailing} size={18} color={C.white} style={{ position: 'absolute', right: 18 }} />}
    </Pressable>
  );
}
