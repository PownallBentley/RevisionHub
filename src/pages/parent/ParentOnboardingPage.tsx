// src/pages/parent/ParentOnboardingPage.tsx

import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import StepShell from "../../components/parentOnboarding/StepShell";
import ChildDetailsStep, {
  ChildDetails,
} from "../../components/parentOnboarding/steps/ChildDetailsStep";
import GoalStep from "../../components/parentOnboarding/steps/GoalStep";
import NeedsStep, {
  type NeedClusterSelection,
} from "../../components/parentOnboarding/steps/NeedsStep";
import ExamTypeStep from "../../components/parentOnboarding/steps/ExamTypeStep";
import SubjectBoardStep, {
  type SelectedSubject,
} from "../../components/parentOnboarding/steps/SubjectBoardStep";
import SubjectPriorityGradesStep, {
  type SubjectWithGrades,
} from "../../components/parentOnboarding/steps/SubjectPriorityGradesStep";
import RevisionPeriodStep, {
  type RevisionPeriodData,
} from "../../components/parentOnboarding/steps/RevisionPeriodStep";
import AvailabilityBuilderStep, {
  type DateOverride,
} from "../../components/parentOnboarding/steps/AvailabilityBuilderStep";
import ConfirmStep from "../../components/parentOnboarding/steps/ConfirmStep";

import { rpcParentCreateChildAndPlan } from "../../services/parentOnboarding/parentOnboardingService";
import {
  rpcCreateChildInvite,
  type ChildInviteCreateResult,
} from "../../services/invitationService";
import {
  calculateRecommendedSessions,
  type RecommendationResult,
  type DayTemplate,
} from "../../services/parentOnboarding/recommendationService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

/* ============================
   Constants & Helpers
============================ */

function createEmptyTemplate(): DayTemplate[] {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames.map((name, index) => ({
    day_of_week: index,
    day_name: name,
    is_enabled: index < 5, // Weekdays enabled by default
    slots: [],
    session_count: 0,
  }));
}

function createDefaultRevisionPeriod(): RevisionPeriodData {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysUntilMonday);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 56); // 8 weeks

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    contingency_percent: 10,
    feeling_code: null,
    history_code: null,
  };
}

function normaliseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)];
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

/* ============================
   Step Configuration
   
   NEW ORDER:
   1. Child Details
   2. Goal
   3. Needs (moved earlier - informs recommendations)
   4. Exam Type
   5. Subjects
   6. Priority & Grades (NEW)
   7. Revision Period (NEW - replaces ExamTimeline)
   8. Availability (NEW - replaces old AvailabilityStep)
   9. Confirm
   10. Invite
============================ */

const STEPS = {
  CHILD_DETAILS: 0,
  GOAL: 1,
  NEEDS: 2,           // Moved earlier
  EXAM_TYPE: 3,
  SUBJECTS: 4,
  PRIORITY_GRADES: 5, // NEW
  REVISION_PERIOD: 6, // NEW (replaces EXAM_TIMELINE)
  AVAILABILITY: 7,    // NEW (replaces old availability)
  CONFIRM: 8,
  INVITE: 9,
} as const;

/* ============================
   Main Component
============================ */

