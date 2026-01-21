/**
 * Storage Service - Firebase Storage Operations
 * Handles image uploads, compression, and management
 */

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  metadata?: {
    size: number;
    contentType: string;
    uploadedAt: string;
  };
}

export interface ImageMetadata {
  width?: number;
  height?: number;
  size: number;
  contentType: string;
  hasExif?: boolean;
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
}

// =============================================================================
// Image Upload Functions
// =============================================================================

/**
 * Upload an image to Firebase Storage
 */
export async function uploadImage(
  file: File,
  issueId: string,
  index: number = 0
): Promise<UploadResult> {
  if (!storage) {
    return {
      success: false,
      error: "Storage not initialized"
    };
  }

  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: "Invalid file type. Only images are allowed."
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File too large. Maximum size is 10MB."
      };
    }

    // Create storage path
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `issues/${issueId}/${timestamp}_${index}.${extension}`;
    
    const storageRef = ref(storage, path);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        issueId,
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    });
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url,
      path,
      metadata: {
        size: file.size,
        contentType: file.type,
        uploadedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed"
    };
  }
}

/**
 * Upload image from URL (for external images)
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  issueId: string,
  index: number = 0
): Promise<UploadResult> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch image from URL"
      };
    }
    
    const blob = await response.blob();
    
    // Create a File from blob
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    const file = new File([blob], `image_${index}.${extension}`, { type: contentType });
    
    return uploadImage(file, issueId, index);
  } catch (error) {
    console.error("Error uploading image from URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload from URL"
    };
  }
}

/**
 * Delete an image from storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  if (!storage) {
    console.error("Storage not initialized");
    return false;
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

/**
 * Delete all images for an issue
 */
export async function deleteIssueImages(issueId: string): Promise<number> {
  if (!storage) {
    console.error("Storage not initialized");
    return 0;
  }

  try {
    const folderRef = ref(storage, `issues/${issueId}`);
    const result = await listAll(folderRef);
    
    let deletedCount = 0;
    for (const item of result.items) {
      await deleteObject(item);
      deletedCount++;
    }
    
    return deletedCount;
  } catch (error) {
    console.error("Error deleting issue images:", error);
    return 0;
  }
}

/**
 * Get all image URLs for an issue
 */
export async function getIssueImages(issueId: string): Promise<string[]> {
  if (!storage) {
    console.error("Storage not initialized");
    return [];
  }

  try {
    const folderRef = ref(storage, `issues/${issueId}`);
    const result = await listAll(folderRef);
    
    const urls: string[] = [];
    for (const item of result.items) {
      const url = await getDownloadURL(item);
      urls.push(url);
    }
    
    return urls;
  } catch (error) {
    console.error("Error getting issue images:", error);
    return [];
  }
}

// =============================================================================
// Image Processing Functions
// =============================================================================

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error("Compression failed"));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Extract EXIF metadata from image (basic implementation)
 * In production, use a library like exif-js for full EXIF support
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        contentType: file.type,
        hasExif: false, // Would need exif-js library for actual extraction
        gpsCoordinates: undefined
      });
    };
    
    img.onerror = () => {
      resolve({
        size: file.size,
        contentType: file.type
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
    };
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB"
    };
  }
  
  return { valid: true };
}

/**
 * Generate thumbnail URL (using Firebase image resizing extension if available)
 */
export function getThumbnailUrl(originalUrl: string, size: number = 200): string {
  // If using Firebase Extension for image resizing, modify URL
  // Otherwise return original
  return originalUrl;
}
