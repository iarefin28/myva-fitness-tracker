import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { typography } from '@/theme/typography';

type WorkoutSheetProps = {
  title: string;
  leftLabel?: string;
  onLeftPress?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  children: React.ReactNode;
};

export default function WorkoutSheet({
  title,
  leftLabel,
  onLeftPress,
  rightLabel = 'Close',
  onRightPress,
  children,
}: WorkoutSheetProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = {
    bg: isDark ? '#0b0b0b' : '#ffffff',
    grabber: isDark ? '#333' : '#cbd5e1',
    title: isDark ? '#ffffff' : '#0f172a',
    closeBg: isDark ? '#151515' : '#f1f5f9',
    closeText: isDark ? '#0A84FF' : '#2563EB',
  };
  const isSave = rightLabel.toLowerCase() === 'save';
  const showLeft = !!leftLabel;

  return (
    <SafeAreaView style={[styles.sheetRoot, { backgroundColor: C.bg }]}>
      <View style={[styles.grabber, { backgroundColor: C.grabber }]} />
      <View style={styles.sheetHeaderRow}>
        <View style={styles.sheetSide}>
          {showLeft && (
            <Pressable onPress={onLeftPress} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>{leftLabel}</Text>
            </Pressable>
          )}
        </View>
        <Text style={[styles.sheetTitle, { color: C.title }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.sheetSide}>
          <Pressable
            onPress={onRightPress}
            style={[styles.closeBtn, { backgroundColor: C.closeBg }, isSave && styles.saveBtn]}
          >
            <Text style={[styles.closeText, { color: C.closeText }, isSave && styles.saveText]}>{rightLabel}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sheetBody}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, backgroundColor: '#0b0b0b' },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  sheetSide: { width: 88, alignItems: 'flex-start', justifyContent: 'center' },
  sheetTitle: { flex: 1, textAlign: 'center', color: 'white', fontSize: 16, ...typography.body },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#151515', alignSelf: 'flex-end' },
  closeText: { color: '#0A84FF', ...typography.body },
  saveBtn: { backgroundColor: '#0A84FF' },
  saveText: { color: 'white' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#3b0b0b' },
  deleteText: { color: '#ef4444', ...typography.body },
  sheetBody: { flex: 1, padding: 16, gap: 12 },
});
