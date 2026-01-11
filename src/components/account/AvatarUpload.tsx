// src/components/account/AvatarUpload.tsx

import { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faTrash, faUpload, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../lib/supabaseClient";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userId: string;
  userType: "parent" | "child";
  userName: string;
  onAvatarChange: (newUrl: string | null) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export default function AvatarUpload({
  currentAvatarUrl,
  userId,
  userType,
  userName,
  onAvatarChange,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate initials for fallback avatar
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
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
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
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
      setShowCropper(false);
      setSelectedFile(null);
      setPreviewUrl(null);
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

  const cancelCrop = () => {
    setShowCropper(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Display */}
      <div className="relative mb-4">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt={userName}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-card"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-card"
            style={{ backgroundColor: "#EAE3FF" }}
          >
            <span className="text-2xl font-semibold" style={{ color: "#5B2CFF" }}>
              {initials}
            </span>
          </div>
        )}

        {/* Camera overlay button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors"
          style={{ backgroundColor: "#5B2CFF" }}
        >
          <FontAwesomeIcon icon={faCamera} className="text-white text-sm" />
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
      <div className="flex items-center gap-3">
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
            <span className="text-neutral-300">•</span>
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="text-sm font-medium text-red-500 hover:underline transition-colors"
            >
              Remove
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      {/* File requirements */}
      <p className="text-xs text-neutral-500 mt-2">
        JPEG or PNG, max 2MB
      </p>

      {/* Preview/Crop Modal */}
      {showCropper && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-neutral-700 mb-4">
              Preview your photo
            </h3>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-40 h-40 rounded-full object-cover border-4 border-neutral-100"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelCrop}
                disabled={uploading}
                className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
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
                    Uploading...
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