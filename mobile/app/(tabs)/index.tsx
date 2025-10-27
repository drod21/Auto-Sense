import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import type { Exercise, Phase, Program, WorkoutDay } from '@shared/schema';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PhaseWithDays extends Phase {
  workoutDays: (WorkoutDay & { exercises: Exercise[] })[];
}

interface ProgramResponse {
  program: Program;
  phases: PhaseWithDays[];
}

type ViewState = 'loading' | 'empty' | 'ready';

function calculateProgramStats(programResponse: ProgramResponse) {
  const { phases } = programResponse;

  let totalWorkoutDays = 0;
  let totalNonRestDays = 0;
  let totalExercises = 0;
  let firstWeekNonRestDays = 0;

  phases.forEach((phase) => {
    phase.workoutDays.forEach((day) => {
      totalWorkoutDays += 1;
      if (!day.isRestDay) {
        totalNonRestDays += 1;
        totalExercises += day.exercises.length;
        if (day.weekNumber === 1) {
          firstWeekNonRestDays += 1;
        }
      }
    });
  });

  return {
    phaseCount: phases.length,
    workoutDayCount: totalWorkoutDays,
    avgExercisesPerDay: totalNonRestDays > 0 ? totalExercises / totalNonRestDays : 0,
    workoutsPerWeek: firstWeekNonRestDays > 0 ? firstWeekNonRestDays : totalNonRestDays,
  };
}

