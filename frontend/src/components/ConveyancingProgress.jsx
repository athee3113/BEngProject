import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';
import { propertyStageAPI, messageAPI } from '../services/api';
import { getAllowedRecipientsForRole } from '../utils/messagingAccess';
import StageInfoModal from './StageInfoModal';

// Helper to map status to emoji and text
const statusMap = {
  completed: { icon: '✅', text: 'Complete', color: '#22c55e' },
  'in-progress': { icon: '🟡', text: 'In Progress', color: '#eab308' },
  delayed: { emoji: '🔴', text: 'Delayed' },
  waiting: { emoji: '⏳', text: 'Waiting' },
  pending: { icon: '❌', text: 'Not Started', color: '#ef4444' },
};

// Add a helper to get the property-specific role for a user
function getPropertyRole(user, property) {
  if (!user.role) return '';
  let r = user.role.toLowerCase();
  if (r === 'solicitor') {
    if (user.id === property.buyer_solicitor_id) return 'buyer solicitor';
    if (user.id === property.seller_solicitor_id) return 'seller solicitor';
  }
  if (r === 'estate_agent') return 'estate agent';
  return r;
}

// Add responsibleRoleLabel helper function
const responsibleRoleLabel = (role) => {
  switch (role) {
    case 'buyer': return 'Buyer';
    case 'seller': return 'Seller';
    case 'buyer_solicitor': return 'Buyer Solicitor';
    case 'seller_solicitor': return 'Seller Solicitor';
    case 'estate_agent': return 'Estate Agent';
    default: return role ? role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
  }
};

