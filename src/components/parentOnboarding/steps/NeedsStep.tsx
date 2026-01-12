// src/components/parentOnboarding/steps/NeedsStep.tsx

import { useEffect, useMemo, useState } from "react";
import {
  listNeedAreas,
  listNeedClusters,
  type NeedArea,
  type NeedCluster,
  type JcqArea,
} from "../../../services/referenceData/referenceDataService";

/* ============================
   Types (UNCHANGED)
============================ */

export type NeedClusterSelection = {
  cluster_code: string;
  source: "formal_diagnosis" | "observed";
  has_exam_accommodations?: boolean;
  accommodation_details?: string;
};

type Props = {
  childName?: string;
  value: NeedClusterSelection[];
  onChange: (next: NeedClusterSelection[]) => void;
};

type FlowPath = "gate" | "formal" | "observed";

/* ============================
   Sub-components
============================ */

function GateScreen(props: {
  childName: string;
  onYes: () => void;
  onNo: () => void;
  onPending: () => void;
}) {
  const { childName, onYes, onNo, onPending } = props;

  return (
    <div>
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Does {childName} have any formal access arrangements for exams?
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Access arrangements are approved by your school through the exam boards. They
          might include extra time, a separate room, a reader, or other support.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onYes}
          className="w-full border-2 border-neutral-200 rounded-xl p-5 text-left transition-all hover:border-primary-300 hover:shadow-soft"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mt-0.5">
              <i className="fa-solid fa-check-double text-primary-600 text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">
                Yes, they have approved arrangements
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                I'll tell you what support they receive
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onNo}
          className="w-full border-2 border-neutral-200 rounded-xl p-5 text-left transition-all hover:border-primary-300 hover:shadow-soft"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mt-0.5">
              <i className="fa-solid fa-circle-question text-primary-600 text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">
                No, or I'm not sure
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Help me understand their learning style
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onPending}
          className="w-full border-2 border-neutral-200 rounded-xl p-5 text-left transition-all hover:border-primary-300 hover:shadow-soft"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mt-0.5">
              <i className="fa-solid fa-hourglass-half text-primary-600 text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">
                We're in the process of getting assessed
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                I'll describe what I've noticed
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

