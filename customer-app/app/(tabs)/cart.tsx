import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react-native';
import { useCartStore } from '../../src/store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/theme';
import Button from '../../src/components/Button';

export default function CartScreen() {
  const router = useRouter();
  const { cart, fetchCart, updateItem, removeItem, isLoading } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  if (isLoading && !cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconContainer}>
          <ShoppingBag size={48} color={COLORS.brand.primary} strokeWidth={1.5} />
        </View>
        <Text style={[TYPOGRAPHY.h2, styles.emptyTitle]}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Looks like you haven't added any premium medical apparel yet.</Text>
        <Button
          title="Start Shopping"
          onPress={() => router.push('/(tabs)')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={TYPOGRAPHY.h1}>My Cart</Text>
            <Text style={styles.itemCount}>{cart.items.length} Items</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.product_image }} style={styles.itemImage} resizeMode="cover" />
            </View>
            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                  <Trash2 size={18} color="#FF4B4B" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.variant}>{item.variant_label || 'Standard Fit'}</Text>
              
              {item.customizations && (
                <View style={styles.customizationsContainer}>
                  {item.customizations.fitting && <Text style={styles.customText}>• {item.customizations.fitting}</Text>}
                  {item.customizations.custom_color && <Text style={styles.customText}>• Color: {item.customizations.custom_color}</Text>}
                  {item.customizations.name_on_shirt && (
                    <Text style={styles.customText}>• Name: {item.customizations.name_on_shirt} ({item.customizations.name_placement})</Text>
                  )}
                  {item.customizations.logo && (
                    <Text style={styles.customText}>• Logo: {item.customizations.logo} ({item.customizations.logo_placement})</Text>
                  )}
                </View>
              )}
              
              <View style={styles.itemFooter}>
                <Text style={styles.itemPrice}>Rs. {item.unit_price.toLocaleString()}</Text>
                <View style={styles.quantity}>
                  <TouchableOpacity 
                    onPress={() => updateItem(item.id, Math.max(0, item.quantity - 1))}
                    style={styles.qtyBtn}
                  >
                    <Minus size={14} color={COLORS.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    onPress={() => updateItem(item.id, item.quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    <Plus size={14} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />
      
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>Rs. {cart.subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Shipping</Text>
          <Text style={[styles.totalValue, { color: '#059669' }]}>Free</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={TYPOGRAPHY.h2}>Total</Text>
          <Text style={[TYPOGRAPHY.h2, { color: COLORS.brand.primary }]}>Rs. {cart.subtotal.toLocaleString()}</Text>
        </View>
        
        <Button
          title="Checkout"
          onPress={() => router.push('/checkout')}
          style={styles.checkoutBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  itemCount: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.tertiary,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.soft,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.text.tertiary,
    marginBottom: SPACING.xxl,
    paddingHorizontal: 20,
  },
  emptyButton: {
    width: 200,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 220,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  imageWrapper: {
    width: 90,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  variant: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  customizationsContainer: {
    marginTop: 4,
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 6,
  },
  customText: {
    fontSize: 10,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.brand.primary,
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    color: COLORS.text.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...SHADOWS.medium,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  grandTotalRow: {
    marginBottom: SPACING.xl,
  },
  checkoutBtn: {
    width: '100%',
  },
});
