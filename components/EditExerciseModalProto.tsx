// EditExerciseModal.tsx
import { useWorkoutStore } from '@/store/workoutStore';
import type { WorkoutExercise } from '@/types/workout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';

type Props = {
  visible: boolean;
  exerciseId: string | null;
  onClose: () => void;
};

type EditorKind = 'set' | 'rest' | 'note' | null;
type Unit = 'lb' | 'kg';

// --- NEW: types used locally for clarity ---
type PlannedSetPayload = { plannedWeight: number; plannedReps: number; unit?: Unit };
type CompleteSetPayload = { weight?: number; reps?: number; unit?: Unit };

export default function EditExerciseModal({ visible, exerciseId, onClose }: Props) {
  // ------- store --------
  const items = useWorkoutStore((s) => s.draft?.items ?? []);
  const removeItem = useWorkoutStore((s) => (s as any).removeItem) as
    | ((id: string) => void)
    | undefined;

  // Keep legacy actions available as fallback
  const addSetLegacy = useWorkoutStore((s) => (s as any).addSet) as
    | ((exId: string, payload: { weight: number; reps: number; unit?: Unit }) => void)
    | undefined;
  const addWeightedSetLegacy = useWorkoutStore((s) => (s as any).addWeightedSet) as
    | ((exId: string, weight: number, reps: number, unit?: Unit) => void)
    | undefined;

  // NEW: data-integrity actions (see store patch below)
  const planSet = useWorkoutStore((s) => (s as any).planSet) as
    | ((exId: string, payload: PlannedSetPayload) => string /*plannedSetId*/)
    | undefined;
  const completePlannedSet = useWorkoutStore((s) => (s as any).completePlannedSet) as
    | ((exId: string, plannedSetId: string, payload?: CompleteSetPayload) => void)
    | undefined;

  const ex = useMemo(
    () => items.find((it) => it.id === exerciseId && it.type === 'exercise') as WorkoutExercise | undefined,
    [items, exerciseId]
  );

  // ------- header actions --------
  const confirmDelete = () => {
    if (!ex) return;
    Alert.alert(
      'Delete exercise?',
      'This will remove the exercise from this workout.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeItem?.(ex.id);
            onClose();
          },
        },
      ],
      { cancelable: true }
    );
  };
  const handleSave = () => onClose(); // name locked; Save just closes

  // ------- keyboard (to hide sets list while typing) --------
  const [kbOpen, setKbOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKbOpen(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbOpen(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ------- layout: uniform panel size (compact) --------
  const { height: screenH } = useWindowDimensions();
  const PANEL_HEIGHT = Math.min(220, Math.max(120, Math.round(screenH * 0.18)));

  // ------- editor switching --------
  const [active, setActive] = useState<EditorKind>('set'); // default flow

  // prevent switching away mid-set
  const guardSwitch = (target: EditorKind) => {
    if (setPhase === 'performing' && active === 'set' && target !== 'set') {
      Alert.alert('Complete your set', 'Finish your current set before moving on.');
      return;
    }
    setActive(active === target ? null : target);
  };

  // ------- sets & phases --------
  const sets = useMemo(() => {
    const entries = (ex as any)?.entries as any[] | undefined;
    return (entries ?? []).filter((e) => e?.kind === 'set');
  }, [ex?.id, (ex as any)?.entries]);

  const lastCompleted = useMemo(
    () => [...sets].reverse().find((s: any) => s.status === 'completed'),
    [sets]
  );

  // phases: null | editing | performing
  const [setPhase, setSetPhase] = useState<'editing' | 'performing' | null>(null);

  // NEW: track the currently planned set id & a flash state after completion
  const [plannedSetId, setPlannedSetId] = useState<string | null>(null);
  const [flash, setFlash] = useState<'idle' | 'justCompleted'>('idle');
  const flashTimer = useRef<NodeJS.Timeout | null>(null);

  // weight / reps / unit
  const [weight, setWeight] = useState('135');
  const [reps, setReps] = useState('5');
  const [unit, setUnit] = useState<Unit>('lb');

  // Initialize defaults when opening Set editor; reset when leaving
  useEffect(() => {
    if (!visible) return;
    if (active === 'set' && setPhase !== 'performing') {
      const w = (lastCompleted?.weight ?? lastCompleted?.plannedWeight ?? 135) as number;
      const r = (lastCompleted?.reps ?? lastCompleted?.plannedReps ?? 5) as number;
      setWeight(String(w));
      setReps(String(r));
      setUnit((lastCompleted?.unit as Unit) ?? 'lb');
      setSetPhase('editing');
    }
    if (active !== 'set') {
      setSetPhase(null);
      setPlannedSetId(null);
    }
  }, [active, lastCompleted, visible, setPhase]);

  // Plan the set (persist planned values)
  const beginSetPerforming = () => {
    const w = Number(weight);
    const r = Number(reps);
    if (!Number.isFinite(w) || !Number.isFinite(r) || r <= 0) {
      Alert.alert('Invalid set', 'Enter valid weight and reps.');
      return;
    }

    // prefer integrity API
    if (planSet) {
      const id = planSet(ex!.id, { plannedWeight: w, plannedReps: r, unit });
      setPlannedSetId(id);
    } else {
      // legacy fallback: immediately add a completed set if the new API doesn’t exist
      if (addSetLegacy) addSetLegacy(ex!.id, { weight: w, reps: r, unit });
      else addWeightedSetLegacy?.(ex!.id, w, r, unit);
    }

    setSetPhase('performing');
  };

  // Complete the planned set
  const completeSet = () => {
    if (!ex) return;

    const w = Number(weight);
    const r = Number(reps);

    if (plannedSetId && completePlannedSet) {
      completePlannedSet(ex.id, plannedSetId, { weight: w, reps: r, unit });
      setPlannedSetId(null);
    } else {
      // legacy: nothing to do (already added)
    }

    setSetPhase('editing');
    setFlash('justCompleted');
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash('idle'), 900);
  };

  const currentSetNumber =
    (sets?.filter((s: any) => s.status === 'completed').length ?? 0) +
    (setPhase === 'performing' ? 1 : 0);

  // Descriptor text (per your copy)
  const descriptor = useMemo(() => {
    if (active !== 'set') return '';

    if (sets.filter((s: any) => s.status === 'completed').length === 0 && setPhase !== 'performing') {
      return 'No sets have been added. Add a set.';
    }

    if (setPhase === 'performing') {
      return `You are currently on set #${currentSetNumber}. Attempting to perform the weight and the reps. Press complete to complete this set.`;
    }

    if (flash === 'justCompleted') {
      return `Set #${currentSetNumber} completed. Add next set or adjust weight/reps.`;
    }

    const total = sets.filter((s: any) => s.status === 'completed').length;
    return `You have ${total} ${total === 1 ? 'set' : 'sets'} logged.`;
  }, [active, sets, setPhase, currentSetNumber, flash]);

  // Gradient colors by state
  const gradColors =
    setPhase === 'performing'
      ? ['#3a2a00', '#8a6d1a'] // amber-ish during performing
      : flash === 'justCompleted'
      ? ['#083b12', '#0ea05a'] // green pop after completion
      : ['#121826', '#1b2433']; // neutral

  // ------- UI --------
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={confirmDelete}
            hitSlop={12}
            accessibilityLabel="Delete exercise"
            style={styles.leftIconBtn}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </Pressable>

          <Text style={styles.title} numberOfLines={1}>
            Edit Exercise
          </Text>

          <Pressable
            onPress={handleSave}
            hitSlop={10}
            accessibilityLabel="Save"
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.body}>
          {/* Locked name */}
          <Text style={styles.label}>Exercise</Text>
          <View style={styles.nameBox}>
            <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={{ marginRight: 6 }} />
            <Text style={styles.nameText} numberOfLines={2}>
              {ex?.name ?? '—'}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <ActionButton icon="add-circle-outline" label="Add Set" onPress={() => guardSwitch('set')} active={active === 'set'} />
            <ActionButton icon="time-outline" label="Add Rest" onPress={() => guardSwitch('rest')} active={active === 'rest'} disabled />
            <ActionButton icon="chatbubble-ellipses-outline" label="Add Note" onPress={() => guardSwitch('note')} active={active === 'note'} disabled />
          </View>

          {/* Uniform-height panel (Set only) */}
          {active === 'set' && (
            <View style={[styles.panel, { height: PANEL_HEIGHT }]}>
              <View style={styles.panelContentTight}>
                <Text style={styles.panelTitle}>Add Set</Text>

                <View style={styles.rowTight}>
                  <Field label="Weight" value={weight} onChangeText={setWeight} keyboardType="numeric" />
                  <Field label="Reps" value={reps} onChangeText={setReps} keyboardType="numeric" />
                </View>

                <View style={styles.unitRowTight}>
                  <UnitChip text="lb" selected={unit === 'lb'} onPress={() => setUnit('lb')} />
                  <UnitChip text="kg" selected={unit === 'kg'} onPress={() => setUnit('kg')} />
                  <View style={{ flex: 1 }} />
                  {setPhase !== 'performing' ? (
                    <SmallButtonCompact title="Add Set" onPress={beginSetPerforming} />
                  ) : (
                    <SmallButtonCompact title="Complete Set" onPress={completeSet} />
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Descriptor directly under the panel */}
          {active === 'set' && (
            <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.descriptorGrad}>
              <Ionicons name="barbell-outline" size={18} color="#fff" />
              <Text style={styles.descriptorText} numberOfLines={3}>
                {descriptor}
              </Text>
            </LinearGradient>
          )}

          {/* Sets list (hidden if keyboard is up) */}
          {!kbOpen && active === 'set' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionHeader}>Sets</Text>
              {sets.length > 0 ? (
                sets.map((s: any) => (
                  <View key={s.id} style={styles.entryRow}>
                    <Ionicons name="barbell-outline" size={16} color="#cbd5e1" />
                    <Text style={styles.entryText}>
                      {/* Show planned → completed */}
                      {s.status === 'planned'
                        ? `${s.plannedWeight}${s.unit ?? 'lb'} × ${s.plannedReps}  ·  planned`
                        : `${(s.weight ?? s.plannedWeight) ?? '?'}${s.unit ?? 'lb'} × ${(s.reps ?? s.plannedReps) ?? '?'}${
                            s.status === 'completed' ? '  ·  completed' : ''
                          }`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sectionHint}>No sets yet. Start with Add Set.</Text>
              )}

              {setPhase === 'performing' && plannedSetId && (
                <View style={[styles.entryRow, { opacity: 0.8 }]}>
                  <Ionicons name="barbell-outline" size={16} color="#cbd5e1" />
                  <Text style={styles.entryText}>
                    (In progress) {weight}
                    {unit} × {reps}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  active,
  disabled,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.actionBtn,
        active && styles.actionBtnActive,
        disabled && styles.actionBtnDisabled,
        pressed && !disabled && { opacity: 0.9 },
      ]}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        style={styles.fieldInput}
        returnKeyType="done"
      />
    </View>
  );
}

function UnitChip({
  text,
  selected,
  onPress,
}: {
  text: Unit;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.unitChip, selected && styles.unitChipSelected]}>
      <Text style={[styles.unitChipText, selected && styles.unitChipTextSelected]}>{text.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b0b' },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leftIconBtn: { width: 40, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: 'white', fontSize: 17, fontWeight: '700' },
  saveBtn: { minWidth: 52, height: 36, alignItems: 'flex-end', justifyContent: 'center' },
  saveBtnPressed: { opacity: 0.7 },
  saveText: { color: 'white', fontSize: 16, fontWeight: '700' },

  // body
  body: { paddingHorizontal: 16, paddingTop: 16 },
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6 },
  nameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#111',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  nameText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // buttons
  actionsRow: { marginTop: 14, flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  actionBtnActive: { backgroundColor: '#263241', borderColor: 'rgba(255,255,255,0.12)' },
  actionBtnDisabled: { opacity: 0.5 },
  actionText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // uniform panel
  panel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0f1012',
    borderRadius: 14,
    overflow: 'hidden',
  },
  panelContentTight: { paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  panelTitle: { color: 'white', fontSize: 15, fontWeight: '700' },
  rowTight: { flexDirection: 'row', gap: 8 },

  // fields
  field: { flex: 1 },
  fieldLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  fieldInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#111',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },

  // unit chips + compact button row
  unitRowTight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#111',
  },
  unitChipSelected: { backgroundColor: '#1c2430', borderColor: 'rgba(255,255,255,0.2)' },
  unitChipText: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },
  unitChipTextSelected: { color: 'white' },

  // descriptor (gradient)
  descriptorGrad: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  descriptorText: { color: 'white', fontSize: 13, flex: 1 },

  sectionHeader: { color: 'white', fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  sectionHint: { color: '#9ca3af', fontSize: 12, opacity: 0.9 },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  entryText: { color: 'white', fontSize: 14 },
});

// Compact small button (local helper)
function SmallButtonCompact({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: '#374151',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{title}</Text>
    </Pressable>
  );
}
