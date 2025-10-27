import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button, Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Exercise, CompletedSet } from '@shared/schema';

interface SetLoggerCardProps {
  exercise: Exercise;
  completedSets: CompletedSet[];
  onLogSet: (set: CompletedSet) => void;
}

export default function SetLoggerCard({ exercise, completedSets, onLogSet }: SetLoggerCardProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const theme = useTheme();

  const totalSets = (exercise.warmupSets || 0) + exercise.workingSets;
  const currentSetNumber = completedSets.length + 1;
  const isWarmup = currentSetNumber <= (exercise.warmupSets || 0);

  const handleLogSet = () => {
    const set: CompletedSet = {
      setNumber: currentSetNumber,
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe: rpe ? parseInt(rpe) : undefined,
      completedAt: new Date().toISOString(),
      isWarmup,
    };

    onLogSet(set);
    setWeight('');
    setReps('');
    setRpe('');
  };

  const canLog = weight !== '' && reps !== '';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">Log Your Sets</Text>
          <Chip mode="outlined">
            Set {currentSetNumber} / {totalSets}
          </Chip>
        </View>

        {isWarmup && (
          <View style={styles.warmupBanner}>
            <MaterialCommunityIcons name="fire" size={16} color={theme.colors.primary} />
            <Text variant="bodySmall" style={styles.warmupText}>
              Warmup Set
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            label="Weight (lbs)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Reps"
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          {exercise.rpe && (
            <TextInput
              label="RPE"
              value={rpe}
              onChangeText={setRpe}
              keyboardType="numeric"
              mode="outlined"
              style={styles.inputSmall}
              maxLength={2}
            />
          )}
        </View>

        <Button
          mode="contained"
          onPress={handleLogSet}
          disabled={!canLog}
          icon="plus"
          style={styles.logButton}
        >
          Log Set
        </Button>

        {completedSets.length > 0 && (
          <View style={styles.setsHistory}>
            <Text variant="labelMedium" style={styles.historyTitle}>
              Completed Sets:
            </Text>
            {completedSets.map((set, index) => (
              <View key={index} style={styles.setHistoryItem}>
                <Text variant="bodySmall" style={styles.setNumber}>
                  {set.isWarmup ? 'W' : 'Set'} {set.setNumber}
                </Text>
                <Text variant="bodyMedium" style={styles.setDetails}>
                  {set.weight} lbs × {set.reps} reps
                  {set.rpe && ` @ RPE ${set.rpe}`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  warmupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginBottom: 16,
  },
  warmupText: {
    color: '#ff6f00',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
  },
  inputSmall: {
    width: 80,
  },
  logButton: {
    marginBottom: 16,
  },
  setsHistory: {
    marginTop: 8,
  },
  historyTitle: {
    marginBottom: 8,
    color: '#666',
  },
  setHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  setNumber: {
    color: '#666',
    fontWeight: 'bold',
  },
  setDetails: {
    fontWeight: '500',
  },
});
