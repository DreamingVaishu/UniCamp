import React from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CircleButton from './CircleButton';
import { C } from '../lib/theme';

// Pop-up panel that slides up from the bottom. Used for every form.
export default function Sheet({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#0007' }} />
        <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%', paddingBottom: insets.bottom + 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 4 }}>
            <Text style={{ flex: 1, fontSize: 19, fontWeight: '600', color: C.text }}>{title}</Text>
            <CircleButton icon="x" label="Close" size={32} onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 0 }}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
