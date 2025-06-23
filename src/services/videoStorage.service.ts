import { storage } from './firestoreService';
import { storageLogger } from '@/lib/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface VideoUploadOptions {
  userId: string;
  type: 'intro' | 'interview' | 'testimonial';
  maxSizeMB?: number;
  allowedFormats?: string[];
  generateThumbnail?: boolean;
}

export interface VideoMetadata {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  originalName: string;
  size: number;
  duration?: number;
  format: string;
  uploadedAt: Date;
  userId: string;
  type: string;
}

class VideoStorageService {
  private bucket = storage?.bucket();
  private readonly DEFAULT_MAX_SIZE_MB = 50;
  private readonly ALLOWED_FORMATS = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
  private readonly BASE_PATH = 'videos';

  constructor() {
    if (!this.bucket) {
      storageLogger.warn('Firebase Storage bucket not available. Video uploads will fail.');
    }
  }

  private ensureBucket() {
    if (!this.bucket) {
      throw new Error('Firebase Storage bucket not available. Check Firebase configuration.');
    }
  }

  private validateFile(file: File | Buffer, options: VideoUploadOptions): void {
    const maxSizeBytes = (options.maxSizeMB || this.DEFAULT_MAX_SIZE_MB) * 1024 * 1024;
    const allowedFormats = options.allowedFormats || this.ALLOWED_FORMATS;

    // Check file size
    const fileSize = file instanceof File ? file.size : file.length;
    if (fileSize > maxSizeBytes) {
      throw new Error(`File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${options.maxSizeMB || this.DEFAULT_MAX_SIZE_MB}MB`);
    }

    // Check file format for File objects
    if (file instanceof File) {
      if (!allowedFormats.includes(file.type)) {
        throw new Error(`File format ${file.type} not allowed. Allowed formats: ${allowedFormats.join(', ')}`);
      }
    }

    storageLogger.info('File validation passed', {
      fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
      maxSize: `${options.maxSizeMB || this.DEFAULT_MAX_SIZE_MB}MB`
    });
  }

