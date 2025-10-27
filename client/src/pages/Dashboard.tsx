import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import ProgramCard from "@/components/ProgramCard";
import WorkoutPreviewSheet from "@/components/WorkoutPreviewSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Upload, Dumbbell, Calendar, Trash2, ArrowLeft, Grid3x3 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Program, Phase, WorkoutDay, Exercise } from "@shared/schema";

interface PhaseWithDays extends Phase {
  workoutDays: (WorkoutDay & { exercises: Exercise[] })[];
}

interface ProgramWithPhases extends Program {
  phases: PhaseWithDays[];
}

interface ProgramResponse {
  program: Program;
  phases: PhaseWithDays[];
}

interface ProgramStats {
  phaseCount: number;
  workoutDayCount: number;
  avgExercisesPerDay: number;
  workoutsPerWeek: number;
}

interface ProgramWithStats extends Program {
  stats: ProgramStats;
}

type ViewMode = "all-programs" | "single-program";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("single-program");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<{
    id: string;
    name: string;
    exercises: Exercise[];
  } | null>(null);
  const { toast } = useToast();

  const {
    data: programs = [],
    isLoading,
    isSuccess,
  } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  // Set default selected program and revalidate when programs change
  useEffect(() => {
    if (programs.length === 0) {
      setSelectedProgramId(null);
      setViewMode("all-programs");
      return;
    }

    // If no program is selected or the selected program no longer exists, select the first one
    const selectedProgramExists = programs.some(p => p.id === selectedProgramId);
    if (!selectedProgramId || !selectedProgramExists) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  // Fetch full details for all programs (for stats calculation)
  const { data: allProgramsData = [] } = useQuery<ProgramResponse[]>({
    queryKey: ["/api/programs/all-details"],
    queryFn: async () => {
      const responses = await Promise.all(
        programs.map(async (program) => {
          const response = await fetch(`/api/programs/${program.id}`);
          if (!response.ok) throw new Error("Failed to fetch program");
          return response.json();
        })
      );
      return responses;
    },
    enabled: programs.length > 0 && viewMode === "all-programs",
  });

  // Fetch full details for the selected program
  const selectedProgramExists = selectedProgramId && programs.some(p => p.id === selectedProgramId);
  const { data: programData, isLoading: isProgramLoading } = useQuery<ProgramResponse>({
    queryKey: ["/api/programs", selectedProgramId],
    enabled: !!selectedProgramId && !!selectedProgramExists && viewMode === "single-program",
  });

  // Calculate stats for a program
  const calculateProgramStats = (programResponse: ProgramResponse): ProgramStats => {
    const { phases } = programResponse;
    const phaseCount = phases.length;
    
    let totalWorkoutDays = 0;
    let totalNonRestDays = 0;
    let totalExercises = 0;
    let firstWeekNonRestDays = 0;

    phases.forEach((phase) => {
      phase.workoutDays.forEach((day) => {
        totalWorkoutDays++;
        if (!day.isRestDay) {
          totalNonRestDays++;
          totalExercises += day.exercises.length;
          
          // Count first week non-rest days for frequency calculation
          if (day.weekNumber === 1) {
            firstWeekNonRestDays++;
          }
        }
      });
    });

    const avgExercisesPerDay = totalNonRestDays > 0 ? totalExercises / totalNonRestDays : 0;
    const workoutsPerWeek = firstWeekNonRestDays > 0 ? firstWeekNonRestDays : totalNonRestDays;

    return {
      phaseCount,
      workoutDayCount: totalWorkoutDays,
      avgExercisesPerDay,
      workoutsPerWeek,
    };
  };

  // Convert program data to programs with stats
  const programsWithStats: ProgramWithStats[] = allProgramsData.map((programResponse) => ({
    ...programResponse.program,
    stats: calculateProgramStats(programResponse),
  }));

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      return await apiRequest("DELETE", `/api/programs/${programId}`);
    },
    onSuccess: async (_, deletedProgramId) => {
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
      
      await queryClient.cancelQueries({ queryKey: ["/api/programs", deletedProgramId] });
      queryClient.removeQueries({ queryKey: ["/api/programs", deletedProgramId] });
      
      queryClient.setQueryData<Program[]>(["/api/programs"], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(p => p.id !== deletedProgramId);
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs/all-details"] });
      
      setTimeout(() => {
        toast({
          title: "Program deleted",
          description: "The program has been successfully deleted.",
        });
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete program",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (programId: string) => {
    setProgramToDelete(programId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (programToDelete) {
      deleteProgramMutation.mutate(programToDelete);
    }
  };

  const handleViewProgram = (programId: string) => {
    setSelectedProgramId(programId);
    setViewMode("single-program");
  };

  const handleViewAllPrograms = () => {
    setViewMode("all-programs");
  };

  const handlePreviewWorkout = (day: WorkoutDay & { exercises: Exercise[] }) => {
    setPreviewWorkout({
      id: day.id,
      name: day.dayName,
      exercises: day.exercises,
    });
  };

  const allWorkoutDays: (WorkoutDay & {
    exercises: Exercise[];
    phaseName: string;
    phaseNumber: number;
  })[] = [];

  if (programData && viewMode === "single-program") {
    programData.phases.forEach((phase: PhaseWithDays) => {
      phase.workoutDays.forEach((day: WorkoutDay & { exercises: Exercise[] }) => {
        allWorkoutDays.push({
          ...day,
          phaseName: phase.name,
          phaseNumber: phase.phaseNumber,
        });
      });
    });
  }

  const filteredWorkoutDays = allWorkoutDays.filter(
    (day) =>
      day.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      day.exercises.some((ex) =>
        ex.exerciseName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const totalExercises = allWorkoutDays.reduce(
    (sum, day) => sum + day.exercises.length,
    0,
  );

  const trainingDays = allWorkoutDays.filter((day) => !day.isRestDay).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </div>
    );
  }

  // Show empty state
  if (isSuccess && programs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center py-16">
            <div className="mb-4">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No programs yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload a program spreadsheet to get started
              </p>
            </div>
            <Link href="/upload">
              <Button
                size="lg"
                className="h-12 sm:h-11"
                data-testid="button-upload-first"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Program
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Show all programs grid view
  if (viewMode === "all-programs") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1
                  className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2"
                  data-testid="text-dashboard-title"
                >
                  Your Programs
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Select a program to view details and start training
                </p>
              </div>
              <Link href="/upload">
                <Button
                  className="w-full sm:w-auto h-11 sm:h-10"
                  data-testid="button-new-upload"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="sm:hidden">Upload</span>
                  <span className="hidden sm:inline">Upload New Program</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {programsWithStats.map((program) => (
              <ProgramCard
                key={program.id}
                id={program.id}
                name={program.name}
                description={program.description || undefined}
                stats={program.stats}
                onViewProgram={handleViewProgram}
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show single program view
  if (isProgramLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {programs.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewAllPrograms}
                  className="mb-2 -ml-3"
                  data-testid="button-view-all-programs"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  All Programs
                </Button>
              )}
              <h1
                className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2"
                data-testid="text-dashboard-title"
              >
                {programData?.program.name || "Your Workouts"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {programData?.program.description ||
                  "Manage and track your workout program"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedProgramId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(selectedProgramId)}
                  data-testid="button-delete-program"
                  className="h-11 w-11"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {allWorkoutDays.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                    Workout Days
                  </p>
                  <p
                    className="text-xl sm:text-3xl font-bold font-mono"
                    data-testid="text-total-workouts"
                  >
                    {trainingDays}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                    Total Exercises
                  </p>
                  <p
                    className="text-xl sm:text-3xl font-bold font-mono"
                    data-testid="text-total-exercises"
                  >
                    {totalExercises}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                    Phases
                  </p>
                  <p
                    className="text-xl sm:text-3xl font-bold font-mono"
                    data-testid="text-total-phases"
                  >
                    {programData?.phases.length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
              <div className="relative flex-1 w-full max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search workouts..."
                  className="pl-9 h-11 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>

              <Link href="/upload">
                <Button
                  className="w-full sm:w-auto h-11 sm:h-10"
                  data-testid="button-new-upload"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="sm:hidden">Upload</span>
                  <span className="hidden sm:inline">Upload New Program</span>
                </Button>
              </Link>
            </div>
          </>
        )}

        {allWorkoutDays.length > 0 && programData && (
          <div className="space-y-6 sm:space-y-8">
            {programData.phases.map((phase: PhaseWithDays) => (
              <div key={phase.id} className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h2
                    className="text-xl sm:text-2xl font-bold"
                    data-testid={`text-phase-${phase.phaseNumber}`}
                  >
                    {phase.name}
                  </h2>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    Phase {phase.phaseNumber}
                  </Badge>
                </div>
                {phase.description && (
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {phase.description}
                  </p>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {phase.workoutDays
                    .filter(
                      (day: WorkoutDay & { exercises: Exercise[] }) =>
                        searchQuery === "" ||
                        day.dayName
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        day.exercises.some((ex: Exercise) =>
                          ex.exerciseName
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                        ),
                    )
                    .map((day: WorkoutDay & { exercises: Exercise[] }) => (
                      <Card
                        key={day.id}
                        className="hover-elevate transition-all"
                        data-testid={`card-workout-${day.id}`}
                      >
                        <CardHeader className="pb-2 sm:pb-3">
                          <div className="flex items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {day.isRestDay ? (
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                              )}
                              <h3
                                className="text-base sm:text-xl font-semibold truncate"
                                data-testid={`text-day-name-${day.id}`}
                              >
                                {day.dayName}
                              </h3>
                            </div>
                            {day.isRestDay && (
                              <Badge variant="secondary" className="text-xs">
                                Rest Day
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 sm:space-y-3">
                          {day.isRestDay ? (
                            <p className="text-sm text-muted-foreground">
                              Take a rest and recover
                            </p>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                                <span className="font-medium">
                                  {day.exercises.length} exercises
                                </span>
                              </div>
                              <div className="space-y-2">
                                {day.exercises
                                  .slice(0, 3)
                                  .map((exercise: Exercise, idx: number) => (
                                    <div
                                      key={exercise.id}
                                      className="flex items-start gap-2 text-xs sm:text-sm"
                                      data-testid={`exercise-${exercise.id}`}
                                    >
                                      <span className="text-muted-foreground font-mono min-w-[20px] sm:min-w-[24px]">
                                        {idx + 1}.
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium truncate">
                                            {exercise.exerciseName}
                                          </span>
                                          {exercise.supersetGroup && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {exercise.supersetGroup}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 sm:gap-3">
                                          <span>
                                            {exercise.workingSets}×
                                            {exercise.reps}
                                          </span>
                                          {exercise.rpe && (
                                            <span>RPE {exercise.rpe}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                {day.exercises.length > 3 && (
                                  <p className="text-xs text-muted-foreground pl-6 sm:pl-7">
                                    +{day.exercises.length - 3} more exercises
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                className="w-full mt-2 sm:mt-3 h-11 sm:h-10"
                                onClick={() => handlePreviewWorkout(day)}
                                data-testid={`button-preview-workout-${day.id}`}
                              >
                                <Search className="w-4 h-4 mr-2" />
                                Preview Workout
                              </Button>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {allWorkoutDays.length > 0 && filteredWorkoutDays.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              No workouts found matching "{searchQuery}"
            </p>
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-program">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this program? This will permanently
              remove the program and all its phases, workout days, and exercises.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProgramMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewWorkout && (
        <WorkoutPreviewSheet
          open={!!previewWorkout}
          onOpenChange={(open) => !open && setPreviewWorkout(null)}
          workoutDayId={previewWorkout.id}
          workoutDayName={previewWorkout.name}
          exercises={previewWorkout.exercises}
        />
      )}
    </div>
  );
}
