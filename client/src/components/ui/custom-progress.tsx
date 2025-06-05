import React from "react";
import { cn } from "@/lib/utils";

interface CustomProgressProps {
  value: number;
  className?: string;
  showPercentage?: boolean;
}

export function CustomProgress({ 
  value, 
  className, 
  showPercentage = false 
}: CustomProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value || 0));
  
  return (
    <div className={cn("relative", className)}>
      <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-muted-foreground mt-1 text-right">
          {Math.round(clampedValue)}%
        </div>
      )}
    </div>
  );
}