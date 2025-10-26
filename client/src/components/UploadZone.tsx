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
      formData.append("workoutName", file.name.replace(/\.(csv|xlsx|xls)$/i, ''));

      setProgress(100);
      setUploadState("parsing");

      const response = await fetch("/api/programs/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(uploadInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setExerciseCount(data.totalExercises || 0);
      setUploadState("success");

      toast({
        title: "Upload successful!",
        description: data.message || `Found ${data.totalExercises} exercises in ${data.phases?.length || 0} phases.`,
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
          border-2 border-dashed rounded-lg p-6 sm:p-8 md:p-12 text-center transition-colors
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
            <div className="flex justify-center mb-3 sm:mb-4">
              <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              <span className="hidden sm:inline">Drop spreadsheet here</span>
              <span className="sm:hidden">Upload your workout</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
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
              <Button asChild size="lg" className="h-12 sm:h-11 px-6 sm:px-8">
                <span data-testid="button-browse">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  <span className="sm:hidden">Choose File</span>
                  <span className="hidden sm:inline">Browse Files</span>
                </span>
              </Button>
            </label>
          </>
        )}

        {uploadState === "uploading" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin" />
            </div>
            <h3 className="text-base sm:text-xl font-semibold">Uploading {fileName}</h3>
            <Progress value={progress} className="w-full" data-testid="progress-upload" />
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">{progress}%</p>
          </div>
        )}

        {uploadState === "parsing" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-spin" />
            </div>
            <h3 className="text-base sm:text-xl font-semibold">Parsing with AI...</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Extracting exercises, sets, reps, and RPE data
            </p>
          </div>
        )}

        {uploadState === "success" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500" />
            </div>
            <h3 className="text-base sm:text-xl font-semibold text-green-600">Parsing Complete!</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Found {exerciseCount} exercises in your workout plan
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </div>

      {uploadState === "idle" && (
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4">
            <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Exercise Names</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">Automatically identifies exercises and alternatives</p>
          </div>
          <div className="text-center p-3 sm:p-4">
            <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Sets & Reps</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">Extracts sets, warmup sets, and rep ranges</p>
          </div>
          <div className="text-center p-3 sm:p-4">
            <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">RPE & Rest</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">Captures RPE targets and rest timers</p>
          </div>
        </div>
      )}
    </div>
  );
}
