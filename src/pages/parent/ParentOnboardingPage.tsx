// src/pages/parent/ParentOnboardingPage.tsx
// Multi-step onboarding flow for parents to set up their child's revision plan
// Steps: Child Details → Goal → Needs → Exam Type → Subjects → Pathways → Priority/Grades → Revision Period → Availability → Confirm → Invite

import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import OnboardingModal from "../../components/parentOnboarding/OnboardingModal";
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
import PathwaySelectionStep, {
  type PathwaySelectionData,
} from "../../components/parentOnboarding/steps/PathwaySelectionStep";
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
import InviteChildStep from "../../components/parentOnboarding/steps/InviteChildStep";

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
    is_enabled: index < 5,
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
  endDate.setDate(startDate.getDate() + 56);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    contingency_enabled: true,
    current_revision_score: 5,
    past_revision_score: 5,
    is_first_time: true,
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

/* ============================
   Step Configuration
============================ */

const STEPS = {
  CHILD_DETAILS: 0,
  GOAL: 1,
  NEEDS: 2,
  EXAM_TYPE: 3,
  SUBJECTS: 4,
  PATHWAYS: 5,
  PRIORITY_GRADES: 6,
  REVISION_PERIOD: 7,
  AVAILABILITY: 8,
  CONFIRM: 9,
  INVITE: 10,
} as const;

const STEP_TITLES: Record<number, string> = {
  [STEPS.CHILD_DETAILS]: "Add your child",
  [STEPS.GOAL]: "Set a goal",
  [STEPS.NEEDS]: "Learning support",
  [STEPS.EXAM_TYPE]: "Exam type",
  [STEPS.SUBJECTS]: "Choose subjects",
  [STEPS.PATHWAYS]: "Subject options",
  [STEPS.PRIORITY_GRADES]: "Grades & priority",
  [STEPS.REVISION_PERIOD]: "Revision period",
  [STEPS.AVAILABILITY]: "Weekly schedule",
  [STEPS.CONFIRM]: "Review & confirm",
  [STEPS.INVITE]: "Invite your child",
};

const PROGRESS_STEPS = 11;

/* ============================
   Main Component
============================ */

