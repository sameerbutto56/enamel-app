export const STAGES = [
  "Order Received",
  "Material Assigned",
  "Cutting/Preparation",
  "Stitching",
  "Quality Check",
  "Packaging",
  "Ready/Dispatched",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  "Order Received": {
    bg: "#F1F5F9",
    text: "#334155",
    border: "#CBD5E1",
    dot: "#64748B",
  },
  "Material Assigned": {
    bg: "#DBEAFE",
    text: "#1D4ED8",
    border: "#93C5FD",
    dot: "#3B82F6",
  },
  "Cutting/Preparation": {
    bg: "#E0E7FF",
    text: "#4338CA",
    border: "#A5B4FC",
    dot: "#6366F1",
  },
  Stitching: {
    bg: "#FEF3C7",
    text: "#92400E",
    border: "#FCD34D",
    dot: "#F59E0B",
  },
  "Quality Check": {
    bg: "#FFEDD5",
    text: "#9A3412",
    border: "#FDBA74",
    dot: "#F97316",
  },
  Packaging: {
    bg: "#FCE7F3",
    text: "#9D174D",
    border: "#F9A8D4",
    dot: "#EC4899",
  },
  "Ready/Dispatched": {
    bg: "#D1FAE5",
    text: "#065F46",
    border: "#6EE7B7",
    dot: "#10B981",
  },
};

export function getStageColor(stage: string) {
  return STAGE_COLORS[stage] || STAGE_COLORS["Order Received"];
}

export function nextStage(current: string): string | null {
  const idx = STAGES.indexOf(current as Stage);
  if (idx === -1 || idx === STAGES.length - 1) return null;
  return STAGES[idx + 1];
}

export function stageIndex(stage: string): number {
  return STAGES.indexOf(stage as Stage);
}

export const COLORS = {
  bg: "#F7F7F5",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  borderStrong: "#111827",
  text: "#111827",
  textSecondary: "#4B5563",
  textTertiary: "#9CA3AF",
  accent: "#EA580C",
  accentHover: "#C2410C",
  inverted: "#FFFFFF",
};

export const MONO_FONT = {
  fontFamily:
    require("react-native").Platform.OS === "ios" ? "Menlo" : "monospace",
};
