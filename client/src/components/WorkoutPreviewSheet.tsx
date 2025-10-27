import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Timer, Hash, Flame, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import type { Exercise } from "@shared/schema";

interface WorkoutPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutDayId: string;
  workoutDayName: string;
  exercises: Exercise[];
}

export default function WorkoutPreviewSheet({
  open,
  onOpenChange,
  workoutDayId,
  workoutDayName,
  exercises,
}: WorkoutPreviewSheetProps) {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "N/A";
    
    // If already formatted with "min" or other text, return as-is
    if (timeStr.toLowerCase().includes("min") || timeStr.toLowerCase().includes("sec") || timeStr.includes("-")) {
      return timeStr;
    }
    
    // Only parse if it's a pure number (seconds)
    const match = timeStr.match(/^(\d+)$/);
    if (!match) return timeStr;
    
    const seconds = parseInt(match[1]);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl flex items-center gap-2" data-testid="text-preview-title">
            <Dumbbell className="w-6 h-6 text-primary" />
            {workoutDayName}
          </SheetTitle>
          <SheetDescription data-testid="text-preview-description">
            {exercises.length} exercises in this workout
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {exercises.map((exercise, index) => (
            <Card key={exercise.id} data-testid={`preview-exercise-${exercise.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg font-mono font-bold text-muted-foreground min-w-[32px]">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-semibold" data-testid={`text-exercise-name-${exercise.id}`}>
                          {exercise.exerciseName}
                        </h4>
                        {exercise.supersetGroup && (
                          <Badge variant="outline" className="text-xs">
                            {exercise.supersetGroup}
                          </Badge>
                        )}
                      </div>
                      {(exercise.substitutionOption1 || exercise.substitutionOption2) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Alternatives:{" "}
                          {[exercise.substitutionOption1, exercise.substitutionOption2]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sets</p>
                      <p className="font-mono font-medium" data-testid={`text-sets-${exercise.id}`}>
                        {exercise.workingSets}
                      </p>
                    </div>
                  </div>

                  {exercise.warmupSets && exercise.warmupSets > 0 && (
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Warmup</p>
                        <p className="font-mono font-medium" data-testid={`text-warmup-${exercise.id}`}>
                          {exercise.warmupSets}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rest</p>
                      <p className="font-mono font-medium" data-testid={`text-rest-${exercise.id}`}>
                        {exercise.restTimer ? formatTime(exercise.restTimer) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {exercise.rpe && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">RPE</p>
                        <p className="font-mono font-medium" data-testid={`text-rpe-${exercise.id}`}>
                          {exercise.rpe}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Reps: </span>
                      <span className="font-mono font-medium" data-testid={`text-reps-${exercise.id}`}>
                        {exercise.reps}
                      </span>
                    </div>
                    {exercise.load && (
                      <div>
                        <span className="text-muted-foreground">Load: </span>
                        <span className="font-mono font-medium" data-testid={`text-load-${exercise.id}`}>
                          {exercise.load}
                        </span>
                      </div>
                    )}
                  </div>
                  {exercise.notes && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                      <span className="font-semibold">Notes: </span>
                      {exercise.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-preview"
          >
            Close
          </Button>
          <Link href={`/workout/${workoutDayId}`}>
            <Button className="w-full sm:w-auto" data-testid="button-start-workout-from-preview">
              <Dumbbell className="w-4 h-4 mr-2" />
              Start Workout
            </Button>
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
