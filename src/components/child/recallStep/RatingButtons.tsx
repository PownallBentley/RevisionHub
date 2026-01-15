// src/components/child/recallStep/RatingButtons.tsx
// Undo, Still Learning, and Know It button group

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUndo } from "@fortawesome/free-solid-svg-icons";
import type { CardRating } from "@/types/child/recallStep";

type RatingButtonsProps = {
  onRate: (rating: CardRating) => void;
  onUndo: () => void;
  canUndo: boolean;
  saving: boolean;
};

export function RatingButtons({
  onRate,
  onUndo,
  canUndo,
  saving,
}: RatingButtonsProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 bg-white rounded-full shadow-lg p-2">
        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 transition"
          title="Undo"
        >
          <FontAwesomeIcon icon={faUndo} />
        </button>

        {/* Still learning */}
        <button
          type="button"
          onClick={() => onRate("learning")}
          disabled={saving}
          className="w-14 h-14 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-2xl transition disabled:opacity-50"
          title="Still learning"
        >
          🤔
        </button>

        {/* Know */}
        <button
          type="button"
          onClick={() => onRate("known")}
          disabled={saving}
          className="w-14 h-14 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center text-2xl transition disabled:opacity-50"
          title="I know this!"
        >
          😃
        </button>
      </div>
    </div>
  );
}