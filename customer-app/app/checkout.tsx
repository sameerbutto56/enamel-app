import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, Animated } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CheckCircle2, CreditCard, Wallet, Truck } from 'lucide-react-native';
import { useCartStore, useAuthStore } from '../src/store';
import { orderApi } from '../src/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../src/theme';
import Button from '../src/components/Button';
import Input from '../src/components/Input';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const { customer } = useAuthStore();
  
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  const handlePlaceOrder = async () => {
    if (!name || !phone || !street || !city || !state || !zipCode) {
      alert('Please fill in all shipping details');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shipping_address: {
          full_name: name,
          phone: phone,
          street: street,
          city: city,
          state: state,
          zip_code: zipCode,
          country: 'Pakistan'
        },
        payment_method: 'cod',
        note: 'Customer mobile checkout'
      };
      
      const res = await orderApi.placeOrder(orderData);
      setOrderNum(res.data.order_number);
      await clearCart();
      setShowSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <Stack.Screen options={{ headerTitle: 'Checkout', headerShadowVisible: false }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Truck size={20} color={COLORS.brand.primary} />
            <Text style={styles.cardTitle}>Shipping Address</Text>
          </View>
          <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" />
          <Input label="Phone Number" value={phone} onChangeText={setPhone} placeholder="0300-1234567" keyboardType="phone-pad" />
          <Input label="Street Address" value={street} onChangeText={setStreet} placeholder="123 Main St" />
          <View style={styles.row}>
            <Input label="City" value={city} onChangeText={setCity} placeholder="Lahore" style={{ flex: 1, marginRight: 10 }} />
            <Input label="State" value={state} onChangeText={setState} placeholder="Punjab" style={{ flex: 1 }} />
          </View>
          <Input label="ZIP Code" value={zipCode} onChangeText={setZipCode} placeholder="54000" keyboardType="numeric" />
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Wallet size={20} color={COLORS.brand.primary} />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>
          <View style={styles.paymentOption}>
            <View style={styles.paymentIcon}>
              <CreditCard size={20} color={COLORS.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentName}>Cash on Delivery</Text>
              <Text style={styles.paymentSub}>Pay when your order arrives</Text>
            </View>
            <View style={styles.radioActive} />
          </View>
        </View>
        
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs. {cart?.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>Free</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>Rs. {cart?.subtotal.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={loading}
        />
      </View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <CheckCircle2 size={64} color={COLORS.brand.primary} />
            </View>
            <Text style={TYPOGRAPHY.h2}>Order Placed!</Text>
            <Text style={styles.modalText}>Your order #{orderNum} has been placed successfully. We'll notify you when it's shipped.</Text>
            <Button
              title="View My Orders"
              onPress={() => {
                setShowSuccess(false);
                router.replace('/(tabs)/orders');
              }}
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 150,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  row: {
    flexDirection: 'row',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.brand.primary,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  paymentSub: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  radioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: COLORS.brand.primary,
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  summaryLabel: {
    color: '#999',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  totalPrice: {
    color: COLORS.brand.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...SHADOWS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 20,
  },
  modalText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.text.secondary,
    marginTop: 12,
  },
});
