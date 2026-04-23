export const COLORS = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: {
    primary: '#1A1A1A',
    secondary: '#555555',
    tertiary: '#999999',
    inverted: '#FFFFFF',
  },
  border: {
    default: '#EEEEEE',
    strong: '#111827',
    focus: '#FF8C42',
  },
  brand: {
    primary: '#FF8C42',
    accent: '#FFA24C',
    accentHover: '#E67E22',
  },
  status: {
    placed: { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' },
    confirmed: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
    processing: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
    shipped: { bg: '#FCE7F3', text: '#9D174D', border: '#FBCFE8' },
    out_for_delivery: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
    delivered: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  }
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '900' as const,
    letterSpacing: -1,
    color: COLORS.text.primary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: COLORS.text.primary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  small: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.text.tertiary,
  },
  mono: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: COLORS.text.tertiary,
  }
};
