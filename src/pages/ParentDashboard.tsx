// src/pages/ParentDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type ChildRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  year_group: number | null;
  country: string | null;
  auth_user_id: string | null;
};

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, profile, parentChildCount, signOut, loading: authLoading } = useAuth();

  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    if (!profile) {
      // If a child somehow hits this route, send them home-gate.
      navigate("/", { replace: true });
    }
  }, [authLoading, user, profile, navigate]);

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
        .select("id, first_name, last_name, year_group, country, auth_user_id")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.warn("[parent] loadChildren error:", error);
        setChildren([]);
      } else {
        setChildren((data ?? []) as ChildRow[]);
      }

      setLoading(false);
    }

    loadChildren();

    return () => {
      mounted = false;
    };
  }, [user, profile]);

  async function handleLogout() {
    await signOut();
    navigate("/", { replace: true }); // ✅ back to Landing
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Parent dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              {profile.full_name ? `Hi ${profile.full_name}` : "Hi there"} • {user.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/children")}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
            >
              Children
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900">Your children</h2>

          {loading ? (
            <p className="text-gray-600 mt-4">Loading…</p>
          ) : children.length === 0 ? (
            <div className="mt-4">
              <p className="text-gray-700">No children linked to this account yet.</p>
              <button
                onClick={() => navigate("/parent/onboarding")}
                className="mt-4 px-4 py-2 rounded-lg bg-brand-purple text-white hover:opacity-95"
              >
                Set up a child
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {children.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div>
                    <p className="text-gray-900 font-medium">
                      {(c.first_name ?? "Child") + (c.last_name ? ` ${c.last_name}` : "")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {c.year_group ? `Year ${c.year_group}` : "Year group not set"}
                      {c.country ? ` • ${c.country}` : ""}
                      {c.auth_user_id ? " • Linked" : " • Not linked"}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/revision-plan")}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:opacity-95"
                  >
                    View plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/revision-plan")}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:bg-gray-50"
          >
            <p className="font-semibold text-gray-900">Revision plan</p>
            <p className="text-sm text-gray-600 mt-1">Review and adjust the plan.</p>
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