export default function ParentOnboardingPage() {
  const navigate = useNavigate();
  const { refresh, user, parentChildCount } = useAuth();
  
  // Track if we've completed onboarding (to prevent redirect loops)
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  
  // Track if we're waiting to navigate to dashboard
  const [pendingDashboardNav, setPendingDashboardNav] = useState(false);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invite, setInvite] = useState<ChildInviteCreateResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Step 1: Child Details
  const [child, setChild] = useState<ChildDetails>({
    first_name: "",
    last_name: "",
    preferred_name: "",
    country: "England",
    year_group: 11,
  });

  // Step 2: Goal
  const [goalCode, setGoalCode] = useState<string | undefined>(undefined);

  // Step 3: Needs (moved earlier)
  const [needClusters, setNeedClusters] = useState<NeedClusterSelection[]>([]);

  // Step 4: Exam Types
  const [examTypeIds, setExamTypeIds] = useState<string[]>([]);

  // Step 5: Subjects (basic selection)
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);

  // Step 6: Priority & Grades (NEW)
  const [subjectsWithGrades, setSubjectsWithGrades] = useState<SubjectWithGrades[]>([]);

  // Step 7: Revision Period (NEW)
  const [revisionPeriod, setRevisionPeriod] = useState<RevisionPeriodData>(
    createDefaultRevisionPeriod()
  );

  // Step 8: Availability (NEW)
  const [weeklyTemplate, setWeeklyTemplate] = useState<DayTemplate[]>(createEmptyTemplate());
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);

  // Recommendation state (calculated when entering availability step)
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  /* ============================
     Navigate to dashboard when auth state confirms child was created
  ============================ */
  useEffect(() => {
    // Only navigate if we're pending navigation AND parentChildCount > 0
    if (pendingDashboardNav && parentChildCount !== null && parentChildCount > 0) {
      setPendingDashboardNav(false);
      navigate("/parent", { replace: true });
    }
  }, [pendingDashboardNav, parentChildCount, navigate]);

  /* ============================
     Convert subjects to grades format when moving to priority step
  ============================ */
  useEffect(() => {
    if (step === STEPS.PRIORITY_GRADES && selectedSubjects.length > 0 && subjectsWithGrades.length === 0) {
      const converted: SubjectWithGrades[] = selectedSubjects.map((s, index) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        exam_board_name: s.exam_board_name,
        sort_order: index + 1,
        current_grade: null,
        target_grade: null,
        grade_confidence: 'confirmed' as const,
      }));
      setSubjectsWithGrades(converted);
    }
  }, [step, selectedSubjects, subjectsWithGrades.length]);

  /* ============================
     Calculate recommendations when entering availability step
  ============================ */
  const calculateRecommendations = useCallback(async () => {
    if (subjectsWithGrades.length === 0 || !goalCode) return;

    setIsLoadingRecommendation(true);
    try {
      const subjectData = subjectsWithGrades.map(s => ({
        subject_id: s.subject_id,
        sort_order: s.sort_order,
        current_grade: s.current_grade,
        target_grade: s.target_grade,
        grade_confidence: s.grade_confidence,
      }));

      const needClusterCodes = needClusters.map(nc => nc.cluster_code);

      const result = await calculateRecommendedSessions(
        subjectData,
        goalCode,
        needClusterCodes,
        revisionPeriod.contingency_percent
      );

      setRecommendation(result);
    } catch (err) {
      console.error('Error calculating recommendations:', err);
      // Don't block progress - recommendations are helpful but not required
    } finally {
      setIsLoadingRecommendation(false);
    }
  }, [subjectsWithGrades, goalCode, needClusters, revisionPeriod.contingency_percent]);

  useEffect(() => {
    if (step === STEPS.AVAILABILITY && subjectsWithGrades.length > 0 && goalCode && !recommendation) {
      calculateRecommendations();
    }
  }, [step, subjectsWithGrades, goalCode, recommendation, calculateRecommendations]);

  /* ============================
     Build payload for RPC (NEW FORMAT)
  ============================ */
  const payload = useMemo(() => {
    // Build weekly_availability in new format
    const weekly_availability: Record<string, { enabled: boolean; slots: Array<{ time_of_day: string; session_pattern: string }> }> = {};
    
    for (const day of weeklyTemplate) {
      weekly_availability[day.day_of_week.toString()] = {
        enabled: day.is_enabled,
        slots: day.slots.map(s => ({
          time_of_day: s.time_of_day,
          session_pattern: s.session_pattern,
        })),
      };
    }

    // Build subjects in new format (with grades)
    const subjects = subjectsWithGrades.map(s => ({
      subject_id: s.subject_id,
      sort_order: s.sort_order,
      current_grade: s.current_grade,
      target_grade: s.target_grade,
      grade_confidence: s.grade_confidence,
    }));

    // Build need_clusters
    const need_clusters = needClusters.map((nc) => ({
      cluster_code: nc.cluster_code,
    }));

    return {
      child,
      goal_code: goalCode ?? null,
      subjects,
      need_clusters,
      revision_period: {
        start_date: revisionPeriod.start_date,
        end_date: revisionPeriod.end_date,
        contingency_percent: revisionPeriod.contingency_percent,
        feeling_code: revisionPeriod.feeling_code,
        history_code: revisionPeriod.history_code,
      },
      weekly_availability,
      date_overrides: dateOverrides.length > 0 ? dateOverrides : undefined,
    };
  }, [child, goalCode, subjectsWithGrades, needClusters, revisionPeriod, weeklyTemplate, dateOverrides]);

  /* ============================
     Validation
  ============================ */
  const canNext = useMemo(() => {
    switch (step) {
      case STEPS.CHILD_DETAILS:
        return !!child.first_name?.trim();
      case STEPS.GOAL:
        return !!goalCode;
      case STEPS.NEEDS:
        return true; // Optional step
      case STEPS.EXAM_TYPE:
        return normaliseStringArray(examTypeIds).length > 0;
      case STEPS.SUBJECTS:
        return true; // SubjectBoardStep owns its nav
      case STEPS.PRIORITY_GRADES:
        return subjectsWithGrades.length > 0 && subjectsWithGrades.every(s => s.target_grade !== null);
      case STEPS.REVISION_PERIOD:
        return !!revisionPeriod.start_date && !!revisionPeriod.end_date;
      case STEPS.AVAILABILITY:
        return weeklyTemplate.some(d => d.is_enabled && d.slots.length > 0);
      default:
        return true;
    }
  }, [step, child.first_name, goalCode, examTypeIds, subjectsWithGrades, revisionPeriod, weeklyTemplate]);

  function validatePayload(): string | null {
    if (!payload.child?.first_name?.trim()) {
      return "Please enter your child's first name.";
    }
    if (!payload.goal_code) {
      return "Please choose a goal.";
    }
    if (!Array.isArray(payload.subjects) || payload.subjects.length === 0) {
      return "Please select at least one subject.";
    }
    if (!payload.subjects.every(s => s.target_grade !== null)) {
      return "Please set a target grade for each subject.";
    }
    if (!payload.revision_period?.start_date || !payload.revision_period?.end_date) {
      return "Please set a revision period.";
    }
    
    // Check availability has at least one session
    const hasSession = Object.values(payload.weekly_availability).some(
      day => day.enabled && day.slots.length > 0
    );
    if (!hasSession) {
      return "Please add at least one study session to your schedule.";
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
      setOnboardingComplete(true);
      setStep(STEPS.INVITE);
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

  const childDisplayName =
    child.preferred_name?.trim() || child.first_name?.trim() || "your child";

  // Steps that manage their own navigation
  const selfNavigatingSteps = [STEPS.SUBJECTS];
  const showDefaultNav = !selfNavigatingSteps.includes(step) && step < STEPS.INVITE;

  /* ============================
     Step-specific navigation handlers
  ============================ */
  
  const handlePriorityGradesNext = useCallback(() => {
    setError(null);
    setStep(STEPS.REVISION_PERIOD);
  }, []);

  const handlePriorityGradesBack = useCallback(() => {
    setStep(STEPS.SUBJECTS);
  }, []);

  const handleRevisionPeriodNext = useCallback(() => {
    setError(null);
    // Trigger recommendation calculation
    calculateRecommendations();
    setStep(STEPS.AVAILABILITY);
  }, [calculateRecommendations]);

  const handleRevisionPeriodBack = useCallback(() => {
    setStep(STEPS.PRIORITY_GRADES);
  }, []);

  const handleAvailabilityNext = useCallback(() => {
    setError(null);
    setStep(STEPS.CONFIRM);
  }, []);

  const handleAvailabilityBack = useCallback(() => {
    setStep(STEPS.REVISION_PERIOD);
  }, []);

  /* ============================
     Render
  ============================ */

  return (
    <StepShell
      title="Set up your child's revision plan"
      subtitle="A few steps. You can change things later."
      error={error}
    >
      {/* Step 0: Child Details */}
      {step === STEPS.CHILD_DETAILS && (
        <ChildDetailsStep value={child} onChange={setChild} />
      )}

      {/* Step 1: Goal */}
      {step === STEPS.GOAL && (
        <GoalStep value={goalCode} onChange={setGoalCode} />
      )}

      {/* Step 2: Needs (moved earlier) */}
      {step === STEPS.NEEDS && (
        <NeedsStep
          childName={childDisplayName}
          value={needClusters}
          onChange={setNeedClusters}
        />
      )}

      {/* Step 3: Exam Type */}
      {step === STEPS.EXAM_TYPE && (
        <ExamTypeStep
          value={examTypeIds}
          onChange={(ids) => {
            setExamTypeIds(normaliseStringArray(ids));
            setSelectedSubjects([]); // reset subjects if exams change
            setSubjectsWithGrades([]); // reset grades too
          }}
        />
      )}

      {/* Step 4: Subject & Board Selection (self-navigating) */}
      {step === STEPS.SUBJECTS && (
        <SubjectBoardStep
          examTypeIds={normaliseStringArray(examTypeIds)}
          value={selectedSubjects}
          onChange={setSelectedSubjects}
          onBackToExamTypes={() => setStep(STEPS.EXAM_TYPE)}
          onDone={() => {
            // Reset grades when subjects change
            setSubjectsWithGrades([]);
            setStep(STEPS.PRIORITY_GRADES);
          }}
        />
      )}

      {/* Step 5: Priority & Grades (NEW) */}
      {step === STEPS.PRIORITY_GRADES && (
        <SubjectPriorityGradesStep
          subjects={subjectsWithGrades}
          onSubjectsChange={setSubjectsWithGrades}
          onNext={handlePriorityGradesNext}
          onBack={handlePriorityGradesBack}
        />
      )}

      {/* Step 6: Revision Period (NEW - replaces ExamTimeline) */}
      {step === STEPS.REVISION_PERIOD && (
        <RevisionPeriodStep
          revisionPeriod={revisionPeriod}
          onRevisionPeriodChange={setRevisionPeriod}
          onNext={handleRevisionPeriodNext}
          onBack={handleRevisionPeriodBack}
        />
      )}

      {/* Step 7: Availability (NEW) */}
      {step === STEPS.AVAILABILITY && (
        <AvailabilityBuilderStep
          weeklyTemplate={weeklyTemplate}
          dateOverrides={dateOverrides}
          recommendation={recommendation}
          revisionPeriod={revisionPeriod}
          onTemplateChange={setWeeklyTemplate}
          onOverridesChange={setDateOverrides}
          onNext={handleAvailabilityNext}
          onBack={handleAvailabilityBack}
        />
      )}

      {/* Step 8: Confirm */}
      {step === STEPS.CONFIRM && (
        <ConfirmStep payload={payload} busy={busy} onSubmit={submit} />
      )}

      {/* Step 9: Invite */}
      {step === STEPS.INVITE && invite && (
        <div className="mt-2">
          <h3 className="text-lg font-semibold">Invite {childDisplayName}</h3>
          <p className="mt-1 text-sm text-gray-600">
            Send this link to your child. They'll set a password and land straight in
            Today.
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
                onClick={async () => {
                  // Set pending navigation flag
                  setPendingDashboardNav(true);
                  // Refresh auth state to update parentChildCount
                  await refresh();
                  // If parentChildCount is already > 0, useEffect will navigate
                  // Otherwise, we wait for the state to update
                }}
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

      {/* Default navigation for steps that don't manage their own */}
      {showDefaultNav && step !== STEPS.PRIORITY_GRADES && step !== STEPS.REVISION_PERIOD && step !== STEPS.AVAILABILITY && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>

          {step < STEPS.CONFIRM ? (
            <button
              type="button"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
              disabled={!canNext || busy}
              onClick={() => setStep((s) => Math.min(STEPS.CONFIRM, s + 1))}
            >
              {step === STEPS.NEEDS && needClusters.length === 0 ? "Skip" : "Next"}
            </button>
          ) : null}
        </div>
      )}
    </StepShell>
  );
}