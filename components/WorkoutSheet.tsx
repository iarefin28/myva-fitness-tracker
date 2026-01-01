import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

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
  const isSave = rightLabel.toLowerCase() === 'save';
  const showLeft = !!leftLabel;

  return (
    <SafeAreaView style={styles.sheetRoot}>
      <View style={styles.grabber} />
      <View style={styles.sheetHeaderRow}>
        <View style={styles.sheetSide}>
          {showLeft && (
            <Pressable onPress={onLeftPress} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>{leftLabel}</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.sheetTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.sheetSide}>
          <Pressable onPress={onRightPress} style={[styles.closeBtn, isSave && styles.saveBtn]}>
            <Text style={[styles.closeText, isSave && styles.saveText]}>{rightLabel}</Text>
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
  sheetTitle: { flex: 1, textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#151515', alignSelf: 'flex-end' },
  closeText: { color: '#0A84FF', fontWeight: '800' },
  saveBtn: { backgroundColor: '#0A84FF' },
  saveText: { color: 'white' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#3b0b0b' },
  deleteText: { color: '#ef4444', fontWeight: '800' },
  sheetBody: { flex: 1, padding: 16, gap: 12 },
});
