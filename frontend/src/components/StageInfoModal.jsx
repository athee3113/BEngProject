import React, { useState, useEffect } from 'react';

const StageInfoModal = ({ isOpen, onClose, stage, role }) => {
  const [stageInfo, setStageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStageInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/stage-info?stage=${stage}&role=${role}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stage information');
        }
        
        const data = await response.json();
        setStageInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStageInfo();
    }
  }, [isOpen, stage, role]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Stage Information</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading stage information...</p>
          </div>
        ) : error ? (
          <div className="text-red-600 p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : stageInfo ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Stage {stage}</h3>
              <p className="text-gray-600 mt-2">{stageInfo.explanation}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                This information is specific to your role as a {role}.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 text-center py-4">
            No information available for this stage.
          </div>
        )}
      </div>
    </div>
  );
};

export default StageInfoModal; 