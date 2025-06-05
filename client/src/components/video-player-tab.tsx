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
      {videoLinks.map((video, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Play className="w-5 h-5 mr-2 text-primary" />
                {video.title}
              </span>
              <Badge variant="secondary">
                Recommended
              </Badge>
            </CardTitle>
            {video.description && (
              <p className="text-sm text-muted-foreground">{video.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {video.url ? (
              <YouTubeEmbed 
                videoUrl={video.url} 
                title=""
                description=""
                showFullscreen={true}
              />
            ) : (
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <Play className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Video link will be available when added to the content
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}