export default function DashboardScreen() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];

  const {
    data: programs = [],
    isLoading: isProgramsLoading,
    isSuccess: isProgramsSuccess,
    error: programsError,
  } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  useEffect(() => {
    if (isProgramsLoading) {
      setViewState('loading');
      return;
    }

    if (!isProgramsLoading && programs.length === 0) {
      setViewState('empty');
      return;
    }

    setViewState('ready');
  }, [isProgramsLoading, programs.length]);

  useEffect(() => {
    if (programs.length === 0) {
      return;
    }

    const exists = selectedProgramId
      ? programs.some((program) => program.id === selectedProgramId)
      : false;

    if (!exists) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  const { data: selectedProgramData, isLoading: isProgramLoading } = useQuery<ProgramResponse>({
    queryKey: ['/api/programs', selectedProgramId],
    enabled: viewState === 'ready' && !!selectedProgramId,
  });

  const flattenedWorkoutDays = useMemo(() => {
    if (!selectedProgramData) return [];

    return selectedProgramData.phases.flatMap((phase) =>
      phase.workoutDays.map((day) => ({
        ...day,
        phaseName: phase.name,
        phaseNumber: phase.phaseNumber,
      })),
    );
  }, [selectedProgramData]);

  const filteredWorkoutDays = useMemo(() => {
    if (!searchQuery.trim()) {
      return flattenedWorkoutDays;
    }

    const normalized = searchQuery.trim().toLowerCase();
    return flattenedWorkoutDays.filter((day) => {
      const matchesName = day.dayName.toLowerCase().includes(normalized);
      const matchesExercise = day.exercises.some((exercise) =>
        exercise.exerciseName.toLowerCase().includes(normalized),
      );
      return matchesName || matchesExercise;
    });
  }, [flattenedWorkoutDays, searchQuery]);

  const selectedProgramStats = useMemo(() => {
    if (!selectedProgramData) return null;
    return calculateProgramStats(selectedProgramData);
  }, [selectedProgramData]);

  const handleWorkoutPress = (workoutId: string) => {
    router.push({
      pathname: '/workout/[workoutDayId]',
      params: { workoutDayId: workoutId },
    });
  };

  const renderContent = () => {
    if (viewState === 'loading') {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.helperText, { color: theme.icon }]}>Loading your programs…</Text>
        </View>
      );
    }

    if (viewState === 'empty') {
      return (
        <View style={styles.centerContent}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No programs yet</Text>
          <Text style={[styles.helperText, { color: theme.icon }]}>
            Upload a training spreadsheet from the Upload tab to get started.
          </Text>
        </View>
      );
    }

    if (!selectedProgramData || isProgramLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.helperText, { color: theme.icon }]}>Loading program details…</Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Program Overview</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.icon }]}>
            {selectedProgramData.program.description ??
              'Browse workouts, see training focus, and jump straight into a session.'}
          </Text>
        </View>

        {process.env.EXPO_PUBLIC_DEBUG && programsError ? (
          <Text style={{ color: 'red' }}>{String(programsError)}</Text>
        ) : null}

        {selectedProgramStats ? (
          <View style={styles.statsRow}>
            <StatCard
              label="Phases"
              value={`${selectedProgramStats.phaseCount}`}
              themeColor={theme.tint}
              textColor={theme.text}
            />
            <StatCard
              label="Workouts"
              value={`${selectedProgramStats.workoutDayCount}`}
              themeColor={theme.tint}
              textColor={theme.text}
            />
            <StatCard
              label="Avg Exercises"
              value={selectedProgramStats.avgExercisesPerDay.toFixed(1)}
              themeColor={theme.tint}
              textColor={theme.text}
            />
            <StatCard
              label="Weekly Sessions"
              value={`${selectedProgramStats.workoutsPerWeek}`}
              themeColor={theme.tint}
              textColor={theme.text}
            />
          </View>
        ) : null}

        {programs.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.programPicker}
            contentContainerStyle={styles.programPickerContent}>
            {programs.map((program) => {
              const isSelected = program.id === selectedProgramId;
              return (
                <TouchableOpacity
                  key={program.id}
                  style={[
                    styles.programPill,
                    {
                      backgroundColor: isSelected ? theme.tint : 'transparent',
                      borderColor: theme.tint,
                    },
                  ]}
                  onPress={() => setSelectedProgramId(program.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}>
                  <Text
                    style={[
                      styles.programPillText,
                      { color: isSelected ? '#fff' : theme.tint },
                    ]}>
                    {program.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.searchContainer}>
          <Text style={[styles.searchLabel, { color: theme.text }]}>Find a workout</Text>
          <TextInput
            placeholder="Search by day or exercise name"
            placeholderTextColor={theme.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              {
                borderColor: theme.icon,
                color: theme.text,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Workout Days</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.icon }]}>
            Tap a day to review the exercises and start logging sets.
          </Text>
        </View>

        {filteredWorkoutDays.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={[styles.helperText, { color: theme.icon }]}>
              No workouts match your search.
            </Text>
          </View>
        ) : (
          filteredWorkoutDays.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={[styles.workoutCard, { borderColor: theme.icon }]}
              onPress={() => handleWorkoutPress(day.id)}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutHeaderText}>
                  <Text style={[styles.workoutTitle, { color: theme.text }]}>{day.dayName}</Text>
                  <Text style={[styles.workoutPhase, { color: theme.icon }]}>
                    Phase {day.phaseNumber} • Week {day.weekNumber}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: day.isRestDay ? '#FEE4E2' : '#E0F7EC',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.badgeText,
                      { color: day.isRestDay ? '#912018' : '#1B5E20' },
                    ]}>
                    {day.isRestDay ? 'Rest Day' : `${day.exercises.length} exercises`}
                  </Text>
                </View>
              </View>
              {!day.isRestDay ? (
                <View style={styles.exerciseList}>
                  {day.exercises.slice(0, 3).map((exercise) => (
                    <Text key={exercise.id} style={[styles.exerciseItem, { color: theme.icon }]}>
                      • {exercise.exerciseName} ({exercise.workingSets} x {exercise.reps})
                    </Text>
                  ))}
                  {day.exercises.length > 3 ? (
                    <Text style={[styles.exerciseItem, { color: theme.icon }]}>
                      + {day.exercises.length - 3} more
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={[styles.exerciseItem, { color: theme.icon }]}>
                  Take the day to recover and prepare for your next session.
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Review your training plan and start logging workouts on the go.
        </Text>
      </View>
      {renderContent()}
    </ScrollView>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  themeColor: string;
  textColor: string;
}

function StatCard({ label, value, themeColor, textColor }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderColor: themeColor }]}>
      <Text style={[styles.statLabel, { color: themeColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    lineHeight: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 24,
  },
  centerContent: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  helperText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minWidth: 140,
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  programPicker: {
    marginTop: -6,
    marginHorizontal: -8,
  },
  programPickerContent: {
    paddingHorizontal: 8,
    gap: 10,
  },
  programPill: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  programPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    gap: 8,
  },
  searchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  workoutCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(17, 24, 28, 0.02)',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  workoutHeaderText: {
    flexShrink: 1,
    gap: 4,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  workoutPhase: {
    fontSize: 13,
    opacity: 0.9,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  exerciseList: {
    marginTop: 12,
    gap: 6,
  },
  exerciseItem: {
    fontSize: 14,
    lineHeight: 20,
  },
});
