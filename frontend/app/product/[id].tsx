import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, extractError } from "../../src/api/client";
import {
  COLORS,
  STAGES,
  getStageColor,
  nextStage,
  stageIndex,
} from "../../src/theme";
import StageChip from "../../src/components/StageChip";
import { socket } from "../../src/api/socket";
import { useAuth } from "../../src/api/AuthContext";

type HistoryEntry = {
  stage: string;
  note?: string | null;
  changed_by: string;
  changed_at: string;
};

type Product = {
  id: string;
  name: string;
  order_number: string;
  batch_number: string;
  current_stage: string;
  current_department_id: string;
  workflow_steps: {
    index: number;
    stage: string;
    department_id: string;
    deadline_hours: number;
    status: string;
    deadline_at?: string | null;
    completed_at?: string | null;
    completed_by?: string | null;
  }[];
  history: HistoryEntry[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

export default function ProductDetail() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pickedStage, setPickedStage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      setError(null);
    } catch (e: any) {
      setError(extractError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  React.useEffect(() => {
    const off = socket.on("product_updated", (p: Product) => {
      if (p && p.id === id) setProduct(p);
    });
    return () => off();
  }, [id]);

  const handleAdvance = () => {
    const nxt = product ? nextStage(product.current_stage) : null;
    setPickedStage(nxt);
    setNote("");
    setModalOpen(true);
  };

  const submitStage = async () => {
    if (!product || !pickedStage) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/products/${product.id}/stage`, {
        stage: pickedStage,
        note: note.trim() || null,
      });
      setProduct(data);
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert("Unable to update", extractError(e));
    } finally {
      setSaving(false);
    }
  };

  const completeMyStep = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/products/${product.id}/complete-step`, {
        note: "Step completed",
      });
      setProduct(data);
    } catch (e: any) {
      Alert.alert("Unable to complete", extractError(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={COLORS.text} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  if (error || !product)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <BackBtn onPress={() => router.back()} />
          <Text style={styles.error}>{error || "Product not found"}</Text>
        </View>
      </SafeAreaView>
    );

  const currentIdx = stageIndex(product.current_stage);
  const canAdvance = currentIdx < STAGES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <BackBtn onPress={() => router.back()} />

        <Text style={styles.kicker}>ROUTING SLIP</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.mono}>
          ORDER {product.order_number} · BATCH {product.batch_number}
        </Text>

        <View style={{ marginTop: 14 }}>
          <StageChip stage={product.current_stage} />
        </View>

        {/* Progress dots */}
        <View style={styles.progress}>
          {STAGES.map((s, i) => {
            const past = i < currentIdx;
            const current = i === currentIdx;
            const c = getStageColor(s);
            return (
              <View key={s} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    past && { backgroundColor: COLORS.text },
                    current && { backgroundColor: c.dot },
                    !past && !current && {
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      borderWidth: 1,
                    },
                  ]}
                />
                {i < STAGES.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      past && { backgroundColor: COLORS.text },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {user?.role === "employee" ? (
          <TouchableOpacity
            testID="complete-step-button"
            style={styles.advanceBtn}
            onPress={completeMyStep}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.advanceText}>COMPLETE MY STEP → NEXT</Text>
            )}
          </TouchableOpacity>
        ) : canAdvance && (
          <TouchableOpacity
            testID="advance-stage-button"
            style={styles.advanceBtn}
            onPress={handleAdvance}
            activeOpacity={0.85}
          >
            <Text style={styles.advanceText}>
              ADVANCE → {nextStage(product.current_stage)?.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}

        {user?.role === "admin" && (
          <TouchableOpacity
            testID="change-stage-button"
            style={[styles.secondaryBtn, !canAdvance && { marginTop: 22 }]}
            onPress={() => {
              setPickedStage(product.current_stage);
              setNote("");
              setModalOpen(true);
            }}
          >
            <Text style={styles.secondaryText}>CHANGE STAGE…</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>STEP DEADLINES</Text>
        <View style={styles.timeline}>
          {product.workflow_steps?.map((s) => (
            <View key={`${s.stage}-${s.index}`} style={styles.deadlineRow}>
              <Text style={styles.deadlineStage}>{s.stage}</Text>
              <Text style={styles.deadlineMeta}>
                DEPT {s.department_id.toUpperCase()} · {s.status.toUpperCase()}
              </Text>
              <Text style={styles.deadlineMeta}>
                {s.deadline_at
                  ? `Due ${new Date(s.deadline_at).toLocaleString()}`
                  : "Deadline starts when step becomes active"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>FULL TIMELINE</Text>

        <View style={styles.timeline} testID="product-timeline">
          {[...product.history].reverse().map((h, idx, arr) => {
            const c = getStageColor(h.stage);
            const isLatest = idx === 0;
            return (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineNodeCol}>
                  <View
                    style={[
                      styles.node,
                      {
                        backgroundColor: isLatest ? c.dot : COLORS.text,
                        borderColor: isLatest ? c.dot : COLORS.text,
                      },
                    ]}
                  />
                  {idx !== arr.length - 1 && <View style={styles.stem} />}
                </View>
                <View style={styles.timelineContent}>
                  <StageChip stage={h.stage} size="sm" />
                  <Text style={styles.tlTime}>
                    {new Date(h.changed_at).toLocaleString()}
                  </Text>
                  {h.note ? (
                    <Text style={styles.tlNote}>{`"${h.note}"`}</Text>
                  ) : null}
                  <Text style={styles.tlBy}>By {h.changed_by}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalRoot}
        >
          <TouchableOpacity
            style={styles.modalBg}
            activeOpacity={1}
            onPress={() => setModalOpen(false)}
          />
          <View style={styles.modalSheet} testID="stage-update-modal">
            <Text style={styles.modalKicker}>STAGE UPDATE</Text>
            <Text style={styles.modalTitle}>Choose new stage</Text>

            <ScrollView style={{ maxHeight: 280 }}>
              {STAGES.map((s) => {
                const selected = pickedStage === s;
                const isCurrent = s === product.current_stage;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setPickedStage(s)}
                    style={[
                      styles.stageOption,
                      selected && {
                        borderColor: COLORS.text,
                        backgroundColor: "#F3F4F6",
                      },
                    ]}
                    testID={`stage-option-${s}`}
                  >
                    <View
                      style={[
                        styles.radio,
                        selected && { backgroundColor: COLORS.text },
                      ]}
                    />
                    <Text style={styles.stageOptionText}>{s}</Text>
                    {isCurrent && (
                      <Text style={styles.currentTag}>CURRENT</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 14 }]}>NOTE (OPTIONAL)</Text>
            <TextInput
              testID="stage-note-input"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Passed final inspection"
              placeholderTextColor={COLORS.textTertiary}
              style={styles.noteInput}
              multiline
            />

            <TouchableOpacity
              testID="submit-stage-update"
              style={[
                styles.confirmBtn,
                (saving || !pickedStage || pickedStage === product.current_stage) && {
                  opacity: 0.5,
                },
              ]}
              onPress={submitStage}
              disabled={
                saving || !pickedStage || pickedStage === product.current_stage
              }
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>CONFIRM UPDATE</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalOpen(false)}
              style={{ paddingVertical: 10, alignItems: "center" }}
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.backBtn}
      testID="back-button"
    >
      <Ionicons name="arrow-back" size={20} color={COLORS.text} />
      <Text style={styles.backText}>BACK</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: COLORS.text,
  },
  kicker: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  mono: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: 6,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  progressItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  progressDot: { width: 12, height: 12 },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  advanceBtn: {
    marginTop: 22,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    alignItems: "center",
  },
  advanceText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 1.5,
    fontSize: 13,
  },
  secondaryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.text,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: COLORS.text,
    fontWeight: "800",
    letterSpacing: 1.5,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    marginTop: 32,
    marginBottom: 12,
  },
  timeline: {},
  deadlineRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 10,
    marginBottom: 8,
  },
  deadlineStage: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  deadlineMeta: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  timelineItem: { flexDirection: "row", gap: 14 },
  timelineNodeCol: { width: 14, alignItems: "center" },
  node: {
    width: 12,
    height: 12,
    borderWidth: 2,
    marginTop: 4,
  },
  stem: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 2,
    minHeight: 20,
  },
  timelineContent: { flex: 1, paddingBottom: 22 },
  tlTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 6,
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  tlNote: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  tlBy: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  error: { color: "#DC2626", marginTop: 20 },

  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(17,24,39,0.4)" },
  modalSheet: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderTopWidth: 3,
    borderTopColor: COLORS.accent,
  },
  modalKicker: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  stageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
    gap: 10,
  },
  radio: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  stageOptionText: {
    flex: 1,
    fontWeight: "700",
    color: COLORS.text,
    fontSize: 13,
  },
  currentTag: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    padding: 12,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: "top",
    fontSize: 14,
  },
  confirmBtn: {
    marginTop: 14,
    backgroundColor: COLORS.text,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 13,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontSize: 12,
  },
});
