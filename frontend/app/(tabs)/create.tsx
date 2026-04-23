import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { api, extractError } from "../../src/api/client";
import { COLORS } from "../../src/theme";

export default function CreateProduct() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [batch, setBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name || !orderNumber || !batch) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/products", {
        name: name.trim(),
        order_number: orderNumber.trim(),
        batch_number: batch.trim(),
      });
      setName("");
      setOrderNumber("");
      setBatch("");
      Alert.alert("Product Created", `${data.name} is now at "Order Received".`, [
        {
          text: "View",
          onPress: () => router.push(`/product/${data.id}`),
        },
        { text: "OK", style: "cancel" },
      ]);
    } catch (e: any) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.kicker}>NEW ENTRY</Text>
            <Text style={styles.title}>Create Product</Text>
            <Text style={styles.sub}>
              A new routing slip starts at stage 1 — Order Received.
            </Text>

            <View style={styles.card}>
              <Field
                label="PRODUCT NAME"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Cobalt Blue Mug"
                testID="create-name-input"
              />
              <Field
                label="ORDER NUMBER"
                value={orderNumber}
                onChangeText={setOrderNumber}
                placeholder="e.g. #1024"
                autoCapitalize="characters"
                testID="create-order-number-input"
              />
              <Field
                label="BATCH NUMBER"
                value={batch}
                onChangeText={setBatch}
                placeholder="e.g. B-2026-14"
                autoCapitalize="characters"
                testID="create-batch-input"
              />
            </View>

            {error && (
              <Text style={styles.error} testID="create-error">
                {error}
              </Text>
            )}

            <TouchableOpacity
              testID="create-submit-button"
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>CREATE PRODUCT →</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footnote}>
              Once created, this product can be advanced through 7 production
              stages. Full history is permanently tracked.
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  testID,
  ...props
}: {
  label: string;
  testID: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.textTertiary}
        testID={testID}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  kicker: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -1,
    marginTop: 2,
  },
  sub: { color: COLORS.textSecondary, marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
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
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  btn: {
    height: 52,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 14,
  },
  error: { color: "#DC2626", marginTop: 12, fontWeight: "600" },
  footnote: {
    marginTop: 22,
    color: COLORS.textTertiary,
    fontSize: 12,
    lineHeight: 18,
  },
});