  private generateFilePath(userId: string, type: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = uuidv4().substring(0, 8);
    return `${this.BASE_PATH}/${type}/${userId}/${timestamp}_${uniqueId}.${extension}`;
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).substring(1).toLowerCase();
  }

  private getMimeType(extension: string): string {
    const mimeMap: { [key: string]: string } = {
      'webm': 'video/webm',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo'
    };
    return mimeMap[extension] || 'video/mp4';
  }

  async uploadVideo(
    file: File | Buffer,
    originalName: string,
    options: VideoUploadOptions
  ): Promise<VideoMetadata> {
    try {
      this.ensureBucket();
      this.validateFile(file, options);

      const extension = this.getFileExtension(originalName);
      const filePath = this.generateFilePath(options.userId, options.type, extension);
      const mimeType = this.getMimeType(extension);

      storageLogger.info('Starting video upload', {
        userId: options.userId,
        type: options.type,
        filePath,
        originalName
      });

      // Upload file to Firebase Storage
      const fileRef = this.bucket!.file(filePath);
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: mimeType,
          metadata: {
            userId: options.userId,
            type: options.type,
            originalName,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Convert File to Buffer if needed
      const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          storageLogger.error('Video upload failed', {
            error: String(error),
            userId: options.userId,
            filePath
          });
          reject(new Error(`Video upload failed: ${error.message}`));
        });

        stream.on('finish', async () => {
          try {
            // Make file publicly accessible
            await fileRef.makePublic();
            
            // Get public URL
            const publicUrl = `https://storage.googleapis.com/${this.bucket!.name}/${filePath}`;

            const metadata: VideoMetadata = {
              url: publicUrl,
              fileName: path.basename(filePath),
              originalName,
              size: buffer.length,
              format: mimeType,
              uploadedAt: new Date(),
              userId: options.userId,
              type: options.type
            };

            // Generate thumbnail if requested
            if (options.generateThumbnail) {
              try {
                metadata.thumbnailUrl = await this.generateThumbnail(publicUrl, options.userId);
              } catch (thumbnailError) {
                storageLogger.warn('Thumbnail generation failed', {
                  error: String(thumbnailError),
                  videoUrl: publicUrl
                });
                // Don't fail the upload if thumbnail generation fails
              }
            }

            storageLogger.info('Video upload completed', {
              userId: options.userId,
              url: publicUrl,
              size: `${(buffer.length / 1024 / 1024).toFixed(2)}MB`
            });

            resolve(metadata);
          } catch (error) {
            storageLogger.error('Post-upload processing failed', {
              error: String(error),
              userId: options.userId,
              filePath
            });
            reject(error);
          }
        });

        stream.end(buffer);
      });

    } catch (error) {
      storageLogger.error('Video upload preparation failed', {
        error: String(error),
        userId: options.userId
      });
      throw error;
    }
  }

  async uploadVideoFromBlob(
    blob: Blob,
    originalName: string,
    options: VideoUploadOptions
  ): Promise<VideoMetadata> {
    const buffer = Buffer.from(await blob.arrayBuffer());
    return this.uploadVideo(buffer, originalName, options);
  }

  private async generateThumbnail(videoUrl: string, userId: string): Promise<string> {
    // For now, return a placeholder thumbnail
    // In production, you would use a service like Cloud Functions to extract a frame
    // or integrate with a third-party service like Cloudinary
    
    const thumbnailPath = `${this.BASE_PATH}/thumbnails/${userId}/${Date.now()}_thumb.jpg`;
    
    // Placeholder implementation - in real usage, you'd extract a frame from the video
    // For now, we'll just return a constructed URL that would point to where the thumbnail should be
    const placeholderThumbnailUrl = `https://storage.googleapis.com/${this.bucket!.name}/${thumbnailPath}`;
    
    storageLogger.info('Thumbnail placeholder generated', {
      videoUrl,
      thumbnailUrl: placeholderThumbnailUrl,
      userId
    });

    return placeholderThumbnailUrl;
  }

  async deleteVideo(url: string): Promise<void> {
    try {
      this.ensureBucket();

      // Extract file path from URL
      const bucketName = this.bucket!.name;
      const urlPrefix = `https://storage.googleapis.com/${bucketName}/`;
      
      if (!url.startsWith(urlPrefix)) {
        throw new Error('Invalid video URL format');
      }

      const filePath = url.replace(urlPrefix, '');
      const fileRef = this.bucket!.file(filePath);

      // Check if file exists
      const [exists] = await fileRef.exists();
      if (!exists) {
        storageLogger.warn('Video file not found for deletion', { url, filePath });
        return;
      }

      await fileRef.delete();
      
      storageLogger.info('Video deleted successfully', { url, filePath });
    } catch (error) {
      storageLogger.error('Video deletion failed', {
        error: String(error),
        url
      });
      throw error;
    }
  }

  async getVideoMetadata(url: string): Promise<any> {
    try {
      this.ensureBucket();

      const bucketName = this.bucket!.name;
      const urlPrefix = `https://storage.googleapis.com/${bucketName}/`;
      
      if (!url.startsWith(urlPrefix)) {
        throw new Error('Invalid video URL format');
      }

      const filePath = url.replace(urlPrefix, '');
      const fileRef = this.bucket!.file(filePath);

      const [metadata] = await fileRef.getMetadata();
      
      return {
        name: metadata.name,
        size: parseInt(metadata.size),
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        customMetadata: metadata.metadata
      };
    } catch (error) {
      storageLogger.error('Failed to get video metadata', {
        error: String(error),
        url
      });
      throw error;
    }
  }

  async listUserVideos(userId: string, type?: string): Promise<VideoMetadata[]> {
    try {
      this.ensureBucket();

      const prefix = type 
        ? `${this.BASE_PATH}/${type}/${userId}/`
        : `${this.BASE_PATH}/*//${userId}/`;

      const [files] = await this.bucket!.getFiles({ prefix });
      
      const videos: VideoMetadata[] = [];
      
      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          const publicUrl = `https://storage.googleapis.com/${this.bucket!.name}/${file.name}`;
          
          videos.push({
            url: publicUrl,
            fileName: path.basename(file.name),
            originalName: metadata.metadata?.originalName || path.basename(file.name),
            size: parseInt(metadata.size),
            format: metadata.contentType,
            uploadedAt: new Date(metadata.timeCreated),
            userId,
            type: metadata.metadata?.type || 'unknown'
          });
        } catch (fileError) {
          storageLogger.warn('Failed to get metadata for file', {
            fileName: file.name,
            error: String(fileError)
          });
        }
      }

      return videos.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      storageLogger.error('Failed to list user videos', {
        error: String(error),
        userId,
        type
      });
      throw error;
    }
  }

  async getSignedDownloadUrl(url: string, expiresInMinutes = 60): Promise<string> {
    try {
      this.ensureBucket();

      const bucketName = this.bucket!.name;
      const urlPrefix = `https://storage.googleapis.com/${bucketName}/`;
      
      if (!url.startsWith(urlPrefix)) {
        throw new Error('Invalid video URL format');
      }

      const filePath = url.replace(urlPrefix, '');
      const fileRef = this.bucket!.file(filePath);

      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiresInMinutes * 60 * 1000)
      });

      return signedUrl;
    } catch (error) {
      storageLogger.error('Failed to generate signed URL', {
        error: String(error),
        url
      });
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      this.ensureBucket();
      
      // Try to list files to verify connection
      await this.bucket!.getFiles({ maxResults: 1 });
      return true;
    } catch (error) {
      storageLogger.error('Video storage health check failed', {
        error: String(error)
      });
      return false;
    }
  }
}

export const videoStorageService = new VideoStorageService();
export default videoStorageService;