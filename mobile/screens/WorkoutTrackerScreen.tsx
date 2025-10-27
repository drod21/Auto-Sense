import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text,
  Card,
  Button,
  ProgressBar,
  useTheme,
  ActivityIndicator,
  Chip,
  Divider,
} from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import type { WorkoutDay, Exercise, WorkoutSession, ExerciseProgress, CompletedSet } from '@shared/schema';
import { RootStackParamList } from '../navigation';
import SetLoggerCard from '../components/SetLoggerCard';
import RestTimerCard from '../components/RestTimerCard';

interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: Exercise[];
}

type WorkoutTrackerRouteProp = RouteProp<RootStackParamList, 'WorkoutTracker'>;

export default function WorkoutTrackerScreen() {
  const route = useRoute<WorkoutTrackerRouteProp>();
  const { workoutDayId } = route.params;
  const theme = useTheme();

  const { data: workoutData, isLoading } = useQuery<WorkoutDayWithExercises>({
    queryKey: ['/api/workout-days', workoutDayId],
    queryFn: () => apiClient.get<WorkoutDayWithExercises>(`/api/workout-days/${workoutDayId}`),
  });

  const [session, setSession] = useState<WorkoutSession>({
    workoutDayId: workoutDayId || '',
    startedAt: new Date().toISOString(),
    exerciseProgress: [],
    currentExerciseIndex: 0,
    isComplete: false,
  });

  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(180);

  useEffect(() => {
    if (workoutData && session.exerciseProgress.length === 0) {
      const progress: ExerciseProgress[] = workoutData.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        completedSets: [],
        isComplete: false,
      }));
      setSession((prev) => ({ ...prev, exerciseProgress: progress }));
    }
  }, [workoutData, session.exerciseProgress.length]);

  const currentExercise = workoutData?.exercises[session.currentExerciseIndex];
  const currentProgress = session.exerciseProgress[session.currentExerciseIndex];

  const totalExercises = workoutData?.exercises.length || 0;
  const completedExercises = session.exerciseProgress.filter((p) => p.isComplete).length;
  const overallProgress = totalExercises > 0 ? completedExercises / totalExercises : 0;

  const handleLogSet = (set: CompletedSet) => {
    setSession((prev) => {
      const newProgress = [...prev.exerciseProgress];
      newProgress[prev.currentExerciseIndex] = {
        ...newProgress[prev.currentExerciseIndex],
        completedSets: [...newProgress[prev.currentExerciseIndex].completedSets, set],
      };
      return { ...prev, exerciseProgress: newProgress };
    });

    // Start rest timer
    if (currentExercise?.restTimer) {
      const timerMatch = currentExercise.restTimer.match(/(\d+)/);
      if (timerMatch) {
        const minutes = parseInt(timerMatch[1]);
        setRestTimerDuration(minutes * 60);
        setRestTimerActive(true);
      }
    }
  };

  const handleCompleteExercise = () => {
    setSession((prev) => {
      const newProgress = [...prev.exerciseProgress];
      newProgress[prev.currentExerciseIndex] = {
        ...newProgress[prev.currentExerciseIndex],
        isComplete: true,
      };

      const nextIndex = prev.currentExerciseIndex + 1;
      const isWorkoutComplete = nextIndex >= totalExercises;

      return {
        ...prev,
        exerciseProgress: newProgress,
        currentExerciseIndex: isWorkoutComplete ? prev.currentExerciseIndex : nextIndex,
        isComplete: isWorkoutComplete,
        completedAt: isWorkoutComplete ? new Date().toISOString() : undefined,
      };
    });
  };

  const handlePreviousExercise = () => {
    if (session.currentExerciseIndex > 0) {
      setSession((prev) => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex - 1,
      }));
    }
  };

  const handleNextExercise = () => {
    if (session.currentExerciseIndex < totalExercises - 1) {
      setSession((prev) => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
      }));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!workoutData || !currentExercise || !currentProgress) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text variant="titleLarge">Workout not found</Text>
      </View>
    );
  }

  if (session.isComplete) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons
          name="trophy"
          size={64}
          color={theme.colors.primary}
        />
        <Text variant="headlineMedium" style={styles.completeTitle}>
          Workout Complete!
        </Text>
        <Text variant="bodyLarge" style={styles.completeText}>
          Great job on completing your workout!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text variant="titleMedium">
            Exercise {session.currentExerciseIndex + 1} of {totalExercises}
          </Text>
          <Text variant="bodyMedium" style={styles.progressText}>
            {completedExercises} / {totalExercises} complete
          </Text>
        </View>
        <ProgressBar progress={overallProgress} style={styles.progressBar} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.exerciseCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.exerciseName}>
              {currentExercise.exerciseName}
            </Text>

            {currentExercise.supersetGroup && (
              <Chip style={styles.supersetChip} mode="outlined">
                Superset {currentExercise.supersetGroup}
              </Chip>
            )}

            <Divider style={styles.divider} />

            <View style={styles.detailsRow}>
              <DetailItem label="Sets" value={`${currentExercise.warmupSets || 0}W + ${currentExercise.workingSets}W`} />
              <DetailItem label="Reps" value={currentExercise.reps} />
            </View>

            <View style={styles.detailsRow}>
              {currentExercise.rpe && <DetailItem label="RPE" value={currentExercise.rpe} />}
              {currentExercise.restTimer && <DetailItem label="Rest" value={currentExercise.restTimer} />}
            </View>

            {currentExercise.notes && (
              <View style={styles.notesSection}>
                <Text variant="labelMedium" style={styles.notesLabel}>
                  Notes:
                </Text>
                <Text variant="bodyMedium">{currentExercise.notes}</Text>
              </View>
            )}

            {(currentExercise.substitutionOption1 || currentExercise.substitutionOption2) && (
              <View style={styles.substitutionsSection}>
                <Text variant="labelMedium" style={styles.substitutionsLabel}>
                  Substitutions:
                </Text>
                {currentExercise.substitutionOption1 && (
                  <Text variant="bodySmall">• {currentExercise.substitutionOption1}</Text>
                )}
                {currentExercise.substitutionOption2 && (
                  <Text variant="bodySmall">• {currentExercise.substitutionOption2}</Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        <SetLoggerCard
          exercise={currentExercise}
          completedSets={currentProgress.completedSets}
          onLogSet={handleLogSet}
        />

        {restTimerActive && (
          <RestTimerCard
            duration={restTimerDuration}
            onComplete={() => setRestTimerActive(false)}
            onDismiss={() => setRestTimerActive(false)}
          />
        )}

        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={handlePreviousExercise}
            disabled={session.currentExerciseIndex === 0}
            style={styles.navButton}
            icon="chevron-left"
          >
            Previous
          </Button>

          {currentProgress.completedSets.length > 0 && !currentProgress.isComplete && (
            <Button
              mode="contained"
              onPress={handleCompleteExercise}
              style={styles.navButton}
              icon="check"
            >
              Complete
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={handleNextExercise}
            disabled={session.currentExerciseIndex === totalExercises - 1}
            style={styles.navButton}
            icon="chevron-right"
            contentStyle={{ flexDirection: 'row-reverse' }}
          >
            Next
          </Button>
        </View>

        <View style={styles.allExercisesSection}>
          <Text variant="titleMedium" style={styles.allExercisesTitle}>
            All Exercises
          </Text>
          {workoutData.exercises.map((exercise, index) => (
            <Card
              key={exercise.id}
              style={[
                styles.exerciseSummaryCard,
                session.exerciseProgress[index]?.isComplete && styles.completedCard,
                index === session.currentExerciseIndex && styles.currentCard,
              ]}
              onPress={() => setSession((prev) => ({ ...prev, currentExerciseIndex: index }))}
            >
              <Card.Content>
                <View style={styles.exerciseSummaryHeader}>
                  <Text variant="titleSmall">{exercise.exerciseName}</Text>
                  {session.exerciseProgress[index]?.isComplete && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                  )}
                </View>
                <Text variant="bodySmall" style={styles.exerciseSummaryDetails}>
                  {exercise.workingSets} sets × {exercise.reps} reps
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text variant="labelMedium" style={styles.detailLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  progressSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  exerciseCard: {
    marginBottom: 16,
  },
  exerciseName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  supersetChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: 100,
  },
  detailLabel: {
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  notesLabel: {
    marginBottom: 4,
    color: '#666',
  },
  substitutionsSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  substitutionsLabel: {
    marginBottom: 8,
    color: '#666',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  navButton: {
    flex: 1,
  },
  allExercisesSection: {
    marginBottom: 16,
  },
  allExercisesTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exerciseSummaryCard: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  completedCard: {
    backgroundColor: '#f0f8f0',
  },
  currentCard: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  exerciseSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseSummaryDetails: {
    color: '#666',
  },
  completeTitle: {
    marginTop: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  completeText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
});
