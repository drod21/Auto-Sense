import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Upload, Dumbbell, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  // Fetch full details for the first program (if exists)
  const { data: programData, isLoading: isProgramLoading } = useQuery<ProgramResponse>({
    queryKey: ["/api/programs", programs[0]?.id],
    enabled: programs.length > 0,
  });

  const allWorkoutDays: (WorkoutDay & { 
    exercises: Exercise[], 
    phaseName: string,
    phaseNumber: number 
  })[] = [];
  
  if (programData) {
    programData.phases.forEach(phase => {
      phase.workoutDays.forEach(day => {
        allWorkoutDays.push({
          ...day,
          phaseName: phase.name,
          phaseNumber: phase.phaseNumber,
        });
      });
    });
  }

  const filteredWorkoutDays = allWorkoutDays.filter((day) =>
    day.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    day.exercises.some(ex => ex.exerciseName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalExercises = allWorkoutDays.reduce(
    (sum, day) => sum + day.exercises.length, 
    0
  );

  const trainingDays = allWorkoutDays.filter(day => !day.isRestDay).length;

  if (isLoading || isProgramLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2" data-testid="text-dashboard-title">
            {programData?.program.name || "Your Workouts"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {programData?.program.description || "Manage and track your workout program"}
          </p>
        </div>

        {allWorkoutDays.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Workout Days</p>
                  <p className="text-xl sm:text-3xl font-bold font-mono" data-testid="text-total-workouts">{trainingDays}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Exercises</p>
                  <p className="text-xl sm:text-3xl font-bold font-mono" data-testid="text-total-exercises">{totalExercises}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Phases</p>
                  <p className="text-xl sm:text-3xl font-bold font-mono" data-testid="text-total-phases">
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
                <a className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-11 sm:h-10" data-testid="button-new-upload">
                    <Upload className="w-4 h-4 mr-2" />
                    <span className="sm:hidden">Upload</span>
                    <span className="hidden sm:inline">Upload New Program</span>
                  </Button>
                </a>
              </Link>
            </div>
          </>
        )}

        {allWorkoutDays.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No programs yet</h3>
              <p className="text-muted-foreground mb-6">Upload a program spreadsheet to get started</p>
            </div>
            <Link href="/upload">
              <a>
                <Button size="lg" className="h-11 sm:h-11" data-testid="button-upload-first">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Program
                </Button>
              </a>
            </Link>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {programData?.phases.map((phase) => (
              <div key={phase.id} className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold" data-testid={`text-phase-${phase.phaseNumber}`}>
                    {phase.name}
                  </h2>
                  <Badge variant="secondary" className="text-xs sm:text-sm">Phase {phase.phaseNumber}</Badge>
                </div>
                {phase.description && (
                  <p className="text-sm sm:text-base text-muted-foreground">{phase.description}</p>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {phase.workoutDays
                    .filter(day => 
                      searchQuery === "" || 
                      day.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      day.exercises.some(ex => ex.exerciseName.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((day) => (
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
                              <h3 className="text-base sm:text-xl font-semibold truncate" data-testid={`text-day-name-${day.id}`}>
                                {day.dayName}
                              </h3>
                            </div>
                            {day.isRestDay && (
                              <Badge variant="secondary" className="text-xs">Rest Day</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 sm:space-y-3">
                          {day.isRestDay ? (
                            <p className="text-sm text-muted-foreground">Take a rest and recover</p>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                                <span className="font-medium">{day.exercises.length} exercises</span>
                              </div>
                              <div className="space-y-2">
                                {day.exercises.slice(0, 3).map((exercise, idx) => (
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
                                        <span className="font-medium truncate">{exercise.exerciseName}</span>
                                        {exercise.supersetGroup && (
                                          <Badge variant="outline" className="text-xs">
                                            {exercise.supersetGroup}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 sm:gap-3">
                                        <span>{exercise.workingSets}×{exercise.reps}</span>
                                        {exercise.rpe && <span>RPE {exercise.rpe}</span>}
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
                              <Link href={`/workout/${day.id}`} className="block">
                                <Button 
                                  className="w-full mt-2 sm:mt-3 h-11 sm:h-10"
                                  size="lg"
                                  data-testid={`button-start-workout-${day.id}`}
                                >
                                  <Dumbbell className="w-4 h-4 mr-2" />
                                  Start Workout
                                </Button>
                              </Link>
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
            <p className="text-muted-foreground">No workouts found matching "{searchQuery}"</p>
          </div>
        )}
      </main>
    </div>
  );
}
