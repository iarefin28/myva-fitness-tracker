// auth/SignInScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { auth } from '../FirebaseConfig';

export default function SignInScreen() {
  const nav = useNavigation<any>();
  const scheme = useColorScheme();

  // Hide header exactly once (prevents re-mount/focus loss)
  useLayoutEffect(() => {
    nav.setOptions?.({ headerShown: false });
  }, [nav]);

  // THEME (same aesthetic)
  const backgroundColor = scheme === 'dark' ? '#000' : '#fff';
  const textColor = scheme === 'dark' ? '#fff' : '#0f172a';
  const cardColor = scheme === 'dark' ? '#101317' : '#f4f6f8';
  const dividerColor = scheme === 'dark' ? '#1f2937' : '#d1d5db';
  const subtleText = scheme === 'dark' ? '#94a3b8' : '#475569';
  const primary = scheme === 'dark' ? '#a7f3d0' : '#0ea5e9';
  const border = scheme === 'dark' ? '#243041' : '#cfe8ff';
  const danger = scheme === 'dark' ? '#fca5a5' : '#dc2626';

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);

  const onSignIn = useCallback(async () => {
    if (!email.trim() || !pw) return;
    try {
      setErr(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      Keyboard.dismiss();
    } catch (e: any) {
      setErr(e?.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }, [email, pw]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          {/* Logo / Title */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Ionicons name="barbell-outline" size={84} color={primary} />
            <Text style={{ marginTop: 10, fontSize: 24, fontWeight: '800', color: textColor }}>
              Welcome back to MYVA
            </Text>
            <Text style={{ marginTop: 6, color: subtleText }}>
              Sign in to continue your grind
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: cardColor,
              borderRadius: 14,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: border,
            }}
          >
            {/* Email */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 16,
              }}
            >
              <Ionicons name="mail-outline" size={20} color={subtleText} style={{ marginRight: 12 }} />
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => pwRef.current?.focus()}
                style={{ flex: 1, color: textColor, fontSize: 16, paddingVertical: 4 }}
                importantForAutofill="yes"
              />
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: dividerColor, opacity: 0.4 }} />

            {/* Password */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 16,
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={subtleText} style={{ marginRight: 12 }} />
              <TextInput
                ref={pwRef}
                value={pw}
                onChangeText={setPw}
                placeholder="Password"
                placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                blurOnSubmit={false}
                onSubmitEditing={onSignIn}
                style={{ flex: 1, color: textColor, fontSize: 16, paddingVertical: 4 }}
                importantForAutofill="yes"
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={8} activeOpacity={0.6}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={subtleText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error lane (reserved height to avoid layout jumps) */}
          <View style={{ minHeight: 22, marginTop: 10 }}>
            {!!err && <Text style={{ color: danger, textAlign: 'center' }}>{err}</Text>}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={onSignIn}
            disabled={loading || !email.trim() || !pw}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              backgroundColor: scheme === 'dark' ? '#0f172a' : '#e6f4ff',
              borderWidth: 1,
              borderColor: scheme === 'dark' ? '#334155' : '#bae6fd',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              opacity: loading || !email.trim() || !pw ? 0.6 : 1,
            }}
          >
            <Text style={{ color: textColor, fontWeight: '800' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={{ marginTop: 16, textAlign: 'center', color: subtleText }}>
            New here?{' '}
            <Text
              onPress={() => nav.navigate('SignUp')}
              style={{ fontWeight: '700', textDecorationLine: 'underline', color: primary }}
            >
              Create an account
            </Text>
          </Text>

          {/* Spacer so the button/links don’t get covered by keyboard */}
          <View style={{ height: 24 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
