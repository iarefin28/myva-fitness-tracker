import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import WorkoutSheet from './WorkoutSheet';

type CustomModalProps = {
  visible: boolean;
  text: string;
  onChangeText: (next: string) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  isEditing: boolean;
};

export default function CustomModal({
  visible,
  text,
  onChangeText,
  onClose,
  onSave,
  onDelete,
  isEditing,
}: CustomModalProps) {
  const hasText = text.trim().length > 0;
  const rightLabel = hasText ? 'Save' : 'Close';

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <WorkoutSheet
        title={isEditing ? 'Edit Custom' : 'Add Custom'}
        leftLabel={isEditing ? 'Delete' : undefined}
        onLeftPress={isEditing ? onDelete : undefined}
        rightLabel={rightLabel}
        onRightPress={hasText ? onSave : onClose}
      >
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder="What do you want to log?"
          placeholderTextColor="#777"
          style={styles.sheetInput}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.sheetPrimary, { opacity: hasText ? 1 : 0.65 }]}
          disabled={!hasText}
          onPress={onSave}
        >
          <Text style={styles.sheetPrimaryText}>{isEditing ? 'Save Changes' : 'Add Custom'}</Text>
        </TouchableOpacity>
      </WorkoutSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetInput: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#141414',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sheetPrimary: { backgroundColor: '#0A84FF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  sheetPrimaryText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
