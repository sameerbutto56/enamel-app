import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ShoppingCart, Package, User } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '../../src/theme';
import { useCartStore } from '../../src/store';
import { View, Text, StyleSheet } from 'react-native';

function CartIcon({ color, size }: { color: string; size: number }) {
  const count = useCartStore((state) => state.cart?.item_count || 0);
  
  return (
    <View>
      <ShoppingCart size={size} color={color} strokeWidth={2} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.brand.primary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border.default,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.mono,
          fontSize: 10,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTitleStyle: {
          ...TYPOGRAPHY.h3,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} />,
          headerTitle: 'Enamels Store',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <CartIcon color={color} size={size} />,
          headerTitle: 'Your Cart',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} strokeWidth={2} />,
          headerTitle: 'Order History',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
          headerTitle: 'Your Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: COLORS.brand.accent,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.text.inverted,
    fontSize: 10,
    fontWeight: '900',
  },
});
