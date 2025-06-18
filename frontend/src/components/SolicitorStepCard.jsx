import React, { useState } from 'react';
import dayjs from 'dayjs';

const SolicitorStepCard = ({
  step,
  expanded,
  onToggle,
  onAction,
  isEditing,
  onEditChange,
  onEditSave,
  onEditCancel,
  editValues,
  userRole,
  propertyId,
  recipients,
  stageEstimates,
  userInfo,
  property
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleInfoClick = (e) => {
    e.stopPropagation();
    setShowInfoModal(true);
  };

  return (
    <div className="relative">
      <div
        className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 ${
          expanded ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step.status === 'completed' ? 'bg-green-500' :
              step.status === 'in-progress' ? 'bg-blue-500' :
              'bg-gray-300'
            }`}>
              <span className="text-white font-bold">
                {step.status === 'completed' ? '✓' :
                 step.status === 'in-progress' ? '⟳' :
                 '○'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{step.stage}</h3>
              <p className="text-sm text-gray-500">
                {step.status === 'completed' ? 'Completed' :
                 step.status === 'in-progress' ? 'In Progress' :
                 'Pending'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? '▼' : '▶'}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            {/* Rest of the expanded content */}
            {/* ... existing expanded content ... */}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolicitorStepCard; 