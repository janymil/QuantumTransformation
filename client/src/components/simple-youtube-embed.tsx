import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";

interface SimpleYouTubeEmbedProps {
  videoUrl: string;
  title: string;
  description?: string;
}

export default function SimpleYouTubeEmbed({ videoUrl, title, description }: SimpleYouTubeEmbedProps) {
  // Extract video ID from YouTube URL
  const getVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(videoUrl);
  
  if (!videoId) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Invalid YouTube URL</p>
          <Button variant="outline" asChild className="mt-4">
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Play className="w-5 h-5 mr-2 text-primary" />
            {title}
          </span>
          <Button variant="outline" size="sm" asChild>
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" />
              YouTube
            </a>
          </Button>
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Streaming from YouTube</span>
            <span>No server load</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}