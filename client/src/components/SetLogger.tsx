import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Flame,
  Weight
} from "lucide-react";
import type { 
  Exercise, 
  ExerciseProgress, 
  CompletedSet 
} from "@shared/schema";

interface SetLoggerProps {
  exercise: Exercise;
  exerciseProgress: ExerciseProgress;
  onSetCompleted: (set: CompletedSet) => void;
  onExerciseComplete: () => void;
}

export default function SetLogger({
  exercise,
  exerciseProgress,
  onSetCompleted,
  onExerciseComplete
}: SetLoggerProps) {
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [rpe, setRpe] = useState<string>("");

  // Parse target rep range
  const parseRepRange = (reps: string) => {
    const match = reps.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return { min, max };
    }
    return { min: 0, max: 0 };
  };

  const targetRange = parseRepRange(exercise.reps);
  const totalSetsNeeded = (exercise.warmupSets || 0) + exercise.workingSets;
  const completedSetsCount = exerciseProgress.completedSets.length;
  const currentSetNumber = completedSetsCount + 1;
  const isWarmupSet = currentSetNumber <= (exercise.warmupSets || 0);

  // Check if reps are in target range
  const getRepsStatus = (repsCompleted: number) => {
    if (targetRange.min === 0) return "neutral";
    if (repsCompleted >= targetRange.min && repsCompleted <= targetRange.max) {
      return "in-range";
    }
    return "out-of-range";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weightValue = parseFloat(weight) || 0;
    const repsValue = parseInt(reps) || 0;
    const rpeValue = rpe ? parseFloat(rpe) : undefined;

    if (weightValue > 0 && repsValue > 0) {
      const newSet: CompletedSet = {
        setNumber: currentSetNumber,
        weight: weightValue,
        reps: repsValue,
        rpe: rpeValue,
        completedAt: new Date().toISOString(),
        isWarmup: isWarmupSet
      };

      onSetCompleted(newSet);
      
      // Clear form for next set
      setReps("");
      setRpe("");
      // Keep weight for convenience
    }
  };

  const isExerciseComplete = completedSetsCount >= totalSetsNeeded;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Weight className="h-5 w-5" />
            Log Your Sets
          </span>
          {isExerciseComplete && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Set progress indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSetsNeeded }, (_, i) => {
            const setNum = i + 1;
            const isCompleted = setNum <= completedSetsCount;
            const isWarmup = setNum <= (exercise.warmupSets || 0);
            const isCurrent = setNum === currentSetNumber;
            
            return (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  isCompleted 
                    ? isWarmup 
                      ? 'bg-orange-500' 
                      : 'bg-green-500'
                    : isCurrent
                      ? 'bg-primary animate-pulse'
                      : 'bg-muted'
                }`}
                data-testid={`set-indicator-${i + 1}`}
              />
            );
          })}
        </div>

        {/* Current set info */}
        {!isExerciseComplete && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              {isWarmupSet ? 'Warmup' : 'Working'} Set
            </p>
            <p className="text-2xl font-bold font-mono">
              Set {currentSetNumber} of {totalSetsNeeded}
            </p>
          </div>
        )}

        {/* Set logging form */}
        {!isExerciseComplete ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-lg font-mono"
                  data-testid="input-weight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <div className="relative">
                  <Input
                    id="reps"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="text-lg font-mono"
                    data-testid="input-reps"
                  />
                  {reps && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {getRepsStatus(parseInt(reps)) === "in-range" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : getRepsStatus(parseInt(reps)) === "out-of-range" ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {targetRange.min > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Target: {exercise.reps} reps
                  </p>
                )}
              </div>
            </div>

            {/* RPE Input */}
            {exercise.rpe && exercise.rpe !== "N/A" && (
              <div className="space-y-2">
                <Label htmlFor="rpe" className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  RPE (Rate of Perceived Exertion)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="rpe"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    max="10"
                    step="0.5"
                    placeholder="1-10"
                    value={rpe}
                    onChange={(e) => setRpe(e.target.value)}
                    className="text-lg font-mono max-w-24"
                    data-testid="input-rpe"
                  />
                  <span className="text-sm text-muted-foreground">
                    Target: {exercise.rpe}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  1 = Very easy, 10 = Maximum effort
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={!weight || !reps}
              data-testid="button-complete-set"
            >
              <Plus className="h-5 w-5 mr-2" />
              Complete Set
            </Button>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              All sets completed for this exercise!
            </p>
            <Button 
              onClick={onExerciseComplete}
              size="lg"
              className="w-full"
              data-testid="button-next-exercise"
            >
              Continue to Next Exercise
            </Button>
          </div>
        )}

        {/* Completed sets summary */}
        {exerciseProgress.completedSets.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Completed Sets</h4>
              <div className="space-y-1">
                {exerciseProgress.completedSets.map((set, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between text-sm py-1"
                    data-testid={`completed-set-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={set.isWarmup ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {set.isWarmup ? 'W' : 'W'}
                        {set.setNumber}
                      </Badge>
                      <span className="font-mono">
                        {set.weight} lbs × {set.reps} reps
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {set.rpe && (
                        <span className="text-xs text-muted-foreground font-mono">
                          RPE {set.rpe}
                        </span>
                      )}
                      <div>
                        {getRepsStatus(set.reps) === "in-range" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : getRepsStatus(set.reps) === "out-of-range" ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}