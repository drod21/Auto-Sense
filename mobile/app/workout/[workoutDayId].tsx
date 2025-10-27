import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import type { CompletedSet, Exercise, ExerciseProgress, WorkoutDay } from '@shared/schema';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: Exercise[];
}

interface WorkoutSession {
  workoutDayId: string;
  startedAt: string;
  completedAt?: string;
  exerciseProgress: ExerciseProgress[];
  currentExerciseIndex: number;
  isComplete: boolean;
}

interface SetDraft {
  weight: string;
  reps: string;
  rpe: string;
}

const INITIAL_SET_DRAFT: SetDraft = { weight: '', reps: '', rpe: '' };

export default function WorkoutTrackerScreen() {
  const { workoutDayId } = useLocalSearchParams<{ workoutDayId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { data: workoutData, isLoading } = useQuery<WorkoutDayWithExercises>({
    queryKey: ['/api/workout-days', workoutDayId],
    enabled: !!workoutDayId,
  });

  const [session, setSession] = useState<WorkoutSession>({
    workoutDayId: String(workoutDayId ?? ''),
    startedAt: new Date().toISOString(),
    exerciseProgress: [],
    currentExerciseIndex: 0,
    isComplete: false,
  });
  const [setDraft, setSetDraft] = useState<SetDraft>(INITIAL_SET_DRAFT);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!workoutDayId || !workoutData) {
      return;
    }

    setSession((prev) => {
      if (prev.exerciseProgress.length > 0 && prev.workoutDayId === workoutDayId) {
        return prev;
      }

      const progress: ExerciseProgress[] = workoutData.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        completedSets: [],
        isComplete: false,
      }));

      return {
        workoutDayId,
        startedAt: new Date().toISOString(),
        exerciseProgress: progress,
        currentExerciseIndex: 0,
        isComplete: false,
      };
    });
  }, [workoutDayId, workoutData]);

  useEffect(() => {
    if (restSecondsRemaining === null) {
      return;
    }

    if (restSecondsRemaining <= 0) {
      setRestSecondsRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      setRestSecondsRemaining((current) => {
        if (current === null) {
          return null;
        }
        if (current <= 1) {
          return null;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restSecondsRemaining]);

  const currentExercise = useMemo(() => {
    if (!workoutData) return undefined;
    return workoutData.exercises[session.currentExerciseIndex];
  }, [session.currentExerciseIndex, workoutData]);

  const currentProgress = useMemo(() => {
    return session.exerciseProgress[session.currentExerciseIndex];
  }, [session.exerciseProgress, session.currentExerciseIndex]);

  const totalExercises = session.exerciseProgress.length;
  const completedExercises = session.exerciseProgress.filter((item) => item.isComplete).length;
  const progressRatio = totalExercises > 0 ? completedExercises / totalExercises : 0;

  const handleLogSet = () => {
    if (!currentExercise) {
      return;
    }

    const weight = Number(setDraft.weight);
    const reps = Number(setDraft.reps);
    const rpe = setDraft.rpe ? Number(setDraft.rpe) : undefined;

    if (Number.isNaN(weight) || Number.isNaN(reps)) {
      Alert.alert('Missing info', 'Please enter both weight and reps to log the set.');
      return;
    }

    const totalSetsNeeded =
      (currentExercise.warmupSets ?? 0) + (currentExercise.workingSets ?? 0);

    setSession((prev) => {
      const updatedProgress = [...prev.exerciseProgress];
      const targetProgress = { ...updatedProgress[prev.currentExerciseIndex] };
      const newSet: CompletedSet = {
        setNumber: targetProgress.completedSets.length + 1,
        weight,
        reps,
        rpe,
        completedAt: new Date().toISOString(),
        isWarmup: targetProgress.completedSets.length < (currentExercise.warmupSets ?? 0),
      };

      targetProgress.completedSets = [...targetProgress.completedSets, newSet];
      if (targetProgress.completedSets.length >= totalSetsNeeded) {
        targetProgress.isComplete = true;
      }

      updatedProgress[prev.currentExerciseIndex] = targetProgress;

      return {
        ...prev,
        exerciseProgress: updatedProgress,
      };
    });

    const parsedRest = parseRestTimer(currentExercise.restTimer);
    if (parsedRest !== null && parsedRest > 0) {
      setRestSecondsRemaining(parsedRest);
    }

    setSetDraft(INITIAL_SET_DRAFT);
  };

  const handleMarkComplete = () => {
    if (!currentExercise) {
      return;
    }

    setSession((prev) => {
      const updatedProgress = [...prev.exerciseProgress];
      updatedProgress[prev.currentExerciseIndex] = {
        ...updatedProgress[prev.currentExerciseIndex],
        isComplete: true,
      };

      const isLastExercise = prev.currentExerciseIndex >= updatedProgress.length - 1;

      return {
        ...prev,
        exerciseProgress: updatedProgress,
        currentExerciseIndex: isLastExercise ? prev.currentExerciseIndex : prev.currentExerciseIndex + 1,
      };
    });
  };

  const handleNavigate = (direction: 'next' | 'previous') => {
    setSession((prev) => {
      const nextIndex =
        direction === 'next'
          ? Math.min(prev.currentExerciseIndex + 1, prev.exerciseProgress.length - 1)
          : Math.max(prev.currentExerciseIndex - 1, 0);

      if (nextIndex === prev.currentExerciseIndex) {
        return prev;
      }

      return {
        ...prev,
        currentExerciseIndex: nextIndex,
      };
    });
  };

  const handleFinishWorkout = () => {
    setSession((prev) => ({
      ...prev,
      isComplete: true,
      completedAt: new Date().toISOString(),
    }));
    router.back();
  };

  const handleCancelRestTimer = () => setRestSecondsRemaining(null);

  if (isLoading) {
    return (
      <View style={[styles.centerContent, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.helperText, { color: theme.icon }]}>Loading workout…</Text>
      </View>
    );
  }

  if (!workoutData || workoutData.exercises.length === 0) {
    return (
      <View style={[styles.centerContent, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Workout not found</Text>
        <Text style={[styles.helperText, { color: theme.icon }]}>
          This workout may have been removed. Return to the dashboard to choose another day.
        </Text>
        <ActionButton
          label="Back to Dashboard"
          onPress={() => router.replace('/')}
          themeColor={theme.tint}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonLabel, { color: theme.tint }]}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{workoutData.dayName}</Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            Week {workoutData.weekNumber} • {workoutData.isRestDay ? 'Recovery' : 'Training day'}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.text }]}>
            Exercise {Math.min(session.currentExerciseIndex + 1, totalExercises)} of{' '}
            {totalExercises}
          </Text>
          <Text style={[styles.progressLabel, { color: theme.icon }]}>
            {Math.round(progressRatio * 100)}% complete
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: `${theme.icon}30` }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(progressRatio * 100, 6)}%`,
                backgroundColor: theme.tint,
              },
            ]}
          />
        </View>
      </View>

      {restSecondsRemaining !== null ? (
        <View style={[styles.restBanner, { borderColor: theme.tint, backgroundColor: `${theme.tint}10` }]}>
          <Text style={[styles.restLabel, { color: theme.tint }]}>
            Rest {formatSeconds(restSecondsRemaining)}
          </Text>
          <TouchableOpacity onPress={handleCancelRestTimer}>
            <Text style={[styles.restCancel, { color: theme.tint }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.content}>
        {currentExercise ? (
          <View style={styles.exerciseCard}>
            <Text style={[styles.exerciseTitle, { color: theme.text }]}>
              {currentExercise.exerciseName}
            </Text>
            <Text style={[styles.exerciseMeta, { color: theme.icon }]}>
              {currentExercise.workingSets} working sets • {currentExercise.reps} reps
            </Text>
            {currentExercise.load ? (
              <Text style={[styles.exerciseMeta, { color: theme.icon }]}>
                Load: {currentExercise.load}
              </Text>
            ) : null}
            {currentExercise.notes ? (
              <Text style={[styles.exerciseNotes, { color: theme.icon }]}>
                Notes: {currentExercise.notes}
              </Text>
            ) : null}
          </View>
        ) : null}

        {currentProgress ? (
          <View style={styles.setLogger}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Log a set</Text>
            <View style={styles.formRow}>
              <FormField
                label="Weight"
                placeholder="lbs"
                value={setDraft.weight}
                onChangeText={(value) => setSetDraft((prev) => ({ ...prev, weight: value }))}
                keyboardType="numeric"
                theme={theme}
              />
              <FormField
                label="Reps"
                placeholder="reps"
                value={setDraft.reps}
                onChangeText={(value) => setSetDraft((prev) => ({ ...prev, reps: value }))}
                keyboardType="numeric"
                theme={theme}
              />
              <FormField
                label="RPE"
                placeholder="optional"
                value={setDraft.rpe}
                onChangeText={(value) => setSetDraft((prev) => ({ ...prev, rpe: value }))}
                keyboardType="numeric"
                theme={theme}
              />
            </View>
            <ActionButton
              label="Add Completed Set"
              onPress={handleLogSet}
              themeColor={theme.tint}
            />
          </View>
        ) : null}

        {currentProgress && currentProgress.completedSets.length > 0 ? (
          <View style={styles.completedSets}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Completed sets</Text>
            {currentProgress.completedSets.map((set) => (
              <View key={`${currentExercise?.id}-${set.setNumber}`} style={styles.completedSetRow}>
                <Text style={[styles.completedSetLabel, { color: theme.icon }]}>
                  Set {set.setNumber}
                </Text>
                <Text style={[styles.completedSetValue, { color: theme.text }]}>
                  {set.weight} lbs × {set.reps} reps
                </Text>
                {typeof set.rpe === 'number' ? (
                  <Text style={[styles.completedSetValue, { color: theme.icon }]}>
                    RPE {set.rpe}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.controls}>
          <ActionButton
            label="Previous"
            onPress={() => handleNavigate('previous')}
            themeColor={theme.tint}
            variant="outline"
            disabled={session.currentExerciseIndex === 0}
          />
          <ActionButton
            label="Mark Complete"
            onPress={handleMarkComplete}
            themeColor={theme.tint}
            variant="solid"
          />
          <ActionButton
            label="Next"
            onPress={() => handleNavigate('next')}
            themeColor={theme.tint}
            variant="outline"
            disabled={session.currentExerciseIndex >= totalExercises - 1}
          />
        </View>

        <ActionButton
          label="Finish Workout"
          onPress={handleFinishWorkout}
          themeColor={theme.tint}
          variant="solid"
        />
      </View>
    </ScrollView>
  );
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  themeColor: string;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
}

function ActionButton({
  label,
  onPress,
  themeColor,
  variant = 'solid',
  disabled = false,
}: ActionButtonProps) {
  const isSolid = variant === 'solid';
  const backgroundColor = isSolid ? themeColor : 'transparent';
  const computedTextColor = isSolid
    ? isColorLight(backgroundColor) ? '#11181C' : '#fff'
    : themeColor;
  const borderWidth = variant === 'outline' ? 1 : 0;
  const borderColor = themeColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.actionButton,
        {
          backgroundColor,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        },
      ]}>
      <Text
        style={[
          styles.actionButtonLabel,
          { color: disabled && !isSolid ? `${themeColor}80` : computedTextColor },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  theme: (typeof Colors)['light'];
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  theme,
}: FormFieldProps) {
  return (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: theme.icon }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={`${theme.icon}80`}
        keyboardType={keyboardType}
        style={[
          styles.formInput,
          {
            borderColor: `${theme.icon}60`,
            color: theme.text,
          },
        ]}
      />
    </View>
  );
}

function parseRestTimer(restTimer?: string | null) {
  if (!restTimer) {
    return null;
  }

  if (restTimer.toLowerCase().includes('0')) {
    return null;
  }

  const match = restTimer.match(/(\d+)/);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  if (Number.isNaN(minutes)) {
    return null;
  }

  return minutes * 60;
}

function formatSeconds(seconds: number) {
  const clamped = Math.max(seconds, 0);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isColorLight(color: string) {
  if (!color || color === 'transparent') {
    return false;
  }

  if (!color.startsWith('#')) {
    return false;
  }

  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    return false;
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.7;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  helperText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  header: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  restBanner: {
    marginHorizontal: 20,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  restCancel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 24,
  },
  exerciseCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(17, 24, 28, 0.04)',
    padding: 20,
    gap: 8,
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  exerciseMeta: {
    fontSize: 15,
    lineHeight: 20,
  },
  exerciseNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  setLogger: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  completedSets: {
    gap: 12,
  },
  completedSetRow: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 28, 0.03)',
    gap: 4,
  },
  completedSetLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  completedSetValue: {
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
