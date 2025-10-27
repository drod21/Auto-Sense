import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, ProgressBar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RestTimerCardProps {
  duration: number; // in seconds
  onComplete: () => void;
  onDismiss: () => void;
}

export default function RestTimerCard({ duration, onComplete, onDismiss }: RestTimerCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeRemaining, onComplete]);

  const progress = 1 - timeRemaining / duration;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="timer-outline" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium">Rest Timer</Text>
          </View>
          <Button mode="text" onPress={onDismiss} icon="close">
            Dismiss
          </Button>
        </View>

        <View style={styles.timerDisplay}>
          <Text variant="displayMedium" style={styles.timerText}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>

        <ProgressBar progress={progress} style={styles.progressBar} />

        <View style={styles.controls}>
          <Button
            mode="outlined"
            onPress={() => setIsPaused(!isPaused)}
            icon={isPaused ? 'play' : 'pause'}
            style={styles.controlButton}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setTimeRemaining(duration)}
            icon="restart"
            style={styles.controlButton}
          >
            Reset
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerDisplay: {
    alignItems: 'center',
    marginVertical: 24,
  },
  timerText: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
  },
});