export default function ParentOnboardingPage() {
  const navigate = useNavigate();
  const { refresh, user, parentChildCount } = useAuth();
  
  const [, setOnboardingComplete] = useState(false);
  const [pendingDashboardNav, setPendingDashboardNav] = useState(false);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invite, setInvite] = useState<ChildInviteCreateResult | null>(null);

  const [child, setChild] = useState<ChildDetails>({
    first_name: "",
    last_name: "",
    preferred_name: "",
    country: "England",
    year_group: 11,
  });

  const [goalCode, setGoalCode] = useState<string | undefined>(undefined);
  const [needClusters, setNeedClusters] = useState<NeedClusterSelection[]>([]);
  const [examTypeIds, setExamTypeIds] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);
  const [pathwaySelections, setPathwaySelections] = useState<PathwaySelectionData[]>([]);
  const [subjectsWithGrades, setSubjectsWithGrades] = useState<SubjectWithGrades[]>([]);
  const [revisionPeriod, setRevisionPeriod] = useState<RevisionPeriodData>(
    createDefaultRevisionPeriod()
  );
  const [weeklyTemplate, setWeeklyTemplate] = useState<DayTemplate[]>(createEmptyTemplate());
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [, setIsLoadingRecommendation] = useState(false);

  /* ============================
     Effects
  ============================ */
  
  useEffect(() => {
    if (pendingDashboardNav && parentChildCount !== null && parentChildCount > 0) {
      setPendingDashboardNav(false);
      navigate("/parent", { replace: true });
    }
  }, [pendingDashboardNav, parentChildCount, navigate]);

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
     Payload
  ============================ */
  const payload = useMemo(() => {
    const weekly_availability: Record<string, {
      enabled: boolean;
      slots: Array<{
        time_of_day: 'early_morning' | 'morning' | 'afternoon' | 'evening';
        session_pattern: 'p20' | 'p45' | 'p70';
      }>
    }> = {};

    for (const day of weeklyTemplate) {
      weekly_availability[day.day_of_week.toString()] = {
        enabled: day.is_enabled,
        slots: day.slots.map(s => ({
          time_of_day: s.time_of_day as 'early_morning' | 'morning' | 'afternoon' | 'evening',
          session_pattern: s.session_pattern as 'p20' | 'p45' | 'p70',
        })),
      };
    }

    const subjects = subjectsWithGrades.map(s => ({
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      exam_board_name: s.exam_board_name,
      sort_order: s.sort_order,
      current_grade: s.current_grade,
      target_grade: s.target_grade,
      grade_confidence: s.grade_confidence,
    }));

    const need_clusters = needClusters.map((nc) => ({
      cluster_code: nc.cluster_code,
    }));

    const pathway_selections = pathwaySelections
      .filter(ps => ps.pathway_id !== 'skipped')
      .map(ps => ({
        subject_id: ps.subject_id,
        pathway_id: ps.pathway_id,
      }));

    return {
      child,
      goal_code: goalCode ?? null,
      subjects,
      need_clusters,
      pathway_selections,
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
  }, [child, goalCode, subjectsWithGrades, needClusters, pathwaySelections, revisionPeriod, weeklyTemplate, dateOverrides]);

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
        return true;
      case STEPS.EXAM_TYPE:
        return normaliseStringArray(examTypeIds).length > 0;
      case STEPS.SUBJECTS:
        return true;
      case STEPS.PATHWAYS:
        return true;
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
    
    const hasSession = Object.values(payload.weekly_availability).some(
      day => day.enabled && day.slots.length > 0
    );
    if (!hasSession) {
      return "Please add at least one study session to your schedule.";
    }
    
    return null;
  }

  /* ============================
     Submit
  ============================ */
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

    try {
      const result: any = await rpcParentCreateChildAndPlan(payload as any);

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

  const childDisplayName =
    child.preferred_name?.trim() || child.first_name?.trim() || "Your child";

  /* ============================
     Navigation Handlers
  ============================ */
  const handleDashboard = useCallback(async () => {
    setPendingDashboardNav(true);
    await refresh();
  }, [refresh]);

  const handleSkip = useCallback(() => {
    navigate("/parent", { replace: true });
  }, [navigate]);

  const selfNavigatingSteps = [STEPS.SUBJECTS, STEPS.PATHWAYS, STEPS.PRIORITY_GRADES, STEPS.REVISION_PERIOD, STEPS.AVAILABILITY];
  const showDefaultNav = !selfNavigatingSteps.includes(step as typeof STEPS.SUBJECTS) && step < STEPS.INVITE;

  const handlePathwaysNext = useCallback(() => {
    setError(null);
    setSubjectsWithGrades([]);
    setStep(STEPS.PRIORITY_GRADES);
  }, []);

  const handlePathwaysBack = useCallback(() => {
    setStep(STEPS.SUBJECTS);
  }, []);

  const handlePriorityGradesNext = useCallback(() => {
    setError(null);
    setStep(STEPS.REVISION_PERIOD);
  }, []);

  const handlePriorityGradesBack = useCallback(() => {
    setStep(STEPS.PATHWAYS);
  }, []);

  const handleRevisionPeriodNext = useCallback(() => {
    setError(null);
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

  const subjectIdsForPathways = useMemo(() => {
    return selectedSubjects.map(s => s.subject_id);
  }, [selectedSubjects]);

  /* ============================
     Render
  ============================ */
  const displayStep = Math.min(step + 1, PROGRESS_STEPS);
  const showProgress = step < STEPS.INVITE;
  const continueLabel = step === STEPS.NEEDS && needClusters.length === 0 ? "Skip" : "Continue";

  return (
    <OnboardingModal
      title={STEP_TITLES[step] ?? "Set up revision plan"}
      currentStep={displayStep}
      totalSteps={PROGRESS_STEPS}
      showProgress={showProgress}
      error={error}
      onClose={() => navigate("/")}
      backButton={
        showDefaultNav
          ? {
              disabled: step === 0 || busy,
              onClick: () => setStep((s) => Math.max(0, s - 1)),
            }
          : null
      }
      continueButton={
        showDefaultNav && step < STEPS.CONFIRM
          ? {
              label: continueLabel,
              disabled: !canNext || busy,
              loading: busy,
              onClick: () => setStep((s) => Math.min(STEPS.CONFIRM, s + 1)),
            }
          : null
      }
    >
      {/* Step 0: Child Details */}
      {step === STEPS.CHILD_DETAILS && (
        <ChildDetailsStep value={child} onChange={setChild} />
      )}

      {/* Step 1: Goal */}
      {step === STEPS.GOAL && (
        <GoalStep value={goalCode} onChange={setGoalCode} />
      )}

      {/* Step 2: Needs */}
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
            setSelectedSubjects([]);
            setPathwaySelections([]);
            setSubjectsWithGrades([]);
          }}
        />
      )}

      {/* Step 4: Subject & Board Selection */}
      {step === STEPS.SUBJECTS && (
        <SubjectBoardStep
          examTypeIds={normaliseStringArray(examTypeIds)}
          value={selectedSubjects}
          onChange={(newSubjects) => {
            setSelectedSubjects(newSubjects);
            setPathwaySelections([]);
          }}
          onBackToExamTypes={() => setStep(STEPS.EXAM_TYPE)}
          onDone={() => {
            setSubjectsWithGrades([]);
            setStep(STEPS.PATHWAYS);
          }}
        />
      )}

      {/* Step 5: Pathway Selection */}
      {step === STEPS.PATHWAYS && (
        <PathwaySelectionStep
          subjectIds={subjectIdsForPathways}
          value={pathwaySelections}
          onChange={setPathwaySelections}
          onBack={handlePathwaysBack}
          onNext={handlePathwaysNext}
        />
      )}

      {/* Step 6: Priority & Grades */}
      {step === STEPS.PRIORITY_GRADES && (
        <SubjectPriorityGradesStep
          subjects={subjectsWithGrades}
          onSubjectsChange={setSubjectsWithGrades}
          onNext={handlePriorityGradesNext}
          onBack={handlePriorityGradesBack}
        />
      )}

      {/* Step 7: Revision Period */}
      {step === STEPS.REVISION_PERIOD && (
        <RevisionPeriodStep
          revisionPeriod={revisionPeriod}
          onRevisionPeriodChange={setRevisionPeriod}
          onNext={handleRevisionPeriodNext}
          onBack={handleRevisionPeriodBack}
        />
      )}

      {/* Step 8: Availability */}
      {step === STEPS.AVAILABILITY && (
        <AvailabilityBuilderStep
          weeklyTemplate={weeklyTemplate}
          dateOverrides={dateOverrides}
          recommendation={recommendation}
          revisionPeriod={revisionPeriod}
          subjects={subjectsWithGrades}
          goalCode={goalCode}
          needClusters={needClusters}
          onTemplateChange={setWeeklyTemplate}
          onOverridesChange={setDateOverrides}
          onNext={handleAvailabilityNext}
          onBack={handleAvailabilityBack}
        />
      )}

      {/* Step 9: Confirm */}
      {step === STEPS.CONFIRM && (
        <ConfirmStep payload={payload} busy={busy} onSubmit={submit} />
      )}

      {/* Step 10: Invite */}
      {step === STEPS.INVITE && invite && (
        <InviteChildStep
          invite={invite}
          childName={childDisplayName}
          onDashboard={handleDashboard}
          onSkip={handleSkip}
        />
      )}
    </OnboardingModal>
  );
}