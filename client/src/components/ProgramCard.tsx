import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Dumbbell, TrendingUp, BarChart } from "lucide-react";

interface ProgramStats {
  phaseCount: number;
  workoutDayCount: number;
  avgExercisesPerDay: number;
  workoutsPerWeek: number;
}

interface ProgramCardProps {
  id: string;
  name: string;
  description?: string;
  stats: ProgramStats;
  onViewProgram: (id: string) => void;
}

export default function ProgramCard({
  id,
  name,
  description,
  stats,
  onViewProgram,
}: ProgramCardProps) {
  return (
    <Card className="hover-elevate transition-all" data-testid={`card-program-${id}`}>
      <CardHeader>
        <CardTitle className="text-2xl" data-testid="text-program-name">
          {name}
        </CardTitle>
        {description && (
          <CardDescription className="text-base mt-2" data-testid="text-program-description">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Frequency</p>
              <p className="font-semibold" data-testid="text-frequency">
                {stats.workoutsPerWeek}x/week
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phases</p>
              <p className="font-semibold" data-testid="text-phases">
                {stats.phaseCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Workout Days</p>
              <p className="font-semibold" data-testid="text-workout-days">
                {stats.workoutDayCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BarChart className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Avg Exercises</p>
              <p className="font-semibold" data-testid="text-avg-exercises">
                {stats.avgExercisesPerDay.toFixed(1)}/day
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onViewProgram(id)}
          data-testid="button-view-program"
        >
          View Program
        </Button>
      </CardFooter>
    </Card>
  );
}
