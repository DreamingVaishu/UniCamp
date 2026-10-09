import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { C, T } from '../lib/theme';

// Label + grey input. Takes every normal TextInput prop.
export default function Field({ label, style, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[T.label, { marginBottom: 5 }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A8A90"
        {...props}
        style={[{ minHeight: 48, backgroundColor: '#C9C9D2', borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: '#C0C0CA' }, props.multiline && { height: 100, paddingTop: 12, textAlignVertical: 'top' }, style]}
      />
    </View>
  );
}
