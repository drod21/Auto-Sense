import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle2,
  Dumbbell,
  Trophy
} from "lucide-react";
import SetLogger from "@/components/SetLogger";
import RestTimer from "@/components/RestTimer";
import type { 
  WorkoutDay, 
  Exercise, 
  WorkoutSession, 
  ExerciseProgress,
  CompletedSet 
} from "@shared/schema";

interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: Exercise[];
}

export default function WorkoutTracker() {
  const { workoutDayId } = useParams<{ workoutDayId: string }>();
  const [, setLocation] = useLocation();
  
  // Fetch workout day data
  const { data: workoutData, isLoading } = useQuery<WorkoutDayWithExercises>({
    queryKey: ["/api/workout-days", workoutDayId],
    enabled: !!workoutDayId,
  });

  // Initialize workout session
  const [session, setSession] = useState<WorkoutSession>({
    workoutDayId: workoutDayId || "",
    startedAt: new Date().toISOString(),
    exerciseProgress: [],
    currentExerciseIndex: 0,
    isComplete: false,
  });

  // Initialize exercise progress when workout data loads
  useEffect(() => {
    if (workoutData && session.exerciseProgress.length === 0) {
      const progress: ExerciseProgress[] = workoutData.exercises.map(exercise => ({
        exerciseId: exercise.id,
        completedSets: [],
        isComplete: false,
      }));
      setSession(prev => ({ ...prev, exerciseProgress: progress }));
    }
  }, [workoutData, session.exerciseProgress.length]);

  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(180); // 3 minutes default

  // Get current exercise
  const currentExercise = workoutData?.exercises[session.currentExerciseIndex];
  const currentProgress = session.exerciseProgress[session.currentExerciseIndex];

  // Calculate overall progress
  const totalExercises = workoutData?.exercises.length || 0;
  const completedExercises = session.exerciseProgress.filter(p => p.isComplete).length;
  const progressPercentage = totalExercises > 0 
    ? (completedExercises / totalExercises) * 100 
    : 0;

  // Navigation handlers
  const goToPreviousExercise = () => {
    if (session.currentExerciseIndex > 0) {
      setSession(prev => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex - 1
      }));
    }
  };

  const goToNextExercise = () => {
    if (session.currentExerciseIndex < totalExercises - 1) {
      setSession(prev => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1
      }));
    }
  };

  const markExerciseComplete = () => {
    const updatedProgress = [...session.exerciseProgress];
    updatedProgress[session.currentExerciseIndex].isComplete = true;
    
    setSession(prev => ({
      ...prev,
      exerciseProgress: updatedProgress
    }));

    // Auto-advance to next exercise if not the last one
    if (session.currentExerciseIndex < totalExercises - 1) {
      setTimeout(goToNextExercise, 500);
    }
  };

  const handleSetCompleted = (set: CompletedSet) => {
    const updatedProgress = [...session.exerciseProgress];
    const currentExerciseProgress = updatedProgress[session.currentExerciseIndex];
    currentExerciseProgress.completedSets.push(set);
    
    // Check if exercise is complete
    if (currentExercise) {
      const totalSetsNeeded = (currentExercise.warmupSets || 0) + currentExercise.workingSets;
      if (currentExerciseProgress.completedSets.length >= totalSetsNeeded) {
        currentExerciseProgress.isComplete = true;
      }
    }
    
    setSession(prev => ({
      ...prev,
      exerciseProgress: updatedProgress
    }));

    // Start rest timer
    if (currentExercise?.restTimer && currentExercise.restTimer !== "0 min") {
      // Parse rest timer duration (e.g., "~3-4 min" -> 210 seconds)
      const match = currentExercise.restTimer.match(/(\d+)/);
      const minutes = match ? parseInt(match[1]) : 3;
      setRestTimerDuration(minutes * 60);
      setRestTimerActive(true);
    }
  };

  const completeWorkout = () => {
    setSession(prev => ({
      ...prev,
      completedAt: new Date().toISOString(),
      isComplete: true
    }));
    
    // Store session data in localStorage for review
    localStorage.setItem(`workout-session-${workoutDayId}`, JSON.stringify({
      ...session,
      completedAt: new Date().toISOString(),
      isComplete: true
    }));
    
    // Navigate back to dashboard
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!workoutData || workoutData.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold mb-4">No exercises found</h2>
          <Link href="/">
            <a>
              <Button data-testid="button-back-to-dashboard">Back to Dashboard</Button>
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/">
                <a>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                    data-testid="button-exit-workout"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </a>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold truncate">{workoutData.dayName}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Exercise {session.currentExerciseIndex + 1} of {totalExercises}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs sm:text-sm">
              {Math.round(progressPercentage)}%
            </Badge>
          </div>
          
          {/* Progress bar */}
          <Progress value={progressPercentage} className="mt-2 sm:mt-3 h-2" />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Current Exercise Card */}
        {currentExercise && (
          <Card className="border-2">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                    <span className="truncate">{currentExercise.exerciseName}</span>
                  </CardTitle>
                  {currentExercise.supersetGroup && (
                    <Badge variant="secondary" className="mt-1 sm:mt-2 text-xs sm:text-sm">
                      Superset {currentExercise.supersetGroup}
                    </Badge>
                  )}
                </div>
                {currentProgress?.isComplete && (
                  <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Exercise details */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between gap-1">
                    <span className="text-muted-foreground">Warmup:</span>
                    <span className="font-mono font-bold">{currentExercise.warmupSets || 0}</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-muted-foreground">Sets:</span>
                    <span className="font-mono font-bold">{currentExercise.workingSets}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-1">
                    <span className="text-muted-foreground">Reps:</span>
                    <span className="font-mono font-bold">{currentExercise.reps}</span>
                  </div>
                  {currentExercise.rpe && currentExercise.rpe !== "N/A" && (
                    <div className="flex justify-between gap-1">
                      <span className="text-muted-foreground">RPE:</span>
                      <span className="font-mono font-bold">{currentExercise.rpe}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {currentExercise.notes && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{currentExercise.notes}</p>
                </div>
              )}

              {/* Substitution options */}
              {(currentExercise.substitutionOption1 || currentExercise.substitutionOption2) && (
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">Alternative exercises:</p>
                  {currentExercise.substitutionOption1 && (
                    <p>• {currentExercise.substitutionOption1}</p>
                  )}
                  {currentExercise.substitutionOption2 && (
                    <p>• {currentExercise.substitutionOption2}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Set Logger */}
        {currentExercise && currentProgress && (
          <SetLogger
            exercise={currentExercise}
            exerciseProgress={currentProgress}
            onSetCompleted={handleSetCompleted}
            onExerciseComplete={markExerciseComplete}
          />
        )}

        {/* Rest Timer */}
        {restTimerActive && (
          <RestTimer
            duration={restTimerDuration}
            isActive={restTimerActive}
            onComplete={() => setRestTimerActive(false)}
            onSkip={() => setRestTimerActive(false)}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="outline"
            className="h-11 sm:h-10"
            onClick={goToPreviousExercise}
            disabled={session.currentExerciseIndex === 0}
            data-testid="button-previous-exercise"
          >
            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          {session.currentExerciseIndex === totalExercises - 1 && 
           completedExercises === totalExercises ? (
            <Button
              size="lg"
              onClick={completeWorkout}
              className="flex-1 h-11 sm:h-10"
              data-testid="button-complete-workout"
            >
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Complete Workout
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-11 sm:h-10 ml-auto"
              onClick={goToNextExercise}
              disabled={session.currentExerciseIndex >= totalExercises - 1}
              data-testid="button-next-exercise"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
            </Button>
          )}
        </div>

        {/* Exercise list overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workoutData.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                  ${index === session.currentExerciseIndex ? 'bg-primary/10' : 'hover:bg-muted'}
                  ${session.exerciseProgress[index]?.isComplete ? 'opacity-60' : ''}
                `}
                onClick={() => setSession(prev => ({ ...prev, currentExerciseIndex: index }))}
                data-testid={`exercise-list-item-${exercise.id}`}
              >
                <div className="flex-shrink-0">
                  {session.exerciseProgress[index]?.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : index === session.currentExerciseIndex ? (
                    <div className="h-5 w-5 rounded-full bg-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exercise.exerciseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.workingSets} sets × {exercise.reps}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}