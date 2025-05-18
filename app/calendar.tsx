import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { CalendarList, DateObject } from 'react-native-calendars';

export default function CalendarScreen() {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const navigation = useNavigation();

    const filterOptions = ['Back', 'Chest', 'Legs', 'Push', 'Pull'];

    // 🧠 Example workout log
    const workoutData: Record<string, string> = {
        '2025-05-18': 'Chest',
        '2025-05-06': 'Back',
        '2025-05-09': 'Back',
        '2025-05-14': 'Back',
        '2025-05-17': 'Back',
        '2025-05-30': 'Legs',
        '2025-05-10': 'Push',
        '2025-05-25': 'Pull',
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Calendar',
            headerRight: () => (
                <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
                    <Ionicons name="filter" size={24} color="white" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    // 🧠 Build markedDates from filter
    const markedDates: Record<string, any> = {};
    Object.entries(workoutData).forEach(([date, muscle]) => {
        if (!selectedMuscleGroup || muscle === selectedMuscleGroup) {
            markedDates[date] = {
                selected: true,
                selectedColor: '#ff6f61',
                selectedTextColor: '#fff',
            };
        }
    });

    if (selectedDate && !markedDates[selectedDate]) {
        markedDates[selectedDate] = {
            selected: true,
            selectedColor: '#00adf5',
            selectedTextColor: '#ffffff',
        };
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return '';

        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed

        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
        };

        return date.toLocaleDateString('en-US', options);
    };
    return (
        <SafeAreaView style={styles.container}>
            {/* Top half: Calendar */}
            <View style={styles.calendarContainer}>
                <CalendarList
                    horizontal={false}
                    pagingEnabled={false}
                    pastScrollRange={24}
                    futureScrollRange={24}
                    hideExtraDays={true}
                    scrollEnabled={true}
                    showScrollIndicator={false}
                    onDayPress={(day: DateObject) => setSelectedDate(day.dateString)}
                    markedDates={markedDates}
                    theme={{
                        backgroundColor: '#000000',
                        calendarBackground: '#000000',
                        dayTextColor: '#ffffff',
                        monthTextColor: '#ffffff',
                        arrowColor: '#ffffff',
                    }}
                />
            </View>

            {/* Bottom half: Scrollable rounded gray view */}
            <View style={styles.bottomHalf}>
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    {selectedDate ? (
                        <Text style={styles.selectedDateFormatted}>{formatDate(selectedDate)}</Text>
                    ) : (
                        <Text style={styles.selectedText}>Select a date to view workouts</Text>
                    )}

                    {[...Array(3)].map((_, i) => (
                        <View key={i} style={styles.workoutCard}>
                            <Text style={styles.workoutText}>Workout {i + 1}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Muscle Group</Text>
                        <FlatList
                            data={filterOptions}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.filterOption}
                                    onPress={() => {
                                        setSelectedMuscleGroup(item === selectedMuscleGroup ? null : item);
                                        setFilterModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.filterText}>
                                        {item} {item === selectedMuscleGroup ? '✓' : ''}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    calendarContainer: { flex: 1, paddingTop: 10 },
    bottomHalf: {
        flex: 1,
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    scrollContainer: { padding: 16 },
    selectedText: {
        color: '#aaa',
        fontSize: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    workoutCard: {
        backgroundColor: '#2e2e2e',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    workoutText: { color: '#fff', fontSize: 16 },

    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#1e1e1e',
        marginHorizontal: 32,
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: { color: 'white', fontSize: 18, marginBottom: 12 },
    filterOption: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    filterText: { color: '#fff', fontSize: 16 },
    selectedDateFormatted: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'left',
    },
});