const StepCard = ({ step, expanded, onToggle, onMessage, userRole, onEdit, propertyId, recipients, property, onAction }) => {
  const status = statusMap[step.status] || { icon: '', text: step.status, color: '#6b7280' };
  const canMessage =
    (userRole === 'buyer' || userRole === 'seller' || userRole === 'solicitor' || userRole === 'estate_agent') &&
    step.status === 'in-progress';

  const navigate = useNavigate();
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Add function to handle viewing seller-buyer chat
  const handleViewSellerBuyerChat = (e) => {
    e.stopPropagation();
    navigate(`/property/${propertyId}/stage/${step.id}/seller-buyer-chat`);
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    setShowInfoModal(true);
  };

  return (
    <div className={`bg-white rounded-2xl shadow p-6 border border-blue-100 transition-all duration-200 ${expanded ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4 w-full">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${step.status === 'completed' ? 'bg-green-100 text-green-700' : step.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
            {step.status === 'completed' ? 'Complete' : step.status === 'in-progress' ? 'In Progress' : 'Not Started'}
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-lg font-semibold text-gray-900 truncate">{step.stage}</span>
            {step.estimated_duration && (
              <span className="text-sm text-gray-500">Estimated: {step.estimated_duration}</span>
            )}
          </div>
          <div className="ml-auto flex items-center">
            <span className="text-sm text-gray-700">
              <span className="font-semibold">To be done by:</span> <span className="font-bold">{responsibleRoleLabel(step.responsible_role) || step.responsible || '-'}</span>
            </span>
          </div>
          {step.is_draft && <span className="ml-2 text-yellow-600 text-xs font-semibold">Draft</span>}
          {/* Info button for buyers and sellers */}
          {(userRole === 'buyer' || userRole === 'seller') && (
            <button
              onClick={handleInfoClick}
              className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
              title="View stage information"
            >
              ℹ️
            </button>
          )}
        </div>
        <button className="ml-auto text-2xl font-bold text-blue-400 hover:text-blue-600 transition-colors">{expanded ? '−' : '+'}</button>
      </div>
      {expanded && (
        <div className="px-0 pb-0 pt-4 text-gray-700">
          <div className="flex flex-wrap gap-6 mb-2 text-sm text-gray-500">
            <span><b>Start:</b> {step.start_date ? dayjs(step.start_date).format('DD/MM/YYYY') : '-'}</span>
            <span><b>Due:</b> {step.due_date ? dayjs(step.due_date).format('DD/MM/YYYY') : '-'}</span>
            <span><b>Completed:</b> {step.completion_date ? dayjs(step.completion_date).format('DD/MM/YYYY') : '-'}</span>
          </div>
          <div className="mb-2 text-base text-gray-700">{step.description || '-'}</div>
          {step.responsible_role && (
            <div className="mb-2 text-sm text-gray-500">
              <b>Responsible Role:</b> {responsibleRoleLabel(step.responsible_role)}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {/* Add View Seller-Buyer Chat button for Estate Agents */}
            {userRole === 'estate_agent' && (
              <button
                className="bg-purple-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-purple-700 transition-colors"
                onClick={handleViewSellerBuyerChat}
              >
                View Seller-Buyer Chat
              </button>
            )}
            {(userRole === 'solicitor' || userRole === 'estate_agent' || userRole === 'buyer_solicitor' || userRole === 'seller_solicitor') && (
              <>
                {step.status === 'in-progress' && (
                  <button 
                    className="bg-green-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-green-700 transition-colors" 
                    onClick={e => { 
                      e.stopPropagation(); 
                      onAction('complete', step);
                    }}
                  >
                    Mark as Complete
                  </button>
                )}
                {step.status === 'pending' && (
                  <button 
                    className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors" 
                    onClick={e => { 
                      e.stopPropagation(); 
                      onAction('start', step);
                    }}
                  >
                    Start Stage
                  </button>
                )}
                <button 
                  className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors" 
                  onClick={e => { 
                    e.stopPropagation(); 
                    onEdit(step); 
                  }}
                >
                  Edit Stage
                </button>
              </>
            )}
          </div>
          {recipients && recipients.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {recipients
                .filter(r => r.role !== userRole)
                .map(r => (
                  <Link
                    key={r.id}
                    to={`/property/${propertyId}/stage/${step.id}/chat/${r.id}`}
                    className="bg-blue-600 text-white rounded-md px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
                  >
                    {`Chat with ${r.name} (${getPropertyRole(r, property)})`}
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}
      {/* Stage Info Modal */}
      <StageInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        stage={step.stage}
        role={userRole.toLowerCase()}
      />
    </div>
  );
};

function ConveyancingProgress({ property, recipients = [], hideHeaderInfo = false }) {
  console.log("ConveyancingProgress component loaded");
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [expandedStep, setExpandedStep] = useState(null);
  const [filter, setFilter] = useState('all');
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageStage, setMessageStage] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [editingStep, setEditingStep] = useState(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role ? userInfo.role.toLowerCase() : '';
  const dashboardRoute =
    userRole === 'buyer' ? '/dashboard/buyer'
    : userRole === 'seller' ? '/dashboard/seller'
    : userRole === 'solicitor' ? '/dashboard/solicitor'
    : userRole === 'estate_agent' ? '/dashboard/estate-agent'
    : '/';

  // Filter recipients based on messaging access rules
  const allowedRecipients = React.useMemo(() => {
    return getAllowedRecipientsForRole(userRole, property, recipients, userInfo.id);
  }, [userRole, property, recipients, userInfo.id]);

  // Persist expanded step in sessionStorage
  useEffect(() => {
    const savedExpandedStep = sessionStorage.getItem(`expandedStep_${propertyId}`);
    if (savedExpandedStep) {
      setExpandedStep(parseInt(savedExpandedStep));
    }
  }, [propertyId]);

  useEffect(() => {
    if (expandedStep !== null) {
      sessionStorage.setItem(`expandedStep_${propertyId}`, expandedStep.toString());
    }
  }, [expandedStep, propertyId]);

  useEffect(() => {
    async function fetchStages() {
      console.log('fetchStages called');
      try {
        const stages = await propertyStageAPI.getPropertyStages(propertyId);
        console.log('Fetched stages from API:', stages);
        setProgress(stages);
      } catch (err) {
        setError('Failed to load stages');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStages();
  }, [propertyId]);

  console.log('Progress state before sorting:', progress);
  const steps = progress
    .map(step => ({ ...step }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  console.log('Sorted steps:', steps);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalCount = steps.length;
  const filteredSteps = steps.filter(step => {
    if (filter === 'all') return true;
    if (filter === 'completed') return step.status === 'completed';
    if (filter === 'in-progress') return step.status === 'in-progress';
    if (filter === 'pending') return step.status === 'pending';
    return true;
  });

  const handleSendMessage = async () => {
    setSendLoading(true);
    setSendError('');
    setSendSuccess('');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const recipient_id = userRole === 'buyer' ? selectedRecipient : 2;
      await messageAPI.sendMessage(
        userInfo.id,
        recipient_id,
        property.id,
        messageStage.id,
        messageContent
      );
      setSendSuccess('Message sent successfully!');
      setMessageContent('');
      setTimeout(() => {
        setShowMessageModal(false);
        setSendSuccess('');
      }, 1200);
    } catch (err) {
      if (Array.isArray(err)) {
        setSendError(err.map(e => e.message || JSON.stringify(e)).join(', '));
      } else if (typeof err === 'object' && err !== null) {
        setSendError(err.message || JSON.stringify(err));
      } else {
        setSendError(err || 'Failed to send message');
      }
    } finally {
      setSendLoading(false);
    }
  };

  const handleEdit = (step) => {
    setEditingStep({
      ...step,
      start_date: step.start_date ? dayjs(step.start_date).format('YYYY-MM-DD') : '',
      due_date: step.due_date ? dayjs(step.due_date).format('YYYY-MM-DD') : '',
      description: step.description || ''
    });
  };

  const handleAction = async (action, step) => {
    try {
      if (action === 'complete') {
        const idx = steps.findIndex(s => s.id === step.id);
        const updatedStage = await propertyStageAPI.updatePropertyStage(propertyId, step.id, {
          ...step,
          status: 'completed',
          completion_date: dayjs().format('YYYY-MM-DD')
        });
        setProgress(prev => {
          const updated = prev.map((s, i) => {
            if (i === idx) {
              return updatedStage;
            }
            if (i === idx + 1 && s.status === 'pending') {
              return { ...s, status: 'in-progress' };
            }
            return s;
          });
          return updated;
        });
      } else if (action === 'start') {
        const idx = steps.findIndex(s => s.id === step.id);
        const updatedStage = await propertyStageAPI.updatePropertyStage(propertyId, step.id, {
          ...step,
          status: 'in-progress',
          start_date: dayjs().format('YYYY-MM-DD')
        });
        setProgress(prev => {
          const updated = prev.map((s, i) => {
            if (i === idx) {
              return updatedStage;
            }
            return s;
          });
          return updated;
        });
      }
    } catch (err) {
      setError('Failed to update stage');
      console.error(err);
    }
  };

  return (
    <div className={hideHeaderInfo ? '' : 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50'}>
      {!hideHeaderInfo && (
        <>
          {/* Navigation */}
          <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <Link to="/dashboard/buyer" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Conveyancer
                </Link>
                <div className="flex gap-2">
                  <Link 
                    to={userRole === 'solicitor' ? `/solicitor/property/${propertyId}` : `/property/${propertyId}`} 
                    className="bg-blue-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-blue-700 transition-colors"
                  >
                    Property Dashboard
                  </Link>
                  <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('userInfo'); sessionStorage.removeItem('token'); navigate('/'); }} className="bg-blue-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-blue-700 transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
          <main className="py-10 w-full">
            <div className="max-w-5xl mx-auto px-4">
              <div className="property-header">
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-blue-100">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">{property.address}</h1>
                    {property.status && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm
                        ${property.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          property.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'}`}
                      >
                        {property.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Timeline Approval Status (if applicable) */}
              {(userRole === 'buyer_solicitor' || userRole === 'seller_solicitor') && (
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <h3 className="mb-2 text-lg font-semibold text-blue-900">Timeline Approval Status</h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Buyer Solicitor:</span>
                      <span className={`px-3 py-1 rounded-full font-semibold ${property.timeline_approved_by_buyer_solicitor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{property.timeline_approved_by_buyer_solicitor ? 'Approved' : 'Pending'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Seller Solicitor:</span>
                      <span className={`px-3 py-1 rounded-full font-semibold ${property.timeline_approved_by_seller_solicitor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{property.timeline_approved_by_seller_solicitor ? 'Approved' : 'Pending'}</span>
                    </div>
                    {property.timeline_locked && (
                      <div className="ml-auto px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">Timeline Locked</div>
                    )}
                  </div>
                  {property.timeline_locked ? (
                    <div className="mt-4 bg-red-100 text-red-800 p-4 rounded-lg font-semibold flex items-center gap-2">
                      <span role="img" aria-label="locked">🔒</span>
                      Timeline is <b>closed</b>. No further changes can be made to the stages.
                    </div>
                  ) : (
                    <div className="mt-4 bg-green-100 text-green-800 p-4 rounded-lg font-semibold flex items-center gap-2">
                      <span role="img" aria-label="unlocked">🟢</span>
                      Timeline is <b>open</b>. Stages can be edited.
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </>
      )}
      {/* Always show progress summary, progress bar, and filter buttons */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-end items-center mb-4">
          <div className="text-blue-700 font-bold text-lg tracking-wide">
            Approximate Completion: {property.completion_date
              ? dayjs(property.completion_date).format('MMM YYYY')
              : dayjs().format('MMM YYYY')}
          </div>
        </div>
        <div className="progress-summary-bar">
          <div className="progress-summary-text">{completedCount} of {steps.length} steps completed</div>
          <div className="progress-summary-bar-bg flex mb-2" style={{ height: '16px' }}>
            {steps.map((step, idx) => (
              <div
                key={step.id || idx}
                style={{
                  flex: 1,
                  background: step.status === 'completed' ? '#2563eb' : '#e5e7eb',
                  borderLeft: idx !== 0 ? '2px solid #fff' : 'none',
                  borderRadius:
                    idx === 0
                      ? '8px 0 0 8px'
                      : idx === steps.length - 1
                      ? '0 8px 8px 0'
                      : '0',
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 mb-8 mt-2">
            <button className={`bg-blue-600 text-white rounded-md px-4 py-2 font-medium transition-colors duration-200 ${filter === 'all' ? 'shadow' : 'bg-opacity-70 hover:bg-blue-700'}`} onClick={() => setFilter('all')}>All</button>
            <button className={`bg-blue-600 text-white rounded-md px-4 py-2 font-medium transition-colors duration-200 ${filter === 'pending' ? 'shadow' : 'bg-opacity-70 hover:bg-blue-700'}`} onClick={() => setFilter('pending')}>Not Started</button>
            <button className={`bg-blue-600 text-white rounded-md px-4 py-2 font-medium transition-colors duration-200 ${filter === 'in-progress' ? 'shadow' : 'bg-opacity-70 hover:bg-blue-700'}`} onClick={() => setFilter('in-progress')}>Ongoing</button>
            <button className={`bg-blue-600 text-white rounded-md px-4 py-2 font-medium transition-colors duration-200 ${filter === 'completed' ? 'shadow' : 'bg-opacity-70 hover:bg-blue-700'}`} onClick={() => setFilter('completed')}>Completed</button>
          </div>
        </div>
        {/* Stepper (original layout and logic) */}
        <div className="flex flex-col space-y-6">
          {filteredSteps.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              expanded={expandedStep === idx}
              onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
              onMessage={handleSendMessage}
              userRole={userRole}
              onEdit={handleEdit}
              onAction={handleAction}
              propertyId={propertyId}
              recipients={allowedRecipients}
              property={property}
            />
          ))}
        </div>
      </div>
      {/* Edit Modal */}
      {editingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Stage: {editingStep.stage}</h2>
            <label className="block mb-2 font-medium">Start Date:
              <input type="date" value={editingStep.start_date} onChange={e => setEditingStep({ ...editingStep, start_date: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>
            <label className="block mb-2 font-medium">Due Date:
              <input type="date" value={editingStep.due_date} onChange={e => setEditingStep({ ...editingStep, due_date: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>
            <label className="block mb-4 font-medium">Description:
              <textarea value={editingStep.description} onChange={e => setEditingStep({ ...editingStep, description: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
            </label>
            <div className="flex gap-2 mt-4">
              <button className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors" onClick={async () => {
                try {
                  await propertyStageAPI.updatePropertyStage(propertyId, editingStep.id, {
                    ...editingStep,
                    start_date: editingStep.start_date,
                    due_date: editingStep.due_date,
                    description: editingStep.description,
                  });
                  setEditingStep(null);
                  // Refresh stages
                  const stages = await propertyStageAPI.getPropertyStages(propertyId);
                  setProgress(stages);
                } catch (error) {
                  console.error('Failed to update stage:', error);
                  setError('Failed to update stage. Please try again.');
                }
              }}>
                Save
              </button>
              <button className="bg-gray-200 text-gray-800 rounded-md px-4 py-2 font-semibold hover:bg-gray-300 transition-colors" onClick={() => setEditingStep(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Send Message for Stage: {messageStage?.stage}</h2>
            {userRole === 'buyer' && allowedRecipients.length > 0 && (
              <label className="block mb-4 font-medium">Recipient:
                <select value={selectedRecipient} onChange={e => setSelectedRecipient(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2">
                  {allowedRecipients.map(r => (
                    <option key={r.id} value={r.id}>{r.role}: {r.name}</option>
                  ))}
                </select>
              </label>
            )}
            <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} placeholder="Type your message here..." rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2" />
            {sendError && <div className="text-red-600 mb-2">{sendError}</div>}
            {sendSuccess && <div className="text-green-600 mb-2">{sendSuccess}</div>}
            <div className="flex gap-2 mt-4">
              <button className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors" onClick={handleSendMessage} disabled={sendLoading || !messageContent}>
                {sendLoading ? 'Sending...' : 'Send'}
              </button>
              <button className="bg-gray-200 text-gray-800 rounded-md px-4 py-2 font-semibold hover:bg-gray-300 transition-colors" onClick={() => setShowMessageModal(false)} disabled={sendLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConveyancingProgress; 