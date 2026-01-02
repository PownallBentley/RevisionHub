// src/pages/child/SessionRun.tsx
// UPDATED: Integrated gamification support (v3.3)

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import RecallStep from "./sessionSteps/RecallStep";
import ReinforceStep from "./sessionSteps/ReinforceStep";
import PracticeStep from "./sessionSteps/PracticeStep";
import ReflectionStep from "./sessionSteps/ReflectionStep";
import CompleteStep from "./sessionSteps/CompleteStep";
import SessionHeader from "../../components/session/SessionHeader";
import ProgressTracker from "../../components/session/ProgressTracker";
import SessionCompleteWithGamification from "../../components/gamification/SessionCompleteWithGamification";
import { markAchievementsNotified } from "../../services/gamificationService";
import type { SessionGamificationResult, AdvanceTopicResult } from "../../types/gamification";

type StartPlannedSessionRow = {
  out_planned_session_id: string;
  out_status: string;
  out_started_at: string | null;
  out_revision_session_id: string | null;
};

type RevisionSessionRow = {
  id: string;
  child_id: string;
  planned_session_id: string;
  status: string;
  current_step: string | null;
  current_step_index: number | null;
  current_item_index: number | null;
  current_topic_index: number;
  total_topics: number;
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

type TopicInfo = {
  topic_id: string;
  topic_name: string;
};

const STEP_ORDER = ["recall", "reinforce", "practice", "reflection"] as const;

function normaliseStepKey(step: any) {
  const s = String(step ?? "").toLowerCase().trim();
  if (s === "complete") return "complete";
  if (s === "topic_complete") return "topic_complete";
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
  if (s === "reflection") return "topic_complete"; // Changed: go to topic_complete, not complete
  if (s === "topic_complete") return "recall"; // After break, start next topic
  const i = idxOf(s);
  return STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)];
}

function prevStepKey(step: string | null | undefined) {
  const s = normaliseStepKey(step);
  if (s === "complete" || s === "topic_complete") return "reflection";
  const i = idxOf(s);
  return STEP_ORDER[Math.max(i - 1, 0)];
}

