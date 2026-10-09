import React from 'react';
import { Image, Text, View } from 'react-native';
import { C } from '../lib/theme';
import { initials } from '../lib/helpers';

// Round avatar: the photo if there is one, otherwise the person's initials.
export default function Initials({ name, image, size = 56 }: { name?: string; image?: string | null; size?: number }) {
  if (image) return <Image source={{ uri: image }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.navy2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.white, fontSize: size / 3, fontWeight: '600' }}>{initials(name)}</Text>
    </View>
  );
}
