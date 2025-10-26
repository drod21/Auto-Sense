import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface Exercise {
  id: string;
  exerciseName: string;
  alternateExercise?: string | null;
  sets: number;
  warmupSets: number | null;
  restTimer: number;
  rpe?: number | null;
  repRangeMin: number;
  repRangeMax: number;
}

interface ParsedDataTableProps {
  exercises: Exercise[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ParsedDataTable({ exercises, onEdit, onDelete }: ParsedDataTableProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <div className="rounded-lg border" data-testid="table-exercises">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exercise</TableHead>
            <TableHead>Alternative</TableHead>
            <TableHead className="text-center">Sets</TableHead>
            <TableHead className="text-center">Warmup</TableHead>
            <TableHead className="text-center">Rest</TableHead>
            <TableHead className="text-center">RPE</TableHead>
            <TableHead className="text-center">Rep Range</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map((exercise) => (
            <TableRow key={exercise.id} data-testid={`row-exercise-${exercise.id}`}>
              <TableCell className="font-medium">{exercise.exerciseName}</TableCell>
              <TableCell className="text-muted-foreground">
                {exercise.alternateExercise || "—"}
              </TableCell>
              <TableCell className="text-center font-mono">{exercise.sets}</TableCell>
              <TableCell className="text-center font-mono">{exercise.warmupSets || 0}</TableCell>
              <TableCell className="text-center font-mono">{formatTime(exercise.restTimer)}</TableCell>
              <TableCell className="text-center font-mono">
                {exercise.rpe ? `${exercise.rpe}/10` : "—"}
              </TableCell>
              <TableCell className="text-center font-mono">
                {exercise.repRangeMin}-{exercise.repRangeMax}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onEdit?.(exercise.id);
                      console.log("Edit exercise:", exercise.id);
                    }}
                    data-testid={`button-edit-${exercise.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onDelete?.(exercise.id);
                      console.log("Delete exercise:", exercise.id);
                    }}
                    data-testid={`button-delete-${exercise.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
