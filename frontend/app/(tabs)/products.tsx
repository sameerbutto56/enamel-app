import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { api, extractError } from "../../src/api/client";
import { STAGES, COLORS } from "../../src/theme";
import StageChip from "../../src/components/StageChip";
import { socket } from "../../src/api/socket";

type Product = {
  id: string;
  name: string;
  order_number: string;
  batch_number: string;
  current_stage: string;
  current_department_id: string;
  updated_at: string;
};

export default function ProductsList() {
  const { stage: stageParam } = useLocalSearchParams<{ stage?: string }>();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>(stageParam || "All");
  const [stages, setStages] = useState<string[]>([...STAGES]);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (q = search, st = stage) => {
      try {
        const { data } = await api.get("/products", {
          params: {
            search: q || undefined,
            stage: st !== "All" ? st : undefined,
          },
        });
        setItems(data);
        setError(null);
      } catch (e: any) {
        setError(extractError(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, stage]
  );

  const loadStages = useCallback(async () => {
    try {
      const { data } = await api.get("/products/stages");
      if (Array.isArray(data?.stages) && data.stages.length > 0) {
        setStages(data.stages);
      }
    } catch {
      // keep default stages on failure
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (stageParam && stageParam !== stage) setStage(stageParam);
      loadStages();
      load(search, stageParam || stage);
    }, [load, loadStages, search, stage, stageParam])
  );

  React.useEffect(() => {
    const off1 = socket.on("product_updated", () => load());
    const off2 = socket.on("product_created", () => load());
    return () => {
      off1();
      off2();
    };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>INVENTORY</Text>
        <Text style={styles.title}>Products</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={18}
          color={COLORS.textTertiary}
          style={{ marginLeft: 12 }}
        />
        <TextInput
          testID="products-search-input"
          style={styles.searchInput}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            load(t, stage);
          }}
          placeholder="Search name, order #, batch..."
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {["All", ...stages].map((s) => {
          const active = stage === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => {
                setStage(s);
                load(search, s);
              }}
              style={[
                styles.filterChip,
                active && { backgroundColor: COLORS.text, borderColor: COLORS.text },
              ]}
              testID={`filter-${s}`}
            >
              <Text
                style={[
                  styles.filterText,
                  active && { color: "#fff" },
                ]}
              >
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator
          color={COLORS.text}
          style={{ marginTop: 60 }}
          testID="products-loading"
        />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No products match your filters</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/create")}
            style={styles.emptyBtn}
          >
            <Text style={styles.emptyBtnText}>+ CREATE PRODUCT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`product-card-${item.order_number}`}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMono}>
                    ORDER {item.order_number} · BATCH {item.batch_number}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={COLORS.textTertiary}
                />
              </View>
              <View style={styles.cardBottom}>
                <StageChip stage={item.current_stage} size="sm" />
                <Text style={styles.cardTime}>
                  {new Date(item.updated_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
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
  searchRow: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    height: 46,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardMono: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  error: { color: "#DC2626", textAlign: "center", marginTop: 40 },
  empty: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyText: { color: COLORS.textSecondary, marginTop: 16, fontSize: 14 },
  emptyBtn: {
    marginTop: 22,
    backgroundColor: COLORS.text,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 1.5,
    fontSize: 12,
  },
});
