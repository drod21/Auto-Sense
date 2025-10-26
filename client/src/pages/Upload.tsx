import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Upload() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-page-title">
            Import Your Workout Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your workout spreadsheet and let AI automatically parse exercises, sets, reps, RPE, and rest timers.
          </p>
        </div>

        <UploadZone />

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Don't have a spreadsheet? Download our sample template
          </p>
          <Button 
            variant="outline" 
            onClick={() => console.log("Download sample template")}
            data-testid="button-download-sample"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Sample Spreadsheet
          </Button>
        </div>
      </main>
    </div>
  );
}
