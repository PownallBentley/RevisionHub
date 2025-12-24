// src/pages/child/SessionRun.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import RecallStep from "./sessionSteps/RecallStep";
import ReinforceStep from "./sessionSteps/ReinforceStep";
import PracticeStep from "./sessionSteps/PracticeStep";
import ReflectionStep from "./sessionSteps/ReflectionStep";
import CompleteStep from "./sessionSteps/CompleteStep";

type StartPlannedSessionRow = {
  out_planned_session_id: string;
  out_status: string;
  out_started_at: string | null;
  out_revision_session_id: string | null;
};

type RevisionSessionRow = {
  id: string;
  planned_session_id: string;
  status: string;
  current_step: string | null;
  current_step_index: number | null;
  current_item_index: number | null;
  started_at: string | null;
  completed_at: string | null;
};

type RevisionSessionStepRow = {
  step_key: string;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_items: number | null;
  current_item_index: number | null;
  payload: any | null;
};

type PlannedSessionPayloadRow = {
  id: string;
  generated_payload: any | null;
};

const STEP_ORDER = ["recall", "reinforce", "practice", "reflection"] as const;

function normaliseStepKey(step: any) {
  const s = String(step ?? "").toLowerCase().trim();
  if (s === "complete") return "complete";
  if ((STEP_ORDER as readonly string[]).includes(s)) return s;
  return "recall";
}

function idxOf(step: string | null | undefined) {
  const s = normaliseStepKey(step);
  const i = STEP_ORDER.indexOf(s as any);
  return i >= 0 ? i : 0;
}

function nextStepKey(step: string | null | undefined) {
  const s = normaliseStepKey(step);
  if (s === "reflection") return "complete";
  const i = idxOf(s);
  return STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)];
}

function prevStepKey(step: string | null | undefined) {
  const s = normaliseStepKey(step);
  if (s === "complete") return "reflection";
  const i = idxOf(s);
  return STEP_ORDER[Math.max(i - 1, 0)];
}

function computeProgress(stepKey: string) {
  const s = normaliseStepKey(stepKey);
  if (s === "complete") return 100;
  const i = idxOf(s);
  const total = STEP_ORDER.length;
  const pct = Math.round(((i + 1) / total) * 100);
  return Math.max(5, Math.min(95, pct));
}

function isValidMacroPayload(gp: any) {
  if (!gp || typeof gp !== "object") return false;
  if (!gp.plannedSessionId) return false;
  if (!gp.recall || typeof gp.recall !== "object") return false;
  if (!gp.reinforce || typeof gp.reinforce !== "object") return false;
  if (!gp.practice || typeof gp.practice !== "object") return false;
  return true;
}

