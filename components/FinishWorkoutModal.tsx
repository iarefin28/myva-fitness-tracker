import type { WorkoutDraft, WorkoutSaved } from '@/types/workout';
import React, { useMemo } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import WorkoutSheet from './WorkoutSheet';

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

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <WorkoutSheet title="Finish Workout" rightLabel="Close" onRightPress={onClose}>
        <Text style={styles.summary}>{itemsCount} item(s) • Time {mmss} • (timer paused)</Text>
        <View style={styles.jsonBox}>
          <ScrollView>
            <Text style={styles.jsonText}>{jsonPreview}</Text>
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.finishConfirm} activeOpacity={0.9} onPress={onConfirm}>
          <Text style={styles.finishConfirmText}>Save & Finish</Text>
        </TouchableOpacity>
      </WorkoutSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  summary: { color: '#d1d5db', marginBottom: 12, fontSize: 15 },
  jsonBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  jsonText: { color: '#cbd5e1', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as any, fontSize: 12 },
  finishConfirm: { backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  finishConfirmText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
