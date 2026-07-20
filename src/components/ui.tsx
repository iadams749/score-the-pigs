import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

type ButtonVariant = 'card' | 'accent' | 'brass' | 'danger';

const variantStyles: Record<
  ButtonVariant,
  { bg: string; edge: string; fg: string }
> = {
  card: { bg: colors.card, edge: colors.cardEdge, fg: colors.text },
  accent: { bg: colors.accent, edge: colors.accentEdge, fg: colors.accentText },
  brass: { bg: colors.brass, edge: colors.brassEdge, fg: colors.brassText },
  danger: { bg: colors.danger, edge: colors.dangerEdge, fg: colors.dangerText },
};

const EDGE = 4;

/**
 * A physical "chip" button: solid face over a darker bottom edge. Pressing
 * compresses the edge and drops the face, like pushing a chip into felt.
 */
export function Button({
  label,
  sublabel,
  onPress,
  variant = 'card',
  disabled,
  dense,
  style,
  labelStyle,
}: {
  label: string;
  sublabel?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Tighter padding and type for dense control pads. */
  dense?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}) {
  const { bg, edge, fg } = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chipOuter,
        { backgroundColor: edge, opacity: disabled ? 0.35 : 1 },
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.chipFace,
            dense && styles.chipFaceDense,
            {
              backgroundColor: bg,
              marginBottom: pressed ? 0 : EDGE,
              marginTop: pressed ? EDGE : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonLabel,
              dense && styles.buttonLabelDense,
              { color: fg },
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text
              style={[
                styles.buttonSublabel,
                dense && styles.buttonSublabelDense,
                { color: fg },
              ]}
            >
              {sublabel}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

/** A raised felt card with a stitched (dashed) trim, like table edging. */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={styles.cardOuter}>
      <View style={[styles.cardInner, style]}>{children}</View>
    </View>
  );
}

/**
 * One roll from a turn — its name and what it scored. Used by the live turn
 * strip on the game screen and by each turn card in the history feed, so the
 * two read as the same object.
 */
export function RollChip({ label, points }: { label: string; points: number }) {
  return (
    <View style={styles.rollChip}>
      <Text style={styles.rollChipLabel}>{label}</Text>
      <Text style={styles.rollChipPoints}>+{points}</Text>
    </View>
  );
}

/** Full-screen felt with a vignette so the table reads as lit from above. */
export function Felt({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={[colors.surfaceDeep, colors.surface, colors.surface, colors.surfaceDeep]}
      locations={[0, 0.25, 0.72, 1]}
      style={[styles.felt, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  rollChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.s,
    paddingVertical: 3,
    paddingHorizontal: spacing.s,
  },
  rollChipLabel: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  rollChipPoints: {
    color: colors.brass,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  chipOuter: {
    borderRadius: radius.m,
  },
  chipFace: {
    borderRadius: radius.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipFaceDense: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
  },
  buttonLabel: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonLabelDense: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  buttonSublabel: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    opacity: 0.75,
    marginTop: 1,
  },
  buttonSublabelDense: {
    fontSize: 11,
    marginTop: 0,
  },
  cardOuter: {
    backgroundColor: colors.cardEdge,
    borderRadius: radius.l,
    paddingBottom: EDGE,
  },
  cardInner: {
    backgroundColor: colors.card,
    borderRadius: radius.l,
    padding: spacing.l,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.stitch,
  },
  felt: {
    flex: 1,
  },
});
