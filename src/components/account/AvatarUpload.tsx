// src/components/account/AvatarUpload.tsx

import { useState, useRef, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCamera, 
  faUpload, 
  faSpinner,
  faSearchPlus,
  faSearchMinus,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../lib/supabase";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userId: string;
  userType: "parent" | "child";
  userName: string;
  onAvatarChange: (newUrl: string | null) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const CROP_SIZE = 200; // Output size in pixels
const PREVIEW_SIZE = 200; // Preview circle size

export default function AvatarUpload({
  currentAvatarUrl,
  userId,
  userType,
  userName,
  onAvatarChange,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  
  // Image state for cropping
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50); // 0-100 slider
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  
  // Zoom bounds calculated from image size
  const [minZoom, setMinZoom] = useState(0.1);
  const [fitZoom, setFitZoom] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate initials for fallback avatar
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Convert slider (0-100) to actual zoom
  // 0% = minZoom (see whole image)
  // 50% = fitZoom (smallest dimension fills circle)
  // 100% = fitZoom * 2 (zoomed in 2x)
  const sliderToZoom = useCallback((slider: number): number => {
    if (slider <= 50) {
      // 0-50 maps to minZoom-fitZoom
      const t = slider / 50;
      return minZoom + (fitZoom - minZoom) * t;
    } else {
      // 50-100 maps to fitZoom to fitZoom*2
      const t = (slider - 50) / 50;
      return fitZoom + fitZoom * t;
    }
  }, [minZoom, fitZoom]);

  const actualZoom = sliderToZoom(sliderValue);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a JPEG or PNG image");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be less than 2MB");
      return;
    }

    // Create preview and open cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      
      // Load image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        const natWidth = img.naturalWidth;
        const natHeight = img.naturalHeight;
        
        setNaturalSize({ width: natWidth, height: natHeight });
        
        // Calculate zoom bounds
        // fitZoom: smallest dimension fills the circle exactly
        const minDim = Math.min(natWidth, natHeight);
        const calculatedFitZoom = PREVIEW_SIZE / minDim;
        
        // minZoom: largest dimension fills the circle (see whole image)
        const maxDim = Math.max(natWidth, natHeight);
        const calculatedMinZoom = PREVIEW_SIZE / maxDim;
        
        setFitZoom(calculatedFitZoom);
        setMinZoom(calculatedMinZoom);
        
        // Start at 50% (fitZoom - image fills circle nicely)
        setSliderValue(50);
        setPosition({ x: 0, y: 0 });
        setImageSrc(src);
        setShowCropper(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle mouse/touch drag for repositioning
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Generate cropped image at whatever zoom/position user has chosen
  const getCroppedImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas || !imageSrc) {
        reject(new Error("Canvas not ready"));
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Set canvas to output size
        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        // Calculate the source region based on current zoom and position
        const scaledWidth = img.naturalWidth * actualZoom;
        const scaledHeight = img.naturalHeight * actualZoom;
        
        // Center of the preview area
        const centerX = PREVIEW_SIZE / 2;
        const centerY = PREVIEW_SIZE / 2;
        
        // The visible area in source image coordinates
        const sourceX = (centerX - position.x - scaledWidth / 2) / actualZoom + img.naturalWidth / 2;
        const sourceY = (centerY - position.y - scaledHeight / 2) / actualZoom + img.naturalHeight / 2;
        const sourceSize = PREVIEW_SIZE / actualZoom;

        // Draw circular clip
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw the cropped portion
        ctx.drawImage(
          img,
          sourceX - sourceSize / 2,
          sourceY - sourceSize / 2,
          sourceSize,
          sourceSize,
          0,
          0,
          CROP_SIZE,
          CROP_SIZE
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageSrc;
    });
  };

  const handleUpload = async () => {
    if (!imageSrc) return;

    setUploading(true);
    setError(null);

    try {
      // Get cropped image blob at current composition
      const croppedBlob = await getCroppedImage();
      
      // Generate unique filename
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `${userType}s/${fileName}`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split("/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile/children table
      if (userType === "parent") {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from("children")
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (updateError) throw updateError;
      }

      onAvatarChange(publicUrl);
      closeCropper();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAvatarUrl) return;

    setUploading(true);
    setError(null);

    try {
      // Delete from storage
      const oldPath = currentAvatarUrl.split("/avatars/")[1];
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Update profile/children table
      if (userType === "parent") {
        await supabase
          .from("profiles")
          .update({ avatar_url: null, updated_at: new Date().toISOString() })
          .eq("id", userId);
      } else {
        await supabase
          .from("children")
          .update({ avatar_url: null, updated_at: new Date().toISOString() })
          .eq("id", userId);
      }

      onAvatarChange(null);
    } catch (err: any) {
      console.error("Remove error:", err);
      setError(err.message || "Failed to remove avatar");
    } finally {
      setUploading(false);
    }
  };

  const closeCropper = () => {
    setShowCropper(false);
    setImageSrc(null);
    setSliderValue(50);
    setPosition({ x: 0, y: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Calculate displayed image size
  const displayWidth = naturalSize.width * actualZoom;
  const displayHeight = naturalSize.height * actualZoom;

  return (
    <div className="flex flex-col items-center">
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Avatar Display */}
      <div className="relative mb-4">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={userName}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-card"
          />
        ) : (
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-white shadow-card"
            style={{ backgroundColor: "#EAE3FF" }}
          >
            <span className="text-3xl font-semibold" style={{ color: "#5B2CFF" }}>
              {initials}
            </span>
          </div>
        )}

        {/* Camera overlay button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-1 right-1 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors hover:opacity-90"
          style={{ backgroundColor: "#5B2CFF" }}
        >
          <FontAwesomeIcon icon={faCamera} className="text-white" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-medium hover:underline transition-colors"
          style={{ color: "#5B2CFF" }}
        >
          {currentAvatarUrl ? "Change photo" : "Upload photo"}
        </button>
        {currentAvatarUrl && (
          <>
            <span style={{ color: "#CFD3E0" }}>•</span>
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: "#F05151" }}
            >
              Remove
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm mt-2" style={{ color: "#F05151" }}>{error}</p>
      )}

      {/* File requirements */}
      <p className="text-xs mt-1" style={{ color: "#6C7280" }}>
        JPEG or PNG, max 2MB
      </p>

      {/* Crop Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "#1F2330" }}>
              Adjust your photo
            </h3>

            {/* Crop preview area */}
            <div className="flex justify-center mb-4">
              <div 
                className="relative overflow-hidden rounded-full cursor-move"
                style={{ 
                  width: PREVIEW_SIZE, 
                  height: PREVIEW_SIZE, 
                  backgroundColor: "#F6F7FB",
                  border: "3px solid #5B2CFF"
                }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  className="absolute select-none pointer-events-none"
                  style={{
                    width: displayWidth,
                    height: displayHeight,
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    transform: "translate(-50%, -50%)",
                    maxWidth: "none",
                  }}
                  draggable={false}
                />
              </div>
            </div>

            {/* Instructions */}
            <p className="text-xs text-center mb-4" style={{ color: "#6C7280" }}>
              Drag to reposition • Use slider to zoom
            </p>

            {/* Zoom slider - 0 to 100 */}
            <div className="flex items-center gap-3 mb-2 px-4">
              <FontAwesomeIcon icon={faSearchMinus} style={{ color: "#A8AEBD" }} />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, #5B2CFF 0%, #5B2CFF ${sliderValue}%, #E1E4EE ${sliderValue}%, #E1E4EE 100%)` 
                }}
              />
              <FontAwesomeIcon icon={faSearchPlus} style={{ color: "#A8AEBD" }} />
            </div>

            {/* Slider value display */}
            <p className="text-xs text-center mb-6" style={{ color: "#6C7280" }}>
              {sliderValue}%
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeCropper}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl font-medium transition-colors"
                style={{ 
                  border: "1px solid #E1E4EE",
                  color: "#4B5161"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: "#5B2CFF" }}
              >
                {uploading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} />
                    Save photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}