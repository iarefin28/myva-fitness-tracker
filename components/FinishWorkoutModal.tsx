import type { WorkoutDraft, WorkoutSaved } from '@/types/workout';
import React, { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import WorkoutSheet from './WorkoutSheet';
import { typography } from '@/theme/typography';

type FinishWorkoutModalProps = {
  visible: boolean;
  itemsCount: number;
  mmss: string;
  draft: WorkoutDraft | null;
  history: WorkoutSaved[];
  onClose: () => void;
  onConfirm: () => void;
};

export default function FinishWorkoutModal({
  visible,
  itemsCount,
  mmss,
  draft,
  history,
  onClose,
  onConfirm,
}: FinishWorkoutModalProps) {
  const jsonPreview = useMemo(() => JSON.stringify({ draft, history }, null, 2), [draft, history]);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = useMemo(
    () => ({
      text: isDark ? '#d1d5db' : '#1f2937',
      jsonBorder: isDark ? '#262626' : '#e2e8f0',
      jsonBg: isDark ? '#0f0f0f' : '#ffffff',
      jsonText: isDark ? '#cbd5e1' : '#0f172a',
      finishBg: isDark ? '#22C55E' : '#16A34A',
      finishText: '#ffffff',
    }),
    [isDark]
  );

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <WorkoutSheet title="Finish Workout" rightLabel="Close" onRightPress={onClose}>
        <Text style={[styles.summary, { color: C.text }]}>{itemsCount} item(s) • Time {mmss} • (timer paused)</Text>
        <View style={[styles.jsonBox, { borderColor: C.jsonBorder, backgroundColor: C.jsonBg }]}>
          <ScrollView>
            <Text style={[styles.jsonText, { color: C.jsonText }]}>{jsonPreview}</Text>
          </ScrollView>
        </View>
        <TouchableOpacity style={[styles.finishConfirm, { backgroundColor: C.finishBg }]} activeOpacity={0.9} onPress={onConfirm}>
          <Text style={[styles.finishConfirmText, { color: C.finishText }]}>Save & Finish</Text>
        </TouchableOpacity>
      </WorkoutSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  summary: { marginBottom: 12, fontSize: 15 },
  jsonBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  jsonText: { fontSize: 12, ...typography.mono },
  finishConfirm: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  finishConfirmText: { fontSize: 16, ...typography.button },
});
