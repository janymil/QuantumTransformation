import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize,
  Clock,
  User,
  Star
} from "lucide-react";

interface VideoMeditationGuideProps {
  challengeType: string;
  day: number;
}

interface MeditationVideo {
  id: string;
  title: string;
  duration: string;
  instructor: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  rating: number;
}

export default function VideoMeditationGuide({ challengeType, day }: VideoMeditationGuideProps) {
  const [selectedVideo, setSelectedVideo] = useState<MeditationVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Get meditation videos based on challenge type and day
  const getMeditationVideos = (): MeditationVideo[] => {
    const baseVideos: MeditationVideo[] = [
      {
        id: "breathing-basics",
        title: "Quantum Breathing Foundation",
        duration: "12:30",
        instructor: "Dr. Sarah Chen",
        description: "Master the fundamental breathing techniques that form the foundation of quantum consciousness work.",
        difficulty: "Beginner",
        tags: ["breathing", "foundation", "awareness"],
        rating: 4.8
      },
      {
        id: "energy-alignment",
        title: "Energy Field Alignment",
        duration: "18:45",
        instructor: "Michael Rodriguez",
        description: "Learn to align your energy field with quantum possibilities through guided visualization.",
        difficulty: "Intermediate",
        tags: ["energy", "visualization", "alignment"],
        rating: 4.9
      },
      {
        id: "manifestation-meditation",
        title: "Quantum Manifestation Practice",
        duration: "25:00",
        instructor: "Emma Thompson",
        description: "Advanced meditation combining intention setting with quantum field manipulation techniques.",
        difficulty: "Advanced",
        tags: ["manifestation", "intention", "advanced"],
        rating: 4.7
      },
      {
        id: "morning-activation",
        title: "Morning Quantum Activation",
        duration: "8:20",
        instructor: "Dr. James Wilson",
        description: "Quick morning practice to activate your quantum potential for the day ahead.",
        difficulty: "Beginner",
        tags: ["morning", "activation", "energy"],
        rating: 4.6
      },
      {
        id: "evening-integration",
        title: "Evening Integration Session",
        duration: "15:15",
        instructor: "Luna Martinez",
        description: "Integrate your daily quantum experiences and prepare for regenerative sleep.",
        difficulty: "Intermediate",
        tags: ["evening", "integration", "sleep"],
        rating: 4.8
      }
    ];

    // Filter and customize based on challenge type and day
    return baseVideos.map(video => ({
      ...video,
      title: `Day ${day}: ${video.title}`,
      description: `${video.description} Specifically designed for ${challengeType.replace('_', ' ')} challenge progression.`
    }));
  };

  const videos = getMeditationVideos();

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedVideo) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{selectedVideo.title}</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedVideo(null)}
            >
              Back to Library
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Video Player Placeholder */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white space-y-4">
                <div className="text-6xl opacity-50">🧘‍♀️</div>
                <p className="text-lg">Meditation Video Player</p>
                <p className="text-sm opacity-75">
                  Video content would be streamed here from your meditation library
                </p>
              </div>
            </div>
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <div className="flex-1 mx-4">
                  <div className="bg-white/30 rounded-full h-1">
                    <div className="bg-white rounded-full h-1 w-1/3"></div>
                  </div>
                </div>
                
                <span className="text-sm">{formatTime(currentTime)} / {selectedVideo.duration}</span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Video Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-4">
                <Badge className={getDifficultyColor(selectedVideo.difficulty)}>
                  {selectedVideo.difficulty}
                </Badge>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {selectedVideo.duration}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  {selectedVideo.instructor}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-1" />
                  {selectedVideo.rating}
                </div>
              </div>
              
              <p className="text-gray-700">{selectedVideo.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {selectedVideo.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Save to Favorites
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Download Audio
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Share Session
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Play className="w-5 h-5 mr-2" />
          Guided Meditation Library
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose from curated meditation sessions designed for Day {day} of your quantum journey
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video) => (
            <Card 
              key={video.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedVideo(video)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm leading-tight">{video.title}</h4>
                    <div className="flex items-center text-xs text-gray-500">
                      <Star className="w-3 h-3 mr-1" />
                      {video.rating}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">{video.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(video.difficulty)}>
                        {video.difficulty}
                      </Badge>
                      <span className="text-xs text-gray-500">{video.duration}</span>
                    </div>
                    
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <Play className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="w-3 h-3 mr-1" />
                    {video.instructor}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Pro Tip:</strong> For best results, practice in a quiet space with comfortable seating. 
            Consider using headphones for immersive audio experience.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}