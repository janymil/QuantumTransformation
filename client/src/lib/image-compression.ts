/**
 * Image compression utilities for vision boards
 * Reduces file size while maintaining quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'webp' | 'png';
}

export class ImageCompressor {
  /**
   * Compress image to reduce file size
   */
  static async compressImage(
    imageUrl: string, 
    options: CompressionOptions = {}
  ): Promise<string> {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Apply compression settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = format === 'png' ? 'image/png' : 
                        format === 'webp' ? 'image/webp' : 'image/jpeg';
        
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Get compressed image size estimate
   */
  static getImageSizeKB(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1];
    const byteCharacters = atob(base64);
    return byteCharacters.length / 1024; // KB
  }

  /**
   * Compress multiple images for vision board
   */
  static async compressVisionBoardImages(items: any[]): Promise<any[]> {
    const compressedItems = await Promise.all(
      items.map(async (item) => {
        if (item.type === 'image' && item.content.startsWith('data:')) {
          try {
            const compressed = await this.compressImage(item.content, {
              maxWidth: 800,
              maxHeight: 600,
              quality: 0.75,
              format: 'jpeg'
            });
            
            console.log(`Image compressed: ${this.getImageSizeKB(item.content).toFixed(1)}KB → ${this.getImageSizeKB(compressed).toFixed(1)}KB`);
            
            return { ...item, content: compressed };
          } catch (error) {
            console.warn('Image compression failed, using original:', error);
            return item;
          }
        }
        return item;
      })
    );

    return compressedItems;
  }
}

/**
 * External hosting integration utilities
 */
export class ExternalHostingUploader {
  /**
   * Upload to Hostinger hosting via API
   */
  static async uploadToHostinger(
    imageData: string,
    filename: string,
    config: {
      apiEndpoint: string;
      authToken: string;
      directory?: string;
    }
  ): Promise<string> {
    const blob = this.dataURLtoBlob(imageData);
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('directory', config.directory || 'vision-boards');

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.url; // Return the public URL
  }

  /**
   * Upload to BunnyCDN
   */
  static async uploadToBunnyCDN(
    imageData: string,
    filename: string,
    config: {
      storageZone: string;
      accessKey: string;
      baseUrl: string;
    }
  ): Promise<string> {
    const blob = this.dataURLtoBlob(imageData);
    
    const response = await fetch(`${config.baseUrl}/${config.storageZone}/${filename}`, {
      method: 'PUT',
      headers: {
        'AccessKey': config.accessKey,
        'Content-Type': blob.type
      },
      body: blob
    });

    if (!response.ok) {
      throw new Error(`BunnyCDN upload failed: ${response.statusText}`);
    }

    return `https://${config.storageZone}.b-cdn.net/${filename}`;
  }

  /**
   * Convert dataURL to Blob for uploading
   */
  private static dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }
}