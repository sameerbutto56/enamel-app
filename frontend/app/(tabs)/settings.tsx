import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { api, extractError } from "../../src/api/client";
import { COLORS } from "../../src/theme";
import { useAuth } from "../../src/api/AuthContext";

type WorkflowStep = {
  name: string;
  department_id: string;
  deadline_hours: number;
};

export default function WorkflowSettingsScreen() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products/stages");
      setSteps(data.workflow || []);
      setError(null);
    } catch (e: any) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const updateStep = (idx: number, patch: Partial<WorkflowStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { name: "New Stage", department_id: "new-dept", deadline_hours: 24 },
    ]);
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (steps.length < 2) {
      Alert.alert("Invalid workflow", "At least 2 steps are required.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/products/workflow", steps.map((s) => ({
        name: s.name.trim(),
        department_id: s.department_id.trim().toLowerCase(),
        deadline_hours: Number(s.deadline_hours),
      })));
      Alert.alert("Saved", "Workflow updated successfully.");
    } catch (e: any) {
      Alert.alert("Save failed", extractError(e));
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <Text style={styles.error}>Admin only</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} color={COLORS.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.kicker}>ADMIN CONFIG</Text>
        <Text style={styles.title}>Workflow Settings</Text>
        <Text style={styles.sub}>
          Manage stage sequence, department IDs, and deadline hours.
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}

        {steps.map((s, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.stepLabel}>STEP {idx + 1}</Text>
            <TextInput
              style={styles.input}
              value={s.name}
              onChangeText={(v) => updateStep(idx, { name: v })}
              placeholder="Stage name"
              placeholderTextColor={COLORS.textTertiary}
            />
            <TextInput
              style={styles.input}
              value={s.department_id}
              onChangeText={(v) => updateStep(idx, { department_id: v })}
              placeholder="Department ID"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={String(s.deadline_hours)}
              onChangeText={(v) =>
                updateStep(idx, {
                  deadline_hours: Number(v.replace(/[^0-9]/g, "")) || 1,
                })
              }
              keyboardType="numeric"
              placeholder="Deadline hours"
              placeholderTextColor={COLORS.textTertiary}
            />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeStep(idx)}>
              <Text style={styles.removeText}>REMOVE STEP</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addStep}>
          <Text style={styles.addText}>+ ADD STEP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>SAVE WORKFLOW</Text>
          )}
        </TouchableOpacity>
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
  error: { color: "#DC2626", fontWeight: "600", marginTop: 10 },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  stepLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "800",
    letterSpacing: 1,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    color: COLORS.text,
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    paddingVertical: 9,
  },
  removeText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: COLORS.text,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  addText: { color: COLORS.text, fontWeight: "800", letterSpacing: 1.2 },
  saveBtn: {
    marginTop: 10,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
  },
  saveText: { color: "#fff", fontWeight: "800", letterSpacing: 1.4 },
});
