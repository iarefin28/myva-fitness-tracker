// auth/SignUpScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
import { auth, db } from '../FirebaseConfig';

export default function SignUpScreen() {
  const nav = useNavigation<any>();
  const scheme = useColorScheme();

  // Hide header once to avoid re-mount/focus loss
  useLayoutEffect(() => {
    nav.setOptions?.({ headerShown: false });
  }, [nav]);

  // THEME — keep MYVA vibe
  const backgroundColor = scheme === 'dark' ? '#000' : '#fff';
  const textColor = scheme === 'dark' ? '#fff' : '#0f172a';
  const cardColor = scheme === 'dark' ? '#101317' : '#f4f6f8';
  const dividerColor = scheme === 'dark' ? '#1f2937' : '#d1d5db';
  const subtleText = scheme === 'dark' ? '#94a3b8' : '#475569';
  const primary = scheme === 'dark' ? '#a7f3d0' : '#0ea5e9';
  const border = scheme === 'dark' ? '#243041' : '#cfe8ff';
  const danger = scheme === 'dark' ? '#fca5a5' : '#dc2626';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);

  const onSignUp = useCallback(async () => {
    if (!email.trim() || !pw) return;
    try {
      setErr(null);
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);

      const cleanName = displayName.trim();
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
      }

      /*
        For the first MYVA user this setDoc code will create the users collection in Firestore. The users collection will contain all information relevant to the user specifically 
        and it is a precursor to the social ecosystem of MYVA. The schema of this collection is currently defined below for phase one. If new fields are added, 
        adding it below will add it for new users. If adding fields later, need to look into adding the fields for old users but this should not be a problem now since MYVA will 
        initially have just 2 users. 
      */
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cleanName || null,

        // SOCIAL FOUNDATION
        friends: [], // accepted friends
        coaches: [], // future use 
        trainees: [], // future use with coaches array

        // FUTURE-PROOF SETTINGS
        settings: {
          theme: "system",
        },

        createdAt: serverTimestamp(),
      });

      Keyboard.dismiss();
    } catch (e: any) {
      setErr(e?.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }, [displayName, email, pw]);

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
              Create your account
            </Text>
            <Text style={{ marginTop: 6, color: subtleText }}>
              Spawn a new character and save your runs
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
            {/* Display Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }}>
              <Ionicons name="person-circle-outline" size={20} color={subtleText} style={{ marginRight: 12 }} />
              <TextInput
                ref={nameRef}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name (optional)"
                placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
                style={{ flex: 1, color: textColor, fontSize: 16, paddingVertical: 4 }}
              />
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: dividerColor, opacity: 0.4 }} />

            {/* Email */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }}>
              <Ionicons name="mail-outline" size={20} color={subtleText} style={{ marginRight: 12 }} />
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
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
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }}>
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
                textContentType="newPassword"
                returnKeyType="done"
                blurOnSubmit={false}
                onSubmitEditing={onSignUp}
                style={{ flex: 1, color: textColor, fontSize: 16, paddingVertical: 4 }}
                importantForAutofill="yes"
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={8} activeOpacity={0.6}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={subtleText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error lane */}
          <View style={{ minHeight: 22, marginTop: 10 }}>
            {!!err && <Text style={{ color: danger, textAlign: 'center' }}>{err}</Text>}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={onSignUp}
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
              {loading ? 'Creating…' : 'Create account'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={{ marginTop: 16, textAlign: 'center', color: subtleText }}>
            Already have an account?{' '}
            <Text
              onPress={() => nav.navigate('SignIn')}
              style={{ fontWeight: '700', textDecorationLine: 'underline', color: primary }}
            >
              Sign in
            </Text>
          </Text>

          <View style={{ height: 24 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
