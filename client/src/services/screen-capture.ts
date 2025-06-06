/**
 * Screen Capture Service - Browser-based screen capture functionality
 * Similar to Windows Snip & Sketch tool
 */

export interface CaptureOptions {
  format?: 'png' | 'jpeg';
  quality?: number; // 0.1 to 1.0 for jpeg
}

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
  timestamp: Date;
  source: 'screen' | 'webcam' | 'upload';
}

class ScreenCaptureService {
  private mediaStream: MediaStream | null = null;

  /**
   * Capture entire screen or selected window
   */
  async captureScreen(options: CaptureOptions = {}): Promise<CaptureResult> {
    try {
      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      this.mediaStream = stream;

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play();
          
          setTimeout(() => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d')!;
              
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              // Draw video frame to canvas
              ctx.drawImage(video, 0, 0);
              
              const format = options.format || 'png';
              const quality = options.quality || 0.9;
              const dataUrl = canvas.toDataURL(`image/${format}`, quality);
              
              // Stop the stream
              stream.getTracks().forEach(track => track.stop());
              this.mediaStream = null;
              
              resolve({
                dataUrl,
                width: canvas.width,
                height: canvas.height,
                timestamp: new Date(),
                source: 'screen'
              });
            } catch (error) {
              reject(error);
            }
          }, 100); // Small delay to ensure video is ready
        };
      });
    } catch (error) {
      throw new Error(`Screen capture failed: ${error}`);
    }
  }

  /**
   * Capture from webcam
   */
  async captureWebcam(options: CaptureOptions = {}): Promise<CaptureResult> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play();
          
          setTimeout(() => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d')!;
              
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              ctx.drawImage(video, 0, 0);
              
              const format = options.format || 'png';
              const quality = options.quality || 0.9;
              const dataUrl = canvas.toDataURL(`image/${format}`, quality);
              
              // Stop the stream
              stream.getTracks().forEach(track => track.stop());
              
              resolve({
                dataUrl,
                width: canvas.width,
                height: canvas.height,
                timestamp: new Date(),
                source: 'webcam'
              });
            } catch (error) {
              reject(error);
            }
          }, 100);
        };
      });
    } catch (error) {
      throw new Error(`Webcam capture failed: ${error}`);
    }
  }

  /**
   * Process uploaded file
   */
  async processUpload(file: File): Promise<CaptureResult> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png');
          
          resolve({
            dataUrl,
            width: img.width,
            height: img.height,
            timestamp: new Date(),
            source: 'upload'
          });
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Stop any active capture streams
   */
  stopCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Check if screen capture is supported
   */
  isScreenCaptureSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  /**
   * Check if webcam capture is supported
   */
  isWebcamSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

export const screenCaptureService = new ScreenCaptureService();