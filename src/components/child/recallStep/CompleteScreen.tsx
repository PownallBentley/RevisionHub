// src/components/child/recallStep/CompleteScreen.tsx
// Results summary shown after all flashcards are reviewed

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

type CompleteScreenProps = {
  knownCount: number;
  learningCount: number;
  totalCards: number;
  saving: boolean;
  onContinue: () => void;
};

export function CompleteScreen({
  knownCount,
  learningCount,
  totalCards,
  saving,
  onContinue,
}: CompleteScreenProps) {
  // Determine message based on results
  let headlineMessage = "";
  let supportMessage = "";

  if (knownCount === totalCards) {
    headlineMessage = "Amazing! You knew them all! 🌟";
    supportMessage = "You're already a pro at this topic. Let's build on what you know!";
  } else if (knownCount > learningCount) {
    headlineMessage = "Great job! You know loads already! 💪";
    supportMessage = "Now let's focus on the bits you're still learning.";
  } else if (knownCount > 0) {
    headlineMessage = "Nice work! Good effort! 👍";
    supportMessage = "Don't worry about the ones you didn't know yet – that's what we're here for!";
  } else {
    headlineMessage = "Thanks for trying! 🙌";
    supportMessage = "This is all new to you, and that's totally fine. Let's learn it together!";
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">{headlineMessage}</h2>
        <p className="text-neutral-600">{supportMessage}</p>
      </div>

      {/* Results summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{knownCount}</p>
          <p className="text-sm text-neutral-600 mt-1">Already knew</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-500">{learningCount}</p>
          <p className="text-sm text-neutral-600 mt-1">To learn</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        Continue
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  );
}