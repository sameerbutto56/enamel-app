import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Box, Truck, CheckCircle, Package } from 'lucide-react-native';
import { orderApi } from '../../src/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../src/theme';

const WS_URL = 'ws://192.168.10.3:8000/api/ws';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await orderApi.getOrder(id);
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();

    // Setup WebSocket for real-time tracking
    ws.current = new WebSocket(WS_URL);
    
    ws.current.onopen = () => {
      console.log('WS Connected');
      // Subscribe to this specific order channel
      ws.current?.send(JSON.stringify({
        action: 'subscribe',
        channel: `order:${id}`
      }));
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === 'order_status') {
        setOrder(data.payload);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={TYPOGRAPHY.body}>Order not found.</Text>
      </View>
    );
  }

  const steps = [
    { status: 'placed', label: 'Order Placed', icon: Box },
    { status: 'confirmed', label: 'Confirmed', icon: Package },
    { status: 'processing', label: 'Processing', icon: ActivityIndicator },
    { status: 'shipped', label: 'Shipped', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStatusIndex = steps.findIndex(s => s.status === order.status);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: 'Order Tracking',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        ),
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={TYPOGRAPHY.mono}>{order.order_number}</Text>
          <Text style={TYPOGRAPHY.h2}>Expected Delivery</Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.brand.accent, fontWeight: '700' }]}>
            In 2-3 Business Days
          </Text>
        </View>

        <View style={styles.trackingCard}>
          {steps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const Icon = step.icon;
            
            return (
              <View key={step.status} style={styles.stepContainer}>
                <View style={styles.leftCol}>
                  <View style={[
                    styles.line, 
                    index === 0 && { top: '50%' },
                    index === steps.length - 1 && { bottom: '50%' },
                    isCompleted && { backgroundColor: COLORS.brand.primary }
                  ]} />
                  <View style={[
                    styles.node,
                    isCompleted && { backgroundColor: COLORS.brand.primary, borderColor: COLORS.brand.primary },
                    isCurrent && styles.currentNode
                  ]}>
                    {isCurrent && index !== steps.length - 1 ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Icon size={14} color={isCompleted ? '#fff' : COLORS.text.tertiary} />
                    )}
                  </View>
                </View>
                
                <View style={styles.rightCol}>
                  <Text style={[
                    TYPOGRAPHY.body, 
                    { fontWeight: isCompleted ? '700' : '500' },
                    !isCompleted && { color: COLORS.text.tertiary }
                  ]}>
                    {step.label}
                  </Text>
                  {isCurrent && (
                    <Text style={TYPOGRAPHY.small}>We are currently preparing your order.</Text>
                  )}
                  {order.status_history?.find((h: any) => h.status === step.status) && (
                    <Text style={styles.timestamp}>
                      {new Date(order.status_history.find((h: any) => h.status === step.status).changed_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.orderItem}>
              <Text style={TYPOGRAPHY.body}>{item.quantity}x {item.product_name}</Text>
              <Text style={TYPOGRAPHY.body}>Rs. {item.line_total.toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={TYPOGRAPHY.h3}>Total</Text>
            <Text style={TYPOGRAPHY.h3}>Rs. {order.total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <Text style={TYPOGRAPHY.body}>{order.shipping_address.full_name}</Text>
          <Text style={TYPOGRAPHY.body}>{order.shipping_address.street}</Text>
          <Text style={TYPOGRAPHY.body}>{order.shipping_address.city}, {order.shipping_address.zip_code}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  trackingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xl,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 80,
  },
  leftCol: {
    width: 40,
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.border.default,
    left: 19,
  },
  node: {
    width: 30,
    height: 30,
    borderRadius: 0, // Square industrial look
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  currentNode: {
    backgroundColor: COLORS.brand.accent,
    borderColor: COLORS.brand.accent,
    transform: [{ scale: 1.2 }],
  },
  rightCol: {
    flex: 1,
    paddingLeft: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  timestamp: {
    ...TYPOGRAPHY.small,
    marginTop: 4,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.mono,
    marginBottom: SPACING.md,
    color: COLORS.text.primary,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.default,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
