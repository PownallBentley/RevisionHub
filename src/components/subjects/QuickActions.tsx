// src/components/subjects/QuickActions.tsx

interface QuickActionsProps {
  onAddTopic?: () => void;
  onRequestReview?: () => void;
  onExportProgress?: () => void;
}

export default function QuickActions({
  onAddTopic,
  onRequestReview,
  onExportProgress,
}: QuickActionsProps) {
  const actions = [
    {
      icon: (
        <svg className="w-5 h-5 text-brand-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: "bg-purple-100",
      title: "Add Topic",
      description: "Schedule new revision topic",
      onClick: onAddTopic,
    },
    {
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      iconBg: "bg-blue-100",
      title: "Request Review",
      description: "Revisit a previous topic",
      onClick: onRequestReview,
    },
    {
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      iconBg: "bg-green-100",
      title: "Export Progress",
      description: "Download subject report",
      onClick: onExportProgress,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">Quick Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="p-4 rounded-lg border border-gray-200 hover:border-brand-purple hover:bg-purple-50 transition-colors text-left"
          >
            <div className={`w-10 h-10 rounded-lg ${action.iconBg} flex items-center justify-center mb-3`}>
              {action.icon}
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">{action.title}</p>
            <p className="text-xs text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}