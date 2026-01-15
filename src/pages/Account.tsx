// src/pages/Account.tsx
// Refactored: Profile & Avatar only. Settings moved to /parent/settings
// 15 January 2026

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faMapMarkerAlt,
  faSpinner,
  faCheck,
  faExclamationTriangle,
  faPen,
  faTimes,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";
import { PageLayout } from "../components/layout";
import { supabase } from "../lib/supabase";
import AvatarUpload from "../components/account/AvatarUpload";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  timezone: string;
}

interface ChildProfileData {
  first_name: string;
  preferred_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function Account() {
  const navigate = useNavigate();
  const { user, isChild, isParent, loading: authLoading, refresh } = useAuth();

  const [parentData, setParentData] = useState<ProfileData | null>(null);
  const [childData, setChildData] = useState<ChildProfileData | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-section editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Backup state for cancel
  const [profileBackup, setProfileBackup] = useState<Partial<ProfileData> | null>(null);
  const [addressBackup, setAddressBackup] = useState<Partial<ProfileData> | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Load profile data
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        if (isParent) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, email, phone, avatar_url, address_line1, address_line2, city, postcode, timezone")
            .eq("id", user.id)
            .single();

          if (profileError) throw profileError;

          setParentData({
            full_name: profileData.full_name || "",
            email: profileData.email || "",
            phone: profileData.phone || null,
            avatar_url: profileData.avatar_url || null,
            address_line1: profileData.address_line1 || null,
            address_line2: profileData.address_line2 || null,
            city: profileData.city || null,
            postcode: profileData.postcode || null,
            timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        } else if (isChild) {
          const { data: childProfileData, error: childError } = await supabase
            .from("children")
            .select("id, first_name, preferred_name, email, avatar_url")
            .eq("auth_user_id", user.id)
            .single();

          if (childError) throw childError;

          setChildId(childProfileData.id);
          setChildData({
            first_name: childProfileData.first_name || "",
            preferred_name: childProfileData.preferred_name || null,
            email: childProfileData.email || null,
            avatar_url: childProfileData.avatar_url || null,
          });
        }
      } catch (err: any) {
        console.error("Load error:", err);
        setError(err.message || "Failed to load account data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, isParent, isChild]);

  // Save profile section
  const saveProfileSection = async () => {
    if (!parentData && !childData) return;
    
    setSavingProfile(true);
    setError(null);

    try {
      if (isParent && parentData) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: parentData.full_name,
            phone: parentData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user!.id);

        if (updateError) throw updateError;
      } else if (childData && childId) {
        const { error: updateError } = await supabase
          .from("children")
          .update({
            preferred_name: childData.preferred_name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", childId);

        if (updateError) throw updateError;
      }

      setEditingProfile(false);
      setProfileBackup(null);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Save address section
  const saveAddressSection = async () => {
    if (!parentData) return;
    
    setSavingAddress(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          address_line1: parentData.address_line1,
          address_line2: parentData.address_line2,
          city: parentData.city,
          postcode: parentData.postcode,
          timezone: parentData.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);

      if (updateError) throw updateError;

      setEditingAddress(false);
      setAddressBackup(null);
    } catch (err: any) {
      setError(err.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle avatar change - refresh header
  const handleAvatarChange = async (newUrl: string | null) => {
    if (isParent && parentData) {
      setParentData({ ...parentData, avatar_url: newUrl });
    } else if (childData) {
      setChildData({ ...childData, avatar_url: newUrl });
    }
    await refresh();
  };

  // Cancel editing helpers
  const cancelProfileEdit = () => {
    if (profileBackup && parentData) {
      setParentData({ ...parentData, ...profileBackup });
    }
    setEditingProfile(false);
    setProfileBackup(null);
  };

  const cancelAddressEdit = () => {
    if (addressBackup && parentData) {
      setParentData({ ...parentData, ...addressBackup });
    }
    setEditingAddress(false);
    setAddressBackup(null);
  };

  // Start editing helpers
  const startProfileEdit = () => {
    if (parentData) {
      setProfileBackup({ full_name: parentData.full_name, phone: parentData.phone });
    }
    setEditingProfile(true);
  };

  const startAddressEdit = () => {
    if (parentData) {
      setAddressBackup({
        address_line1: parentData.address_line1,
        address_line2: parentData.address_line2,
        city: parentData.city,
        postcode: parentData.postcode,
        timezone: parentData.timezone,
      });
    }
    setEditingAddress(true);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Loading account...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user) return null;

  const displayName = isParent ? parentData?.full_name : childData?.preferred_name || childData?.first_name;
  const avatarUrl = isParent ? parentData?.avatar_url : childData?.avatar_url;
  const userId = isParent ? user.id : childId;

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-primary-600">My Account</h1>
            <p className="text-neutral-500">Manage your profile information</p>
          </div>
          
          {/* Settings link for parents */}
          {isParent && (
            <Link
              to="/parent/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              <FontAwesomeIcon icon={faCog} />
              <span className="font-medium">Settings</span>
            </Link>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-red-50 border border-red-200">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-accent-red" />
            <p className="text-sm text-accent-red">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <FontAwesomeIcon icon={faTimes} className="text-accent-red" />
            </button>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Avatar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-6">
              <AvatarUpload
                currentAvatarUrl={avatarUrl || null}
                userId={userId || ""}
                userType={isParent ? "parent" : "child"}
                userName={displayName || "User"}
                onAvatarChange={handleAvatarChange}
              />
              
              {/* Display name under avatar */}
              <div className="text-center mt-4 pt-4 border-t border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-700">
                  {displayName}
                </h2>
                <p className="text-sm text-neutral-500">
                  {isParent ? "Parent Account" : "Student Account"}
                </p>
              </div>
            </div>
          </div>

          {/* Right column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <SectionCard
              icon={faUser}
              title="Profile"
              editing={editingProfile}
              saving={savingProfile}
              onEdit={startProfileEdit}
              onSave={saveProfileSection}
              onCancel={cancelProfileEdit}
            >
              {isParent && parentData && (
                <div className="space-y-4">
                  <FormField
                    label="Full name"
                    value={parentData.full_name}
                    onChange={(v) => setParentData({ ...parentData, full_name: v })}
                    disabled={!editingProfile}
                  />
                  <FormField
                    label="Email"
                    value={parentData.email}
                    disabled={true}
                    hint="Contact support to change your email"
                  />
                  <FormField
                    label="Phone (optional)"
                    value={parentData.phone || ""}
                    onChange={(v) => setParentData({ ...parentData, phone: v || null })}
                    disabled={!editingProfile}
                    placeholder="+44 7700 900000"
                  />
                </div>
              )}

              {isChild && childData && (
                <div className="space-y-4">
                  <FormField
                    label="Display name"
                    value={childData.preferred_name || childData.first_name}
                    onChange={(v) => setChildData({ ...childData, preferred_name: v })}
                    disabled={!editingProfile}
                  />
                  {childData.email && (
                    <FormField
                      label="Email"
                      value={childData.email}
                      disabled={true}
                    />
                  )}
                </div>
              )}
            </SectionCard>

            {/* Address Section (Parents only) */}
            {isParent && parentData && (
              <SectionCard
                icon={faMapMarkerAlt}
                title="Address"
                editing={editingAddress}
                saving={savingAddress}
                onEdit={startAddressEdit}
                onSave={saveAddressSection}
                onCancel={cancelAddressEdit}
              >
                <div className="space-y-4">
                  <FormField
                    label="Address line 1"
                    value={parentData.address_line1 || ""}
                    onChange={(v) => setParentData({ ...parentData, address_line1: v || null })}
                    disabled={!editingAddress}
                  />
                  <FormField
                    label="Address line 2 (optional)"
                    value={parentData.address_line2 || ""}
                    onChange={(v) => setParentData({ ...parentData, address_line2: v || null })}
                    disabled={!editingAddress}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="City"
                      value={parentData.city || ""}
                      onChange={(v) => setParentData({ ...parentData, city: v || null })}
                      disabled={!editingAddress}
                    />
                    <FormField
                      label="Postcode"
                      value={parentData.postcode || ""}
                      onChange={(v) => setParentData({ ...parentData, postcode: v || null })}
                      disabled={!editingAddress}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block text-neutral-700">
                      Time zone
                    </label>
                    <select
                      value={parentData.timezone}
                      onChange={(e) => setParentData({ ...parentData, timezone: e.target.value })}
                      disabled={!editingAddress}
                      className={`w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:cursor-not-allowed transition-colors ${
                        editingAddress ? "bg-neutral-50 text-neutral-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="America/New_York">America/New York (EST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Link to Settings for parents */}
            {isParent && (
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-neutral-700">
                      Looking for notifications, security, or analytics?
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      These settings have moved to a dedicated page
                    </p>
                  </div>
                  <Link
                    to="/parent/settings"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faCog} />
                    Go to Settings
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </PageLayout>
  );
}

// Section card with edit/save buttons
function SectionCard({
  icon,
  title,
  children,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={icon} className="text-primary-600" />
          <h2 className="text-lg font-semibold text-neutral-700">{title}</h2>
        </div>
        
        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-neutral-50 transition-colors"
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-200 text-neutral-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-accent-green transition-colors"
            >
              {saving ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faCheck} />
              )}
              Save
            </button>
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
}

// Form field component
function FormField({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block text-neutral-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:cursor-not-allowed transition-colors ${
          disabled ? "bg-neutral-100 text-neutral-500" : "bg-neutral-50 text-neutral-700"
        }`}
      />
      {hint && (
        <p className="text-xs mt-1 text-neutral-500">{hint}</p>
      )}
    </div>
  );
}