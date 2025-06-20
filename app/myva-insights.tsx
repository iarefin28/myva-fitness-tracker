import DraggableExercisePanel from '@/components/DraggableExercisePanel';
import { StyleSheet, View } from 'react-native';

export default function MyvaInsightsScreen() {
  return (
    <View style={styles.container}>
      <DraggableExercisePanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
});