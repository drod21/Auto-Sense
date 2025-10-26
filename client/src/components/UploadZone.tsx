import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type UploadState = "idle" | "uploading" | "parsing" | "success";

interface UploadZoneProps {
  onFileSelect?: (file: File) => void;
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [exerciseCount, setExerciseCount] = useState(0);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setUploadState("uploading");
    setProgress(0);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(uploadInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name.replace(/\.(csv|xlsx|xls)$/i, ''));

      setProgress(100);
      setUploadState("parsing");

      const response = await fetch("/api/workouts/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(uploadInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setExerciseCount(data.exercises.length);
      setUploadState("success");

      toast({
        title: "Upload successful!",
        description: `Found ${data.exercises.length} exercises in your workout plan.`,
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);

      onFileSelect?.(file);
    } catch (error) {
      clearInterval(uploadInterval);
      console.error("Upload error:", error);
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });

      setUploadState("idle");
      setProgress(0);
      setFileName("");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-border"}
          ${uploadState === "idle" ? "hover-elevate" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="upload-dropzone"
      >
        {uploadState === "idle" && (
          <>
            <div className="flex justify-center mb-4">
              <Upload className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drop spreadsheet here</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Supports CSV and Excel files (.csv, .xlsx, .xls)
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
              data-testid="input-file"
            />
            <label htmlFor="file-input">
              <Button asChild size="lg">
                <span data-testid="button-browse">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Browse Files
                </span>
              </Button>
            </label>
          </>
        )}

        {uploadState === "uploading" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold">Uploading {fileName}</h3>
            <Progress value={progress} className="w-full" data-testid="progress-upload" />
            <p className="text-sm text-muted-foreground font-mono">{progress}%</p>
          </div>
        )}

        {uploadState === "parsing" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold">Parsing with AI...</h3>
            <p className="text-sm text-muted-foreground">
              Extracting exercises, sets, reps, and RPE data
            </p>
          </div>
        )}

        {uploadState === "success" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-green-600">Parsing Complete!</h3>
            <p className="text-sm text-muted-foreground">
              Found {exerciseCount} exercises in your workout plan
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </div>

      {uploadState === "idle" && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <h4 className="font-medium mb-2">Exercise Names</h4>
            <p className="text-sm text-muted-foreground">Automatically identifies exercises and alternatives</p>
          </div>
          <div className="text-center p-4">
            <h4 className="font-medium mb-2">Sets & Reps</h4>
            <p className="text-sm text-muted-foreground">Extracts sets, warmup sets, and rep ranges</p>
          </div>
          <div className="text-center p-4">
            <h4 className="font-medium mb-2">RPE & Rest</h4>
            <p className="text-sm text-muted-foreground">Captures RPE targets and rest timers</p>
          </div>
        </div>
      )}
    </div>
  );
}
