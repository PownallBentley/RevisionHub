// src/pages/parent/ParentOnboardingPage.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import StepShell from "../../components/parentOnboarding/StepShell";
import ChildDetailsStep, { ChildDetails } from "../../components/parentOnboarding/steps/ChildDetailsStep";
import GoalStep from "../../components/parentOnboarding/steps/GoalStep";
import ExamTypeStep from "../../components/parentOnboarding/steps/ExamTypeStep";
import SubjectBoardStep, { type SelectedSubject } from "../../components/parentOnboarding/steps/SubjectBoardStep";
import NeedsStep, { NeedClusterSelection } from "../../components/parentOnboarding/steps/NeedsStep";
import AvailabilityStep, { Availability } from "../../components/parentOnboarding/steps/AvailabilityStep";
import ConfirmStep from "../../components/parentOnboarding/steps/ConfirmStep";

import { rpcParentCreateChildAndPlan } from "../../services/parentOnboarding/parentOnboardingService";
import { rpcCreateChildInvite, type ChildInviteCreateResult } from "../../services/invitationService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const defaultAvailability: Availability = {
  monday: { sessions: 1, session_pattern: "p45" },
  tuesday: { sessions: 1, session_pattern: "p45" },
  wednesday: { sessions: 0, session_pattern: "p45" },
  thursday: { sessions: 1, session_pattern: "p45" },
  friday: { sessions: 0, session_pattern: "p45" },
  saturday: { sessions: 1, session_pattern: "p70" },
  sunday: { sessions: 0, session_pattern: "p45" },
};

function normaliseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)];
}

function normaliseNeedClusters(value: unknown): Array<{ cluster_code: string }> {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value
    .map((row: any) => {
      const code = row?.cluster_code ?? row?.code;
      if (!code) return null;
      return { cluster_code: String(code) };
    })
    .filter(Boolean) as Array<{ cluster_code: string }>;
}

