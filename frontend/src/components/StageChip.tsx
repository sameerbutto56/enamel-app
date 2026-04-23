import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getStageColor } from "../theme";

export default function StageChip({
  stage,
  size = "md",
}: {
  stage: string;
  size?: "sm" | "md";
}) {
  const c = getStageColor(stage);
  const padV = size === "sm" ? 3 : 5;
  const padH = size === "sm" ? 8 : 10;
  const font = size === "sm" ? 10 : 11;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
      ]}
      testID={`stage-chip-${stage}`}
    >
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text
        style={[styles.text, { color: c.text, fontSize: font }]}
        numberOfLines={1}
      >
        {stage.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    marginRight: 6,
  },
  text: {
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
