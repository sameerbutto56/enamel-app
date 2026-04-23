import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { api, extractError } from "../../src/api/client";
import { STAGES, COLORS, getStageColor } from "../../src/theme";
import { useAuth } from "../../src/api/AuthContext";
import { socket } from "../../src/api/socket";

type Stats = {
  total: number;
  by_stage: { stage: string; count: number }[];
  stages: string[];
  pending_in_department?: number;
  department_id?: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(socket.connected);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/products/stats");
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError(extractError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  React.useEffect(() => {
    const off1 = socket.on("product_updated", () => load());
    const off2 = socket.on("product_created", () => load());
    const offS = socket.onStatus(setLive);
    return () => {
      off1();
      off2();
      offS();
    };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const stages = stats?.stages || STAGES;
  const active = stats
    ? stats.by_stage
        .filter((s) => s.stage !== stages[stages.length - 1])
        .reduce((a, b) => a + b.count, 0)
    : 0;
  const ready =
    stats?.by_stage.find((s) => s.stage === stages[stages.length - 1])?.count || 0;
  const qc = stats?.by_stage.find((s) => s.stage === "Quality Check")?.count || 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>CONTROL ROOM</Text>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.sub}>
              Welcome, {user?.name || "Admin"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <View
              style={[
                styles.liveBadge,
                { backgroundColor: live ? "#D1FAE5" : "#F1F5F9", borderColor: live ? "#10B981" : "#CBD5E1" },
              ]}
              testID="live-indicator"
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: live ? "#10B981" : "#94A3B8" },
                ]}
              />
              <Text
                style={[
                  styles.liveText,
                  { color: live ? "#065F46" : "#475569" },
                ]}
              >
                {live ? "LIVE" : "OFFLINE"}
              </Text>
            </View>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>E</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            color={COLORS.text}
            style={{ marginTop: 60 }}
            testID="dashboard-loading"
          />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <View style={styles.bento}>
              <StatCard
                label="TOTAL UNITS"
                value={stats?.total || 0}
                accent={COLORS.text}
                testID="stat-total"
              />
              <StatCard
                label={user?.role === "admin" ? "IN PRODUCTION" : "MY PENDING"}
                value={user?.role === "admin" ? active : stats?.pending_in_department || 0}
                accent={COLORS.accent}
                testID="stat-in-production"
              />
              <StatCard
                label="AT QC"
                value={qc}
                accent="#F97316"
                testID="stat-at-qc"
              />
              <StatCard
                label="DISPATCHED"
                value={ready}
                accent="#10B981"
                testID="stat-dispatched"
              />
            </View>

            <Text style={styles.sectionTitle}>PIPELINE BREAKDOWN</Text>
            <View style={styles.stagesCard} testID="pipeline-breakdown">
              {stages.map((s, i) => {
                const count = stats?.by_stage.find((x) => x.stage === s)?.count || 0;
                const maxCount = Math.max(
                  ...(stats?.by_stage.map((x) => x.count) || [1]),
                  1
                );
                const width = `${(count / maxCount) * 100}%` as const;
                const c = getStageColor(s);
                return (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({ pathname: "/(tabs)/products", params: { stage: s } })
                    }
                    style={[
                      styles.stageRow,
                      i !== stages.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border,
                      },
                    ]}
                    testID={`stage-row-${s}`}
                  >
                    <View style={[styles.stageDot, { backgroundColor: c.dot }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stageName}>{s}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width, backgroundColor: c.dot },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.stageCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push("/(tabs)/create")}
              testID="cta-create-product"
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>+ CREATE NEW PRODUCT</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  accent,
  testID,
}: {
  label: string;
  value: number;
  accent: string;
  testID: string;
}) {
  return (
    <View style={styles.statCard} testID={testID}>
      <View style={[styles.statBar, { backgroundColor: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  kicker: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -1,
  },
  sub: { color: COLORS.textSecondary, marginTop: 4, fontSize: 13 },
  logoBadge: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  bento: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    minHeight: 96,
    position: "relative",
  },
  statBar: { position: "absolute", top: 0, left: 0, height: 3, width: 32 },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  statValue: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 8,
    letterSpacing: -1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    marginTop: 28,
    marginBottom: 10,
  },
  stagesCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  stageDot: { width: 10, height: 10 },
  stageName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  barTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 0,
    overflow: "hidden",
  },
  barFill: { height: 4 },
  stageCount: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    minWidth: 30,
    textAlign: "right",
  },
  ctaBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 22,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 13,
  },
  error: { color: "#DC2626", marginTop: 20 },
});
