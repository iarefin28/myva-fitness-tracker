import type { WorkoutDraft, WorkoutSaved } from '@/types/workout';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [viewMode, setViewMode] = useState<'pretty' | 'data'>('pretty');
  const jsonPreview = useMemo(() => JSON.stringify({ draft, history }, null, 2), [draft, history]);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = useMemo(
    () => ({
      text: isDark ? '#d1d5db' : '#1f2937',
      jsonBorder: isDark ? '#262626' : '#e2e8f0',
      jsonBg: isDark ? '#0f0f0f' : '#ffffff',
      jsonText: isDark ? '#cbd5e1' : '#0f172a',
      cardBg: isDark ? '#141416' : '#ffffff',
      cardBorder: isDark ? '#262626' : '#e2e8f0',
      subText: isDark ? '#9ca3af' : '#64748b',
      finishBg: isDark ? '#22C55E' : '#16A34A',
      finishText: '#ffffff',
    }),
    [isDark]
  );

  const items = draft?.items ?? [];
  const workoutName = useMemo(() => {
    const raw = draft?.name?.trim();
    if (raw) return raw;
    const date = draft?.startedAt ? new Date(draft.startedAt).toLocaleDateString() : "Unknown date";
    return `Unnamed Workout on ${date}`;
  }, [draft?.name, draft?.startedAt]);

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <WorkoutSheet title="Overview" rightLabel="Close" onRightPress={onClose}>
        {viewMode === 'pretty' && null}

        {viewMode === 'data' ? (
          <View style={[styles.jsonBox, { borderColor: C.jsonBorder, backgroundColor: C.jsonBg }]}>
            <ScrollView>
              <Text style={[styles.jsonText, { color: C.jsonText }]}>{jsonPreview}</Text>
            </ScrollView>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.prettyList}>
              {items.length === 0 ? (
                <View style={[styles.emptyCard, { borderColor: C.cardBorder, backgroundColor: C.cardBg }]}>
                  <Text style={[styles.emptyText, { color: C.subText }]}>No items added yet.</Text>
                </View>
              ) : (
                items.map((it) => {
                  const isExercise = it.type === 'exercise';
                  const title = isExercise ? (it as any).name : (it as any).text;
                  const setCount = isExercise ? (it as any).sets?.length ?? 0 : 0;
                  const subtitle = isExercise
                    ? `${setCount} set${setCount === 1 ? '' : 's'}`
                    : it.type === 'note'
                      ? 'Note'
                      : 'Custom';
                  const iconName = isExercise
                    ? 'barbell-outline'
                    : it.type === 'note'
                      ? 'document-text-outline'
                      : 'create-outline';
                  return (
                    <View key={it.id} style={[styles.prettyCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                      <View style={styles.prettyLeft}>
                        <Ionicons name={iconName as any} size={16} color={C.subText} style={styles.prettyIcon} />
                        <View style={styles.prettyTextWrap}>
                          <Text style={[styles.prettyTitle, { color: C.text }]} numberOfLines={1}>
                            {title?.trim() || (isExercise ? 'Workout' : 'Item')}
                          </Text>
                          <Text style={[styles.prettySub, { color: C.subText }]}>{subtitle}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
            <View style={[styles.statsCard, { borderColor: C.cardBorder, backgroundColor: C.cardBg }]}>
              <Text style={[styles.workoutTitle, { color: C.text }]} numberOfLines={2}>
                {workoutName}
              </Text>
              <View style={[styles.workoutTitleDivider, { backgroundColor: C.cardBorder }]} />
              <View style={styles.statsRow}>
                <View style={styles.statsLeft}>
                  <Text style={[styles.statsLabel, { color: C.subText }]}>Total Time</Text>
                  <Text style={[styles.statsTime, { color: C.text }]}>{mmss}</Text>
                </View>
                <View style={styles.statsRight}>
                  <View style={styles.statsRightRow}>
                    <Text style={[styles.statsLabel, { color: C.subText }]}>Total Exercises</Text>
                    <Text style={[styles.statsValue, { color: C.text }]}>
                      {items.filter((i) => i.type === 'exercise').length}
                    </Text>
                  </View>
                  <View style={styles.statsRightRow}>
                    <Text style={[styles.statsLabel, { color: C.subText }]}>Total Sets</Text>
                    <Text style={[styles.statsValue, { color: C.text }]}>
                      {items.reduce((sum, it) => {
                        if (it.type !== 'exercise') return sum;
                        return sum + ((it as any).sets?.length ?? 0);
                      }, 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={[styles.toggleRow, { borderColor: C.cardBorder }]}>
          <TouchableOpacity
            onPress={() => setViewMode('pretty')}
            style={[
              styles.toggleBtn,
              viewMode === 'pretty' && styles.toggleBtnActive,
              { borderColor: C.cardBorder, backgroundColor: isDark ? '#0f0f0f' : '#f8fafc' },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                { color: viewMode === 'pretty' ? (isDark ? '#ffffff' : '#0f172a') : C.subText },
              ]}
            >
              Pretty
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('data')}
            style={[
              styles.toggleBtn,
              viewMode === 'data' && styles.toggleBtnActive,
              { borderColor: C.cardBorder, backgroundColor: isDark ? '#0f0f0f' : '#f8fafc' },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                { color: viewMode === 'data' ? (isDark ? '#ffffff' : '#0f172a') : C.subText },
              ]}
            >
              Data
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.finishConfirm, { backgroundColor: C.finishBg }]} activeOpacity={0.9} onPress={onConfirm}>
          <Text style={[styles.finishConfirmText, { color: C.finishText }]}>Save & Finish</Text>
        </TouchableOpacity>
      </WorkoutSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  workoutTitle: { marginBottom: 6, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  workoutTitleDivider: { height: 1, width: '100%', marginBottom: 10 },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    borderWidth: 2,
  },
  toggleText: { fontSize: 13, fontWeight: '600' },
  summary: { marginBottom: 12, fontSize: 15 },
  jsonBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  jsonText: { fontSize: 12, ...typography.mono },
  statsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statsLeft: { flex: 1 },
  statsRight: { gap: 8 },
  statsRightRow: { alignItems: 'flex-end' },
  statsLabel: { fontSize: 12, fontWeight: '600', ...typography.body },
  statsValue: { fontSize: 14, fontWeight: '700', ...typography.body },
  statsTime: { fontSize: 22, fontWeight: '800', ...typography.body },
  prettyList: { gap: 8, paddingBottom: 12 },
  prettyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prettyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  prettyIcon: { marginRight: 10 },
  prettyTextWrap: { flex: 1 },
  prettyTitle: { fontWeight: '600', ...typography.body },
  prettySub: { marginTop: 2, fontSize: 12, ...typography.body },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  finishConfirm: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  finishConfirmText: { fontSize: 16, ...typography.button },
});
