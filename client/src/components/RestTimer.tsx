import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Timer, 
  SkipForward, 
  Plus, 
  Pause, 
  Play,
  Bell
} from "lucide-react";

interface RestTimerProps {
  duration: number; // in seconds
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function RestTimer({
  duration,
  isActive,
  onComplete,
  onSkip
}: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playCompletionSound = () => {
    try {
      // Create a simple beep sound
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      // Create three beeps
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.2);
      }, 250);
      
      setTimeout(() => {
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.value = 1000;
        osc3.type = 'sine';
        gain3.gain.setValueAtTime(0.4, audioContext.currentTime);
        osc3.start(audioContext.currentTime);
        osc3.stop(audioContext.currentTime + 0.3);
      }, 500);
    } catch (error) {
      console.error("Could not play sound:", error);
    }
  };

  // Initialize audio
  useEffect(() => {
    // Create a simple beep sound using the Web Audio API
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    const createBeep = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    return () => {
      audioContext.close();
    };
  }, []);

  // Handle timer completion
  useEffect(() => {
    if (timeRemaining === 0 && !isCompleted) {
      setIsCompleted(true);
      playCompletionSound();
      onComplete();
    }
  }, [timeRemaining, isCompleted, onComplete]);

  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((duration - timeRemaining) / duration) * 100;

  const addTime = (seconds: number) => {
    setTimeRemaining(prev => prev + seconds);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  if (!isActive) return null;

  return (
    <Card className="border-primary/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Timer className="h-5 w-5 animate-pulse" />
            Rest Timer
          </span>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time display */}
        <div className="text-center">
          <p className="text-6xl font-bold font-mono tracking-wider" data-testid="timer-display">
            {formatTime(timeRemaining)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isPaused ? 'Paused' : 'Rest between sets'}
          </p>
        </div>

        {/* Progress bar */}
        <Progress 
          value={progressPercentage} 
          className="h-3"
          data-testid="timer-progress"
        />

        {/* Control buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={togglePause}
            data-testid="button-pause-timer"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={onSkip}
            data-testid="button-skip-timer"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
        </div>

        {/* Add time buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addTime(30)}
            data-testid="button-add-30s"
          >
            <Plus className="h-3 w-3 mr-1" />
            30s
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addTime(60)}
            data-testid="button-add-60s"
          >
            <Plus className="h-3 w-3 mr-1" />
            1m
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addTime(120)}
            data-testid="button-add-120s"
          >
            <Plus className="h-3 w-3 mr-1" />
            2m
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}