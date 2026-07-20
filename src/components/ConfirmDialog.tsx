import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing, type } from '@/theme';

/**
 * Themed confirmation tile: dims the screen behind it and pops a felt card
 * with chip buttons. Used for destructive moves (Oinker, Piggyback, player
 * removal) on every platform, replacing native alerts.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  actionLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.tileOuter} onPress={() => {}}>
          <View style={styles.tile}>
            <Text style={styles.title}>{title}</Text>
            <Text style={[type.body, styles.message]}>{message}</Text>
            <View style={styles.actions}>
              <Button label="Cancel" onPress={onCancel} style={styles.action} />
              <Button
                label={actionLabel}
                variant="danger"
                onPress={onConfirm}
                style={styles.action}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 15, 12, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  tileOuter: {
    backgroundColor: colors.cardEdge,
    borderRadius: radius.l,
    paddingBottom: 4,
    alignSelf: 'stretch',
    maxWidth: 420,
  },
  tile: {
    backgroundColor: colors.card,
    borderRadius: radius.l,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.stitch,
    padding: spacing.xl,
    gap: spacing.m,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  message: {
    color: colors.textDim,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  action: {
    flex: 1,
  },
});
