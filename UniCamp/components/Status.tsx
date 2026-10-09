import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { C } from '../lib/theme';

export const Loading = () => <View style={{ padding: 40 }}><ActivityIndicator color={C.text} /></View>;

export const Empty = ({ text, error }: { text: string; error?: boolean }) => (
  <Text style={{ textAlign: 'center', color: error ? C.danger : C.muted, padding: 24 }}>{text}</Text>
);
