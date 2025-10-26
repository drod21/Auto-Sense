import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import type { Exercise } from "@shared/schema";

interface ExportDialogProps {
  exercises: Exercise[];
  onExport?: (format: "json" | "csv") => void;
}

export default function ExportDialog({ exercises, onExport }: ExportDialogProps) {
  const [open, setOpen] = useState(false);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(exercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    onExport?.("json");
    setOpen(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "Exercise Name",
      "Alternate Exercise",
      "Sets",
      "Warmup Sets",
      "Rest Timer (seconds)",
      "RPE",
      "Rep Range Min",
      "Rep Range Max"
    ];

    // RFC 4180 compliant CSV escaping
    const escapeCSV = (value: string): string => {
      if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = exercises.map(ex => [
      escapeCSV(ex.exerciseName),
      escapeCSV(ex.alternateExercise || ""),
      ex.sets.toString(),
      (ex.warmupSets || 0).toString(),
      ex.restTimer.toString(),
      ex.rpe?.toString() || "",
      ex.repRangeMin.toString(),
      ex.repRangeMax.toString()
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const dataBlob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    onExport?.("csv");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-export">
        <DialogHeader>
          <DialogTitle>Export Workout Data</DialogTitle>
          <DialogDescription>
            Choose a format to download your workout data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportJSON}
            data-testid="button-export-json"
          >
            <FileJson className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Export as JSON</div>
              <div className="text-xs text-muted-foreground">
                {exercises.length} exercises • Machine-readable format
              </div>
            </div>
          </Button>

          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={handleExportCSV}
            data-testid="button-export-csv"
          >
            <FileSpreadsheet className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Export as CSV</div>
              <div className="text-xs text-muted-foreground">
                {exercises.length} exercises • Open in Excel or Sheets
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
