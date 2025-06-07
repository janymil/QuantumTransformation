import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Monitor, Square, Download, X } from "lucide-react";
import { VisionBoardItem } from "./vision-board-types";

interface ScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (item: VisionBoardItem) => void;
  isCapturing: boolean;
  setIsCapturing: (capturing: boolean) => void;
}

export default function ScreenCapture({
  isOpen,
  onClose,
  onImageCaptured,
  isCapturing,
  setIsCapturing
}: ScreenCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startScreenCapture = async () => {
    try {
      setIsCapturing(true);

      // Check if screen capture API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen capture not supported in this browser');
      }

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          
          // Convert to base64
          const dataURL = canvas.toDataURL('image/png', 0.9);
          setCapturedImage(dataURL);
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          setIsCapturing(false);
          
          toast({
            title: "Screen Captured",
            description: "Screenshot taken successfully"
          });
        }
      };

    } catch (error: any) {
      setIsCapturing(false);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Permission Denied",
          description: "Please allow screen capture permission",
          variant: "destructive"
        });
      } else if (error.name === 'NotSupportedError') {
        toast({
          title: "Not Supported",
          description: "Screen capture not supported in this browser",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Capture Failed",
          description: error.message || "Failed to capture screen",
          variant: "destructive"
        });
      }
    }
  };

  const uploadCapturedImage = async () => {
    if (!capturedImage) return;

    try {
      setIsProcessing(true);

      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('image', blob, `screen-capture-${Date.now()}.png`);

      // Upload to BunnyCDN via backend
      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload captured image');
      }

      const result = await uploadResponse.json();

      // Create vision board item
      const newItem: VisionBoardItem = {
        id: Date.now().toString(),
        type: 'image',
        content: result.url,
        x: 150,
        y: 150,
        width: 300,
        height: 200,
        opacity: 1,
        zIndex: 1,
        visible: true,
        locked: false
      };

      onImageCaptured(newItem);
      setCapturedImage(null);
      onClose();

      toast({
        title: "Image Added",
        description: "Screen capture added to vision board"
      });

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload captured image",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.download = `screen-capture-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  const clearCapture = () => {
    setCapturedImage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Screen Capture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* No capture yet */}
          {!capturedImage && !isCapturing && (
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Capture Your Screen</h3>
              <p className="text-muted-foreground mb-6">
                Capture any part of your screen to add to your vision board
              </p>
              <Button onClick={startScreenCapture} className="bg-blue-600 hover:bg-blue-700">
                <Camera className="w-4 h-4 mr-2" />
                Start Screen Capture
              </Button>
            </div>
          )}

          {/* Capturing state */}
          {isCapturing && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Capturing Screen...</h3>
              <p className="text-muted-foreground">
                Select the window or screen area you want to capture
              </p>
            </div>
          )}

          {/* Captured image preview */}
          {capturedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Captured Image</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadImage}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCapture}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-4">
                  <img
                    src={capturedImage}
                    alt="Captured screen"
                    className="w-full h-auto max-h-96 object-contain rounded border"
                  />
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Image will be uploaded to BunnyCDN and added to your vision board
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={startScreenCapture}
                    disabled={isCapturing || isProcessing}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Again
                  </Button>
                  <Button
                    onClick={uploadCapturedImage}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    Add to Vision Board
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Browser compatibility note */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-blue-900">Screen Capture Requirements:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Supported in Chrome, Firefox, Safari, and Edge</li>
              <li>• Requires HTTPS connection for security</li>
              <li>• You'll be prompted to select which screen/window to capture</li>
              <li>• Images are securely uploaded to BunnyCDN storage</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}