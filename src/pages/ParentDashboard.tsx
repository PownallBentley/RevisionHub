// src/pages/ParentDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { rpcCreateChildInvite } from "../services/invitationService";

type ChildRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  year_group: number | null;
  country: string | null;
  auth_user_id: string | null;
};

type InviteRow = {
  id: string;
  child_id: string;
  invitation_code: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, profile, isChild, isParent, parentChildCount, loading: authLoading } = useAuth();

  const [children, setChildren] = useState<ChildRow[]>([]);
  const [invites, setInvites] = useState<Record<string, InviteRow | null>>({});
  const [loading, setLoading] = useState(true);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    // Not logged in
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    
    // This is a child - redirect to child area
    if (isChild) {
      navigate("/child/today", { replace: true });
      return;
    }
    
    // Not a parent (no profile, not a child) - go to home gate
    if (!isParent) {
      navigate("/", { replace: true });
      return;
    }
  }, [authLoading, user, isChild, isParent, navigate]);

  useEffect(() => {
    if (!user || !profile) return;

    if (parentChildCount === 0) {
      navigate("/parent/onboarding", { replace: true });
    }
  }, [user, profile, parentChildCount, navigate]);

  useEffect(() => {
    let mounted = true;

    async function loadChildren() {
      if (!user || !profile) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("children")
        .select(
          "id, first_name, last_name, preferred_name, year_group, country, auth_user_id"
        )
        .eq("parent_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.warn("[parent] loadChildren error:", error);
        setChildren([]);
      } else {
        const childRows = (data ?? []) as ChildRow[];
        setChildren(childRows);

        // Load invites for children who aren't linked yet
        const unlinkedChildren = childRows.filter((c) => !c.auth_user_id);
        if (unlinkedChildren.length > 0) {
          await loadInvites(unlinkedChildren.map((c) => c.id));
        }
      }

      setLoading(false);
    }

    async function loadInvites(childIds: string[]) {
      const { data, error } = await supabase
        .from("child_invitations")
        .select("id, child_id, invitation_code, status, expires_at, created_at")
        .in("child_id", childIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[parent] loadInvites error:", error);
        return;
      }

      // Group by child_id, taking the most recent invite
      const inviteMap: Record<string, InviteRow | null> = {};
      for (const invite of (data ?? []) as InviteRow[]) {
        if (!inviteMap[invite.child_id]) {
          inviteMap[invite.child_id] = invite;
        }
      }

      setInvites(inviteMap);
    }

    loadChildren();

    return () => {
      mounted = false;
    };
  }, [user, profile]);

  async function handleResendInvite(childId: string) {
    setResendingInvite(childId);

    try {
      const result = await rpcCreateChildInvite(childId);
      if (result.ok && result.invite) {
        setInvites((prev) => ({
          ...prev,
          [childId]: {
            id: result.invite!.id,
            child_id: childId,
            invitation_code: result.invite!.invitation_code,
            status: "pending",
            expires_at: result.invite!.expires_at,
            created_at: new Date().toISOString(),
          },
        }));
      }
    } catch (e) {
      console.error("Failed to resend invite:", e);
    } finally {
      setResendingInvite(null);
    }
  }

  function copyInviteLink(code: string) {
    const url = `${window.location.origin}/child/signup?code=${code}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  function getInviteStatus(
    child: ChildRow,
    invite: InviteRow | null | undefined
  ): { label: string; color: string; showActions: boolean } {
    if (child.auth_user_id) {
      return { label: "Linked", color: "text-green-600 bg-green-50", showActions: false };
    }

    if (!invite) {
      return { label: "No invite sent", color: "text-gray-500 bg-gray-50", showActions: true };
    }

    const isExpired = new Date(invite.expires_at) < new Date();

    if (invite.status === "accepted") {
      return { label: "Accepted", color: "text-green-600 bg-green-50", showActions: false };
    }

    if (isExpired) {
      return { label: "Expired", color: "text-orange-600 bg-orange-50", showActions: true };
    }

    return { label: "Pending", color: "text-blue-600 bg-blue-50", showActions: true };
  }

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-neutral-bg flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-neutral-bg">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Parent dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {profile.full_name ? `Hi ${profile.full_name.split(" ")[0]}` : "Hi there"}{" "}
            • {user.email}
          </p>
        </div>

        {/* Children section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your children</h2>
            <button
              onClick={() => navigate("/parent/onboarding")}
              className="px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:opacity-95"
            >
              Add child
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : children.length === 0 ? (
            <div>
              <p className="text-gray-700">
                No children linked to this account yet.
              </p>
              <button
                onClick={() => navigate("/parent/onboarding")}
                className="mt-4 px-4 py-2 rounded-lg bg-brand-purple text-white hover:opacity-95"
              >
                Set up a child
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {children.map((c) => {
                const invite = invites[c.id];
                const status = getInviteStatus(c, invite);
                const displayName =
                  c.preferred_name || c.first_name || "Child";

                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-gray-900 font-medium">
                            {displayName}
                            {c.last_name ? ` ${c.last_name}` : ""}
                          </p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {c.year_group ? `Year ${c.year_group}` : "Year group not set"}
                          {c.country ? ` • ${c.country}` : ""}
                        </p>

                        {/* Invite actions */}
                        {status.showActions && (
                          <div className="mt-3 flex items-center gap-2">
                            {invite && (
                              <button
                                onClick={() => copyInviteLink(invite.invitation_code)}
                                className="text-sm text-brand-purple hover:underline"
                              >
                                Copy invite link
                              </button>
                            )}
                            <button
                              onClick={() => handleResendInvite(c.id)}
                              disabled={resendingInvite === c.id}
                              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            >
                              {resendingInvite === c.id
                                ? "Sending…"
                                : invite
                                ? "Resend invite"
                                : "Send invite"}
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/parent/child/${c.id}`)}
                        className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:opacity-95"
                      >
                        View plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/revision-plan")}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:bg-gray-50"
          >
            <p className="font-semibold text-gray-900">Revision plan</p>
            <p className="text-sm text-gray-600 mt-1">
              Review and adjust the plan.
            </p>
          </button>

          <button
            onClick={() => navigate("/subjects")}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:bg-gray-50"
          >
            <p className="font-semibold text-gray-900">Subjects</p>
            <p className="text-sm text-gray-600 mt-1">Manage subject choices.</p>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:bg-gray-50"
          >
            <p className="font-semibold text-gray-900">Settings</p>
            <p className="text-sm text-gray-600 mt-1">Account and preferences.</p>
          </button>
        </div>
      </div>
    </div>
  );
}