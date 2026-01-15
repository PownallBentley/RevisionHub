// src/pages/parent/InsightsDashboard.tsx
// FEAT-008: Advanced Insights Dashboard - Main Page
// v3: No header bar - controls in Hero card, background AI loading

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { PageLayout } from '../../components/layout';
import { supabase } from '../../lib/supabase';
import {
  fetchAllInsights,
  generateTutorAdvice,
  generateFallbackAdvice,
} from '../../services/parent/insightsDashboardService';
import type {
  DateRangeType,
  AllInsightsData,
  TutorAdvice,
  TopicInsight,
} from '../../types/parent/insightsDashboardTypes';

// Import all widgets
import {
  HeroStoryWidget,
  ProgressPlanWidget,
  ConfidenceTrendWidget,
  FocusModeWidget,
  MomentumWidget,
  BuildingConfidenceWidget,
  NeedsAttentionWidget,
  SubjectBalanceWidget,
  ConfidenceHeatmapWidget,
  TutorAdviceWidget,
  AnalyticsGateWidget,
} from '../../components/parent/insights';

interface Child {
  id: string;
  first_name: string;
  preferred_name: string | null;
}

export default function InsightsDashboard() {
  const navigate = useNavigate();
  const { user, isParent, loading: authLoading } = useAuth();

  // State
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeType>('this_week');
  const [insightsData, setInsightsData] = useState<AllInsightsData | null>(null);
  const [tutorAdvice, setTutorAdvice] = useState<TutorAdvice | null>(null);
  const [shareAnalytics, setShareAnalytics] = useState(false);
  const [isAIAdvice, setIsAIAdvice] = useState(false);
  
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track current AI request to cancel stale ones
  const aiRequestId = useRef(0);

  // Redirect if not parent
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/', { replace: true });
    } else if (!isParent) {
      navigate('/child/today', { replace: true });
    }
  }, [authLoading, user, isParent, navigate]);

  // Helper: get child name
  const getChildName = useCallback((childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.preferred_name || child?.first_name || 'Child';
  }, [children]);

  // Load children on mount
  useEffect(() => {
    if (!user || !isParent) return;

    async function loadChildren() {
      setLoadingChildren(true);
      
      try {
        const { data: childrenData, error: childrenError } = await supabase
          .from('children')
          .select('id, first_name, preferred_name')
          .eq('parent_id', user!.id)
          .order('first_name');

        if (childrenError) throw childrenError;

        setChildren(childrenData || []);
        
        if (childrenData && childrenData.length > 0) {
          setSelectedChildId(childrenData[0].id);
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('share_anonymised_data')
          .eq('id', user!.id)
          .single();

        setShareAnalytics(profileData?.share_anonymised_data || false);
      } catch (err: any) {
        console.error('Error loading children:', err);
        setError(err.message);
      } finally {
        setLoadingChildren(false);
      }
    }

    loadChildren();
  }, [user, isParent]);

  // Load insights when child or date range changes
  useEffect(() => {
    if (!selectedChildId) return;

    async function loadInsights() {
      setLoadingInsights(true);
      setError(null);

      try {
        const { data, error: insightsError } = await fetchAllInsights(selectedChildId, dateRange);

        if (insightsError) {
          throw new Error(insightsError);
        }

        setInsightsData(data);

        // Immediately show fallback advice (instant)
        if (data) {
          const childName = getChildName(selectedChildId);
          const fallback = generateFallbackAdvice(childName, data);
          setTutorAdvice(fallback);
          setIsAIAdvice(false);
          
          // Then try to get AI advice in background
          generateAIAdviceInBackground(selectedChildId, childName, data);
        }
      } catch (err: any) {
        console.error('Error loading insights:', err);
        setError(err.message);
      } finally {
        setLoadingInsights(false);
      }
    }

    loadInsights();
  }, [selectedChildId, dateRange, getChildName]);

  // Background AI advice generation - doesn't block page
  const generateAIAdviceInBackground = async (
    childId: string,
    childName: string,
    data: AllInsightsData
  ) => {
    const currentRequestId = ++aiRequestId.current;
    setLoadingAdvice(true);

    try {
      const { data: aiAdvice, error: aiError } = await generateTutorAdvice(childName, data);
      
      if (currentRequestId === aiRequestId.current) {
        if (!aiError && aiAdvice) {
          setTutorAdvice(aiAdvice);
          setIsAIAdvice(true);
        }
      }
    } catch {
      // AI failed - fallback already showing
    } finally {
      if (currentRequestId === aiRequestId.current) {
        setLoadingAdvice(false);
      }
    }
  };

  // Handle analytics toggle
  const handleAnalyticsToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ share_anonymised_data: enabled })
        .eq('id', user!.id);

      if (error) throw error;
      setShareAnalytics(enabled);
    } catch (err: any) {
      console.error('Error updating analytics:', err);
    }
  };

  // Handle export - navigate to print-optimized report page
  const handleExport = () => {
    if (selectedChildId) {
      window.open(`/parent/insights/report?childId=${selectedChildId}`, '_blank');
    }
  };

  // Transform topics for widgets
  const getTopicInsights = (): TopicInsight[] => {
    const improving = insightsData?.top_topics?.improving_topics || [];
    const struggling = insightsData?.top_topics?.struggling_topics || [];
    
    const allTopics = [...improving, ...struggling];
    const seen = new Set<string>();
    return allTopics.filter(t => {
      if (seen.has(t.topic_id)) return false;
      seen.add(t.topic_id);
      return true;
    });
  };

  // Loading state
  if (authLoading || loadingChildren) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} className="text-primary-600 text-2xl animate-spin mb-3" />
            <p className="text-sm text-neutral-600">Loading insights...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user || !isParent) return null;

  const selectedChild = children.find(c => c.id === selectedChildId);
  const childName = selectedChild?.preferred_name || selectedChild?.first_name || 'Child';

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Hero Story Card - Fixed position, contains controls */}
        <section className="mb-8">
          <HeroStoryWidget
            childName={childName}
            summary={insightsData?.summary || null}
            advice={tutorAdvice}
            loading={loadingInsights}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExport={handleExport}
          />
        </section>

        {/* Main Grid - These widgets will be draggable in future */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProgressPlanWidget
            data={insightsData?.weekly_progress || null}
            loading={loadingInsights}
          />

          <ConfidenceTrendWidget
            data={insightsData?.confidence_trend || null}
            loading={loadingInsights}
          />

          <FocusModeWidget
            data={insightsData?.focus_comparison || null}
            loading={loadingInsights}
          />

          <MomentumWidget
            summary={insightsData?.summary || null}
            loading={loadingInsights}
          />

          <BuildingConfidenceWidget
            topics={getTopicInsights()}
            loading={loadingInsights}
          />

          <NeedsAttentionWidget
            topics={getTopicInsights()}
            loading={loadingInsights}
          />

          <SubjectBalanceWidget
            data={insightsData?.subject_balance || null}
            loading={loadingInsights}
          />

          <ConfidenceHeatmapWidget
            data={insightsData?.confidence_heatmap || null}
            loading={loadingInsights}
          />
        </div>

        {/* Tutor Advice Section */}
        <section className="mb-8">
          <TutorAdviceWidget
            advice={tutorAdvice}
            loading={loadingInsights}
            isAIGenerated={isAIAdvice}
          />
          {loadingAdvice && tutorAdvice && (
            <div className="mt-2 text-center">
              <span className="text-xs text-neutral-400">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                Enhancing with AI insights...
              </span>
            </div>
          )}
        </section>

        {/* Advanced Analytics Gate */}
        <section className="mb-8">
          <AnalyticsGateWidget
            enabled={shareAnalytics}
            onToggle={handleAnalyticsToggle}
            loading={loadingInsights}
          />
        </section>
      </main>
    </PageLayout>
  );
}