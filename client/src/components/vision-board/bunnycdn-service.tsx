import { useState } from 'react';
import { VisionBoardItem } from "./vision-board-types";

interface BunnyCDNConfig {
  storageZone: string;
  accessKey: string;
  pullZoneUrl: string;
  region: string;
}

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

class BunnyCDNService {
  private config: BunnyCDNConfig;

  constructor() {
    // BunnyCDN configuration - these should be environment variables
    this.config = {
      storageZone: 'vision-board-storage',
      accessKey: process.env.BUNNYCDN_ACCESS_KEY || '',
      pullZoneUrl: 'https://vision-board-cdn.b-cdn.net',
      region: 'de' // Frankfurt region
    };
  }

  async uploadImage(file: File): Promise<UploadResponse> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `vision-board-${timestamp}-${randomString}.${extension}`;

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', filename);

      // Upload to our backend which handles BunnyCDN upload
      const response = await fetch('/api/bunnycdn/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          url: `${this.config.pullZoneUrl}/${filename}`
        };
      } else {
        return {
          success: false,
          error: result.error || 'Upload failed'
        };
      }
    } catch (error) {
      console.error('BunnyCDN upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async uploadBase64Image(base64Data: string, filename?: string): Promise<UploadResponse> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], filename || `image-${Date.now()}.png`, {
        type: blob.type || 'image/png'
      });

      return await this.uploadImage(file);
    } catch (error) {
      console.error('Base64 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Base64 upload failed'
      };
    }
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const filename = imageUrl.split('/').pop();
      if (!filename) return false;

      const response = await fetch('/api/bunnycdn/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename }),
        credentials: 'include'
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('BunnyCDN delete error:', error);
      return false;
    }
  }

  optimizeImageUrl(url: string, width?: number, height?: number, quality?: number): string {
    if (!url.includes(this.config.pullZoneUrl)) {
      return url; // Not a BunnyCDN URL
    }

    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (quality) params.append('quality', quality.toString());

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  getImageVariants(baseUrl: string) {
    return {
      thumbnail: this.optimizeImageUrl(baseUrl, 150, 150, 80),
      small: this.optimizeImageUrl(baseUrl, 300, 300, 85),
      medium: this.optimizeImageUrl(baseUrl, 600, 600, 90),
      large: this.optimizeImageUrl(baseUrl, 1200, 1200, 95),
      original: baseUrl
    };
  }
}

// Singleton instance
export const bunnyCDNService = new BunnyCDNService();

// Enhanced image upload hook with BunnyCDN integration
export function useBunnyCDNImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file: File): Promise<VisionBoardItem | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await bunnyCDNService.uploadImage(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        const newImageElement: VisionBoardItem = {
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          content: result.url,
          x: 50,
          y: 50,
          width: 200,
          height: 150,
          opacity: 1,
          zIndex: 1,
          visible: true,
          locked: false
        };

        return newImageElement;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const uploadBase64Image = async (base64Data: string, filename?: string): Promise<VisionBoardItem | null> => {
    setIsUploading(true);
    
    try {
      const result = await bunnyCDNService.uploadBase64Image(base64Data, filename);
      
      if (result.success && result.url) {
        const newImageElement: VisionBoardItem = {
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          content: result.url,
          x: 50,
          y: 50,
          width: 200,
          height: 150,
          opacity: 1,
          zIndex: 1,
          visible: true,
          locked: false
        };

        return newImageElement;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Base64 upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    uploadBase64Image,
    isUploading,
    uploadProgress
  };
}

export default function BunnyCDNServiceComponent() {
  return null;
}