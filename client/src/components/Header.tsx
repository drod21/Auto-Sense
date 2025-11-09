import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Dumbbell, Menu, X, Home, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

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
                className="h-11"
                data-testid="link-dashboard"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/upload">
              <Button 
                variant={location === "/upload" ? "secondary" : "ghost"}
                className="h-11"
                data-testid="link-upload"
              >
                Upload
              </Button>
            </Link>
            <ThemeToggle />
            {user && (
              <>
                <div className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.email || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                    {user.firstName || user.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="h-11"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
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
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-md bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profileImageUrl || undefined} alt={user.email || "User"} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </p>
                  {user.firstName && user.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            )}
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
            {user && (
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start h-12 mt-2"
                onClick={handleLogout}
                data-testid="mobile-button-logout"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