function computeProgress(stepKey: string, topicIndex: number, totalTopics: number) {
  const s = normaliseStepKey(stepKey);
  if (s === "complete") return 100;
  
  const stepsPerTopic = STEP_ORDER.length;
  const stepIdx = s === "topic_complete" ? stepsPerTopic : idxOf(s);
  
  const totalSteps = stepsPerTopic * totalTopics;
  const completedSteps = (topicIndex * stepsPerTopic) + stepIdx;
  
  return Math.max(5, Math.min(95, Math.round((completedSteps / totalSteps) * 100)));
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
  const [topicsList, setTopicsList] = useState<TopicInfo[]>([]);
  
  // Topic transition state
  const [showTopicComplete, setShowTopicComplete] = useState(false);
  const [nextTopicName, setNextTopicName] = useState<string | null>(null);

  // GAMIFICATION STATE (NEW in v3.3)
  const [gamificationResult, setGamificationResult] = useState<SessionGamificationResult | null>(null);
  const [showSessionComplete, setShowSessionComplete] = useState(false);

  const psid = useMemo(() => (plannedSessionId ?? "").trim(), [plannedSessionId]);

  const currentStepKey = useMemo(() => {
    if (showSessionComplete) return "complete";
    if (showTopicComplete) return "topic_complete";
    return normaliseStepKey(revisionSession?.current_step ?? "recall");
  }, [revisionSession?.current_step, showTopicComplete, showSessionComplete]);

  const currentTopicIndex = revisionSession?.current_topic_index ?? 0;
  const totalTopics = revisionSession?.total_topics ?? 1;
  const childId = revisionSession?.child_id;

  const currentStepRow = useMemo(() => {
    return stepRows.find((s) => s.step_key === currentStepKey) ?? null;
  }, [stepRows, currentStepKey]);

  const runtimePayload = currentStepRow?.payload ?? {};

  // Load session data
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
        const { data: ovData, error: ovErr } = await supabase.rpc(
          "rpc_get_planned_session_overview",
          { p_planned_session_id: psid }
        );
        if (ovErr) throw ovErr;
        const ovRow = Array.isArray(ovData) ? ovData[0] : ovData;

        // Load all topics for this session
        const { data: psData } = await supabase
          .from("planned_sessions")
          .select("topic_ids")
          .eq("id", psid)
          .maybeSingle();
        
        const topicIds = psData?.topic_ids || [];
        const topicsInfo: TopicInfo[] = [];
        
        for (const tid of topicIds) {
          const { data: tData } = await supabase
            .from("topics")
            .select("id, topic_name")
            .eq("id", tid)
            .maybeSingle();
          if (tData) {
            topicsInfo.push({ topic_id: tData.id, topic_name: tData.topic_name });
          }
        }

        // 1) Ensure revision session exists (start/reuse)
        let rsid = (revisionSessionId ?? "").trim();
        if (!rsid) {
          const { data, error: startErr } = await supabase.rpc(
            "rpc_start_planned_session",
            { p_planned_session_id: psid }
          );
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

        // 2) Load revision_sessions (now includes topic tracking and child_id)
        const { data: rsData, error: rsErr } = await supabase
          .from("revision_sessions")
          .select(
            "id, child_id, planned_session_id, status, current_step, current_step_index, current_item_index, current_topic_index, total_topics, started_at, completed_at"
          )
          .eq("id", rsid)
          .maybeSingle();
        if (rsErr) throw rsErr;
        if (!rsData) throw new Error("Revision session not found.");

        // 3) Load revision_session_steps (include payload)
        const { data: stepsData, error: stepsErr } = await supabase
          .from("revision_session_steps")
          .select(
            "step_key, status, started_at, completed_at, total_items, current_item_index, payload"
          )
          .eq("revision_session_id", rsid);
        if (stepsErr) throw stepsErr;

        // 4) Load planned_sessions.generated_payload (macro payload)
        const { data: plData, error: plErr } = await supabase
          .from("planned_sessions")
          .select("id, generated_payload")
          .eq("id", psid)
          .maybeSingle<PlannedSessionPayloadRow>();
        if (plErr) throw plErr;

        let gp = plData?.generated_payload ?? null;

        // If payload missing/invalid, regenerate
        if (!isValidMacroPayload(gp)) {
          const { data: regen, error: regenErr } = await supabase.rpc(
            "rpc_generate_planned_session_payload",
            { p_planned_session_id: psid }
          );
          if (regenErr) throw regenErr;
          gp = regen ?? null;
        }

        if (cancelled) return;

        setOverview(ovRow ?? null);
        setTopicsList(topicsInfo);
        setRevisionSession(rsData as RevisionSessionRow);
        setStepRows((stepsData ?? []) as RevisionSessionStepRow[]);
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
  }, [psid, revisionSessionId]);

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
        prev.map((s) =>
          s.step_key === currentStepRow.step_key ? { ...s, payload: merged } : s
        )
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

      setRevisionSession((prev) =>
        prev ? { ...prev, current_step: key } : prev
      );
      setStepRows((prev) =>
        prev.map((s) =>
          s.step_key === key && s.status !== "completed"
            ? {
                ...s,
                status: "in_progress",
                started_at: s.started_at ?? new Date().toISOString(),
              }
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
      // Mark current step completed
      if (current !== "complete" && current !== "topic_complete") {
        const { error: stErr } = await supabase
          .from("revision_session_steps")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
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

      // If we just completed reflection, show topic complete screen
      if (current === "reflection") {
        setShowTopicComplete(true);
      } else {
        await moveTo(next);
      }
    } finally {
      setSaving(false);
    }
  }

  // Called when user clicks "Continue" on the topic complete screen
  // UPDATED: Now handles gamification result from RPC
  async function handleTopicComplete() {
    if (!revisionSessionId) return;

    setSaving(true);
    try {
      // Call RPC to advance to next topic or complete session
      const { data, error: advErr } = await supabase.rpc(
        "rpc_advance_to_next_topic",
        { p_revision_session_id: revisionSessionId }
      );
      if (advErr) throw advErr;

      const result = (Array.isArray(data) ? data[0] : data) as AdvanceTopicResult;
      
      if (result.out_is_session_complete) {
        // All topics done - session complete with gamification!
        setGamificationResult(result.out_gamification);
        setShowTopicComplete(false);
        setShowSessionComplete(true);
        
        // Update local state
        setRevisionSession((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                current_step: "complete",
                completed_at: new Date().toISOString(),
              }
            : prev
        );
      } else {
        // More topics to do
        setNextTopicName(result.out_topic_name);
        
        // Reload session data to get fresh state
        const { data: rsData } = await supabase
          .from("revision_sessions")
          .select("id, child_id, planned_session_id, status, current_step, current_step_index, current_item_index, current_topic_index, total_topics, started_at, completed_at")
          .eq("id", revisionSessionId)
          .maybeSingle();
        
        const { data: stepsData } = await supabase
          .from("revision_session_steps")
          .select("step_key, status, started_at, completed_at, total_items, current_item_index, payload")
          .eq("revision_session_id", revisionSessionId);

        // Regenerate payload for new topic
        const { data: newPayload } = await supabase.rpc(
          "rpc_generate_planned_session_payload",
          { p_planned_session_id: psid }
        );

        if (rsData) setRevisionSession(rsData as RevisionSessionRow);
        if (stepsData) setStepRows(stepsData as RevisionSessionStepRow[]);
        if (newPayload) setPlannedPayload(newPayload);
        
        setShowTopicComplete(false);
      }
    } catch (e: any) {
      console.error("[SessionRun] advance topic error:", e);
      setError(e?.message ?? "Failed to advance to next topic");
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
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("revision_session_id", revisionSessionId)
        .eq("step_key", "reflection");
      if (stErr) throw stErr;

      // Persist reflection info
      await patchCurrentStep({
        reflection: {
          confidence_level: params.confidenceLevel,
          notes: params.notes ?? "",
          completed_at: new Date().toISOString(),
        },
      });

      // Show topic complete (which will check if there are more topics)
      setShowTopicComplete(true);
    } finally {
      setSaving(false);
    }
  }

  // Handle marking achievements as notified (NEW in v3.3)
  async function handleMarkAchievementsNotified() {
    if (!childId) return;
    await markAchievementsNotified(childId);
  }

  // Force step from navigation (only when requested)
  useEffect(() => {
    if (!forceStepFromNav) return;
    if (!revisionSessionId) return;
    if (loading) return;
    if (currentStepKey !== forceStepFromNav) {
      void moveTo(forceStepFromNav);
    }
  }, [forceStepFromNav, revisionSessionId, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading session…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="max-w-5xl mx-auto rounded-2xl border border-red-100 bg-white p-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Something went wrong
          </h1>
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

  // SESSION COMPLETE WITH GAMIFICATION (NEW in v3.3)
  if (showSessionComplete) {
    const currentTopicName = topicsList[currentTopicIndex]?.topic_name ?? "Topic";
    
    return (
      <SessionCompleteWithGamification
        subjectName={overview?.subject_name ?? "Revision"}
        topicName={currentTopicName}
        topicCount={totalTopics}
        gamification={gamificationResult}
        onExit={handleExit}
        onMarkAchievementsNotified={handleMarkAchievementsNotified}
      />
    );
  }

  // Topic Complete Interstitial
  if (showTopicComplete) {
    const currentTopicName = topicsList[currentTopicIndex]?.topic_name ?? "Topic";
    const isLastTopic = currentTopicIndex >= totalTopics - 1;
    const nextTopic = !isLastTopic ? topicsList[currentTopicIndex + 1]?.topic_name : null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <SessionHeader
          subjectName={overview?.subject_name ?? "Revision"}
          subjectIcon="🧪"
          sessionInfo={`Topic ${currentTopicIndex + 1} of ${totalTopics}`}
          showBack={false}
          showExit={true}
          onExit={handleExit}
        />
        
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {isLastTopic ? "Session Complete! 🎉" : "Topic Complete!"}
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            You've finished <span className="font-semibold text-gray-900">{currentTopicName}</span>
          </p>
          
          {!isLastTopic && (
            <>
              <p className="text-gray-500 mb-8">
                Topic {currentTopicIndex + 1} of {totalTopics} complete
              </p>
              
              {/* Break suggestion for multi-topic sessions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
                <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Quick break?</span>
                </div>
                <p className="text-sm text-amber-600">
                  Take 5 minutes to stretch, grab a drink, or rest your eyes before continuing.
                </p>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
                <p className="text-sm text-gray-500 mb-1">Up next</p>
                <p className="text-lg font-semibold text-gray-900">{nextTopic}</p>
              </div>
            </>
          )}
          
          {isLastTopic ? (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Great work completing all {totalTopics} topics in this session!
              </p>
              <button
                onClick={handleTopicComplete}
                disabled={saving}
                className="w-full py-4 rounded-xl bg-green-600 text-white font-semibold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Finishing..." : "Finish Session"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleTopicComplete}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Loading next topic..." : "Continue to Next Topic"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const gp = plannedPayload ?? {};

  // Macro payload, plus any runtime patches for the current step
  const currentTopicId = topicsList[currentTopicIndex]?.topic_id;
  const currentTopicNameForDisplay = topicsList[currentTopicIndex]?.topic_name ?? overview?.topic_name ?? "this topic";

  const effectivePayloadForStep = {
    ...gp,
    ...(runtimePayload ?? {}),
    recall: {
      promptText:
        gp?.recall?.promptText ??
        `What do you remember about ${currentTopicNameForDisplay}?`,
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
    topic_name: currentTopicNameForDisplay,
    session_duration_minutes: overview?.session_duration_minutes ?? null,
    step_key: currentStepKey,
    step_percent: computeProgress(currentStepKey, currentTopicIndex, totalTopics),
  };

  const stepPhaseName =
    {
      recall: "Activating memory",
      reinforce: "Building understanding",
      practice: "Applying knowledge",
      reflection: "Reflecting on learning",
      complete: "Session complete",
    }[currentStepKey] || "Learning";

  const stepLabels: Record<string, string> = {
    recall: "Recall",
    reinforce:
      currentStepRow?.current_item_index !== null &&
      currentStepRow?.current_item_index !== undefined &&
      currentStepRow?.total_items
        ? `Card ${currentStepRow.current_item_index + 1} of ${currentStepRow.total_items}`
        : "Reinforcement",
    practice:
      currentStepRow?.current_item_index !== null &&
      currentStepRow?.current_item_index !== undefined &&
      currentStepRow?.total_items
        ? `Question ${currentStepRow.current_item_index + 1} of ${currentStepRow.total_items}`
        : "Practice question",
    reflection: "Final reflection",
  };

  const currentStepNum = idxOf(currentStepKey) + 1;
  const stepsPerTopic = STEP_ORDER.length;
  const totalStepsOverall = stepsPerTopic * totalTopics;
  const currentOverallStep = (currentTopicIndex * stepsPerTopic) + currentStepNum;

  const timeRemaining = headerMeta.session_duration_minutes
    ? `About ${headerMeta.session_duration_minutes} min left`
    : undefined;

  // Session info showing topic progress
  const sessionInfoText = totalTopics > 1 
    ? `Topic ${currentTopicIndex + 1} of ${totalTopics} • ${currentTopicNameForDisplay}`
    : currentTopicNameForDisplay;

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionHeader
        subjectName={headerMeta.subject_name}
        subjectIcon="🧪"
        sessionInfo={sessionInfoText}
        showBack={false}
        showExit={currentStepKey !== "complete"}
        onExit={handleExit}
      />

      {currentStepKey !== "complete" && (
        <ProgressTracker
          phaseName={stepPhaseName}
          currentStep={currentOverallStep}
          totalSteps={totalStepsOverall}
          timeRemaining={timeRemaining}
          stepLabel={stepLabels[currentStepKey]}
        />
      )}

      <div className="px-6 py-8">
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
    </div>
  );
}