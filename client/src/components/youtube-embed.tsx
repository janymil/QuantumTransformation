import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Maximize } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface YouTubeEmbedProps {
  videoUrl: string;
  title?: string;
  description?: string;
  autoplay?: boolean;
  showFullscreen?: boolean;
}

export default function YouTubeEmbed({ 
  videoUrl, 
  title = "Video", 
  description,
  autoplay = false,
  showFullscreen = true 
}: YouTubeEmbedProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract video ID from YouTube URL
  const getVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
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

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const VideoPlayer = ({ className = "" }: { className?: string }) => (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );

  return (
    <Card className="w-full">
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Play className="w-5 h-5 mr-2 text-primary" />
              {title}
            </span>
            <div className="flex space-x-2">
              {showFullscreen && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Maximize className="w-4 h-4 mr-1" />
                      Fullscreen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl w-full">
                    <VisuallyHidden>
                      <DialogTitle>{title}</DialogTitle>
                    </VisuallyHidden>
                    <VideoPlayer />
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  YouTube
                </a>
              </Button>
            </div>
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="p-6">
        <VideoPlayer />
        
        {/* Video Info */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Streaming from YouTube</span>
            <span>No server load</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Video loads directly from YouTube's servers
          </div>
        </div>
      </CardContent>
    </Card>
  );
}