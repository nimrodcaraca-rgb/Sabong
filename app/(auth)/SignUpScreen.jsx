import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import { Image } from 'react-native';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Account Created! 🐓',
        'Welcome to Sabong! Please check your email to verify your account, then sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Image
            source={require('../../assets/sabong_favicon.png')}
            style={{ width: 80, height: 80, marginBottom: 8 }}
            resizeMode="contain"
            />
            <Text style={styles.appName}>SABONG</Text>
          <Text style={styles.tagline}>Gamefowl Management System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your stable</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Juan dela Cruz"
            placeholderTextColor={COLORS.textmuted}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textmuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textmuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textmuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.black} />
              : <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 64 },
  appName: {
    fontSize: 36, fontWeight: '900', color: COLORS.gold,
    letterSpacing: 8, marginTop: 8,
  },
  tagline: { fontSize: 12, color: COLORS.textmuted, letterSpacing: 2, marginTop: 4 },
  card: {
    backgroundColor: COLORS.darkgray,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textmuted, marginBottom: 24 },
  label: { fontSize: 12, color: COLORS.textlight, fontWeight: '600', marginBottom: 6, letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.gray,
    borderRadius: 10,
    padding: 14,
    color: COLORS.white,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.black, fontWeight: '900', fontSize: 15, letterSpacing: 2 },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { color: COLORS.textmuted, fontSize: 13 },
  linkHighlight: { color: COLORS.gold, fontWeight: '700' },
});