export default function SessionRun() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plannedSessionId } = useParams<{ plannedSessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [revisionSessionId, setRevisionSessionId] = useState<string | null>(
    (location.state as any)?.revisionSessionId ?? null
  );

  const forceStepFromNav = useMemo(() => {
    const fs = (location.state as any)?.forceStep;
    return fs ? normaliseStepKey(fs) : null;
  }, [location.state]);

  const [revisionSession, setRevisionSession] = useState<RevisionSessionRow | null>(null);
  const [stepRows, setStepRows] = useState<RevisionSessionStepRow[]>([]);
  const [plannedPayload, setPlannedPayload] = useState<any | null>(null);
  const [overview, setOverview] = useState<any | null>(null);

  const psid = useMemo(() => (plannedSessionId ?? "").trim(), [plannedSessionId]);

  const currentStepKey = useMemo(() => {
    return normaliseStepKey(revisionSession?.current_step ?? "recall");
  }, [revisionSession?.current_step]);

  const currentStepRow = useMemo(() => {
    return stepRows.find((s) => s.step_key === currentStepKey) ?? null;
  }, [stepRows, currentStepKey]);

  const runtimePayload = currentStepRow?.payload ?? {};

  useEffect(() => {
    let cancelled = false;

    async function ensureAndLoad() {
      setError(null);

      if (!psid) {
        setLoading(false);
        setError("Missing planned session ID.");
        return;
      }

      setLoading(true);

      try {
        // 0) Load overview (subject/topic labels)
        const { data: ovData, error: ovErr } = await supabase.rpc("rpc_get_planned_session_overview", {
          p_planned_session_id: psid,
        });
        if (ovErr) throw ovErr;
        const ovRow = Array.isArray(ovData) ? ovData[0] : null;

        // 1) Ensure revision session exists (start/reuse)
        let rsid = (revisionSessionId ?? "").trim();

        if (!rsid) {
          const { data, error: startErr } = await supabase.rpc("rpc_start_planned_session", {
            p_planned_session_id: psid,
          });
          if (startErr) throw startErr;

          const rows = (data ?? []) as StartPlannedSessionRow[];
          const first = rows[0] ?? null;

          rsid = (first?.out_revision_session_id ?? "").trim();
          if (!rsid) {
            console.error("[SessionRun] start RPC returned:", data);
            throw new Error("Start failed: no revision session id returned.");
          }

          if (!cancelled) setRevisionSessionId(rsid);
        }

        // 2) Load revision_sessions
        const { data: rsData, error: rsErr } = await supabase
          .from("revision_sessions")
          .select(
            "id, planned_session_id, status, current_step, current_step_index, current_item_index, started_at, completed_at"
          )
          .eq("id", rsid)
          .maybeSingle();

        if (rsErr) throw rsErr;
        if (!rsData) throw new Error("Revision session not found.");

        // 3) Load revision_session_steps (include payload)
        const { data: stepsData, error: stepsErr } = await supabase
          .from("revision_session_steps")
          .select("step_key, status, started_at, completed_at, total_items, current_item_index, payload")
          .eq("revision_session_id", rsid);

        if (stepsErr) throw stepsErr;

        // 4) Load planned_sessions.generated_payload (macro payload)
        const { data: psData, error: psErr } = await supabase
          .from("planned_sessions")
          .select("id, generated_payload")
          .eq("id", psid)
          .maybeSingle<PlannedSessionPayloadRow>();

        if (psErr) throw psErr;

        let gp = psData?.generated_payload ?? null;

        // If payload missing/invalid, regenerate
        if (!isValidMacroPayload(gp)) {
          const { data: regen, error: regenErr } = await supabase.rpc("rpc_generate_planned_session_payload", {
            p_planned_session_id: psid,
          });
          if (regenErr) throw regenErr;
          gp = regen ?? null;
        }

        if (cancelled) return;

        setOverview(ovRow ?? null);
        setRevisionSession(rsData as any);
        setStepRows((stepsData ?? []) as any);
        setPlannedPayload(gp);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error("[SessionRun] failed:", e);
        setError(e?.message ?? "Failed to load session.");
        setLoading(false);
      }
    }

    void ensureAndLoad();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psid]);

  const handleExit = () => navigate("/child/today");

  async function patchCurrentStep(patch: Record<string, any>) {
    if (!revisionSessionId) return;
    if (!currentStepRow) return;

    setSaving(true);
    try {
      const merged = { ...(currentStepRow.payload ?? {}), ...patch };

      const { error: updErr } = await supabase
        .from("revision_session_steps")
        .update({ payload: merged })
        .eq("revision_session_id", revisionSessionId)
        .eq("step_key", currentStepRow.step_key);

      if (updErr) throw updErr;

      setStepRows((prev) =>
        prev.map((s) => (s.step_key === currentStepRow.step_key ? { ...s, payload: merged } : s))
      );
    } finally {
      setSaving(false);
    }
  }

  async function moveTo(stepKey: string) {
    if (!revisionSessionId) return;

    const key = normaliseStepKey(stepKey);

    setSaving(true);
    try {
      const { error: rsErr } = await supabase
        .from("revision_sessions")
        .update({ current_step: key })
        .eq("id", revisionSessionId);

      if (rsErr) throw rsErr;

      // Mark target step in_progress (unless completed)
      const target = stepRows.find((s) => s.step_key === key);
      if (target && target.status !== "completed") {
        const { error: stErr } = await supabase
          .from("revision_session_steps")
          .update({
            status: "in_progress",
            started_at: target.started_at ?? new Date().toISOString(),
          })
          .eq("revision_session_id", revisionSessionId)
          .eq("step_key", key);

        if (stErr) throw stErr;
      }

      setRevisionSession((prev) => (prev ? { ...prev, current_step: key } : prev));
      setStepRows((prev) =>
        prev.map((s) =>
          s.step_key === key && s.status !== "completed"
            ? { ...s, status: "in_progress", started_at: s.started_at ?? new Date().toISOString() }
            : s
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function completeStepAndNext() {
    if (!revisionSessionId) return;

    const current = normaliseStepKey(currentStepKey);
    const next = nextStepKey(current);

    setSaving(true);
    try {
      if (current !== "complete") {
        const { error: stErr } = await supabase
          .from("revision_session_steps")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("revision_session_id", revisionSessionId)
          .eq("step_key", current);

        if (stErr) throw stErr;

        setStepRows((prev) =>
          prev.map((s) =>
            s.step_key === current
              ? { ...s, status: "completed", completed_at: new Date().toISOString() }
              : s
          )
        );
      }

      await moveTo(next);
    } finally {
      setSaving(false);
    }
  }

  async function finishSession(params: { confidenceLevel: string; notes?: string }) {
    if (!revisionSessionId) return;

    setSaving(true);
    try {
      // Mark reflection step completed
      const { error: stErr } = await supabase
        .from("revision_session_steps")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("revision_session_id", revisionSessionId)
        .eq("step_key", "reflection");

      if (stErr) throw stErr;

      // Mark revision session completed
      const { error: rsErr } = await supabase
        .from("revision_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString(), current_step: "complete" })
        .eq("id", revisionSessionId);

      if (rsErr) throw rsErr;

      setRevisionSession((prev) =>
        prev ? { ...prev, status: "completed", completed_at: new Date().toISOString(), current_step: "complete" } : prev
      );

      // Persist reflection info into current step payload
      await patchCurrentStep({
        reflection: {
          confidence_level: params.confidenceLevel,
          notes: params.notes ?? "",
          completed_at: new Date().toISOString(),
        },
      });
    } finally {
      setSaving(false);
    }
  }

  // Force step from navigation (only when requested)
  useEffect(() => {
    if (!forceStepFromNav) return;
    if (!revisionSessionId) return;
    if (loading) return;

    if (currentStepKey !== forceStepFromNav) {
      void moveTo(forceStepFromNav);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceStepFromNav, revisionSessionId, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-bg px-6 py-8">
        <div className="max-w-5xl mx-auto rounded-2xl border bg-white p-6 text-gray-600">
          Loading session…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-bg px-6 py-8">
        <div className="max-w-5xl mx-auto rounded-2xl border border-red-100 bg-white p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-3 text-red-700">{error}</p>

          <button
            type="button"
            onClick={handleExit}
            className="mt-6 px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold"
          >
            Back to Today
          </button>
        </div>
      </div>
    );
  }

  const gp = plannedPayload ?? {};

  // Macro payload, plus any runtime patches for the current step
  const effectivePayloadForStep = {
    ...gp,
    ...(runtimePayload ?? {}),
    // safety fallbacks so RecallStep always has something to render
    recall: {
      promptText:
        gp?.recall?.promptText ??
        `What do you remember about ${overview?.topic_name ?? "this topic"}?`,
      allowFreeText: gp?.recall?.allowFreeText ?? true,
      revealAnswerText: gp?.recall?.revealAnswerText ?? "",
      ...(runtimePayload?.recall ?? {}),
    },
    reinforce: {
      cards: Array.isArray(gp?.reinforce?.cards) ? gp.reinforce.cards : [],
      worked_example: gp?.reinforce?.worked_example ?? null,
      ...(runtimePayload?.reinforce ?? {}),
    },
    practice: {
      question: gp?.practice?.question ?? null,
      ...(runtimePayload?.practice ?? {}),
    },
    reflection: {
      ...(gp?.reflection ?? {}),
      ...(runtimePayload?.reflection ?? {}),
    },
  };

  const onBack = async () => {
    const prev = prevStepKey(currentStepKey);
    await moveTo(prev);
  };

  const onNext = async () => {
    await completeStepAndNext();
  };

  const headerMeta = {
    subject_name: overview?.subject_name ?? "Revision",
    topic_name: overview?.topic_name ?? "Topic",
    session_duration_minutes: overview?.session_duration_minutes ?? null,
    step_key: currentStepKey,
    step_percent: computeProgress(currentStepKey),
  };

  return (
    <div className="min-h-screen bg-neutral-bg px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {currentStepKey === "recall" && (
          <RecallStep
            overview={headerMeta}
            payload={effectivePayloadForStep}
            saving={saving}
            onPatch={patchCurrentStep}
            onNext={onNext}
            onBack={onBack}
            onExit={handleExit}
          />
        )}

        {currentStepKey === "reinforce" && (
          <ReinforceStep
            overview={headerMeta}
            payload={effectivePayloadForStep}
            saving={saving}
            onPatch={patchCurrentStep}
            onNext={onNext}
            onBack={onBack}
            onExit={handleExit}
          />
        )}

        {currentStepKey === "practice" && (
          <PracticeStep
            overview={headerMeta}
            payload={effectivePayloadForStep}
            saving={saving}
            onPatch={patchCurrentStep}
            onNext={onNext}
            onBack={onBack}
            onExit={handleExit}
          />
        )}

        {currentStepKey === "reflection" && (
          <ReflectionStep
            overview={headerMeta}
            payload={effectivePayloadForStep}
            saving={saving}
            onPatch={patchCurrentStep}
            onNext={onNext}
            onBack={onBack}
            onExit={handleExit}
            onFinish={finishSession}
          />
        )}

        {currentStepKey === "complete" && (
          <CompleteStep
            overview={headerMeta}
            payload={effectivePayloadForStep}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
}
