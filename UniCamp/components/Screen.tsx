import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../lib/theme';

// Page wrapper. Use `stack` for pages that have no bottom tab bar.
export default function Screen({ children, stack }: { children: React.ReactNode; stack?: boolean }) {
  return (
    <SafeAreaView edges={stack ? ['top', 'bottom'] : ['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      {children}
    </SafeAreaView>
  );
}
