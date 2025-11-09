import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Timer, TrendingUp, Hash, Flame, Video } from "lucide-react";

interface ExerciseCardProps {
  exerciseName: string;
  alternateExercise?: string | null;
  sets: number;
  warmupSets: number | null;
  restTimer: number;
  rpe?: number | null;
  repRangeMin: number;
  repRangeMax: number;
  videoUrl?: string | null;
  onStart?: () => void;
}

function getYouTubeEmbedUrl(url: string): string | null {
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
}

export default function ExerciseCard({
  exerciseName,
  alternateExercise,
  sets,
  warmupSets,
  restTimer,
  rpe,
  repRangeMin,
  repRangeMax,
  videoUrl,
  onStart,
}: ExerciseCardProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-exercise-${exerciseName.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <h3 className="text-xl font-semibold" data-testid="text-exercise-name">{exerciseName}</h3>
        {alternateExercise && (
          <p className="text-sm text-muted-foreground mt-1">
            Alternative: {alternateExercise}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {embedUrl && (
          <div className="rounded-md overflow-hidden" data-testid="video-container">
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
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Sets</p>
              <p className="font-mono font-medium" data-testid="text-sets">{sets}</p>
            </div>
          </div>

          {(warmupSets || 0) > 0 && (
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Warmup</p>
                <p className="font-mono font-medium" data-testid="text-warmup">{warmupSets}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Rest</p>
              <p className="font-mono font-medium" data-testid="text-rest">{formatTime(restTimer)}</p>
            </div>
          </div>

          {rpe && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">RPE</p>
                <p className="font-mono font-medium" data-testid="text-rpe">{rpe}/10</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rep Range</p>
              <Badge variant="secondary" className="font-mono" data-testid="badge-rep-range">
                {repRangeMin}-{repRangeMax} reps
              </Badge>
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={() => {
            onStart?.();
            console.log(`Starting workout: ${exerciseName}`);
          }}
          data-testid="button-start-workout"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Workout
        </Button>
      </CardContent>
    </Card>
  );
}
