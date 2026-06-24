export const colors = {
  background: '#F8F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EAE4',
  surfaceRaised: '#FFFCF8',
  surfaceOverlay: 'rgba(255, 252, 248, 0.94)',
  surfaceOverlayStrong: 'rgba(255, 255, 255, 0.98)',
  ink: '#231815',
  inkMuted: '#6D625E',
  inkFaint: '#9B8E89',
  border: '#E4D7D0',
  borderStrong: '#CAB7AE',
  primary: '#B42318',
  primaryDark: '#7A1B15',
  primarySoft: '#FBE7E4',
  primaryTint: '#FFF3F1',
  onPrimary: '#FFFFFF',
  accent: '#C45F22',
  accentSoft: '#F8E6D8',
  blue: '#315F8A',
  blueSoft: '#E6EEF7',
  danger: '#A9231A',
  dangerSoft: '#FCE4E1',
  success: '#28724A',
  successSoft: '#E2F1E7',
  overlay: 'rgba(35, 24, 21, 0.52)',
  overlaySoft: 'rgba(35, 24, 21, 0.18)',
  overlayWarm: 'rgba(180, 35, 24, 0.14)',
  shadow: 'rgba(47, 26, 22, 0.16)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const opacity = {
  pressed: 0.72,
  disabled: 0.48,
  overlay: 0.52,
  overlaySoft: 0.18,
} as const;

export const shadow = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;
