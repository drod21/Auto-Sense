import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle2,
  Dumbbell,
  Trophy,
  ExternalLink,
  MoreVertical,
  Trash2,
  CheckCheck
} from "lucide-react";
import SetLogger from "@/components/SetLogger";
import RestTimer from "@/components/RestTimer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  WorkoutDay, 
  Exercise, 
  WorkoutSession, 
  CompletedSet 
} from "@shared/schema";

interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: Exercise[];
}

export default function WorkoutTracker() {
  const { workoutDayId } = useParams<{ workoutDayId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isAuthLoading, toast]);

  // Fetch workout day data
  const { data: workoutData, isLoading } = useQuery<WorkoutDayWithExercises>({
    queryKey: ["/api/workout-days", workoutDayId],
    enabled: !!workoutDayId && isAuthenticated,
  });

  // Create or resume workout session (automatically fetches existing session)
  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ session: WorkoutSession; sets: CompletedSet[] }>({
    queryKey: ['/api/workout-sessions', 'start', workoutDayId],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/workout-sessions", { workoutDayId });
      return response.json();
    },
    enabled: !!workoutDayId && isAuthenticated,
    staleTime: Infinity,
  });

  const dbSessionId = sessionData?.session.id;
  const completedSets = sessionData?.sets || [];

  // Track current exercise index
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Calculate which exercise to start on when resuming session
  useEffect(() => {
    if (!workoutData || !sessionData || currentExerciseIndex !== 0) return;
    
    // Find the first incomplete exercise
    const firstIncompleteIndex = workoutData.exercises.findIndex((exercise) => {
      const exerciseSets = sessionData.sets.filter(set => set.exerciseId === exercise.id);
      const totalSetsNeeded = (exercise.warmupSets || 0) + exercise.workingSets;
      return exerciseSets.length < totalSetsNeeded;
    });

    // If all exercises are complete, stay at index 0, otherwise go to first incomplete
    if (firstIncompleteIndex !== -1) {
      setCurrentExerciseIndex(firstIncompleteIndex);
    }
  }, [workoutData, sessionData]);

  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerDuration, setRestTimerDuration] = useState(180); // 3 minutes default

  // Get current exercise
  const currentExercise = workoutData?.exercises[currentExerciseIndex];
  
  // Memoize exercise-to-sets mapping to avoid repeated filtering
  const exerciseSetsMap = useMemo(() => {
    const map = new Map<string, CompletedSet[]>();
    for (const set of completedSets) {
      const sets = map.get(set.exerciseId) || [];
      sets.push(set);
      map.set(set.exerciseId, sets);
    }
    return map;
  }, [completedSets]);
  
  // Helper to get sets for current exercise
  const getCurrentExerciseSets = () => {
    if (!currentExercise) return [];
    return exerciseSetsMap.get(currentExercise.id) || [];
  };

  // Helper function to get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    return null;
  };

  // Memoize exercise completion status
  const exerciseCompletionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!workoutData) return map;
    
    for (const exercise of workoutData.exercises) {
      const sets = exerciseSetsMap.get(exercise.id) || [];
      const totalSetsNeeded = (exercise.warmupSets || 0) + exercise.workingSets;
      map.set(exercise.id, sets.length >= totalSetsNeeded);
    }
    return map;
  }, [workoutData, exerciseSetsMap]);

  // Calculate if current exercise is complete
  const totalSetsNeeded = (currentExercise?.warmupSets || 0) + (currentExercise?.workingSets || 0);
  const currentExerciseSets = getCurrentExerciseSets();
  const isCurrentExerciseComplete = currentExercise 
    ? exerciseCompletionMap.get(currentExercise.id) || false 
    : false;

  // Calculate overall progress
  const totalExercises = workoutData?.exercises.length || 0;
  const completedExercises = workoutData?.exercises.filter(exercise => 
    exerciseCompletionMap.get(exercise.id) || false
  ).length || 0;
  const progressPercentage = totalExercises > 0 
    ? (completedExercises / totalExercises) * 100 
    : 0;

  // Navigation handlers
  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  // Log set mutation
  const logSetMutation = useMutation({
    mutationFn: async (setData: { exerciseId: string; setNumber: number; weight: number; reps: number; rpe?: number; isWarmup?: boolean }) => {
      if (!dbSessionId) throw new Error("No active session");
      const response = await apiRequest("POST", `/api/workout-sessions/${dbSessionId}/sets`, setData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate session query to refetch sets
      queryClient.invalidateQueries({ queryKey: ['/api/workout-sessions', 'start', workoutDayId] });
      
      // Start rest timer
      if (currentExercise?.restTimer && currentExercise.restTimer !== "0 min") {
        const match = currentExercise.restTimer.match(/(\d+)/);
        const minutes = match ? parseInt(match[1]) : 3;
        setRestTimerDuration(minutes * 60);
        setRestTimerActive(true);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log set",
        variant: "destructive",
      });
    },
  });

  const handleSetCompleted = (set: { setNumber: number; weight: number; reps: number; rpe?: number; isWarmup?: boolean }) => {
    if (!currentExercise) return;
    
    logSetMutation.mutate({
      exerciseId: currentExercise.id,
      ...set,
    });
  };

  // Complete workout mutation (requires all exercises complete)
  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!dbSessionId) throw new Error("No active session");
      const response = await apiRequest("PATCH", `/api/workout-sessions/${dbSessionId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate session query to clear cache
      queryClient.invalidateQueries({ queryKey: ['/api/workout-sessions', 'start', workoutDayId] });
      
      toast({
        title: "Workout Complete!",
        description: "Great job! Your workout has been saved.",
      });
      
      // Immediately redirect to dashboard
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete workout",
        variant: "destructive",
      });
    },
  });

  // Complete unfinished workout mutation (marks as complete even if not all exercises done)
  const completeUnfinishedMutation = useMutation({
    mutationFn: async () => {
      if (!dbSessionId) throw new Error("No active session");
      const response = await apiRequest("PATCH", `/api/workout-sessions/${dbSessionId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      // Close dialog immediately
      setShowCompleteUnfinishedDialog(false);
      
      // Invalidate session query to clear cache
      queryClient.invalidateQueries({ queryKey: ['/api/workout-sessions', 'start', workoutDayId] });
      
      toast({
        title: "Workout Saved!",
        description: "Your partial workout has been saved.",
      });
      
      // Immediately redirect to dashboard
      setLocation("/");
    },
    onError: () => {
      setShowCompleteUnfinishedDialog(false);
      
      toast({
        title: "Error",
        description: "Failed to save workout",
        variant: "destructive",
      });
    },
  });

  // Cancel workout mutation (deletes session and all sets)
  const cancelWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!dbSessionId) throw new Error("No active session");
      const response = await apiRequest("DELETE", `/api/workout-sessions/${dbSessionId}`);
      return response.json();
    },
    onSuccess: () => {
      // Close dialog immediately
      setShowCancelDialog(false);
      
      // Invalidate session query to clear cache
      queryClient.invalidateQueries({ queryKey: ['/api/workout-sessions', 'start', workoutDayId] });
      
      toast({
        title: "Workout Canceled",
        description: "All data has been discarded.",
      });
      
      // Immediately redirect to dashboard
      setLocation("/");
    },
    onError: () => {
      setShowCancelDialog(false);
      
      toast({
        title: "Error",
        description: "Failed to cancel workout",
        variant: "destructive",
      });
    },
  });

  const completeWorkout = () => {
    completeWorkoutMutation.mutate();
  };

  // Alert dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteUnfinishedDialog, setShowCompleteUnfinishedDialog] = useState(false);

  if (isAuthLoading || isLoading) {
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

  if (!isAuthenticated) {
    return null;
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
                  Exercise {currentExerciseIndex + 1} of {totalExercises}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs sm:text-sm">
                {Math.round(progressPercentage)}%
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-workout-menu">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowCompleteUnfinishedDialog(true)}
                    data-testid="menu-item-complete-unfinished"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Finish Early
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowCancelDialog(true)}
                    className="text-destructive focus:text-destructive"
                    data-testid="menu-item-cancel-workout"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Workout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                {isCurrentExerciseComplete && (
                  <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Video Section */}
              {currentExercise.videoUrl && (
                <div className="space-y-2">
                  {(() => {
                    const embedUrl = getYouTubeEmbedUrl(currentExercise.videoUrl);
                    if (embedUrl) {
                      return (
                        <div className="rounded-md overflow-hidden bg-muted" data-testid="video-embed">
                          <iframe
                            width="100%"
                            height="200"
                            src={embedUrl}
                            title="Exercise demonstration"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-md"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(currentExercise.videoUrl!, '_blank')}
                          data-testid="button-open-video"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Watch Exercise Video
                        </Button>
                      );
                    }
                  })()}
                </div>
              )}

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
        {currentExercise && (
          <SetLogger
            exercise={currentExercise}
            completedSets={getCurrentExerciseSets()}
            onSetCompleted={handleSetCompleted}
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
            disabled={currentExerciseIndex === 0}
            data-testid="button-previous-exercise"
          >
            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          {currentExerciseIndex === totalExercises - 1 && 
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
              disabled={currentExerciseIndex >= totalExercises - 1}
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
            {workoutData.exercises.map((exercise, index) => {
              const isComplete = exerciseCompletionMap.get(exercise.id) || false;

              return (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                    ${index === currentExerciseIndex ? 'bg-primary/10' : 'hover:bg-muted'}
                    ${isComplete ? 'opacity-60' : ''}
                  `}
                  onClick={() => setCurrentExerciseIndex(index)}
                  data-testid={`exercise-list-item-${exercise.id}`}
                >
                  <div className="flex-shrink-0">
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : index === currentExerciseIndex ? (
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
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Workout Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your logged sets and discard this workout session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-cancel">
              Keep Workout
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelWorkoutMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-cancel-dialog-confirm"
            >
              Cancel Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Unfinished Workout Dialog */}
      <AlertDialog open={showCompleteUnfinishedDialog} onOpenChange={setShowCompleteUnfinishedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Early?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't completed all exercises yet. Your progress will be saved, but this workout will be marked as complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-finish-dialog-cancel">
              Continue Workout
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => completeUnfinishedMutation.mutate()}
              data-testid="button-finish-dialog-confirm"
            >
              Finish Early
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}