import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../../src/theme";
import { useAuth } from "../../src/api/AuthContext";
import { Redirect } from "expo-router";

export default function TabsLayout() {
  const { user } = useAuth();
  if (user === null) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "DASHBOARD",
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "PRODUCTS",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: "TRACK",
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "CREATE",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.fab,
                { backgroundColor: focused ? COLORS.accentHover : COLORS.accent },
              ]}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </View>
          ),
          tabBarLabelStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: user?.role === "admin" ? "/(tabs)/settings" : null,
          title: "SETTINGS",
          tabBarIcon: ({ color }) => (
            <Ionicons name="options-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
