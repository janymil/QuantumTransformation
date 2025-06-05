import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, ExternalLink } from "lucide-react";

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
              <div className="space-y-4">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={getEmbedUrl(video.url)}
                    title={video.title}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Watch this video to deepen your understanding</span>
                  <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in new tab
                  </a>
                </div>
              </div>
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