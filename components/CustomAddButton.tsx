import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function CustomAddButton(props) {
  const navigation = useNavigation();
  const { dark } = useTheme();

  const buttonBg = dark ? "#1A1A1A" : "#e0e0e0";
  const iconColor = dark ? "#fff" : "#000";
  const shadowColor = dark ? "#000" : "#aaa";

  return (
    <TouchableOpacity
      {...props}
      onPress={() => navigation.navigate('add-workout')}
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: buttonBg,
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Ionicons name="add" size={32} color={iconColor} />
    </TouchableOpacity>
  );
}