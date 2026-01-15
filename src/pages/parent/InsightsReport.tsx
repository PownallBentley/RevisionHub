// src/pages/parent/InsightsReport.tsx
// FEAT-008: PDF Report - Print-optimized page for parent-teacher meetings

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faPrint,
  faArrowLeft,
  faCheckCircle,
  faArrowTrendUp,
  faArrowTrendDown,
  faMinus,
  faFire,
  faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ReportData {
  child_name: string;
  generated_at: string;
  report_date: string;
  lifetime: {
    total_sessions: number;
    total_planned: number;
    completion_rate: number;
    avg_confidence_change: number;
    first_session_date: string;
    sessions_with_improvement: number;
  };
  this_month: {
    total_sessions: number;
    total_planned: number;
    completion_rate: number;
    avg_confidence_change: number;
    focus_mode_usage: number;
  };
  this_week: {
    total_sessions: number;
    total_planned: number;
    completion_rate: number;
    avg_confidence_change: number;
    focus_mode_usage: number;
  };
  subjects: Array<{
    subject_id: string;
    subject_name: string;
    session_count: number;
    avg_pre_confidence: number;
    avg_post_confidence: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  strengths: Array<{
    topic_id: string;
    topic_name: string;
    subject_name: string;
    confidence_percent: number;
    sessions_completed: number;
  }>;
  areas_for_support: Array<{
    topic_id: string;
    topic_name: string;
    subject_name: string;
    confidence_percent: number;
    sessions_completed: number;
    last_reviewed: string;
  }>;
  recent_sessions: Array<{
    date: string;
    topic_name: string;
    subject_name: string;
    pre_confidence: string;
    post_confidence: string;
    focus_mode: boolean;
  }>;
  streak: {
    current: number;
    longest: number;
  };
}

export default function InsightsReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isParent, loading: authLoading } = useAuth();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const childId = searchParams.get('childId');

  // Redirect if not parent
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/', { replace: true });
    } else if (!isParent) {
      navigate('/child/today', { replace: true });
    }
  }, [authLoading, user, isParent, navigate]);

  // Fetch report data
  useEffect(() => {
    if (!childId || !user) return;

    async function fetchReportData() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase
          .rpc('rpc_get_report_data', { p_child_id: childId });

        if (rpcError) throw rpcError;
        setReportData(data);
      } catch (err: any) {
        console.error('Error fetching report data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [childId, user]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Confidence label
  const confidenceLabel = (value: string) => {
    const labels: Record<string, string> = {
      need_help: 'Needs Help',
      bit_unsure: 'A Bit Unsure',
      fairly_confident: 'Fairly Confident',
      very_confident: 'Very Confident',
    };
    return labels[value] || value;
  };

  // Trend icon
  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'improving') {
      return <FontAwesomeIcon icon={faArrowTrendUp} className="text-green-600" />;
    }
    if (trend === 'declining') {
      return <FontAwesomeIcon icon={faArrowTrendDown} className="text-red-600" />;
    }
    return <FontAwesomeIcon icon={faMinus} className="text-gray-400" />;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-indigo-600 text-2xl animate-spin mb-3" />
          <p className="text-sm text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load report data'}</p>
          <button
            onClick={() => navigate('/parent/insights')}
            className="text-indigo-600 hover:underline"
          >
            ← Back to Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }
          
          /* Reset background colors for print */
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Page setup */
          @page {
            size: A4;
            margin: 15mm;
          }
          
          /* Prevent page breaks inside cards */
          .report-card {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Force page break before major sections */
          .page-break-before {
            page-break-before: always;
          }
          
          /* Keep headings with content */
          h2, h3 {
            page-break-after: avoid;
          }
          
          /* Table header repeat */
          thead {
            display: table-header-group;
          }
          
          /* Ensure colors print */
          .bg-green-50, .bg-amber-50, .bg-indigo-50, .bg-gray-50 {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        /* Screen styles for print preview */
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Action Bar (hidden when printing) */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/parent/insights')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Insights</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPrint} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="print-container bg-white min-h-screen">
        <div className="px-8 py-10">
          
          {/* Header */}
          <header className="mb-10 border-b-2 border-indigo-600 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">RevisionHub Progress Report</h1>
                </div>
                <p className="text-lg text-indigo-600 font-semibold">{reportData.child_name}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Generated: {formatDate(reportData.generated_at)}</p>
                <p>Report Date: {formatDate(reportData.report_date)}</p>
              </div>
            </div>
          </header>

          {/* Executive Summary */}
          <section className="mb-10 report-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <span>Executive Summary</span>
            </h2>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-indigo-600">
                  {reportData.lifetime.total_sessions}
                </p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {reportData.lifetime.completion_rate || 0}%
                </p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {reportData.lifetime.sessions_with_improvement}
                </p>
                <p className="text-sm text-gray-600">Sessions Improved</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-600 flex items-center justify-center space-x-1">
                  <FontAwesomeIcon icon={faFire} className="text-orange-500" />
                  <span>{reportData.streak.current}</span>
                </p>
                <p className="text-sm text-gray-600">Current Streak</p>
              </div>
            </div>
            
            <p className="mt-4 text-sm text-gray-500">
              First session: {formatDate(reportData.lifetime.first_session_date)} • 
              Longest streak: {reportData.streak.longest} days
            </p>
          </section>

          {/* Progress Timeline */}
          <section className="mb-10 report-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Timeline</h2>
            
            <div className="grid grid-cols-3 gap-6">
              {/* This Week */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">This Week</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-medium">{reportData.this_week.total_sessions}/{reportData.this_week.total_planned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium">{reportData.this_week.completion_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Change</span>
                    <span className={`font-medium ${(reportData.this_week.avg_confidence_change || 0) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {(reportData.this_week.avg_confidence_change || 0) > 0 ? '+' : ''}{reportData.this_week.avg_confidence_change || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* This Month */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">This Month</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-medium">{reportData.this_month.total_sessions}/{reportData.this_month.total_planned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium">{reportData.this_month.completion_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Change</span>
                    <span className={`font-medium ${(reportData.this_month.avg_confidence_change || 0) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {(reportData.this_month.avg_confidence_change || 0) > 0 ? '+' : ''}{reportData.this_month.avg_confidence_change || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* All Time */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">All Time</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-medium">{reportData.lifetime.total_sessions}/{reportData.lifetime.total_planned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium">{reportData.lifetime.completion_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Change</span>
                    <span className={`font-medium ${(reportData.lifetime.avg_confidence_change || 0) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {(reportData.lifetime.avg_confidence_change || 0) > 0 ? '+' : ''}{reportData.lifetime.avg_confidence_change || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Subject Analysis */}
          <section className="mb-10 report-card page-break-before">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subject Analysis</h2>
            
            {reportData.subjects.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Sessions</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Pre</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Post</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.subjects.map((subject, idx) => (
                    <tr key={subject.subject_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 font-medium text-gray-900">{subject.subject_name}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{subject.session_count}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{subject.avg_pre_confidence || '-'}%</td>
                      <td className="py-3 px-4 text-center text-gray-600">{subject.avg_post_confidence || '-'}%</td>
                      <td className="py-3 px-4 text-center">
                        <TrendIcon trend={subject.trend} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic">No subject data available yet.</p>
            )}
          </section>

          {/* Strengths */}
          <section className="mb-10 report-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
              <span>Strengths</span>
            </h2>
            
            {reportData.strengths.length > 0 ? (
              <div className="space-y-3">
                {reportData.strengths.map((topic) => (
                  <div key={topic.topic_id} className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{topic.topic_name}</p>
                      <p className="text-sm text-gray-500">{topic.subject_name} • {topic.sessions_completed} sessions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{topic.confidence_percent}%</p>
                      <p className="text-xs text-gray-500">confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">Building confidence - check back after more sessions.</p>
            )}
          </section>

          {/* Areas for Support */}
          <section className="mb-10 report-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <span>Areas for Support</span>
            </h2>
            
            {reportData.areas_for_support.length > 0 ? (
              <div className="space-y-3">
                {reportData.areas_for_support.map((topic) => (
                  <div key={topic.topic_id} className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{topic.topic_name}</p>
                      <p className="text-sm text-gray-500">
                        {topic.subject_name} • Last reviewed: {formatDate(topic.last_reviewed)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600">{topic.confidence_percent}%</p>
                      <p className="text-xs text-gray-500">confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No areas of concern identified.</p>
            )}
          </section>

          {/* Recent Sessions */}
          <section className="mb-10 report-card page-break-before">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Session History</h2>
            
            {reportData.recent_sessions.length > 0 ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Topic</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Subject</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Before</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">After</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.recent_sessions.map((session, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-gray-600">{formatDate(session.date)}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">{session.topic_name}</td>
                      <td className="py-2 px-3 text-gray-600">{session.subject_name}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{confidenceLabel(session.pre_confidence)}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{confidenceLabel(session.post_confidence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic">No session history available.</p>
            )}
          </section>

          {/* Conversation Starters */}
          <section className="mb-10 report-card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Conversation Starters for Teachers</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use these questions to guide discussions with {reportData.child_name}'s teachers:
            </p>
            
            <div className="bg-indigo-50 rounded-lg p-5 space-y-4">
              <div>
                <p className="font-medium text-indigo-900 mb-1">On overall progress:</p>
                <p className="text-gray-700 italic">
                  "{reportData.child_name} has completed {reportData.lifetime.total_sessions} revision sessions. 
                  How does this align with what you're seeing in class?"
                </p>
              </div>
              
              {reportData.strengths.length > 0 && (
                <div>
                  <p className="font-medium text-indigo-900 mb-1">On strengths:</p>
                  <p className="text-gray-700 italic">
                    "They're showing strong confidence in {reportData.strengths[0]?.topic_name}. 
                    Are there ways to build on this in lessons?"
                  </p>
                </div>
              )}
              
              {reportData.areas_for_support.length > 0 && (
                <div>
                  <p className="font-medium text-indigo-900 mb-1">On areas needing support:</p>
                  <p className="text-gray-700 italic">
                    "{reportData.areas_for_support[0]?.topic_name} seems to be more challenging - 
                    confidence is at {reportData.areas_for_support[0]?.confidence_percent}%. 
                    What additional support would you recommend?"
                  </p>
                </div>
              )}
              
              <div>
                <p className="font-medium text-indigo-900 mb-1">On study habits:</p>
                <p className="text-gray-700 italic">
                  "{reportData.child_name} has a {reportData.streak.current}-day study streak. 
                  Is this consistent effort showing in their classwork?"
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-200 pt-6 mt-10 text-center text-sm text-gray-500">
            <p>Generated by RevisionHub • {formatDate(reportData.generated_at)}</p>
            <p className="mt-1">This report is based on self-reported confidence levels during revision sessions.</p>
          </footer>

        </div>
      </div>
    </>
  );
}