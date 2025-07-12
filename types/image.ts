import { SaveFormat } from 'expo-image-manipulator';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
} 