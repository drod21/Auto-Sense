import { useState } from "react";
import Header from "@/components/Header";
import ExerciseCard from "@/components/ExerciseCard";
import ParsedDataTable from "@/components/ParsedDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, LayoutGrid, Table as TableIcon, Download, Upload } from "lucide-react";
import { Link } from "wouter";

// TODO: remove mock data
const mockExercises = [
  {
    id: "1",
    exerciseName: "Barbell Squat",
    alternateExercise: "Goblet Squat",
    sets: 4,
    warmupSets: 2,
    restTimer: 180,
    rpe: 8,
    repRangeMin: 8,
    repRangeMax: 12,
  },
  {
    id: "2",
    exerciseName: "Bench Press",
    alternateExercise: "Dumbbell Press",
    sets: 3,
    warmupSets: 1,
    restTimer: 120,
    rpe: 9,
    repRangeMin: 6,
    repRangeMax: 10,
  },
  {
    id: "3",
    exerciseName: "Deadlift",
    alternateExercise: "Romanian Deadlift",
    sets: 3,
    warmupSets: 2,
    restTimer: 240,
    rpe: 9,
    repRangeMin: 5,
    repRangeMax: 8,
  },
  {
    id: "4",
    exerciseName: "Pull-ups",
    alternateExercise: "Lat Pulldown",
    sets: 3,
    warmupSets: 0,
    restTimer: 90,
    rpe: 8,
    repRangeMin: 8,
    repRangeMax: 12,
  },
  {
    id: "5",
    exerciseName: "Overhead Press",
    alternateExercise: "Dumbbell Shoulder Press",
    sets: 3,
    warmupSets: 1,
    restTimer: 120,
    rpe: 8,
    repRangeMin: 8,
    repRangeMax: 10,
  },
  {
    id: "6",
    exerciseName: "Barbell Row",
    alternateExercise: "Dumbbell Row",
    sets: 3,
    warmupSets: 1,
    restTimer: 90,
    rpe: 7,
    repRangeMin: 10,
    repRangeMax: 12,
  },
  {
    id: "7",
    exerciseName: "Romanian Deadlift",
    alternateExercise: "Leg Curl",
    sets: 3,
    warmupSets: 1,
    restTimer: 120,
    rpe: 8,
    repRangeMin: 10,
    repRangeMax: 15,
  },
  {
    id: "8",
    exerciseName: "Face Pulls",
    alternateExercise: "Rear Delt Fly",
    sets: 3,
    warmupSets: 0,
    restTimer: 60,
    rpe: 7,
    repRangeMin: 12,
    repRangeMax: 15,
  },
];

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExercises = mockExercises.filter((exercise) =>
    exercise.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Exercises</p>
              <p className="text-3xl font-bold font-mono" data-testid="text-total-exercises">{mockExercises.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">This Week</p>
              <p className="text-3xl font-bold font-mono" data-testid="text-week-count">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Workout Streak</p>
              <p className="text-3xl font-bold font-mono" data-testid="text-streak">7 days</p>
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

            <Button variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

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

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <ExerciseCard key={exercise.id} {...exercise} />
            ))}
          </div>
        ) : (
          <ParsedDataTable exercises={filteredExercises} />
        )}

        {filteredExercises.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No exercises found</p>
            <Link href="/upload">
              <a>
                <Button data-testid="button-upload-first">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Workout
                </Button>
              </a>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