function formatSupabaseError(e: any): string {
  if (!e) return "Failed to build plan";
  const msg = e.message ?? "Failed to build plan";
  const details = e.details ? `\n\nDetails: ${e.details}` : "";
  const hint = e.hint ? `\n\nHint: ${e.hint}` : "";
  return `${msg}${details}${hint}`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ParentOnboardingPage() {
  const navigate = useNavigate();
  const { refresh, user } = useAuth();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invite, setInvite] = useState<ChildInviteCreateResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [child, setChild] = useState<ChildDetails>({
    first_name: "",
    last_name: "",
    preferred_name: "",
    country: "England",
    year_group: 11,
  });

  const [goalCode, setGoalCode] = useState<string | undefined>(undefined);
  const [examTypeIds, setExamTypeIds] = useState<string[]>([]);

  // ✅ structured selections for chips + per-exam grouping
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);

  const [needClusters, setNeedClusters] = useState<NeedClusterSelection>([]);
  const [availability, setAvailability] = useState<Availability>(defaultAvailability);

  const payload = useMemo(() => {
    const subject_ids = (selectedSubjects ?? [])
      .map((s) => s.subject_id)
      .filter(Boolean)
      .map(String);

    const need_clusters = normaliseNeedClusters(needClusters);

    return {
      child,
      goal_code: goalCode ?? null,
      exam_timeline: "6_weeks",
      subject_ids,
      need_clusters,
      settings: {
        availability,
        urgency: { mode: "exam_date", exam_date: "" },
      },
    };
  }, [child, goalCode, selectedSubjects, needClusters, availability]);

  const canNext = useMemo(() => {
    if (step === 0) return !!child.first_name?.trim();
    if (step === 1) return !!goalCode;
    if (step === 2) return normaliseStringArray(examTypeIds).length > 0;

    // Step 3 owns nav
    if (step === 4) return true;
    if (step === 5) return Object.values(availability).some((d) => (d?.sessions ?? 0) > 0);

    return true;
  }, [step, child.first_name, goalCode, examTypeIds, availability]);

  function validatePayload(): string | null {
    if (!payload.child?.first_name?.trim()) return "Please enter your child’s first name.";
    if (!payload.goal_code) return "Please choose a goal.";
    if (!Array.isArray(payload.subject_ids) || payload.subject_ids.length === 0) {
      return "Please select at least one subject (including exam board/spec).";
    }
    if (!payload.settings?.availability) return "Availability is missing.";
    if (!Object.values(payload.settings.availability).some((d: any) => (d?.sessions ?? 0) > 0)) {
      return "Please add at least one study session to your availability.";
    }
    return null;
  }

  async function resolveLatestChildIdForThisParent(): Promise<string> {
    if (!user?.id) throw new Error("No user session");

    const { data, error } = await supabase
      .from("children")
      .select("id, created_at")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    const row = data?.[0];
    if (!row?.id) throw new Error("Could not find child record to invite");
    return row.id as string;
  }

  async function submit() {
    const validation = validatePayload();
    if (validation) {
      setError(validation);
      return;
    }

    setBusy(true);
    setError(null);
    setInvite(null);
    setCopied(null);

    try {
      const result: any = await rpcParentCreateChildAndPlan(payload);

      await refresh();

      const childId =
        result?.child_id ||
        result?.childId ||
        result?.child?.id ||
        (await resolveLatestChildIdForThisParent());

      const inviteResult = await rpcCreateChildInvite(childId);
      if (!inviteResult.ok || !inviteResult.invite) {
        setError(inviteResult.error ?? "Plan created, but failed to generate invite");
        setBusy(false);
        return;
      }

      setInvite(inviteResult.invite);
      setStep(7);
    } catch (e: any) {
      setError(formatSupabaseError(e));
    } finally {
      setBusy(false);
    }
  }

  const inviteUrl = useMemo(() => {
    if (!invite?.invitation_link) return "";
    return `${window.location.origin}${invite.invitation_link}`;
  }, [invite]);

  return (
    <StepShell
      title="Set up your child’s revision plan"
      subtitle="A few steps. You can change things later."
      error={error}
    >
      {step === 0 && <ChildDetailsStep value={child} onChange={setChild} />}

      {step === 1 && <GoalStep value={goalCode} onChange={setGoalCode} />}

      {step === 2 && (
        <ExamTypeStep
          value={examTypeIds}
          onChange={(ids) => {
            setExamTypeIds(normaliseStringArray(ids));
            setSelectedSubjects([]); // reset subjects if exams change
          }}
        />
      )}

      {step === 3 && (
        <SubjectBoardStep
          examTypeIds={normaliseStringArray(examTypeIds)}
          value={selectedSubjects}
          onChange={setSelectedSubjects}
          onBackToExamTypes={() => setStep(2)}
          onDone={() => setStep(4)}
        />
      )}

      {step === 4 && <NeedsStep value={needClusters} onChange={setNeedClusters} />}

      {step === 5 && <AvailabilityStep value={availability} onChange={setAvailability} />}

      {step === 6 && <ConfirmStep payload={payload} busy={busy} onSubmit={submit} />}

      {step === 7 && invite && (
        <div className="mt-2">
          <h3 className="text-lg font-semibold">Invite your child</h3>
          <p className="mt-1 text-sm text-gray-600">
            Send this link to your child. They’ll set a password and land straight in Today.
          </p>

          <div className="mt-4 rounded-xl border bg-white p-4">
            <div className="text-xs text-gray-500">Invite link</div>
            <div className="mt-1 break-all font-medium">{inviteUrl}</div>

            <div className="mt-4 text-xs text-gray-500">Invite code</div>
            <div className="mt-1 font-mono text-base">{invite.invitation_code}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                onClick={async () => {
                  const ok = await copyToClipboard(inviteUrl);
                  setCopied(ok ? "link" : null);
                  if (!ok) setError("Could not copy link. Please copy it manually.");
                }}
              >
                Copy link
              </button>

              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm"
                onClick={async () => {
                  const ok = await copyToClipboard(invite.invitation_code);
                  setCopied(ok ? "code" : null);
                  if (!ok) setError("Could not copy code. Please copy it manually.");
                }}
              >
                Copy code
              </button>

              <button
                type="button"
                className="rounded-lg border px-4 py-2 text-sm"
                onClick={() => navigate("/parent", { replace: true })}
              >
                Go to dashboard
              </button>
            </div>

            {copied && (
              <div className="mt-3 text-xs text-gray-600">
                {copied === "link" ? "Link copied." : "Code copied."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Default nav (Subject step owns its own Continue button) */}
      {step !== 3 && step < 7 ? (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>

          {step < 6 ? (
            <button
              type="button"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
              disabled={!canNext || busy}
              onClick={() => setStep((s) => Math.min(6, s + 1))}
            >
              Next
            </button>
          ) : null}
        </div>
      ) : null}
    </StepShell>
  );
}
