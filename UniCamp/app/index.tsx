import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { getMe, homeFor } from '../lib/auth';
import { C } from '../lib/theme';

// First screen: check who is logged in and send them to the right place.
export default function Index() {
  useEffect(() => {
    getMe()
      .then(me => router.replace(me ? (homeFor(me.role) as any) : '/autho'))
      .catch(() => router.replace('/autho'));
  }, []);
  return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.text} /></View>;
}
