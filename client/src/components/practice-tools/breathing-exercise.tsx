import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";

interface BreathingExerciseProps {
  onClose?: () => void;
}

export default function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [seconds, setSeconds] = useState(0);
  const [cycle, setCycle] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 4-7-8 breathing pattern (4 inhale, 7 hold, 8 exhale, 2 pause)
  const breathingPattern = {
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 2
  };

  const totalCycleTime = Object.values(breathingPattern).reduce((sum, time) => sum + time, 0);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          const cyclePosition = newSeconds % totalCycleTime;
          
          if (cyclePosition === 0 && newSeconds > 0) {
            setCycle(c => c + 1);
          }

          // Determine current phase
          if (cyclePosition <= breathingPattern.inhale) {
            setPhase('inhale');
          } else if (cyclePosition <= breathingPattern.inhale + breathingPattern.hold) {
            setPhase('hold');
          } else if (cyclePosition <= breathingPattern.inhale + breathingPattern.hold + breathingPattern.exhale) {
            setPhase('exhale');
          } else {
            setPhase('pause');
          }

          return newSeconds;
        });
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
  }, [isActive, totalCycleTime]);

  const reset = () => {
    setIsActive(false);
    setSeconds(0);
    setCycle(0);
    setPhase('inhale');
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'pause': return 'Pause';
      default: return 'Breathe';
    }
  };

  const getCircleScale = () => {
    const cyclePosition = seconds % totalCycleTime;
    
    if (cyclePosition <= breathingPattern.inhale) {
      return 0.5 + (cyclePosition / breathingPattern.inhale) * 0.5; // 0.5 to 1
    } else if (cyclePosition <= breathingPattern.inhale + breathingPattern.hold) {
      return 1; // Hold at full size
    } else if (cyclePosition <= breathingPattern.inhale + breathingPattern.hold + breathingPattern.exhale) {
      const exhaleProgress = (cyclePosition - breathingPattern.inhale - breathingPattern.hold) / breathingPattern.exhale;
      return 1 - (exhaleProgress * 0.5); // 1 to 0.5
    } else {
      return 0.5; // Pause at small size
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return '#3B82F6'; // Blue
      case 'hold': return '#10B981'; // Green
      case 'exhale': return '#8B5CF6'; // Purple
      case 'pause': return '#6B7280'; // Gray
      default: return '#3B82F6';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">4-7-8 Breathing Exercise</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          A powerful technique for relaxation and stress relief
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Breathing Circle */}
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div
              className="w-48 h-48 rounded-full border-4 transition-all duration-1000 ease-in-out flex items-center justify-center"
              style={{
                transform: `scale(${getCircleScale()})`,
                borderColor: getPhaseColor(),
                backgroundColor: `${getPhaseColor()}20`
              }}
            >
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-2"
                  style={{ color: getPhaseColor() }}
                >
                  {getPhaseInstruction()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Cycle {cycle + 1}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            <div>Inhale for 4 • Hold for 7 • Exhale for 8 • Pause for 2</div>
          </div>
          <div className="text-xs text-muted-foreground">
            Follow the circle's expansion and contraction
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => setIsActive(!isActive)}
            variant={isActive ? "secondary" : "default"}
            size="lg"
          >
            {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={reset} variant="outline" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Stats */}
        <div className="text-center text-sm text-muted-foreground">
          <div>Total time: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</div>
          <div>Completed cycles: {cycle}</div>
        </div>

        {onClose && (
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}