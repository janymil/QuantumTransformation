import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Camera, Link, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VisionBoardItem } from "./vision-board-types";

interface ImageUploadProps {
  onImageAdd: (item: VisionBoardItem) => void;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

export function useImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (files: FileList | null, onImageAdd: (item: VisionBoardItem) => void) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImageElement: VisionBoardItem = {
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: e.target?.result as string,
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            opacity: 1,
            zIndex: 1,
            visible: true,
            locked: false
          };
          onImageAdd(newImageElement);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleImageFromURL = (url: string, onImageAdd: (item: VisionBoardItem) => void) => {
    if (!url.trim()) return;

    const newImageElement: VisionBoardItem = {
      id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'image',
      content: url.trim(),
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      opacity: 1,
      zIndex: 1,
      visible: true,
      locked: false
    };
    onImageAdd(newImageElement);
  };

  const handleDrop = (e: React.DragEvent, onImageAdd: (item: VisionBoardItem) => void) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files, onImageAdd);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return {
    fileInputRef,
    triggerFileUpload,
    handleFileUpload,
    handleImageFromURL,
    handleDrop,
    handleDragOver
  };
}

export function ImageUpload({ onImageAdd, canvasRef }: ImageUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  const {
    fileInputRef,
    triggerFileUpload,
    handleFileUpload,
    handleImageFromURL,
    handleDrop,
    handleDragOver
  } = useImageUpload();

  const handleScreenCapture = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen' as any
        }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          
          const newImageElement: VisionBoardItem = {
            id: `screen-${Date.now()}`,
            type: 'image',
            content: dataUrl,
            x: 50,
            y: 50,
            width: 300,
            height: 200,
            opacity: 1,
            zIndex: 1,
            visible: true,
            locked: false
          };
          
          onImageAdd(newImageElement);
          setIsDialogOpen(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Screen capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleWebcamCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          
          const newImageElement: VisionBoardItem = {
            id: `webcam-${Date.now()}`,
            type: 'image',
            content: dataUrl,
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            opacity: 1,
            zIndex: 1,
            visible: true,
            locked: false
          };
          
          onImageAdd(newImageElement);
          setIsDialogOpen(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Webcam capture failed:', error);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      handleImageFromURL(imageUrl, onImageAdd);
      setImageUrl("");
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e.target.files, onImageAdd)}
        className="hidden"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Image className="w-4 h-4 mr-2" />
            Add Image
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Image to Vision Board</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4">
            {/* File Upload */}
            <Button
              variant="outline"
              onClick={triggerFileUpload}
              className="h-24 border-dashed"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium">Upload from Computer</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </Button>

            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <Button onClick={handleUrlSubmit} disabled={!imageUrl.trim()}>
                  <Link className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Screen Capture */}
            <Button
              variant="outline"
              onClick={handleScreenCapture}
              disabled={isCapturing}
              className="h-16"
            >
              <div className="text-center">
                <Upload className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm">
                  {isCapturing ? 'Capturing...' : 'Capture Screen'}
                </p>
              </div>
            </Button>

            {/* Webcam Capture */}
            <Button
              variant="outline"
              onClick={handleWebcamCapture}
              className="h-16"
            >
              <div className="text-center">
                <Camera className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm">Take Photo</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ImageDropZone({ 
  children, 
  onImageAdd, 
  className = "" 
}: { 
  children: React.ReactNode;
  onImageAdd: (item: VisionBoardItem) => void;
  className?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { handleDrop, handleDragOver } = useImageUpload();

  return (
    <div
      className={`${className} ${isDragOver ? 'bg-blue-50 border-blue-300' : ''}`}
      onDrop={(e) => {
        handleDrop(e, onImageAdd);
        setIsDragOver(false);
      }}
      onDragOver={(e) => {
        handleDragOver(e);
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      {children}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-50 border-2 border-dashed border-blue-300">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-2 text-blue-500" />
            <p className="text-lg font-medium text-blue-700">Drop images here</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImageUploadComponent() {
  return null;
}