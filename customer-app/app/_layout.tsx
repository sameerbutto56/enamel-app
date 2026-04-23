import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View } from 'react-native';
import { useAuthStore } from '../src/store';
import { COLORS } from '../src/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const EnamelsTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    primary: COLORS.brand.primary,
    card: COLORS.surface,
    text: COLORS.text.primary,
    border: COLORS.border.default,
  },
};

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await checkAuth();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();

    // Safety fallback: Hide splash screen after 5 seconds no matter what
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  if (!appReady) return null;

  return (
    <ThemeProvider value={EnamelsTheme}>
      <View style={Platform.OS === 'web' ? { flex: 1, maxWidth: 480, width: '100%', alignSelf: 'center', backgroundColor: COLORS.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } } : { flex: 1 }}>
        <Stack screenOptions={{ 
          headerStyle: { backgroundColor: COLORS.surface },
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="register" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="product/[id]" options={{ headerTitle: '' }} />
          <Stack.Screen name="order/[id]" options={{ headerTitle: 'Track Order' }} />
          <Stack.Screen name="checkout" options={{ headerTitle: 'Checkout' }} />
        </Stack>
        <StatusBar style="dark" />
      </View>
    </ThemeProvider>
  );
}
