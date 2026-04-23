import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, extractError } from "../../src/api/client";
import { COLORS, getStageColor } from "../../src/theme";

type Product = {
  id: string;
  name: string;
  order_number: string;
  batch_number: string;
  current_stage: string;
  history: {
    stage: string;
    note?: string | null;
    changed_by: string;
    changed_at: string;
  }[];
  workflow_steps: {
    stage: string;
    department_id: string;
    status: string;
    deadline_at?: string | null;
  }[];
};

export default function TrackOrderScreen() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const search = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const key = orderNumber.trim().toUpperCase();
      const { data } = await api.get("/products", { params: { search: key } });
      const match = Array.isArray(data)
        ? data.find((p: Product) => (p.order_number || "").toUpperCase() === key)
        : null;
      if (!match) {
        setProduct(null);
        setError("Order not found");
      } else {
        setProduct(match);
      }
    } catch (e: any) {
      setProduct(null);
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.kicker}>ORDER LOOKUP</Text>
        <Text style={styles.title}>Track Order</Text>
        <Text style={styles.sub}>
          Enter order number once to see complete status and timeline.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={orderNumber}
            onChangeText={setOrderNumber}
            placeholder="e.g. ORD-1001"
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="characters"
            testID="track-order-input"
          />
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={search}
            disabled={loading}
            testID="track-order-search"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>SEARCH</Text>
            )}
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {product && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{product.name}</Text>
            <Text style={styles.cardMono}>
              ORDER {product.order_number} · BATCH {product.batch_number}
            </Text>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.sectionTitle}>CURRENT STATUS</Text>
              <View
                style={[
                  styles.stageBadge,
                  { borderColor: getStageColor(product.current_stage).border },
                ]}
              >
                <Text style={styles.stageText}>{product.current_stage}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>DEPARTMENT STEPS</Text>
            {product.workflow_steps.map((s, idx) => (
              <View key={`${s.stage}-${idx}`} style={styles.stepRow}>
                <Text style={styles.stepTitle}>{s.stage}</Text>
                <Text style={styles.stepMeta}>
                  DEPT {s.department_id.toUpperCase()} · {s.status.toUpperCase()}
                </Text>
                <Text style={styles.stepMeta}>
                  {s.deadline_at
                    ? `Deadline: ${new Date(s.deadline_at).toLocaleString()}`
                    : "Deadline starts when active"}
                </Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>HISTORY</Text>
            {[...product.history].reverse().map((h, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <Text style={styles.timelineStage}>{h.stage}</Text>
                <Text style={styles.timelineMeta}>
                  {new Date(h.changed_at).toLocaleString()} · {h.changed_by}
                </Text>
                {h.note ? <Text style={styles.timelineNote}>{h.note}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  title: { fontSize: 30, fontWeight: "900", color: COLORS.text, marginTop: 3 },
  sub: { color: COLORS.textSecondary, marginTop: 6, marginBottom: 14 },
  searchRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    color: COLORS.text,
  },
  btn: {
    width: 100,
    height: 46,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", letterSpacing: 1 },
  error: { marginTop: 12, color: "#DC2626", fontWeight: "600" },
  card: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  cardMono: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
  },
  stageBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  stageText: { fontWeight: "800", color: COLORS.text },
  stepRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 8,
    backgroundColor: COLORS.bg,
  },
  stepTitle: { fontWeight: "800", color: COLORS.text, fontSize: 13 },
  stepMeta: { marginTop: 3, color: COLORS.textSecondary, fontSize: 11 },
  timelineItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 9,
    marginBottom: 9,
  },
  timelineStage: { fontWeight: "800", color: COLORS.text },
  timelineMeta: { marginTop: 4, color: COLORS.textSecondary, fontSize: 11 },
  timelineNote: { marginTop: 4, color: COLORS.text, fontStyle: "italic" },
});
