import React, { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { getMe, homeFor } from '../lib/auth';
import { C, T } from '../lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const login = async () => {
    if (!email.trim() || !password) return setError('Enter your university mail and password.');
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (err) { setLoading(false); return setError('Wrong mail or password. Try again.'); }

    const me = await getMe();
    setLoading(false);
    if (!me) { await supabase.auth.signOut(); return setError('This account is not registered in UniCamp.'); }
    router.replace(homeFor(me.role) as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.loginBg }}>
      {/* doodles on both edges, as in the design */}
      <Image source={require('../assets/images/doodle-left.png')} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 39 }} />
      <Image source={require('../assets/images/doodle-right.png')} resizeMode="stretch" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 39 }} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 54 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 38 }}>
            <MaterialCommunityIcons name="book-open-page-variant" size={42} color="#5B50D6" />
            <View>
              <Text style={{ fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: C.black }}>UniCamp</Text>
              <Text style={{ fontSize: 12, color: C.text }}>Your university app</Text>
            </View>
          </View>

          <Text style={[T.label, { color: '#A3A3A3', marginBottom: 5 }]}>University mail</Text>
          <TextInput value={email} onChangeText={setEmail} style={input} accessibilityLabel="University mail"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="username"
            returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />

          <Text style={[T.label, { color: '#A3A3A3', marginBottom: 5, marginTop: 10 }]}>Password</Text>
          <View>
            <TextInput ref={passwordRef} value={password} onChangeText={setPassword} style={[input, { paddingRight: 44 }]} accessibilityLabel="Password"
              secureTextEntry={!show} autoCapitalize="none" autoComplete="password" textContentType="password"
              returnKeyType="go" onSubmitEditing={login} />
            <Pressable onPress={() => setShow(!show)} hitSlop={10} accessibilityLabel={show ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 14, top: 12 }}>
              <Feather name={show ? 'eye-off' : 'eye'} size={18} color={C.muted} />
            </Pressable>
          </View>

          {!!error && <Text accessibilityLiveRegion="polite" style={{ color: C.danger, marginTop: 10, fontSize: 13 }}>{error}</Text>}

          <Button title="Login" trailing="chevron-right" onPress={login} loading={loading} style={{ marginTop: 18, height: 48, borderRadius: 10 }} />

          <Pressable onPress={() => Alert.alert('Need help?', 'Use the mail and password given by your university. Forgot it? Ask your department office to reset it.')} hitSlop={10}>
            <Text style={{ textAlign: 'center', color: C.link, marginTop: 14, fontSize: 12 }}>Help?</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const input = { height: 46, backgroundColor: C.loginField, borderRadius: 11, paddingHorizontal: 14, fontSize: 15, color: C.text, borderWidth: 1, borderColor: '#C4CDD0' } as const;
