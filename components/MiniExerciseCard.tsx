// components/MiniExerciseCard.tsx
// Not actually used, using this for development
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MiniExerciseCard({ title }: { title: string }) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardText}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});