function FormalArrangementsScreen(props: {
  childName: string;
  areas: NeedArea[];
  clusters: NeedCluster[];
  selected: NeedClusterSelection[];
  onToggle: (code: string, accommodationDetails?: string) => void;
  onBack: () => void;
}) {
  const { childName, areas, clusters, selected, onToggle, onBack } = props;
  const [expandedArea, setExpandedArea] = useState<JcqArea | null>(null);
  const [accommodationInputs, setAccommodationInputs] = useState<Record<string, string>>(
    {}
  );

  const selectedCodes = useMemo(
    () => new Set(selected.map((s) => s.cluster_code)),
    [selected]
  );

  // Only show JCQ-recognised areas (not study_skills)
  const jcqAreas = areas.filter((a) => a.is_jcq_recognised);

  const clustersByArea = useMemo(() => {
    const map: Record<string, NeedCluster[]> = {};
    for (const cluster of clusters) {
      if (cluster.jcq_area && cluster.typically_has_accommodations) {
        if (!map[cluster.jcq_area]) map[cluster.jcq_area] = [];
        map[cluster.jcq_area].push(cluster);
      }
    }
    return map;
  }, [clusters]);

  return (
    <div>
      {/* Back button and header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-neutral-700 mb-4 flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          <span>Back</span>
        </button>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          What conditions does {childName} have arrangements for?
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Select all that apply. For each, you can tell us what arrangements they receive.
        </p>
      </div>

      {/* Areas list */}
      <div className="space-y-4">
        {jcqAreas.map((area) => {
          const areaClusters = clustersByArea[area.code] ?? [];
          const isExpanded = expandedArea === area.code;
          const hasSelected = areaClusters.some((c) => selectedCodes.has(c.code));

          return (
            <div
              key={area.code}
              className={`rounded-xl border-2 transition-all overflow-hidden ${
                hasSelected ? "border-primary-600 bg-primary-50" : "border-neutral-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedArea(isExpanded ? null : area.code)}
                className="w-full px-5 py-4 text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{area.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">{area.description}</p>
                </div>
                <span className="text-neutral-400 text-xl flex-shrink-0 ml-4">
                  {isExpanded ? (
                    <i className="fa-solid fa-minus" />
                  ) : (
                    <i className="fa-solid fa-plus" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-neutral-200 pt-4">
                  {areaClusters.map((cluster) => {
                    const isSelected = selectedCodes.has(cluster.code);
                    return (
                      <div key={cluster.code} className="space-y-2">
                        <button
                          type="button"
                          onClick={() =>
                            onToggle(cluster.code, accommodationInputs[cluster.code])
                          }
                          className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                            isSelected
                              ? "border-primary-600 bg-primary-100"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <p className="font-medium text-neutral-900">
                            {cluster.parent_friendly_name || cluster.name}
                          </p>
                          {cluster.condition_name &&
                            cluster.condition_name !== cluster.name && (
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {cluster.condition_name}
                              </p>
                            )}
                        </button>

                        {isSelected && (
                          <div className="ml-4">
                            <label className="text-sm text-neutral-600">
                              What arrangements do they receive? (optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., 25% extra time, separate room"
                              value={accommodationInputs[cluster.code] ?? ""}
                              onChange={(e) => {
                                setAccommodationInputs((prev) => ({
                                  ...prev,
                                  [cluster.code]: e.target.value,
                                }));
                              }}
                              onBlur={() => {
                                onToggle(cluster.code, accommodationInputs[cluster.code]);
                              }}
                              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                            />
                            {cluster.common_arrangements &&
                              cluster.common_arrangements.length > 0 && (
                                <p className="mt-2 text-xs text-neutral-400">
                                  Common: {cluster.common_arrangements.join(", ")}
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ObservedTraitsScreen(props: {
  childName: string;
  areas: NeedArea[];
  clusters: NeedCluster[];
  selected: NeedClusterSelection[];
  onToggle: (code: string) => void;
  onBack: () => void;
}) {
  const { childName, areas, clusters, selected, onToggle, onBack } = props;
  const [expandedArea, setExpandedArea] = useState<JcqArea | null>(null);

  const selectedCodes = useMemo(
    () => new Set(selected.map((s) => s.cluster_code)),
    [selected]
  );

  const clustersByArea = useMemo(() => {
    const map: Record<string, NeedCluster[]> = {};
    for (const cluster of clusters) {
      if (cluster.jcq_area) {
        if (!map[cluster.jcq_area]) map[cluster.jcq_area] = [];
        map[cluster.jcq_area].push(cluster);
      }
    }
    return map;
  }, [clusters]);

  return (
    <div>
      {/* Back button and header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-neutral-700 mb-4 flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          <span>Back</span>
        </button>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Let's understand how {childName} learns best
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          You don't need a diagnosis. Just select anything that sounds familiar — this
          helps us tailor their revision experience.
        </p>
      </div>

      {/* Areas list */}
      <div className="space-y-4">
        {areas.map((area) => {
          const areaClusters = clustersByArea[area.code] ?? [];
          const isExpanded = expandedArea === area.code;
          const selectedCount = areaClusters.filter((c) =>
            selectedCodes.has(c.code)
          ).length;

          return (
            <div
              key={area.code}
              className={`rounded-xl border-2 transition-all overflow-hidden ${
                selectedCount > 0
                  ? "border-primary-600 bg-primary-50"
                  : "border-neutral-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedArea(isExpanded ? null : area.code)}
                className="w-full px-5 py-4 text-left flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-neutral-900">{area.name}</p>
                    {!area.is_jcq_recognised && (
                      <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                        Revision support
                      </span>
                    )}
                    {selectedCount > 0 && (
                      <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                        {selectedCount} selected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">{area.helper_text}</p>
                </div>
                <span className="text-neutral-400 text-xl flex-shrink-0 ml-4">
                  {isExpanded ? (
                    <i className="fa-solid fa-minus" />
                  ) : (
                    <i className="fa-solid fa-plus" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-neutral-200 pt-4">
                  {areaClusters.map((cluster) => {
                    const isSelected = selectedCodes.has(cluster.code);
                    const signs =
                      cluster.example_signs ?? cluster.typical_behaviours ?? [];

                    return (
                      <button
                        key={cluster.code}
                        type="button"
                        onClick={() => onToggle(cluster.code)}
                        className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-primary-600 bg-primary-100"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <p className="font-medium text-neutral-900">
                          {cluster.parent_friendly_name || cluster.name}
                        </p>
                        {signs.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {signs.slice(0, 3).map((sign, i) => (
                              <li
                                key={i}
                                className="text-sm text-neutral-500 flex items-start gap-2"
                              >
                                <span className="text-neutral-300">•</span>
                                <span>{sign}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================
   Main Component (LOGIC UNCHANGED)
============================ */

export default function NeedsStep({
  childName = "your child",
  value,
  onChange,
}: Props) {
  const [areas, setAreas] = useState<NeedArea[]>([]);
  const [clusters, setClusters] = useState<NeedCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<FlowPath>("gate");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [areasData, clustersData] = await Promise.all([
          listNeedAreas(),
          listNeedClusters(),
        ]);
        if (mounted) {
          setAreas(areasData);
          setClusters(clustersData);
        }
      } catch (err) {
        console.error("Failed to load needs data:", err);
        if (mounted) {
          setAreas([]);
          setClusters([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleFormalToggle(code: string, accommodationDetails?: string) {
    const existing = value.find((v) => v.cluster_code === code);

    if (existing) {
      if (
        accommodationDetails !== undefined &&
        accommodationDetails !== existing.accommodation_details
      ) {
        onChange(
          value.map((v) =>
            v.cluster_code === code ? { ...v, accommodation_details: accommodationDetails } : v
          )
        );
      } else if (accommodationDetails === undefined) {
        onChange(value.filter((v) => v.cluster_code !== code));
      }
    } else {
      onChange([
        ...value,
        {
          cluster_code: code,
          source: "formal_diagnosis",
          has_exam_accommodations: true,
          accommodation_details: accommodationDetails,
        },
      ]);
    }
  }

  function handleObservedToggle(code: string) {
    const existing = value.find((v) => v.cluster_code === code);

    if (existing) {
      onChange(value.filter((v) => v.cluster_code !== code));
    } else {
      onChange([
        ...value,
        {
          cluster_code: code,
          source: "observed",
          has_exam_accommodations: false,
        },
      ]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="ml-3 text-sm text-neutral-500">Loading support options…</span>
      </div>
    );
  }

  if (path === "gate") {
    return (
      <GateScreen
        childName={childName}
        onYes={() => setPath("formal")}
        onNo={() => setPath("observed")}
        onPending={() => setPath("observed")}
      />
    );
  }

  if (path === "formal") {
    return (
      <FormalArrangementsScreen
        childName={childName}
        areas={areas}
        clusters={clusters}
        selected={value}
        onToggle={handleFormalToggle}
        onBack={() => setPath("gate")}
      />
    );
  }

  return (
    <ObservedTraitsScreen
      childName={childName}
      areas={areas}
      clusters={clusters}
      selected={value}
      onToggle={handleObservedToggle}
      onBack={() => setPath("gate")}
    />
  );
}