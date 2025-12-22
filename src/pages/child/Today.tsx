// src/pages/child/Today.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type TodaySessionRow = {
  planned_session_id: string;
  child_id: string;

  session_date: string; // YYYY-MM-DD
  session_index: number;
  status: string;

  subject_id: string | null;
  subject_name: string | null;

  topic_ids: string[] | null;
  primary_topic_id: string | null;
  topic_name: string | null;

  component_name: string | null;
  theme_name: string | null;
};

function todayIsoDateLondonSafe() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Today() {
  const navigate = useNavigate();
  const { user, profile, activeChildId, loading: authLoading, refresh } = useAuth();

  const [rows, setRows] = useState<TodaySessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refreshAttemptedRef = useRef(false);

  const childId = useMemo(() => {
    if (activeChildId) return activeChildId;
    const ls = localStorage.getItem("active_child_id");
    return ls || null;
  }, [activeChildId]);

  useEffect(() => {
    if (authLoading) return;

    // If a parent lands here, send them to the parent area you actually route to.
    if (user && profile) {
      navigate("/parent", { replace: true });
      return;
    }

    // Logged out => login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Child session exists but childId not yet hydrated:
    // do ONE non-blocking refresh attempt, then stop.
    if (user && !profile && !activeChildId && !refreshAttemptedRef.current) {
      refreshAttemptedRef.current = true;
      refresh().catch(() => {});
    }
  }, [authLoading, user, profile, activeChildId, refresh, navigate]);

  useEffect(() => {
    let mounted = true;

    async function loadToday() {
      if (!user) return;

      setLoading(true);
      setError("");

      if (!childId) {
        setRows([]);
        setError("No child profile is linked to this account yet.");
        setLoading(false);
        return;
      }

      const p_date = todayIsoDateLondonSafe();

      const { data, error } = await supabase.rpc("rpc_get_todays_planned_sessions", {
        p_child_id: childId,
        p_date,
      });

      if (!mounted) return;

      if (error) {
        setRows([]);
        setError(error.message ?? "Failed to load today's sessions.");
        setLoading(false);
        return;
      }

      setRows((data ?? []) as TodaySessionRow[]);
      setLoading(false);
    }

    loadToday();

    return () => {
      mounted = false;
    };
  }, [user, childId]);

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Today</h1>
          <p className="text-sm text-gray-600 mt-1">Your planned revision sessions for today.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600">Loading…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <p className="text-red-700 font-medium">Couldn’t load sessions</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-900 font-medium">No sessions scheduled today</p>
            <p className="text-sm text-gray-600 mt-1">
              That can happen if today isn’t in the child’s schedule, or the plan starts from a later date.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.planned_session_id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-gray-900 font-medium">
                    Session {r.session_index + 1}
                    {r.subject_name ? ` • ${r.subject_name}` : ""}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {r.topic_name ? r.topic_name : "Topic not set"}
                    {r.theme_name ? ` • ${r.theme_name}` : ""}
                    {r.component_name ? ` • ${r.component_name}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Status: {r.status}</p>
                </div>

                <button
                  onClick={() => navigate(`/child/session/${r.planned_session_id}`)}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:opacity-95"
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
