import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Card, Felt } from '@/components/ui';
import { colors, fonts, spacing, type } from '@/theme';

const SCORING: { label: string; desc: string; points: string }[] = [
  { label: 'Sider', desc: 'Both pigs on the same side', points: '1' },
  { label: 'Razorback', desc: 'A pig on its back', points: '5' },
  { label: 'Trotter', desc: 'A pig standing on all fours', points: '5' },
  { label: 'Snouter', desc: 'A pig balanced on snout and front legs', points: '10' },
  { label: 'Leaning Jowler', desc: 'A pig on snout, ear, and front leg', points: '15' },
  { label: 'Double Razorback', desc: 'Both pigs on their backs', points: '20' },
  { label: 'Double Trotter', desc: 'Both pigs standing', points: '20' },
  { label: 'Double Snouter', desc: 'Both pigs on their snouts', points: '40' },
  { label: 'Double Leaning Jowler', desc: 'Both pigs leaning', points: '60' },
];

const DISASTERS: { label: string; desc: string }[] = [
  {
    label: 'Pig Out',
    desc: 'Pigs land on opposite sides. The turn ends and the turn score is lost.',
  },
  {
    label: 'Oinker',
    desc: 'The pigs land touching. The turn ends and the player’s whole banked score resets to zero. Also called Makin’ Bacon.',
  },
  {
    label: 'Piggyback',
    desc: 'One pig comes to rest on top of the other. That player is out of the game.',
  },
];

export default function RulesScreen() {
  return (
    <Felt>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Logo size={88} />
        </View>

        <Text style={type.eyebrow}>The idea</Text>
        <Card style={styles.card}>
          <Text style={type.body}>
            On your turn, throw both pigs as often as you dare. Every scoring
            throw adds to your turn score, but a Pig Out wipes it. Bank before
            the pigs betray you. The first player to bank the target score
            wins.
          </Text>
        </Card>

        <Text style={[type.eyebrow, styles.sectionTitle]}>Scoring throws</Text>
        <Card style={styles.card}>
          {SCORING.map((row, i) => (
            <View key={row.label} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={styles.rowText}>
                <Text style={type.body}>{row.label}</Text>
                <Text style={type.caption}>{row.desc}</Text>
              </View>
              <Text style={styles.points}>{row.points}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowText}>
              <Text style={type.body}>Mixed pair</Text>
              <Text style={type.caption}>
                Two different positions score the sum. In this app, just tap
                both buttons.
              </Text>
            </View>
            <Text style={styles.points}>+</Text>
          </View>
        </Card>

        <Text style={[type.eyebrow, styles.sectionTitle]}>Disasters</Text>
        <Card style={styles.card}>
          {DISASTERS.map((row, i) => (
            <View key={row.label} style={[styles.disaster, i > 0 && styles.rowBorder]}>
              <Text style={[type.body, styles.disasterLabel]}>{row.label}</Text>
              <Text style={type.caption}>{row.desc}</Text>
            </View>
          ))}
        </Card>

        <Text style={[type.eyebrow, styles.sectionTitle]}>Banking</Text>
        <Card style={styles.card}>
          <Text style={type.body}>
            Stop rolling and tap Bank to add your turn score to your total and
            pass the pigs. You win the moment your banked total reaches the
            target, or when everyone else has been eliminated.
          </Text>
        </Card>
      </ScrollView>
    </Felt>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.l,
    paddingBottom: spacing.xl * 2,
    gap: spacing.m,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  card: {
    gap: spacing.m,
  },
  sectionTitle: {
    marginTop: spacing.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    paddingTop: spacing.m,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  points: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.brass,
    minWidth: 36,
    textAlign: 'right',
  },
  disaster: {
    gap: 2,
  },
  disasterLabel: {
    color: colors.danger,
  },
});
