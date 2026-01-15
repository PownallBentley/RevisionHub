// src/components/child/recallStep/IntroScreen.tsx
// Welcome screen shown before flashcard review begins

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";

type IntroScreenProps = {
  childName: string;
  topicName: string;
  totalCards: number;
  onStart: () => void;
};

export function IntroScreen({
  childName,
  topicName,
  totalCards,
  onStart,
}: IntroScreenProps) {
  // Get first name only
  const firstName = childName?.split(" ")[0] || "there";

  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-3xl" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-3">
        Hey {firstName}! 👋
      </h2>

      <p className="text-lg text-neutral-600 mb-2">
        Before we start, let's have some fun and see what you already know about{" "}
        <span className="font-semibold text-primary-600">{topicName}</span>!
      </p>

      <p className="text-neutral-500 mb-8">
        {totalCards} quick questions – no pressure, just do your best!
      </p>

      <button
        type="button"
        onClick={onStart}
        className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition text-lg"
      >
        Let's go! 🚀
      </button>
    </div>
  );
}