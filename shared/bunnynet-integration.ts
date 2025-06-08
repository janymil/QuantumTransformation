/**
 * BunnyNet CDN Integration
 * Real implementation using provided credentials
 */

interface BunnyNetConfig {
  username: string;
  hostname: string;
  password: string;
  readOnlyPassword: string;
  storageZoneName: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
  size?: number;
}

interface FileInfo {
  name: string;
  size: number;
  lastModified: string;
  url: string;
}

class BunnyNetService {
  private config: BunnyNetConfig;

  constructor() {
    this.config = {
      username: 'quantumchallenge',
      hostname: 'ny.storage.bunnycdn.com',
      password: 'e67013cc-8750-49c7-a8ba7ad6f1ce-8fa5-4a73',
      readOnlyPassword: '6bf393f5-2775-47fe-9f3f193cd7ae-f021-46c7',
      storageZoneName: 'quantumchallenge'
    };
  }

  /**
   * Upload file to BunnyNet storage
   */
  async uploadFile(buffer: Buffer, fileName: string, folder?: string): Promise<UploadResult> {
    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const filePath = folder ? `${folder}/${sanitizedFileName}` : sanitizedFileName;
      const uploadUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${filePath}`;

      console.log(`Uploading to BunnyNet: ${filePath}`);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.password,
          'Content-Type': 'application/octet-stream',
          'Content-Length': buffer.length.toString()
        },
        body: buffer
      });

      if (response.ok) {
        const publicUrl = `https://${this.config.storageZoneName}.b-cdn.net/${filePath}`;
        
        return {
          success: true,
          url: publicUrl,
          fileName: sanitizedFileName,
          size: buffer.length
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Download file from BunnyNet storage
   */
  async downloadFile(fileName: string, folder?: string): Promise<Buffer | null> {
    try {
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const downloadUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${filePath}`;

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'AccessKey': this.config.readOnlyPassword
        }
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } else {
        console.error(`Download failed: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(folder?: string): Promise<FileInfo[]> {
    try {
      const listUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${folder || ''}`;

      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'AccessKey': this.config.readOnlyPassword,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const files = await response.json();
        return files.map((file: any) => ({
          name: file.ObjectName,
          size: file.Length,
          lastModified: file.LastChanged,
          url: `https://${this.config.storageZoneName}.b-cdn.net/${folder ? folder + '/' : ''}${file.ObjectName}`
        }));
      } else {
        console.error(`List files failed: ${response.status} ${response.statusText}`);
        return [];
      }
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }

  /**
   * Delete file from BunnyNet storage
   */
  async deleteFile(fileName: string, folder?: string): Promise<boolean> {
    try {
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      const deleteUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${filePath}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.config.password
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Create folder in BunnyNet storage
   */
  async createFolder(folderName: string): Promise<boolean> {
    try {
      const folderUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${folderName}/`;

      const response = await fetch(folderUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.password,
          'Content-Length': '0'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Create folder error:', error);
      return false;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(fileName: string, folder?: string): string {
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    return `https://${this.config.storageZoneName}.b-cdn.net/${filePath}`;
  }

  /**
   * Sanitize file name for safe storage
   */
  private sanitizeFileName(fileName: string): string {
    // Remove or replace unsafe characters
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Generate organized folder structure
   */
  generateFolderPath(discipline: string, type: 'documents' | 'research' | 'training'): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    return `${type}/${discipline}/${year}/${month}`;
  }

  /**
   * Upload document with organized structure
   */
  async uploadDocument(
    buffer: Buffer, 
    fileName: string, 
    discipline: string, 
    type: 'uploaded' | 'research' | 'training' = 'uploaded'
  ): Promise<UploadResult> {
    const folder = this.generateFolderPath(discipline, 'documents');
    const timestampedFileName = this.addTimestamp(fileName);
    
    // Ensure folder exists
    await this.createFolder(`documents/${discipline}`);
    await this.createFolder(`documents/${discipline}/${new Date().getFullYear()}`);
    await this.createFolder(folder);
    
    return this.uploadFile(buffer, timestampedFileName, folder);
  }

  /**
   * Add timestamp to filename to prevent conflicts
   */
  private addTimestamp(fileName: string): string {
    const timestamp = Date.now();
    const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
    const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
    
    return ext ? `${baseName}_${timestamp}.${ext}` : `${baseName}_${timestamp}`;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byDiscipline: Record<string, { files: number; size: number }>;
  }> {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        byDiscipline: {} as Record<string, { files: number; size: number }>
      };

      // List all files in documents folder
      const files = await this.listFiles('documents');
      
      for (const file of files) {
        stats.totalFiles++;
        stats.totalSize += file.size;
        
        // Extract discipline from path
        const pathParts = file.name.split('/');
        if (pathParts.length > 1) {
          const discipline = pathParts[1];
          if (!stats.byDiscipline[discipline]) {
            stats.byDiscipline[discipline] = { files: 0, size: 0 };
          }
          stats.byDiscipline[discipline].files++;
          stats.byDiscipline[discipline].size += file.size;
        }
      }

      return stats;
    } catch (error) {
      console.error('Storage stats error:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        byDiscipline: {}
      };
    }
  }
}

// Export singleton instance
export const bunnyNetService = new BunnyNetService();
export type { UploadResult, FileInfo };