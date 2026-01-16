// src/components/child/recallStep/FlashcardViewer.tsx
// Flip card component with 3D animation
// FEAT-011: Added Study Buddy trigger

import { StudyBuddyTrigger } from "../../studyBuddy/StudyBuddyTrigger";
import type { Flashcard } from "../../../types/child/recallStep";

type FlashcardViewerProps = {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  topicName: string;
  onAskBuddy?: (question: string) => void;
};

export function FlashcardViewer({
  card,
  isFlipped,
  onFlip,
  topicName,
  onAskBuddy,
}: FlashcardViewerProps) {
  
  const handleAskBuddy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    if (onAskBuddy) {
      const question = isFlipped
        ? `I don't understand this answer: "${card.back}"`
        : `Can you help me with this question: "${card.front}"`;
      onAskBuddy(question);
    }
  };

  return (
    <div className="w-full" style={{ perspective: "1000px", minHeight: "320px" }}>
      <div
        onClick={onFlip}
        className="relative w-full h-80 cursor-pointer transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-white shadow-lg border border-neutral-200 p-6 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-4">
            <span>Question</span>
            <span className="text-primary-600 flex items-center gap-1">
              {topicName}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-neutral-900 text-center font-medium px-4">
              {card.front}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-neutral-400">
              Tap to see the answer
            </p>
            {onAskBuddy && (
              <div onClick={handleAskBuddy}>
                <StudyBuddyTrigger
                  onClick={() => {}}
                  promptText="I'm stuck"
                  variant="inline"
                />
              </div>
            )}
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl bg-slate-100 shadow-lg border border-neutral-200 p-6 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-4">
            <span>Answer</span>
            <span className="text-primary-600 flex items-center gap-1">
              {topicName}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg text-neutral-800 text-center px-4">
              {card.back}
            </p>
          </div>
          <div className="flex items-center justify-end mt-4">
            {onAskBuddy && (
              <div onClick={handleAskBuddy}>
                <StudyBuddyTrigger
                  onClick={() => {}}
                  promptText="Explain this"
                  variant="inline"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}