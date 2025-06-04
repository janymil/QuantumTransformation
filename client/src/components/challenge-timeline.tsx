import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lock, Play, Star } from "lucide-react";
import { Link } from "wouter";

interface ChallengeContent {
  day: number;
  title: string;
  topic: string;
  duration: string;
  subtitle: string;
}

interface ChallengeTimelineProps {
  currentDay: number;
  completedDays: number[];
  content: ChallengeContent[];
}

export default function ChallengeTimeline({ 
  currentDay, 
  completedDays, 
  content 
}: ChallengeTimelineProps) {
  const [selectedWeek, setSelectedWeek] = useState(Math.ceil(currentDay / 7));

  const weeks = [
    { number: 1, name: "Foundation", days: content.slice(0, 7) },
    { number: 2, name: "Integration", days: content.slice(7, 14) },
    { number: 3, name: "Manifestation", days: content.slice(14, 21) },
    { number: 4, name: "Mastery", days: content.slice(21, 30) },
  ];

  const selectedWeekData = weeks.find(w => w.number === selectedWeek);

  const getDayStatus = (day: number) => {
    if (completedDays.includes(day)) return "completed";
    if (day === currentDay) return "current";
    if (day < currentDay) return "available";
    return "locked";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-white";
      case "current":
        return "bg-primary text-white animate-pulse-slow";
      case "available":
        return "bg-muted text-muted-foreground hover:bg-muted/80";
      case "locked":
        return "bg-muted/50 text-muted-foreground/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "current":
        return <Play className="w-5 h-5" />;
      case "locked":
        return <Lock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Week Navigation */}
      <div className="flex justify-center">
        <div className="bg-muted rounded-lg p-1 flex">
          {weeks.map((week) => (
            <Button
              key={week.number}
              variant={selectedWeek === week.number ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedWeek(week.number)}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedWeek === week.number 
                  ? 'bg-primary text-white' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week {week.number}
              <span className="ml-2 text-xs opacity-75">{week.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {selectedWeekData?.days.map((dayContent) => {
          const status = getDayStatus(dayContent.day);
          const isAccessible = status === "completed" || status === "current" || status === "available";
          
          return (
            <Card 
              key={dayContent.day} 
              className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
                status === "current" ? 'border-primary shadow-md' : ''
              } ${!isAccessible ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  
                  {/* Day Circle */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${getStatusColor(status)} transition-all duration-300`}>
                    {getStatusIcon(status) || (
                      <span className="font-bold">{dayContent.day}</span>
                    )}
                  </div>
                  
                  {/* Day Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      Day {dayContent.day}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {dayContent.topic}
                    </p>
                    
                    {/* Duration Badge */}
                    <Badge variant="outline" className="text-xs">
                      {dayContent.duration}
                    </Badge>
                    
                    {/* Status Indicators */}
                    {status === "completed" && (
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="w-3 h-3 text-warning fill-current" />
                        <span className="text-xs text-success">Complete</span>
                      </div>
                    )}
                    
                    {status === "current" && (
                      <Badge variant="default" className="bg-primary text-white text-xs">
                        Current
                      </Badge>
                    )}
                    
                    {status === "locked" && (
                      <Badge variant="outline" className="text-xs opacity-60">
                        Locked
                      </Badge>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  {isAccessible && (
                    <div className="mt-3">
                      <Link href={`/challenge/${dayContent.day}`}>
                        <Button 
                          size="sm" 
                          variant={status === "current" ? "default" : "outline"}
                          className="w-full text-xs"
                        >
                          {status === "completed" ? "Review" : status === "current" ? "Start" : "View"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Week Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="font-bold text-lg text-foreground mb-2">
              Week {selectedWeek}: {selectedWeekData?.name}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedWeek === 1 && "Build your foundation in quantum consciousness and establish daily practices."}
              {selectedWeek === 2 && "Integrate quantum principles into your daily life and deepen your understanding."}
              {selectedWeek === 3 && "Learn to consciously manifest your desires using quantum field principles."}
              {selectedWeek === 4 && "Master your quantum abilities and establish lasting transformation."}
            </p>
            
            {/* Week Progress */}
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-muted-foreground">
                  {selectedWeekData?.days.filter(d => completedDays.includes(d.day)).length} Completed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">
                  {selectedWeekData?.days.filter(d => d.day === currentDay).length} Current
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted rounded-full"></div>
                <span className="text-muted-foreground">
                  {selectedWeekData?.days.filter(d => d.day > currentDay).length} Upcoming
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
