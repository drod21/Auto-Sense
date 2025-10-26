import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import ExerciseCard from "@/components/ExerciseCard";
import ParsedDataTable from "@/components/ParsedDataTable";
import ExportDialog from "@/components/ExportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, LayoutGrid, Table as TableIcon, Upload } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Exercise } from "@shared/schema";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/exercises/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete exercise");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({
        title: "Exercise deleted",
        description: "The exercise has been removed from your workout plan.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete exercise",
        variant: "destructive",
      });
    },
  });

  const filteredExercises = exercises.filter((exercise) =>
    exercise.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = (format: "json" | "csv") => {
    toast({
      title: "Export successful",
      description: `Your workout data has been downloaded as ${format.toUpperCase()}.`,
    });
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-dashboard-title">
            Your Workouts
          </h1>
          <p className="text-muted-foreground">
            Manage and track your exercise routines
          </p>
        </div>

        {exercises.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Exercises</p>
                  <p className="text-3xl font-bold font-mono" data-testid="text-total-exercises">{exercises.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Sets</p>
                  <p className="text-3xl font-bold font-mono" data-testid="text-total-sets">
                    {exercises.reduce((sum, ex) => sum + ex.sets + (ex.warmupSets || 0), 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Avg RPE</p>
                  <p className="text-3xl font-bold font-mono" data-testid="text-avg-rpe">
                    {exercises.filter(ex => ex.rpe).length > 0
                      ? (exercises.reduce((sum, ex) => sum + (ex.rpe || 0), 0) / 
                         exercises.filter(ex => ex.rpe).length).toFixed(1)
                      : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search exercises..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                    data-testid="button-view-grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                    className="rounded-l-none"
                    data-testid="button-view-table"
                  >
                    <TableIcon className="w-4 h-4" />
                  </Button>
                </div>

                <ExportDialog exercises={exercises} onExport={handleExport} />

                <Link href="/upload">
                  <a>
                    <Button data-testid="button-new-upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          </>
        )}

        {exercises.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
              <p className="text-muted-foreground mb-6">Upload a spreadsheet to get started</p>
            </div>
            <Link href="/upload">
              <a>
                <Button size="lg" data-testid="button-upload-first">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Workout
                </Button>
              </a>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <ExerciseCard key={exercise.id} {...exercise} />
            ))}
          </div>
        ) : (
          <ParsedDataTable 
            exercises={filteredExercises} 
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}

        {exercises.length > 0 && filteredExercises.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No exercises found matching "{searchQuery}"</p>
          </div>
        )}
      </main>
    </div>
  );
}
