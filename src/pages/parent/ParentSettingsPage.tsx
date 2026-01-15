// src/pages/parent/ParentSettingsPage.tsx
// FEAT-008: Settings page - Analytics, Notifications, Security, Danger Zone
// Refactored from Account.tsx - 15 January 2026

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faBell,
  faLock,
  faTrash,
  faSpinner,
  faCheck,
  faExclamationTriangle,
  faTimes,
  faChartArea,
  faShieldHalved,
  faSchool,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { PageLayout } from "../../components/layout";
import { supabase } from "../../lib/supabase";

interface Child {
  id: string;
  first_name: string;
  preferred_name: string | null;
  school_name: string | null;
  school_town: string | null;
  school_postcode_prefix: string | null;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface NotificationSettings {
  weekly_summary: boolean;
  session_reminders: boolean;
  achievement_alerts: boolean;
  insights_available: boolean;
}

export default function ParentSettingsPage() {
  const navigate = useNavigate();
  const { user, isParent, loading: authLoading } = useAuth();

  // Analytics state
  const [shareAnalytics, setShareAnalytics] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [analyticsMessage, setAnalyticsMessage] = useState<string | null>(null);
  const [childSaveStatus, setChildSaveStatus] = useState<Record<string, SaveStatus>>({});

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    weekly_summary: true,
    session_reminders: true,
    achievement_alerts: true,
    insights_available: true,
  });
  const [editingNotifications, setEditingNotifications] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsBackup, setNotificationsBackup] = useState<NotificationSettings | null>(null);

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // General state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not parent
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/", { replace: true });
    } else if (!isParent) {
      navigate("/child/today", { replace: true });
    }
  }, [authLoading, user, isParent, navigate]);

  // Load data on mount
  useEffect(() => {
    if (!user || !isParent) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Get profile settings
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("share_anonymised_data, notification_settings")
          .eq("id", user!.id)
          .single();

        if (profileError) throw profileError;

        setShareAnalytics(profileData?.share_anonymised_data ?? false);
        setNotifications(profileData?.notification_settings ?? {
          weekly_summary: true,
          session_reminders: true,
          achievement_alerts: true,
          insights_available: true,
        });

        // Get children with school info
        const { data: childrenData, error: childrenError } = await supabase
          .from("children")
          .select("id, first_name, preferred_name, school_name, school_town, school_postcode_prefix")
          .eq("parent_id", user!.id)
          .order("first_name");

        if (childrenError) throw childrenError;

        setChildren(childrenData || []);
      } catch (err: any) {
        console.error("Load error:", err);
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, isParent]);

  // ============================================
  // ANALYTICS HANDLERS
  // ============================================

  const handleAnalyticsToggle = async (enabled: boolean) => {
    setSavingAnalytics(true);
    setAnalyticsMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({ 
        share_anonymised_data: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user!.id);

    if (error) {
      setAnalyticsMessage("Failed to save setting");
      console.error("Analytics toggle error:", error);
    } else {
      setShareAnalytics(enabled);
      setAnalyticsMessage(enabled ? "Advanced Analytics enabled" : "Advanced Analytics disabled");
    }

    setSavingAnalytics(false);
    setTimeout(() => setAnalyticsMessage(null), 3000);
  };

  const handleChildFieldUpdate = (
    childId: string,
    field: "school_name" | "school_town" | "school_postcode_prefix",
    value: string
  ) => {
    setChildren(prev =>
      prev.map(child =>
        child.id === childId ? { ...child, [field]: value || null } : child
      )
    );
  };

  const handleChildBlur = async (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) return;

    // Set saving status
    setChildSaveStatus(prev => ({ ...prev, [childId]: 'saving' }));

    const { error } = await supabase
      .from("children")
      .update({
        school_name: child.school_name,
        school_town: child.school_town,
        school_postcode_prefix: child.school_postcode_prefix,
        updated_at: new Date().toISOString(),
      })
      .eq("id", childId);

    if (error) {
      console.error("Failed to save child school info:", error);
      setChildSaveStatus(prev => ({ ...prev, [childId]: 'error' }));
      setTimeout(() => setChildSaveStatus(prev => ({ ...prev, [childId]: 'idle' })), 3000);
    } else {
      setChildSaveStatus(prev => ({ ...prev, [childId]: 'saved' }));
      setTimeout(() => setChildSaveStatus(prev => ({ ...prev, [childId]: 'idle' })), 2000);
    }
  };

  // ============================================
  // NOTIFICATIONS HANDLERS
  // ============================================

  const startNotificationsEdit = () => {
    setNotificationsBackup({ ...notifications });
    setEditingNotifications(true);
  };

  const cancelNotificationsEdit = () => {
    if (notificationsBackup) {
      setNotifications(notificationsBackup);
    }
    setEditingNotifications(false);
    setNotificationsBackup(null);
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          notification_settings: notifications,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);

      if (updateError) throw updateError;

      setEditingNotifications(false);
      setNotificationsBackup(null);
    } catch (err: any) {
      setError(err.message || "Failed to save notifications");
    } finally {
      setSavingNotifications(false);
    }
  };

  // ============================================
  // PASSWORD HANDLERS
  // ============================================

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

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getChildName = (child: Child) => child.preferred_name || child.first_name;

  // Loading state
  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Loading settings...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user || !isParent) return null;

  return (
    <PageLayout>
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FontAwesomeIcon icon={faCog} className="text-primary-600 text-xl" />
            <h1 className="text-2xl font-bold text-primary-600">Settings</h1>
          </div>
          <p className="text-neutral-500">
            Manage your preferences, notifications, and security
          </p>
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

        <div className="space-y-6">
          {/* ============================================ */}
          {/* ADVANCED ANALYTICS SECTION */}
          {/* ============================================ */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faChartArea} className="text-indigo-500" />
                <h2 className="text-lg font-semibold text-neutral-700">Advanced Analytics</h2>
              </div>
            </div>

            {/* Toggle Section */}
            <div className="px-6 py-5 border-b border-neutral-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-neutral-400 text-sm" />
                    <span className="font-medium text-neutral-900">Share anonymised data</span>
                  </div>
                  <p className="text-sm text-neutral-500">
                    When enabled, your child's progress data (without identifying information) 
                    contributes to cohort averages. This unlocks trend charts, heat maps, and 
                    comparison with similar students on the Insights page.
                  </p>
                  <p className="text-xs text-neutral-400 mt-2">
                    We never share: names, email, exact school, or location.
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleAnalyticsToggle(!shareAnalytics)}
                  disabled={savingAnalytics}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    shareAnalytics ? "bg-indigo-600" : "bg-neutral-200"
                  } ${savingAnalytics ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      shareAnalytics ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Save message */}
              {analyticsMessage && (
                <p className={`text-sm mt-3 ${analyticsMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
                  {analyticsMessage}
                </p>
              )}
            </div>

            {/* School Info Section (only shown when analytics enabled) */}
            {shareAnalytics && children.length > 0 && (
              <div className="px-6 py-5">
                <p className="text-sm text-neutral-600 mb-4">
                  Add school details to enable regional comparisons (optional):
                </p>

                <div className="space-y-4">
                  {children.map(child => (
                    <div key={child.id} className="p-4 bg-neutral-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-neutral-900">{getChildName(child)}</h3>
                        
                        {/* Save status indicator */}
                        {childSaveStatus[child.id] === 'saving' && (
                          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Saving...
                          </span>
                        )}
                        {childSaveStatus[child.id] === 'saved' && (
                          <span className="flex items-center gap-1.5 text-xs text-green-600">
                            <FontAwesomeIcon icon={faCheck} />
                            Saved
                          </span>
                        )}
                        {childSaveStatus[child.id] === 'error' && (
                          <span className="flex items-center gap-1.5 text-xs text-red-600">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            Failed to save
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* School Name */}
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">
                            <FontAwesomeIcon icon={faSchool} className="mr-1" />
                            School name
                          </label>
                          <input
                            type="text"
                            value={child.school_name || ""}
                            onChange={(e) => handleChildFieldUpdate(child.id, "school_name", e.target.value)}
                            onBlur={() => handleChildBlur(child.id)}
                            placeholder="e.g., St Mary's Academy"
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* School Town */}
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">
                            <FontAwesomeIcon icon={faLocationDot} className="mr-1" />
                            Town/City
                          </label>
                          <input
                            type="text"
                            value={child.school_town || ""}
                            onChange={(e) => handleChildFieldUpdate(child.id, "school_town", e.target.value)}
                            onBlur={() => handleChildBlur(child.id)}
                            placeholder="e.g., Manchester"
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* Postcode Prefix */}
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">
                            Postcode area
                          </label>
                          <input
                            type="text"
                            value={child.school_postcode_prefix || ""}
                            onChange={(e) => handleChildFieldUpdate(child.id, "school_postcode_prefix", e.target.value.toUpperCase())}
                            onBlur={() => handleChildBlur(child.id)}
                            placeholder="e.g., M1, SW1"
                            maxLength={4}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* Autosave hint */}
                      <p className="text-xs text-neutral-400 mt-3">
                        Changes are saved automatically
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* NOTIFICATIONS SECTION */}
          {/* ============================================ */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faBell} className="text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-700">Notifications</h2>
              </div>
              
              {!editingNotifications ? (
                <button
                  onClick={startNotificationsEdit}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-neutral-50 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelNotificationsEdit}
                    disabled={savingNotifications}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-200 text-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNotifications}
                    disabled={savingNotifications}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-accent-green"
                  >
                    {savingNotifications ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faCheck} />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <NotificationToggle
                label="Weekly summary email"
                description="Get a summary of your children's progress each Monday"
                enabled={notifications.weekly_summary}
                onChange={(enabled) => setNotifications({ ...notifications, weekly_summary: enabled })}
                disabled={!editingNotifications}
              />
              <NotificationToggle
                label="Session reminders"
                description="Reminders when sessions are due"
                enabled={notifications.session_reminders}
                onChange={(enabled) => setNotifications({ ...notifications, session_reminders: enabled })}
                disabled={!editingNotifications}
              />
              <NotificationToggle
                label="Achievement alerts"
                description="Celebrate when your children earn achievements"
                enabled={notifications.achievement_alerts}
                onChange={(enabled) => setNotifications({ ...notifications, achievement_alerts: enabled })}
                disabled={!editingNotifications}
              />
              <NotificationToggle
                label="Insights available"
                description="Get notified when new insights are ready"
                enabled={notifications.insights_available}
                onChange={(enabled) => setNotifications({ ...notifications, insights_available: enabled })}
                disabled={!editingNotifications || !shareAnalytics}
                dimmed={!shareAnalytics}
              />
            </div>
          </div>

          {/* ============================================ */}
          {/* SECURITY SECTION */}
          {/* ============================================ */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faLock} className="text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-700">Security</h2>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2 bg-green-100">
                <FontAwesomeIcon icon={faCheck} className="text-accent-green" />
                <p className="text-sm text-green-800">Password changed successfully</p>
              </div>
            )}

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                Change password
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-neutral-700">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-neutral-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-neutral-700">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-600 bg-neutral-50"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-accent-red">{passwordError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={savingPassword}
                    className="px-4 py-2 rounded-xl bg-primary-600 text-white font-medium flex items-center gap-2 hover:bg-primary-700 transition-colors"
                  >
                    {savingPassword && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                    Update password
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* DANGER ZONE */}
          {/* ============================================ */}
          <div className="rounded-2xl p-6 border-2 border-accent-red bg-red-50">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-accent-red" />
              <h2 className="text-lg font-semibold text-accent-red">Danger Zone</h2>
            </div>

            <p className="text-sm text-neutral-600 mb-4">
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl border-2 border-accent-red text-accent-red font-medium hover:bg-red-100 transition-colors"
              >
                Delete my account
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-accent-red">
                  Type "DELETE" to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-accent-red focus:outline-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteConfirmText !== "DELETE"}
                    className="px-4 py-2 rounded-xl bg-accent-red text-white font-medium disabled:opacity-50"
                  >
                    Permanently delete account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </PageLayout>
  );
}

// Notification toggle component
function NotificationToggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
  dimmed = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl bg-neutral-50 transition-colors ${dimmed ? "opacity-50" : ""}`}
    >
      <div>
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${disabled && !dimmed ? "cursor-not-allowed" : ""} ${
          enabled ? "bg-accent-green" : "bg-neutral-200"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}