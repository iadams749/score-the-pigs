import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing, type } from '@/theme';

/**
 * Themed text-input dialog in the same tile style as ConfirmDialog. Submit
 * passes the trimmed value; `error` (from the caller's validation) renders
 * under the input and keeps the dialog open.
 */
export function PromptDialog({
  visible,
  title,
  initialValue,
  actionLabel,
  error,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  title: string;
  initialValue: string;
  actionLabel: string;
  error?: string | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* The body only exists while open, and is remounted if `initialValue`
          changes, so the draft always starts from `initialValue` without an
          effect syncing it. */}
      {visible ? (
        <PromptBody
          key={initialValue}
          title={title}
          initialValue={initialValue}
          actionLabel={actionLabel}
          error={error}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      ) : null}
    </Modal>
  );
}

function PromptBody({
  title,
  initialValue,
  actionLabel,
  error,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialValue: string;
  actionLabel: string;
  error?: string | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  const submit = () => onSubmit(value.trim());

  return (
    <Pressable style={styles.backdrop} onPress={onCancel}>
      <Pressable style={styles.tileOuter} onPress={() => {}}>
        <View style={styles.tile}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            onSubmitEditing={submit}
            autoFocus
            returnKeyType="done"
            placeholderTextColor={colors.textDim}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button label="Cancel" onPress={onCancel} style={styles.action} />
            <Button
              label={actionLabel}
              variant="accent"
              onPress={submit}
              disabled={value.trim().length === 0}
              style={styles.action}
            />
          </View>
        </View>
      </Pressable>
    </Pressable>
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
  input: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  error: {
    ...type.caption,
    color: colors.chartBarDanger,
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
