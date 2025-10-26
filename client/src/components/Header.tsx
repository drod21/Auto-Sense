import { Link, useLocation } from "wouter";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/">
          <button className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 -ml-2 min-h-9 bg-transparent border-0 cursor-pointer" data-testid="link-home">
            <Dumbbell className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">WorkoutTracker</span>
          </button>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/">
            <Button 
              variant={location === "/" ? "secondary" : "ghost"}
              size="default"
              data-testid="link-dashboard"
            >
              Dashboard
            </Button>
          </Link>
          <Link href="/upload">
            <Button 
              variant={location === "/upload" ? "secondary" : "ghost"}
              size="default"
              data-testid="link-upload"
            >
              Upload
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
