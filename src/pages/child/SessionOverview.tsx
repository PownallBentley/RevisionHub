// src/pages/child/SessionOverview.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function safeRpc<T>(fn: string, args?: Record<string, any>) {
  const first = await supabase.rpc(fn, args ?? {});
  if (!first.error) return first as { data: T; error: null };

  const second = await supabase.rpc(fn);
  if (!second.error) return second as { data: T; error: null };

  return first as any;
}

type PlannedSessionOverview = {
  planned_session_id: string;
  subject_name?: string | null;
  topic_title?: string | null;
  topic_name?: string | null;
};

export default function SessionOverview() {
  const navigate = useNavigate();
  const { plannedSessionId } = useParams<{ plannedSessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<PlannedSessionOverview | null>(null);
  const [revisionSessionId, setRevisionSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const id = String(plannedSessionId ?? "");
      if (!id || !isUuid(id)) {
        setError("That session link looks invalid. Please go back and start again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1) Pull overview (lightweight; keep it simple and robust)
        // If you already have a service function, you can swap this out.
        const { data: planned, error: plannedErr } = await supabase
          .from("planned_sessions")
          .select("id, subject_id, topic_ids")
          .eq("id", id)
          .maybeSingle();

        if (plannedErr) throw plannedErr;
        if (!planned) throw new Error("Session not found.");

        // Optional: enrich display labels (safe even if columns differ)
        // Topics table column is topic_name (not name)
        let subjectName: string | null = null;
        let topicTitle: string | null = null;

        const subjectRes = await supabase
          .from("subjects")
          .select("subject_name")
          .eq("id", planned.subject_id)
          .maybeSingle();

        if (!subjectRes.error) subjectName = subjectRes.data?.subject_name ?? null;

        const firstTopicId = Array.isArray(planned.topic_ids) ? planned.topic_ids[0] : null;
        if (firstTopicId && isUuid(String(firstTopicId))) {
          const topicRes = await supabase
            .from("topics")
            .select("topic_name")
            .eq("id", String(firstTopicId))
            .maybeSingle();

          if (!topicRes.error) topicTitle = (topicRes.data as any)?.topic_name ?? null;
        }

        if (cancelled) return;

        setOverview({
          planned_session_id: id,
          subject_name: subjectName,
          topic_title: topicTitle,
        });

        // 2) Start (or resume) the revision session for this planned session
        // Your RPC should be idempotent: start if none exists, else return existing.
        const start = await safeRpc<any>("rpc_start_planned_session", {
          p_planned_session_id: id,
        });

        if (start.error) throw start.error;

        // Support a few possible return shapes
        const rId =
          (start.data as any)?.revision_session_id ??
          (start.data as any)?.id ??
          (Array.isArray(start.data) ? (start.data[0] as any)?.id : null);

        const rIdStr = String(rId ?? "");
        if (!isUuid(rIdStr)) {
          throw new Error("Couldn’t start the session (no valid revision session id returned).");
        }

        if (cancelled) return;

        setRevisionSessionId(rIdStr);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error("[SessionOverview] load error:", e);
        setError(e?.message ?? "Failed to load session.");
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [plannedSessionId]);

  const title = useMemo(() => {
    if (!overview) return "Session";
    return overview.subject_name ?? "Session";
  }, [overview]);

  const subtitle = useMemo(() => {
    if (!overview) return "";
    return overview.topic_title ?? overview.topic_name ?? "";
  }, [overview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="text-gray-700">Preparing your session…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-semibold text-gray-900">Session</h1>
          <p className="mt-2 text-gray-600">{error}</p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate("/child/today")}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
            >
              Back to Today
            </button>
          </div>
        </div>
      </div>
    );
  }

  // We don’t put revisionSessionId into the URL, but we ensure it exists here.
  return (
    <div className="min-h-screen bg-neutral-bg px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-3 text-2xl text-gray-600">Topic: {subtitle}</p> : null}

        <div className="mt-10">
          <button
            type="button"
            disabled={!revisionSessionId}
            onClick={() => navigate(`/child/session/${plannedSessionId}/run`)}
            className="px-10 py-4 rounded-2xl bg-brand-purple text-white font-semibold text-xl hover:opacity-95 disabled:opacity-50"
          >
            Begin
          </button>
        </div>
      </div>
    </div>
  );
}
