import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  footer?: ReactNode;
}>;

export function Screen({ children, scroll = true, footer }: ScreenProps) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.staticContent}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {content}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Card({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <View style={[styles.card, muted && styles.cardMuted]}>{children}</View>;
}

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'green' }: { label: string; tone?: 'green' | 'amber' | 'blue' }) {
  return (
    <View style={[styles.badge, tone === 'amber' && styles.badgeAmber, tone === 'blue' && styles.badgeBlue]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card muted>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  staticContent: {
    flex: 1,
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.76,
  },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeAmber: {
    backgroundColor: colors.accentSoft,
  },
  badgeBlue: {
    backgroundColor: colors.blueSoft,
  },
  badgeText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyDescription: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
