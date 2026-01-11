// src/pages/Account.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faMapMarkerAlt,
  faBell,
  faLock,
  faTrash,
  faSpinner,
  faCheck,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import AvatarUpload from "../components/account/AvatarUpload";
import AnalyticsSharingCard from "../components/account/AnalyticsSharingCard";

// Design system colors
const COLORS = {
  primary: { 50: "#F7F4FF", 100: "#EAE3FF", 600: "#5B2CFF", 700: "#4520C5" },
  neutral: { 50: "#F9FAFC", 100: "#F6F7FB", 200: "#E1E4EE", 500: "#6C7280", 600: "#4B5161", 700: "#1F2330" },
  accent: { green: "#1EC592", amber: "#FFB547", red: "#F05151" },
};

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
  notification_settings: {
    weekly_summary: boolean;
    session_reminders: boolean;
    achievement_alerts: boolean;
    insights_available: boolean;
  };
  analytics_sharing: {
    enabled: boolean;
    scope: "town" | "county" | "national";
    children: Array<{ child_id: string; child_name: string; enabled: boolean }>;
  };
}

interface ChildProfileData {
  first_name: string;
  preferred_name: string | null;
  email: string | null;
  avatar_url: string | null;
  notification_settings: {
    session_reminders: boolean;
    achievement_alerts: boolean;
  };
}

