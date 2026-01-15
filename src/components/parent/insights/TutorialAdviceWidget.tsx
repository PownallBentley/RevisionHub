// src/components/parent/insights/TutorAdviceWidget.tsx
// FEAT-008: AI Tutor Advice - Personalized guidance

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserGraduate,
  faLightbulb,
  faTriangleExclamation,
  faComments,
  faCheck,
  faXmark,
  faCircle,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import type { TutorAdvice } from '../../../types/parent/insightsDashboardTypes';

interface TutorAdviceWidgetProps {
  advice: TutorAdvice | null;
  loading: boolean;
  isAIGenerated?: boolean;
}

export default function TutorAdviceWidget({ advice, loading, isAIGenerated = false }: TutorAdviceWidgetProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl shadow-card p-8 border border-primary-800 animate-pulse">
        <div className="h-8 bg-primary-600 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-40 bg-primary-600 rounded-xl" />
          <div className="h-40 bg-primary-600 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl shadow-card p-8 border border-primary-800 text-white">
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faUserGraduate} className="text-4xl text-primary-300 mb-4" />
          <p className="text-primary-200">Complete more sessions to unlock AI tutor advice</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl shadow-card p-8 border border-primary-800 text-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <FontAwesomeIcon icon={faUserGraduate} className="text-primary-300 text-2xl" />
            <h3 className="text-2xl font-bold">Your Tutor Advises</h3>
            {isAIGenerated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-500 rounded-full text-xs">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-amber-300" />
                AI
              </span>
            )}
          </div>
          <p className="text-primary-200">Practical support strategies for this week</p>
        </div>
      </div>

      {/* Focus Points and Watch Out For */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* This Week's Focus */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5 border border-white border-opacity-20">
          <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
            <FontAwesomeIcon icon={faLightbulb} className="text-yellow-300" />
            <span>This Week's Focus</span>
          </h4>
          <ul className="space-y-3 text-sm text-primary-100">
            {advice.focus_points?.map((point, index) => (
              <li key={index} className="flex items-start space-x-2">
                <FontAwesomeIcon icon={faCheck} className="text-accent-green mt-0.5 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Watch Out For */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-5 border border-white border-opacity-20">
          <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-accent-amber" />
            <span>Watch Out For</span>
          </h4>
          <ul className="space-y-3 text-sm text-primary-100">
            {advice.watch_out_for?.map((item, index) => (
              <li key={index} className="flex items-start space-x-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-accent-amber mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Try Saying Section */}
      <div className="bg-white rounded-xl p-6">
        <h4 className="font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
          <FontAwesomeIcon icon={faComments} className="text-primary-600" />
          <span>Try Saying...</span>
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Instead of */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-accent-red bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faXmark} className="text-accent-red" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-600">
                  <strong>Instead of:</strong> "{advice.try_saying?.instead_of}"
                </p>
              </div>
            </div>
          </div>
          
          {/* Try this */}
          <div className="p-4 bg-accent-green bg-opacity-5 rounded-lg border border-accent-green border-opacity-20">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-accent-green bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCheck} className="text-accent-green" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-700">
                  <strong>Try saying:</strong> "{advice.try_saying?.try_this}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* When to Step In/Back */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold text-neutral-900 mb-3 text-sm">When to Step In</h5>
            <ul className="space-y-2 text-sm text-neutral-700">
              {advice.step_in_signals?.map((signal, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <FontAwesomeIcon icon={faCircle} className="text-primary-600 text-[6px] mt-1.5" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-neutral-900 mb-3 text-sm">When to Step Back</h5>
            <ul className="space-y-2 text-sm text-neutral-700">
              {advice.step_back_signals?.map((signal, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <FontAwesomeIcon icon={faCircle} className="text-accent-green text-[6px] mt-1.5" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}