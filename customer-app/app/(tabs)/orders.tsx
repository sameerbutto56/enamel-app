import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Package, Calendar, Tag } from 'lucide-react-native';
import { orderApi } from '../../src/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/theme';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusStyle = (status: string) => {
    const s = COLORS.status[status as keyof typeof COLORS.status] || COLORS.status.placed;
    return s;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={TYPOGRAPHY.h1}>Order History</Text>
            <Text style={styles.headerSub}>{orders.length} transactions in total</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStatusStyle(item.status);
          return (
            <TouchableOpacity 
              style={styles.orderCard}
              onPress={() => router.push(`/order/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderNumContainer}>
                  <Package size={16} color={COLORS.text.secondary} />
                  <Text style={styles.orderNumber}>#{item.order_number}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.text }]}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderBody}>
                <View style={styles.dateRow}>
                  <Calendar size={14} color={COLORS.text.tertiary} />
                  <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={styles.itemRow}>
                  <Tag size={14} color={COLORS.text.tertiary} />
                  <Text style={styles.itemText}>{item.items.length} {item.items.length === 1 ? 'Item' : 'Items'}</Text>
                </View>
              </View>

              <View style={styles.divider} />
              
              <View style={styles.orderFooter}>
                <View>
                  <Text style={styles.totalLabel}>Total Payment</Text>
                  <Text style={styles.totalAmount}>Rs. {item.total.toLocaleString()}</Text>
                </View>
                <View style={styles.detailsBtn}>
                  <Text style={styles.detailsBtnText}>Details</Text>
                  <ChevronRight size={16} color={COLORS.brand.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Package size={48} color={COLORS.text.tertiary} />
            </View>
            <Text style={TYPOGRAPHY.h3}>No Orders Yet</Text>
            <Text style={styles.emptyText}>When you place an order, it will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    fontWeight: '600',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  orderBody: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.brand.primary,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand.primary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