export default function Account() {
  const navigate = useNavigate();
  const { user, profile, isChild, isParent, loading: authLoading } = useAuth();

  const [parentData, setParentData] = useState<ProfileData | null>(null);
  const [childData, setChildData] = useState<ChildProfileData | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
      setLoading(true);
      setError(null);

      try {
        if (isParent) {
          // Load parent profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError) throw profileError;

          // Load children for analytics sharing
          const { data: childrenData } = await supabase
            .from("children")
            .select("id, first_name")
            .eq("parent_id", user.id);

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
            notification_settings: profileData.notification_settings || {
              weekly_summary: true,
              session_reminders: true,
              achievement_alerts: true,
              insights_available: true,
            },
            analytics_sharing: profileData.analytics_sharing || {
              enabled: false,
              scope: "county",
              children: (childrenData || []).map((c) => ({
                child_id: c.id,
                child_name: c.first_name,
                enabled: true,
              })),
            },
          });
        } else if (isChild) {
          // Load child profile - find by auth_user_id
          const { data: childProfileData, error: childError } = await supabase
            .from("children")
            .select("*")
            .eq("auth_user_id", user.id)
            .single();

          if (childError) throw childError;

          setChildId(childProfileData.id);
          setChildData({
            first_name: childProfileData.first_name || "",
            preferred_name: childProfileData.preferred_name || null,
            email: childProfileData.email || null,
            avatar_url: childProfileData.avatar_url || null,
            notification_settings: childProfileData.notification_settings || {
              session_reminders: true,
              achievement_alerts: true,
            },
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

  // Save parent profile
  const saveParentProfile = async () => {
    if (!parentData || !user) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: parentData.full_name,
          phone: parentData.phone,
          address_line1: parentData.address_line1,
          address_line2: parentData.address_line2,
          city: parentData.city,
          postcode: parentData.postcode,
          timezone: parentData.timezone,
          notification_settings: parentData.notification_settings,
          analytics_sharing: parentData.analytics_sharing,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Save child profile
  const saveChildProfile = async () => {
    if (!childData || !childId) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("children")
        .update({
          preferred_name: childData.preferred_name,
          notification_settings: childData.notification_settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", childId);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center" style={{ backgroundColor: COLORS.neutral[100] }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: COLORS.primary[600] }} />
          <p className="text-sm" style={{ color: COLORS.neutral[600] }}>Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = isParent ? parentData?.full_name : childData?.preferred_name || childData?.first_name;
  const avatarUrl = isParent ? parentData?.avatar_url : childData?.avatar_url;
  const userId = isParent ? user.id : childId;

  return (
    <div className="min-h-[calc(100vh-73px)]" style={{ backgroundColor: COLORS.neutral[100] }}>
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.primary[600] }}>
            My Account
          </h1>
          <p style={{ color: COLORS.neutral[500] }}>
            Manage your profile and preferences
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA" }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: COLORS.accent.red }} />
            <p className="text-sm" style={{ color: COLORS.accent.red }}>{error}</p>
          </div>
        )}

        {/* Success banner */}
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "#D1FAE5", border: "1px solid #A7F3D0" }}>
            <FontAwesomeIcon icon={faCheck} style={{ color: COLORS.accent.green }} />
            <p className="text-sm" style={{ color: "#065F46" }}>Changes saved successfully</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <section className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faUser} style={{ color: COLORS.primary[600] }} />
              <h2 className="text-lg font-semibold" style={{ color: COLORS.neutral[700] }}>Profile</h2>
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-6 pb-6 border-b" style={{ borderColor: COLORS.neutral[200] }}>
              <AvatarUpload
                currentAvatarUrl={avatarUrl || null}
                userId={userId || ""}
                userType={isParent ? "parent" : "child"}
                userName={displayName || "User"}
                onAvatarChange={(newUrl) => {
                  if (isParent && parentData) {
                    setParentData({ ...parentData, avatar_url: newUrl });
                  } else if (childData) {
                    setChildData({ ...childData, avatar_url: newUrl });
                  }
                }}
              />
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              {isParent && parentData && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Full name</label>
                    <input
                      type="text"
                      value={parentData.full_name}
                      onChange={(e) => setParentData({ ...parentData, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Email</label>
                    <input
                      type="email"
                      value={parentData.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border cursor-not-allowed"
                      style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[100], color: COLORS.neutral[500] }}
                    />
                    <p className="text-xs mt-1" style={{ color: COLORS.neutral[500] }}>Contact support to change your email</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Phone (optional)</label>
                    <input
                      type="tel"
                      value={parentData.phone || ""}
                      onChange={(e) => setParentData({ ...parentData, phone: e.target.value })}
                      placeholder="+44 7700 900000"
                      className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                    />
                  </div>
                </>
              )}

              {isChild && childData && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Display name</label>
                    <input
                      type="text"
                      value={childData.preferred_name || childData.first_name}
                      onChange={(e) => setChildData({ ...childData, preferred_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                    />
                  </div>
                  {childData.email && (
                    <div>
                      <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Email</label>
                      <input
                        type="email"
                        value={childData.email}
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border cursor-not-allowed"
                        style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[100], color: COLORS.neutral[500] }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Address Section (Parents only) */}
          {isParent && parentData && (
            <section className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
              <div className="flex items-center gap-3 mb-6">
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: COLORS.primary[600] }} />
                <h2 className="text-lg font-semibold" style={{ color: COLORS.neutral[700] }}>Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Address line 1</label>
                  <input
                    type="text"
                    value={parentData.address_line1 || ""}
                    onChange={(e) => setParentData({ ...parentData, address_line1: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Address line 2 (optional)</label>
                  <input
                    type="text"
                    value={parentData.address_line2 || ""}
                    onChange={(e) => setParentData({ ...parentData, address_line2: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>City</label>
                    <input
                      type="text"
                      value={parentData.city || ""}
                      onChange={(e) => setParentData({ ...parentData, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Postcode</label>
                    <input
                      type="text"
                      value={parentData.postcode || ""}
                      onChange={(e) => setParentData({ ...parentData, postcode: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Time zone</label>
                  <select
                    value={parentData.timezone}
                    onChange={(e) => setParentData({ ...parentData, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                  >
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Analytics Sharing (Parents only) */}
          {isParent && parentData && (
            <AnalyticsSharingCard
              settings={parentData.analytics_sharing}
              onSettingsChange={(settings) => setParentData({ ...parentData, analytics_sharing: settings })}
              saving={saving}
            />
          )}

          {/* Notifications Section */}
          <section className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faBell} style={{ color: COLORS.primary[600] }} />
              <h2 className="text-lg font-semibold" style={{ color: COLORS.neutral[700] }}>Notifications</h2>
            </div>

            <div className="space-y-4">
              {isParent && parentData && (
                <>
                  <NotificationToggle
                    label="Weekly summary email"
                    description="Get a summary of your children's progress each Monday"
                    enabled={parentData.notification_settings.weekly_summary}
                    onChange={(enabled) => setParentData({
                      ...parentData,
                      notification_settings: { ...parentData.notification_settings, weekly_summary: enabled },
                    })}
                  />
                  <NotificationToggle
                    label="Session reminders"
                    description="Reminders when sessions are due"
                    enabled={parentData.notification_settings.session_reminders}
                    onChange={(enabled) => setParentData({
                      ...parentData,
                      notification_settings: { ...parentData.notification_settings, session_reminders: enabled },
                    })}
                  />
                  <NotificationToggle
                    label="Achievement alerts"
                    description="Celebrate when your children earn achievements"
                    enabled={parentData.notification_settings.achievement_alerts}
                    onChange={(enabled) => setParentData({
                      ...parentData,
                      notification_settings: { ...parentData.notification_settings, achievement_alerts: enabled },
                    })}
                  />
                  <NotificationToggle
                    label="Insights available"
                    description="Get notified when new peer insights are ready"
                    enabled={parentData.notification_settings.insights_available}
                    onChange={(enabled) => setParentData({
                      ...parentData,
                      notification_settings: { ...parentData.notification_settings, insights_available: enabled },
                    })}
                    disabled={!parentData.analytics_sharing.enabled}
                  />
                </>
              )}

              {isChild && childData && (
                <>
                  <NotificationToggle
                    label="Session reminders"
                    description="Get reminded when you have sessions scheduled"
                    enabled={childData.notification_settings.session_reminders}
                    onChange={(enabled) => setChildData({
                      ...childData,
                      notification_settings: { ...childData.notification_settings, session_reminders: enabled },
                    })}
                  />
                  <NotificationToggle
                    label="Achievement alerts"
                    description="Celebrate when you earn new achievements"
                    enabled={childData.notification_settings.achievement_alerts}
                    onChange={(enabled) => setChildData({
                      ...childData,
                      notification_settings: { ...childData.notification_settings, achievement_alerts: enabled },
                    })}
                  />
                </>
              )}
            </div>
          </section>

          {/* Security Section */}
          <section className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faLock} style={{ color: COLORS.primary[600] }} />
              <h2 className="text-lg font-semibold" style={{ color: COLORS.neutral[700] }}>Security</h2>
            </div>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm font-medium hover:underline"
                style={{ color: COLORS.primary[600] }}
              >
                Change password
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: COLORS.neutral[700] }}>Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.neutral[200], backgroundColor: COLORS.neutral[50] }}
                  />
                </div>
                {passwordError && (
                  <p className="text-sm" style={{ color: COLORS.accent.red }}>{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm" style={{ color: COLORS.accent.green }}>Password changed successfully</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(null);
                    }}
                    className="px-4 py-2 rounded-xl border font-medium"
                    style={{ borderColor: COLORS.neutral[200], color: COLORS.neutral[700] }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                    Update password
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Danger Zone */}
          <section className="rounded-2xl p-6 border-2" style={{ borderColor: COLORS.accent.red, backgroundColor: "#FEF2F2" }}>
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faTrash} style={{ color: COLORS.accent.red }} />
              <h2 className="text-lg font-semibold" style={{ color: COLORS.accent.red }}>Danger Zone</h2>
            </div>

            <p className="text-sm mb-4" style={{ color: COLORS.neutral[600] }}>
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl border-2 font-medium"
                style={{ borderColor: COLORS.accent.red, color: COLORS.accent.red }}
              >
                Delete my account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium" style={{ color: COLORS.accent.red }}>
                  Type "DELETE" to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none"
                  style={{ borderColor: COLORS.accent.red }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="px-4 py-2 rounded-xl border font-medium"
                    style={{ borderColor: COLORS.neutral[200], color: COLORS.neutral[700] }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteConfirmText !== "DELETE"}
                    className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-50"
                    style={{ backgroundColor: COLORS.accent.red }}
                  >
                    Permanently delete account
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={isParent ? saveParentProfile : saveChildProfile}
              disabled={saving}
              className="px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-colors"
              style={{ backgroundColor: COLORS.primary[600] }}
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Notification toggle component
function NotificationToggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl ${disabled ? "opacity-50" : ""}`}
      style={{ backgroundColor: "#F9FAFC" }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "#1F2330" }}>{label}</p>
        <p className="text-xs" style={{ color: "#6C7280" }}>{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative w-10 h-5 rounded-full transition-colors ${disabled ? "cursor-not-allowed" : ""}`}
        style={{ backgroundColor: enabled ? "#1EC592" : "#E1E4EE" }}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}