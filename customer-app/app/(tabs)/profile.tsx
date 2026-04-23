import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, User, MapPin, Bell, Shield, CreditCard, ChevronRight, Settings } from 'lucide-react-native';
import { useAuthStore } from '../../src/store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/theme';
import Button from '../../src/components/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { customer, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/login');
      }},
    ]);
  };

  if (!customer) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
          <User size={48} color={COLORS.brand.primary} />
        </View>
        <Text style={TYPOGRAPHY.h2}>Welcome to Enamels</Text>
        <Text style={styles.emptyText}>Log in to manage your premium orders and profile settings.</Text>
        <Button 
          title="Login / Sign Up" 
          onPress={() => router.push('/login')} 
          style={{ width: 220 }}
        />
      </View>
    );
  }

  const menuItems = [
    { icon: User, label: 'Personal Information', sub: 'Name, email, and phone' },
    { icon: MapPin, label: 'Delivery Addresses', sub: 'Manage your locations' },
    { icon: CreditCard, label: 'Payment Methods', sub: 'Saved cards and COD' },
    { icon: Bell, label: 'Notifications', sub: 'Order updates and alerts' },
    { icon: Shield, label: 'Security', sub: 'Password and privacy' },
    { icon: Settings, label: 'App Settings', sub: 'Theme and preferences' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.editBadge}>
            <Settings size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{customer.name}</Text>
        <Text style={styles.userEmail}>{customer.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.menuIconWrapper}>
              <item.icon size={20} color={COLORS.brand.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <LogOut size={20} color="#FF4B4B" />
        <Text style={styles.logoutText}>Log Out Account</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>Enamels Official v1.0.4</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
    paddingBottom: 40,
  },
  center: {
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
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.text.tertiary,
    marginBottom: SPACING.xl,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.brand.primary,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...SHADOWS.medium,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 8,
    marginBottom: SPACING.xl,
    ...SHADOWS.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuIconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F1',
    height: 60,
    borderRadius: 20,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF4B4B',
  },
  version: {
    ...TYPOGRAPHY.mono,
    fontSize: 10,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    color: COLORS.text.tertiary,
  },
});
