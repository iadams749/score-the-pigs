import { StyleSheet, Text, View } from 'react-native';

import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  DISASTER_BUCKETS,
  Distribution,
} from '@/engine/stats';
import { colors, fonts, spacing, type } from '@/theme';

/** A hero-number tile: big slab value over a muted caption. */
export function StatTile({
  label,
  value,
  width = '33%',
}: {
  label: string;
  value: number | string;
  width?: `${number}%`;
}) {
  return (
    <View style={[styles.tile, { width }]}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

/**
 * Horizontal count bars for roll types: brass for scoring throws, a lighter
 * red for disasters, every row direct-labeled with its count.
 */
export function DistributionBars({
  distribution,
  hideEmpty = false,
}: {
  distribution: Distribution;
  hideEmpty?: boolean;
}) {
  const rows = BUCKET_ORDER.filter((b) => !hideEmpty || distribution[b] > 0);
  const max = Math.max(1, ...rows.map((b) => distribution[b]));
  if (rows.length === 0) {
    return <Text style={type.caption}>No throws recorded.</Text>;
  }
  return (
    <View style={styles.bars}>
      {rows.map((bucket) => {
        const count = distribution[bucket];
        const danger = DISASTER_BUCKETS.includes(bucket);
        return (
          <View key={bucket} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {BUCKET_LABELS[bucket]}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${(count / max) * 100}%`,
                    backgroundColor: danger ? colors.chartBarDanger : colors.chartBar,
                  },
                ]}
              />
            </View>
            <Text style={styles.barCount}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    marginBottom: spacing.s,
  },
  tileValue: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.display,
  },
  bars: {
    gap: spacing.s,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  barLabel: {
    ...type.caption,
    width: 118,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceDeep,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    minWidth: 26,
    textAlign: 'right',
  },
});
