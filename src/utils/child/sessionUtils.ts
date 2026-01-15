// src/utils/child/sessionUtils.ts
// Utility functions for session runner

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFlask,
  faCalculator,
  faAtom,
  faGlobe,
  faLandmark,
  faDna,
  faBook,
} from "@fortawesome/free-solid-svg-icons";

const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  book: faBook,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  dna: faDna,
};

export function getSubjectIcon(iconName?: string | null): IconDefinition {
  if (!iconName) return faFlask;
  return ICON_MAP[iconName.toLowerCase()] || faFlask;
}

export function calculateTimeRemaining(
  currentStepIndex: number,
  totalSteps: number,
  sessionDurationMinutes: number
): number {
  const stepsRemaining = totalSteps - currentStepIndex + 1;
  const timePerStep = Math.ceil(sessionDurationMinutes / totalSteps);
  return stepsRemaining * timePerStep;
}