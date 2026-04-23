import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/api/AuthContext";
import { COLORS } from "../src/theme";

export default function Index() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.bg,
        }}
      >
        <ActivityIndicator color={COLORS.text} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
