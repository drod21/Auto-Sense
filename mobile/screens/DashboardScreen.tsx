import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Text,
  Card,
  Button,
  Searchbar,
  Portal,
  Dialog,
  ActivityIndicator,
  useTheme,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import type { Program, Phase, WorkoutDay, Exercise } from '@shared/schema';
import { RootStackParamList } from '../navigation';

interface ProgramResponse {
  program: Program;
  phases: (Phase & {
    workoutDays: (WorkoutDay & {
      exercises: Exercise[];
    })[];
  })[];
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

  const {
    data: programs = [],
    isLoading,
    refetch,
    isRefreshing,
  } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
    queryFn: () => apiClient.get<Program[]>('/api/programs'),
  });

  const deleteMutation = useMutation({
    mutationFn: (programId: string) => apiClient.delete(`/api/programs/${programId}`),
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
    },
  });

  const handleDeleteProgram = (programId: string) => {
    setProgramToDelete(programId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (programToDelete) {
      deleteMutation.mutate(programToDelete);
    }
  };

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          My Programs
        </Text>
        <Searchbar
          placeholder="Search programs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
        }
      >
        {filteredPrograms.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={64}
              color={theme.colors.outline}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No Programs Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Upload your first workout spreadsheet to get started
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Upload' } as any)}
              style={styles.uploadButton}
              icon="upload"
            >
              Upload Program
            </Button>
          </View>
        ) : (
          filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onDelete={() => handleDeleteProgram(program.id)}
              onViewWorkout={(workoutDayId, workoutDayName) =>
                navigation.navigate('WorkoutTracker', { workoutDayId, workoutDayName })
              }
            />
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogOpen} onDismiss={() => setDeleteDialogOpen(false)}>
          <Dialog.Title>Delete Program</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this program? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onPress={confirmDelete} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function ProgramCard({
  program,
  onDelete,
  onViewWorkout,
}: {
  program: Program;
  onDelete: () => void;
  onViewWorkout: (workoutDayId: string, workoutDayName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  const {
    data: programData,
    isLoading,
  } = useQuery<ProgramResponse>({
    queryKey: ['/api/programs', program.id],
    queryFn: () => apiClient.get<ProgramResponse>(`/api/programs/${program.id}`),
    enabled: expanded,
  });

  const totalWorkouts =
    programData?.phases.reduce(
      (sum, phase) => sum + phase.workoutDays.length,
      0
    ) || 0;

  const totalExercises =
    programData?.phases.reduce(
      (sum, phase) =>
        sum +
        phase.workoutDays.reduce((daySum, day) => daySum + day.exercises.length, 0),
      0
    ) || 0;

  return (
    <Card style={styles.programCard} onPress={() => setExpanded(!expanded)}>
      <Card.Title
        title={program.name}
        subtitle={new Date(program.uploadDate).toLocaleDateString()}
        right={(props) => (
          <Button
            {...props}
            mode="text"
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            icon="delete"
            textColor={theme.colors.error}
          >
            Delete
          </Button>
        )}
      />

      {expanded && (
        <Card.Content>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : programData ? (
            <>
              <View style={styles.statsRow}>
                <Chip icon="calendar" style={styles.chip}>
                  {programData.phases.length} Phase{programData.phases.length !== 1 ? 's' : ''}
                </Chip>
                <Chip icon="dumbbell" style={styles.chip}>
                  {totalWorkouts} Workout{totalWorkouts !== 1 ? 's' : ''}
                </Chip>
                <Chip icon="format-list-bulleted" style={styles.chip}>
                  {totalExercises} Exercise{totalExercises !== 1 ? 's' : ''}
                </Chip>
              </View>

              {programData.phases.map((phase) => (
                <View key={phase.id} style={styles.phaseSection}>
                  <Text variant="titleMedium" style={styles.phaseTitle}>
                    {phase.name}
                  </Text>
                  {phase.workoutDays.map((workoutDay) => (
                    <Card
                      key={workoutDay.id}
                      style={styles.workoutCard}
                      onPress={() => onViewWorkout(workoutDay.id, workoutDay.dayName)}
                    >
                      <Card.Content>
                        <View style={styles.workoutHeader}>
                          <Text variant="titleSmall">{workoutDay.dayName}</Text>
                          {workoutDay.isRestDay && (
                            <Chip mode="outlined" compact>
                              Rest Day
                            </Chip>
                          )}
                        </View>
                        <Text variant="bodySmall" style={styles.exerciseCount}>
                          {workoutDay.exercises.length} exercise{workoutDay.exercises.length !== 1 ? 's' : ''}
                        </Text>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              ))}
            </>
          ) : null}
        </Card.Content>
      )}
    </Card>
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
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  uploadButton: {
    marginTop: 24,
  },
  programCard: {
    marginBottom: 16,
  },
  loader: {
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 0,
  },
  phaseSection: {
    marginTop: 16,
  },
  phaseTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  workoutCard: {
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseCount: {
    color: '#666',
  },
});
