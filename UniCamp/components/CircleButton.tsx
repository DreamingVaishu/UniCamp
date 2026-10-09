import React from 'react';
import { Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { C } from '../lib/theme';

// Round grey icon button (back, more, search, add ...)
export default function CircleButton({ icon, onPress, label, size = 36 }: {
  icon: React.ComponentProps<typeof Feather>['name']; onPress: () => void; label: string; size?: number;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: C.circle, borderWidth: 1, borderColor: '#C7C7CB', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Feather name={icon} size={size * 0.55} color={C.text} />
    </Pressable>
  );
}
