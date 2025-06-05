import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, ExternalLink } from "lucide-react";
import YouTubeEmbed from "./youtube-embed";

interface VideoLink {
  title: string;
  description?: string;
  url?: string;
}

interface VideoPlayerTabProps {
  videoLinks: VideoLink[];
}

export default function VideoPlayerTab({ videoLinks }: VideoPlayerTabProps) {
  const getEmbedUrl = (url: string): string => {
    // YouTube URL conversion
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo URL conversion
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  };

  if (!videoLinks || videoLinks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {videoLinks.filter(video => video.url).map((video, index) => (
        <YouTubeEmbed 
          key={index}
          videoUrl={video.url!} 
          title={video.title}
          description={video.description}
          showFullscreen={true}
        />
      ))}
      {videoLinks.filter(video => !video.url).length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="bg-muted/30 rounded-lg p-6 text-center">
              <Play className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                Additional recommended videos will be available soon
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}