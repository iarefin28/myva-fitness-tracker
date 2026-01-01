import React, { useState } from 'react';
import { Dimensions, Keyboard, TouchableWithoutFeedback, useColorScheme, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'; // adjust path as needed


export default function ChartsScreen() {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    const backgroundColor = isDark ? '#000' : '#fff';
    const cardColor = isDark ? '#1a1a1a' : '#f2f2f2';
    const textSecondary = isDark ? '#888' : '#666';
    const axisColor = isDark ? '#333' : '#ccc';
    const ruleColor = isDark ? '#222' : '#eee';

    const screenWidth = Dimensions.get('window').width;

    const [exerciseInput, setExerciseInput] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const [exerciseType, setExerciseType] = useState<
        'bodyweight' | 'free weight' | 'machine' | 'unknown'
    >('unknown');
    const [inputFocused, setInputFocused] = useState(false);

    const data = [
        { value: 80, label: 'S1' },
        { value: 80, label: 'S2' },
        { value: 85, label: 'S3' },
        { value: 100, label: 'S4' },
        { value: 90, label: 'S5' },
    ];

    const pink = '#FF2DAF';
    const shouldShowChart = selectedExercise !== null && !inputFocused;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor, paddingHorizontal: 20, paddingTop: 40 }}>
                <ExerciseAutocomplete
                    value={exerciseInput}
                    onChangeText={(text) => {
                        setExerciseInput(text);
                        setSelectedExercise(null); // reset selected when user edits
                        setInputFocused(true);
                    }}
                    onSelect={(name, type) => {
                        setExerciseInput(name);
                        setSelectedExercise(name);
                        setExerciseType(type);
                        setInputFocused(false); // selection finalized
                    }}
                />

                {shouldShowChart && (
                    <View
                        style={{
                            backgroundColor: cardColor,
                            borderRadius: 20,
                            paddingVertical: 20,
                            paddingHorizontal: 12,
                            marginTop: 20,
                            shadowColor: isDark ? '#000' : '#999',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 10,
                            overflow: 'hidden',
                        }}
                    >
                        <LineChart
                            data={data}
                            thickness={3}
                            color={pink}
                            maxValue={120}
                            hideDataPoints={false}
                            hideRules={false}
                            showVerticalLines
                            noOfSections={6}
                            dataPointsColor={pink}
                            curved
                            isAnimated
                            animationDuration={800}
                            width={screenWidth * 0.85}
                            height={150}
                            areaChart={false}
                            startFillColor="transparent"
                            endFillColor="transparent"
                            yAxisTextStyle={{ color: textSecondary }}
                            xAxisLabelTextStyle={{ color: textSecondary }}
                            yAxisColor={axisColor}
                            xAxisColor={axisColor}
                            rulesColor={ruleColor}
                        />
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}
