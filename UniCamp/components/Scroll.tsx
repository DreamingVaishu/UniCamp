import React from 'react';
import { RefreshControl, ScrollView, ScrollViewProps } from 'react-native';

// ScrollView with pull-to-refresh. Pass the object returned by useLoad as `load`.
export default function Scroll({ load, children, ...props }: { load?: { refreshing: boolean; refresh: () => void } } & ScrollViewProps) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled"
      refreshControl={load ? <RefreshControl refreshing={load.refreshing} onRefresh={load.refresh} /> : undefined}
      {...props}>
      {children}
    </ScrollView>
  );
}
