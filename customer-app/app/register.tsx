import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store';
import { COLORS, TYPOGRAPHY, SPACING } from '../src/theme';
import Button from '../src/components/Button';
import Input from '../src/components/Input';

const LOGIN_BG = 'https://images.unsplash.com/photo-1759310348050-e64fead4f21a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwYWJzdHJhY3QlMjB0ZXh0dXJlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY4NjcyOTF8MA&ixlib=rb-4.1.0&q=85';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ name, email, password, phone });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ImageBackground source={{ uri: LOGIN_BG }} style={styles.background}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={TYPOGRAPHY.mono}>Create Account</Text>
            <Text style={[TYPOGRAPHY.h1, styles.title]}>ENAMELS</Text>
            
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
            />

            <Input
              label="Phone (Optional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone"
              keyboardType="phone-pad"
            />
            
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Choose a password"
              secureTextEntry
            />
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />
            
            <TouchableOpacity onPress={() => router.back()} style={styles.link}>
              <Text style={TYPOGRAPHY.small}>Already have an account? <Text style={styles.linkText}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    marginBottom: SPACING.xl,
    marginTop: SPACING.xs,
  },
  button: {
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: COLORS.brand.accent,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  link: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.brand.accent,
    fontWeight: '700',
  },
});
