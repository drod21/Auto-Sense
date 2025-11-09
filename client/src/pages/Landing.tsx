import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, FileSpreadsheet, Brain, TrendingUp, Timer, CheckCircle2 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-10" />
        
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6">
              <Dumbbell className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              <h1 className="text-4xl sm:text-6xl font-bold text-white">
                Lipht
              </h1>
            </div>
            <p className="text-lg sm:text-2xl text-white/90 mb-2 max-w-3xl mx-auto">
              Long-term Integration Progressive Hypertrophy Tracker
            </p>
            <p className="text-base sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Transform your workout spreadsheets into intelligent, trackable training programs
            </p>
            <Button
              size="lg"
              onClick={handleLogin}
              className="h-12 sm:h-14 px-8 text-base sm:text-lg"
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-16">
            <Card className="bg-background/95 backdrop-blur">
              <CardContent className="p-6">
                <FileSpreadsheet className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Spreadsheets</h3>
                <p className="text-sm text-muted-foreground">
                  Import your existing workout programs from CSV or Excel files
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur">
              <CardContent className="p-6">
                <Brain className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Parsing</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically extract exercises, sets, reps, and RPE using advanced AI
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur">
              <CardContent className="p-6">
                <TrendingUp className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Log your workouts in real-time and monitor your strength gains
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to Track Your Training
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for serious lifters who want to optimize their progressive overload
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Timer className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Smart Rest Timers</h3>
              <p className="text-muted-foreground">
                Automatic rest timers between sets keep you on pace for optimal performance
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">RPE Tracking</h3>
              <p className="text-muted-foreground">
                Log Rate of Perceived Exertion to ensure proper intensity management
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Multi-Phase Programs</h3>
              <p className="text-muted-foreground">
                Handle complex periodized programs with multiple phases and mesocycles
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Exercise Substitutions</h3>
              <p className="text-muted-foreground">
                Built-in alternative exercises when equipment isn't available
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Button
            size="lg"
            onClick={handleLogin}
            className="h-12 sm:h-14 px-8 text-base sm:text-lg"
            data-testid="button-login-bottom"
          >
            Start Training Smarter
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-primary" />
              <span className="font-semibold">Lipht</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for athletes, by athletes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
