import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/api/AuthContext";
import { COLORS } from "../src/theme";

export default function LoginScreen() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@enamels.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) router.replace("/(tabs)/dashboard");
  }, [user, router]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1759310348050-e64fead4f21a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwYWJzdHJhY3QlMjB0ZXh0dXJlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzY4NjcyOTF8MA&ixlib=rb-4.1.0&q=85",
        }}
        style={styles.hero}
        imageStyle={{ opacity: 0.85 }}
      >
        <View style={styles.heroOverlay} />
        <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
          <View style={styles.heroContent}>
            <View style={styles.logoMark} testID="enamels-logo">
              <Text style={styles.logoE}>E</Text>
            </View>
            <Text style={styles.heroTitle}>ENAMELS</Text>
            <Text style={styles.heroSub}>
              Production · Inventory · Real-time Tracking
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formWrap}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.formKicker}>ADMIN SIGN-IN</Text>
            <Text style={styles.formTitle}>Access your control room.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                testID="login-email-input"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="admin@enamels.com"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                testID="login-password-input"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            {error && (
              <Text style={styles.errorText} testID="login-error">
                {error}
              </Text>
            )}

            <TouchableOpacity
              testID="login-submit-button"
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>SIGN IN →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerMono}>
                v1.0 · INTERNAL USE ONLY · © ENAMELS
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  hero: {
    height: 260,
    width: "100%",
    justifyContent: "flex-end",
    backgroundColor: "#111827",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,24,39,0.6)",
  },
  heroContent: {
    padding: 24,
    paddingBottom: 32,
  },
  logoMark: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoE: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 4,
  },
  heroSub: {
    color: "#E5E7EB",
    marginTop: 8,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  formWrap: { flex: 1 },
  scroll: { padding: 24, paddingTop: 28 },
  formKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: COLORS.accent,
    marginBottom: 6,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  btn: {
    height: 52,
    backgroundColor: COLORS.text,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 14,
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 10,
    fontWeight: "600",
    fontSize: 13,
  },
  footer: { alignItems: "center", marginTop: 28 },
  footerMono: {
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.textTertiary,
    fontWeight: "700",
  },
});
