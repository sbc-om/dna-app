'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Check, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageUploadProps {
  onUpload: (file: File, croppedImageUrl: string) => void;
  currentImage?: string;
  aspectRatio?: number;
  maxSizeMB?: number;
  onError?: (message: string) => void;
}

export function ImageUpload({
  onUpload,
  currentImage,
  aspectRatio = 1,
  maxSizeMB = 5,
  onError,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync previewUrl with currentImage prop
  useEffect(() => {
    if (currentImage) {
      setPreviewUrl(currentImage);
    }
  }, [currentImage]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (onError) onError('Please select an image file');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      if (onError) onError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImageToCrop(result);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getCroppedImage = useCallback(async (): Promise<string> => {
    if (!completedCrop || !imgRef.current) {
      return imageToCrop;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return imageToCrop;
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve(imageToCrop);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop, imageToCrop]);

  const handleCropComplete = async () => {
    if (selectedFile) {
      const croppedUrl = await getCroppedImage();
      setPreviewUrl(croppedUrl);
      onUpload(selectedFile, croppedUrl);
      setCropDialogOpen(false);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Picture Preview with Click to Upload */}
      <div className="relative w-48 h-48 mx-auto group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Upload profile picture"
        />
        
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-[#30B2D2] shadow-xl transition-transform group-hover:scale-105">
          {previewUrl ? (
            <img
              key={previewUrl}
              src={previewUrl}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#30B2D2]/20 to-[#1E3A8A]/20 flex items-center justify-center">
              <UserCircle className="w-24 h-24 text-gray-400" />
            </div>
          )}
          
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-center text-white">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Change Photo</p>
            </div>
          </div>
        </div>

        {/* Remove Button */}
        {previewUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Click on the image to upload a new photo (Max {maxSizeMB}MB)
      </p>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1E3A8A]">
              Crop Your Image
            </DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the part of the image you want to use
            </DialogDescription>
          </DialogHeader>

          <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg p-4 overflow-hidden" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            {imageToCrop && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                circularCrop={aspectRatio === 1}
              >
                <img
                  ref={imgRef}
                  src={imageToCrop}
                  alt="Crop preview"
                  style={{ maxHeight: 'calc(80vh - 220px)', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                />
              </ReactCrop>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCropDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropComplete}
              className="bg-[#30B2D2] hover:bg-[#1E3A8A]"
            >
              <Check className="mr-2 h-4 w-4" />
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
