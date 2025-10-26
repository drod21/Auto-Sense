import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Dumbbell, Menu, X, Home, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/">
            <button className="flex items-center gap-1.5 sm:gap-2 hover-elevate active-elevate-2 rounded-md px-1.5 sm:px-2 -ml-1.5 sm:-ml-2 min-h-10 sm:min-h-9 bg-transparent border-0 cursor-pointer" data-testid="link-home">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-lg sm:text-xl font-bold">WorkoutTracker</span>
            </button>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-2">
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
            <ThemeToggle />
          </nav>

          {/* Mobile Navigation */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0">
          <SheetHeader className="px-4 py-4 border-b">
            <SheetTitle className="text-lg">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-4 gap-2">
            <Link href="/">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                size="lg"
                className="w-full justify-start h-12"
                onClick={() => setIsOpen(false)}
                data-testid="mobile-link-dashboard"
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Button>
            </Link>
            <Link href="/upload">
              <Button
                variant={location === "/upload" ? "secondary" : "ghost"}
                size="lg"
                className="w-full justify-start h-12"
                onClick={() => setIsOpen(false)}
                data-testid="mobile-link-upload"
              >
                <Upload className="mr-3 h-5 w-5" />
                Upload Program
              </Button>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
