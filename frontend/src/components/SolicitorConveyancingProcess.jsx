import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';
import { propertyStageAPI, messageAPI, userAPI } from '../services/api';
import { getAllowedRecipientsForRole } from '../utils/messagingAccess';
import { Toaster, toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const statusMap = {
  completed: { icon: '✅', text: 'Complete', color: '#22c55e' },
  'in-progress': { icon: '🟡', text: 'In Progress', color: '#eab308' },
  delayed: { emoji: '🔴', text: 'Delayed' },
  waiting: { emoji: '⏳', text: 'Waiting' },
  pending: { icon: '❌', text: 'Not Started', color: '#ef4444' },
};

const responsibleRoleLabel = (role) => {
  switch (role) {
    case 'buyer': return 'Buyer';
    case 'seller': return 'Seller';
    case 'buyer_solicitor': return 'Buyer Solicitor';
    case 'seller_solicitor': return 'Seller Solicitor';
    case 'estate_agent': return 'Estate Agent';
    case 'both_solicitors': return 'Both Solicitors';
    case 'client': return 'Client';
    case 'agent': return 'Estate Agent';
    default: return role ? role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
  }
};

const SolicitorStepCard = ({ step, expanded, onToggle, onAction, isEditing, onEditChange, onEditSave, onEditCancel, editValues, onMessage, userRole, propertyId, recipients, stageEstimates, userInfo, property }) => {
  const navigate = useNavigate();
  const allowedRoles = ['buyer', 'seller', 'solicitor', 'estate agent'];

  const status = statusMap[step.status] || { icon: '', text: step.status, color: '#6b7280' };
  const canMessage =
    userRole && allowedRoles.some(role => userRole.toLowerCase().includes(role)) &&
    step.status === 'in-progress';
  
  console.log('Recipients:', recipients);
  console.log('Current userInfo:', userInfo);
  const chatButtons = React.useMemo(() => {
    if (!userRole || !userRole.toLowerCase().includes('solicitor') || !recipients || recipients.length === 0) {
      return null;
    }
    return (
      <div style={{ marginTop: '20px', padding: '10px', background: '#e6f3ff', borderRadius: '4px' }}>
        <h4 style={{ marginBottom: '10px' }}>Chat Options</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {recipients.filter(r => r.id !== userInfo.id).map(r => {
            console.log('Chat button for:', r.name, getPropertyRole(r, property));
            return (
              <button
                key={r.id}
                onClick={() => {
                  sessionStorage.setItem(`expandedStep_${propertyId}`, expanded ? expanded.toString() : '');
                  sessionStorage.setItem(`allowedRecipients_${propertyId}`, JSON.stringify(recipients));
                  navigate(`/property/${propertyId}/stage/${step.id}/chat/${r.id}`);
                }}
                className="view-chat-btn"
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'inline-block',
                  marginBottom: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {`Chat with ${r.name} (${getPropertyRole(r, property)})`}
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [userRole, recipients, propertyId, step.id, property, expanded, navigate, userInfo.id]);

  // Add validation for edit form
  const isEditFormValid = editValues.startDate && editValues.dueDate && editValues.description && editValues.responsibleRole;

  return (
    <div className={`bg-white rounded-2xl shadow p-6 border border-blue-100 transition-all duration-200 ${expanded ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4 w-full">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${step.status === 'completed' ? 'bg-green-100 text-green-700' : step.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{step.status === 'completed' ? 'Complete' : step.status === 'in-progress' ? 'In Progress' : 'Not Started'}</span>
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
          {chatButtons}
          <div className="step-actions">
            <div className="flex gap-2 mt-2">
              {step.status === 'pending' && (
                <button
                  className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
                  onClick={e => { e.stopPropagation(); onAction('start', step); }}
                >
                  Start Stage
                </button>
              )}
              {step.status === 'in-progress' && (
                <button
                  className="bg-green-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-green-700 transition-colors"
                  onClick={e => { e.stopPropagation(); onAction('complete', step); }}
                >
                  Mark as Complete
                </button>
              )}
              {/* Only show Edit and Delete if timeline is not locked */}
              {!property.timeline_locked && (
                <>
                  <button
                    className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
                    onClick={e => { e.stopPropagation(); isEditing ? onEditSave() : onAction('edit', step); }}
                  >
                    Edit Stage
                  </button>
                  <button
                    className="bg-red-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-red-700 transition-colors"
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this stage?')) {
                        onAction('delete', step);
                      }
                    }}
                  >
                    Delete Stage
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getPropertyRole(user, property) {
  if (!user.role) return '';
  let r = user.role.toLowerCase();
  if (r === 'solicitor') {
    if (user.id === property.buyer_solicitor_id) return 'Buyer Solicitor';
    if (user.id === property.seller_solicitor_id) return 'Seller Solicitor';
    return 'Solicitor';
  }
  if (r === 'estate_agent') return 'Estate Agent';
  if (r === 'buyer') return 'Buyer';
  if (r === 'seller') return 'Seller';
  return user.role.charAt(0).toUpperCase() + user.role.slice(1);
}

// Add new CreateStageForm component
const CreateStageForm = ({ onSubmit, onCancel, steps = [] }) => {
  const [formData, setFormData] = useState({
    stage: '',
    description: '',
    responsible_role: '',
    start_date: '',
    due_date: '',
    is_draft: false,
    order: steps.length // default to end
  });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validation: all fields except is_draft must be filled
  const isFormValid = formData.stage && formData.description && formData.responsible_role && formData.start_date && formData.due_date;

  return (
    <div className="create-stage-form" style={{
      padding: '1rem',
      background: '#f8fafc',
      borderRadius: '0.5rem',
      marginBottom: '1rem'
    }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Create New Stage</h3>
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Stage Name</label>
        <input
          type="text"
          value={formData.stage}
          onChange={(e) => handleChange('stage', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #e5e7eb'
          }}
        />
      </div>
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #e5e7eb',
            minHeight: '80px'
          }}
        />
      </div>
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Responsible Role</label>
        <select
          value={formData.responsible_role}
          onChange={(e) => handleChange('responsible_role', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #e5e7eb'
          }}
        >
          <option value="">Select Role</option>
          <option value="buyer_solicitor">Buyer Solicitor</option>
          <option value="seller_solicitor">Seller Solicitor</option>
          <option value="both_solicitors">Both Solicitors</option>
          <option value="client">Client</option>
          <option value="agent">Estate Agent</option>
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Start Date</label>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => handleChange('start_date', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #e5e7eb'
          }}
        />
      </div>
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Due Date</label>
        <input
          type="date"
          value={formData.due_date}
          onChange={(e) => handleChange('due_date', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #e5e7eb'
          }}
        />
      </div>
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Position</label>
        <select
          value={formData.order}
          onChange={e => handleChange('order', parseInt(e.target.value, 10))}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e5e7eb' }}
        >
          {Array.from({ length: steps.length + 1 }, (_, i) => (
            <option key={i} value={i}>{`Position ${i + 1}`}</option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={formData.is_draft}
            onChange={(e) => handleChange('is_draft', e.target.checked)}
          />
          Mark as Draft
        </label>
      </div>
      <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => {
            if (!isFormValid) {
              setError('All fields must be filled to create a stage.');
              return;
            }
            setError('');
            onSubmit(formData);
          }}
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: isFormValid ? 'pointer' : 'not-allowed', opacity: isFormValid ? 1 : 0.6 }}
          disabled={!isFormValid}
        >
          Create Stage
        </button>
        <button
          onClick={onCancel}
          style={{
            background: '#e5e7eb',
            color: '#374151',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
      {!isFormValid && error && <div style={{color: 'red', marginTop: 8}}>{error}</div>}
    </div>
  );
};

function SolicitorConveyancingProcess({ property: initialProperty, recipients: initialRecipients, showHeaderOnly = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { propertyId } = useParams();
  const [expandedStep, setExpandedStep] = useState(() => {
    const saved = sessionStorage.getItem(`expandedStep_${propertyId}`);
    return saved ? parseInt(saved) : null;
  });
  const [filter, setFilter] = useState('all');
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localProperty, setLocalProperty] = useState(initialProperty);
  const [localRecipients, setLocalRecipients] = useState(initialRecipients);
  const [allowedRecipients, setAllowedRecipients] = useState([]);
  const [editingStepId, setEditingStepId] = useState(null);
  const [editValues, setEditValues] = useState({
    startDate: '',
    dueDate: '',
    description: '',
    responsibleRole: '',
    isDraft: false
  });
  const [isCreatingStage, setIsCreatingStage] = useState(false);

  // Add new timeline approval state
  const [timelineState, setTimelineState] = useState({
    isLoading: false,
    error: null,
    success: null,
    buyerSolicitorApproved: localProperty?.timeline_approved_by_buyer_solicitor || false,
    sellerSolicitorApproved: localProperty?.timeline_approved_by_seller_solicitor || false,
    isLocked: localProperty?.timeline_locked || false,
    comment: ''
  });

  // Add state for message form
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messagePending, setMessagePending] = useState(false);
  const [messageStatus, setMessageStatus] = useState('');
  const [chatStageId, setChatStageId] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role;

  // Robust solicitor check
  const isSolicitor =
    (userRole && (
      userRole.toLowerCase() === 'buyer solicitor' ||
      userRole.toLowerCase() === 'seller solicitor' ||
      (userInfo.id && localProperty && (
        userInfo.id === localProperty.buyer_solicitor_id ||
        userInfo.id === localProperty.seller_solicitor_id
      ))
    ));

  // Debug log
  console.log('userRole:', userRole, 'userInfo:', userInfo, 'localProperty:', localProperty);

  // Save expanded step to session storage
  useEffect(() => {
    if (expandedStep !== null) {
      sessionStorage.setItem(`expandedStep_${propertyId}`, expandedStep.toString());
    }
  }, [expandedStep, propertyId]);

  // Fetch timeline state
  const fetchTimelineState = async () => {
    try {
      const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch timeline state');
      
      const data = await response.json();
      console.log('Timeline state from API:', {
        isLocked: data.timeline_locked,
        buyerSolicitorApproved: data.timeline_approved_by_buyer_solicitor,
        sellerSolicitorApproved: data.timeline_approved_by_seller_solicitor,
        propertyId: data.id,
        buyerSolicitorId: data.buyer_solicitor_id,
        sellerSolicitorId: data.seller_solicitor_id,
        currentUserId: userInfo.id
      });
      
      setTimelineState({
        isLocked: Boolean(data.timeline_locked),
        buyerSolicitorApproved: Boolean(data.timeline_approved_by_buyer_solicitor),
        sellerSolicitorApproved: Boolean(data.timeline_approved_by_seller_solicitor),
        isLoading: false,
        error: null,
        success: null
      });
    } catch (err) {
      console.error('Error fetching timeline state:', err);
      setTimelineState(prev => ({
        ...prev,
        error: err.message,
        isLoading: false
      }));
    }
  };

  // Fetch timeline state on mount and when propertyId changes
  useEffect(() => {
    fetchTimelineState();
  }, [propertyId]);

  // Fetch data on mount and when propertyId changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch property data
        const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch property');
        const propertyData = await response.json();
        
        // Initialize timeline state with default values if not present
        const initializedPropertyData = {
          ...propertyData,
          timeline_locked: Boolean(propertyData.timeline_locked),
          timeline_approved_by_buyer_solicitor: Boolean(propertyData.timeline_approved_by_buyer_solicitor),
          timeline_approved_by_seller_solicitor: Boolean(propertyData.timeline_approved_by_seller_solicitor)
        };
        
        console.log('Initialized property data:', initializedPropertyData);
        setLocalProperty(initializedPropertyData);

        // Fetch recipients
        const recipientIds = [
          propertyData.buyer_id,
          propertyData.buyer_solicitor_id,
          propertyData.seller_solicitor_id,
          propertyData.estate_agent_id,
          propertyData.seller_id
        ].filter(id => id !== null && id !== undefined);

        const recipientDetails = await Promise.all(
          recipientIds.map(id => userAPI.getUser(id))
        );

        const formattedRecipients = recipientDetails.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        }));

        setLocalRecipients(formattedRecipients);

        // Calculate allowed recipients
        const allowedRecipients = getAllowedRecipientsForRole(userRole, initializedPropertyData, formattedRecipients, userInfo.id);
        setAllowedRecipients(allowedRecipients);

        // Fetch stages
        const stages = await propertyStageAPI.getPropertyStages(propertyId);
        setProgress(stages);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId, userRole, userInfo.id]);

  // Add refresh function
  const refreshPropertyData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch property');
      const propertyData = await response.json();
      
      const initializedPropertyData = {
        ...propertyData,
        timeline_locked: Boolean(propertyData.timeline_locked),
        timeline_approved_by_buyer_solicitor: Boolean(propertyData.timeline_approved_by_buyer_solicitor),
        timeline_approved_by_seller_solicitor: Boolean(propertyData.timeline_approved_by_seller_solicitor)
      };
      
      console.log('Refreshed property data:', initializedPropertyData);
      setLocalProperty(initializedPropertyData);
    } catch (err) {
      console.error('Error refreshing property data:', err);
      setError(err.message);
    }
  };

  // Update state when props change
  useEffect(() => {
    if (initialProperty && initialRecipients) {
      // Initialize timeline state with default values if not present
      const initializedProperty = {
        ...initialProperty,
        timeline_locked: Boolean(initialProperty.timeline_locked),
        timeline_approved_by_buyer_solicitor: Boolean(initialProperty.timeline_approved_by_buyer_solicitor),
        timeline_approved_by_seller_solicitor: Boolean(initialProperty.timeline_approved_by_seller_solicitor)
      };
      
      console.log('Initialized property from props:', initializedProperty);
      setLocalProperty(initializedProperty);
      setLocalRecipients(initialRecipients);
      const allowedRecipients = getAllowedRecipientsForRole(userRole, initializedProperty, initialRecipients, userInfo.id);
      setAllowedRecipients(allowedRecipients);
    }
  }, [initialProperty, initialRecipients, userRole, userInfo.id]);

  // Handle navigation state
  useEffect(() => {
    // Only reset state if we're navigating to a different property
    if (!location.pathname.includes(`/property/${propertyId}/`)) {
      setExpandedStep(null);
      setEditingStepId(null);
      setEditValues({
        startDate: '',
        dueDate: '',
        description: '',
        responsibleRole: '',
        isDraft: false
      });
    }
  }, [location.pathname, propertyId]);

  const handleEditChange = (field, value) => {
    console.log('Edit change:', field, value);
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSave = async () => {
    try {
      const editingStep = steps.find(s => s.id === editingStepId);
      if (!editingStep) return;
      // Add validation here as well (defensive)
      if (!editValues.startDate || !editValues.dueDate || !editValues.description || !editValues.responsibleRole) {
        setError('All fields must be filled to save.');
        return;
      }
      const updatedStage = await propertyStageAPI.updatePropertyStage(propertyId, editingStep.id, {
        ...editingStep,
        start_date: editValues.startDate,
        due_date: editValues.dueDate,
        description: editValues.description,
        responsible_role: editValues.responsibleRole,
        is_draft: editValues.isDraft
      });
      // Fetch latest stages from backend to ensure UI is up to date
      const updatedStages = await propertyStageAPI.getPropertyStages(propertyId);
      setProgress(updatedStages);
      setEditingStepId(null);
    } catch (err) {
      setError('Failed to update stage');
      console.error(err);
    }
  };

  const handleEditCancel = () => {
    setEditingStepId(null);
  };

  console.log('localProperty:', localProperty);
  console.log('userInfo:', userInfo);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!localProperty) {
    console.log('Early return: localProperty is null');
    return null;
  }

  const stageOrder = [
    "Offer Accepted",
    "Instruct Solicitor",
    "Client ID Verification",
    "Draft Contract Issued",
    "Searches Ordered",
    "Searches Received & Reviewed",
    "Survey Booked",
    "Survey Completed",
    "Mortgage Offer Received",
    "Enquiries Raised",
    "Enquiries Answered",
    "Contract Approved",
    "Deposit Paid",
    "Exchange of Contracts",
    "Final Arrangements",
    "Completion",
    "Stamp Duty Payment",
    "Land Registry Submission",
    "Handover Materials Provided",
    "Final Report to Client"
  ];
  const stageEstimates = {
    "Offer Accepted": "1 day",
    "Instruct Solicitor": "2 days",
    "Client ID Verification": "2 days",
    "Draft Contract Issued": "3 days",
    "Searches Ordered": "5 days",
    "Searches Received & Reviewed": "7 days",
    "Survey Booked": "2 days",
    "Survey Completed": "3 days",
    "Mortgage Offer Received": "7 days",
    "Enquiries Raised": "3 days",
    "Enquiries Answered": "5 days",
    "Contract Approved": "2 days",
    "Deposit Paid": "1 day",
    "Exchange of Contracts": "2 days",
    "Final Arrangements": "2 days",
    "Completion": "1 day",
    "Stamp Duty Payment": "1 day",
    "Land Registry Submission": "3 days",
    "Handover Materials Provided": "1 day",
    "Final Report to Client": "1 day"
  };

  const steps = progress
    .map(step => ({ ...step }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Debug: Log steps before rendering to check for duplicates
  console.log('steps:', steps.map(s => ({ id: s.id, stage: s.stage })));

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalCount = steps.length;
  const filteredSteps = steps.filter(step => {
    if (filter === 'all') return true;
    if (filter === 'completed') return step.status === 'completed';
    if (filter === 'in-progress') return step.status === 'in-progress';
    if (filter === 'pending') return step.status === 'pending';
    return true;
  });

  console.log('Rendering step cards with allowedRecipients:', allowedRecipients);

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
      } else if (action === 'edit') {
        setEditingStepId(step.id);
        setEditValues({
          startDate: step.start_date || '',
          dueDate: step.due_date || '',
          description: step.description || '',
          responsibleRole: step.responsible_role || '',
          isDraft: step.is_draft || false
        });
      } else if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this stage?')) {
          await propertyStageAPI.deletePropertyStage(propertyId, step.id);
          setProgress(prev => prev.filter(s => s.id !== step.id));
        }
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
            if (i === idx - 1 && s.status === 'pending') {
              return { ...s, status: 'in-progress' };
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

  // New timeline approval handler
  const handleTimelineApproval = async () => {
    if (!localProperty) return;

    // Check if timeline is already locked
    if (localProperty.timeline_locked) {
      toast.error('Timeline is already locked and cannot be modified');
      return;
    }

    // Check if the solicitor has already approved
    const isBuyerSolicitor = userInfo.id === localProperty.buyer_solicitor_id;
    if ((isBuyerSolicitor && localProperty.timeline_approved_by_buyer_solicitor) ||
        (!isBuyerSolicitor && localProperty.timeline_approved_by_seller_solicitor)) {
      toast.error('You have already approved this timeline');
      return;
    }

    setTimelineState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: null
    }));

    try {
      const updatedProperty = await propertyStageAPI.approveTimeline(
        localProperty.id,
        isBuyerSolicitor,
        timelineState.comment
      );

      setLocalProperty(updatedProperty);
      setTimelineState(prev => ({
        ...prev,
        isLoading: false,
        success: 'Timeline approved successfully',
        buyerSolicitorApproved: updatedProperty.timeline_approved_by_buyer_solicitor,
        sellerSolicitorApproved: updatedProperty.timeline_approved_by_seller_solicitor,
        isLocked: updatedProperty.timeline_locked,
        comment: ''
      }));

      // Show success message
      toast.success('Timeline approved successfully');

      // If both solicitors have approved, show a special message
      if (updatedProperty.timeline_locked) {
        toast.success('Timeline has been locked by both solicitors');
      }

      // Explicitly refresh state from backend after approval
      await fetchTimelineState();
      await fetchData();

    } catch (error) {
      console.error('Error approving timeline:', error);
      const errorMessage = error.message || 'Failed to approve timeline';
      setTimelineState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  };

  const handleCreateStage = async (stageData) => {
    try {
      const newStage = await propertyStageAPI.createPropertyStage(propertyId, {
        ...stageData,
        status: 'pending',
        order: stageData.order // Use the selected order from the form
      });
      // Fetch latest stages from backend to ensure correct order
      const updatedStages = await propertyStageAPI.getPropertyStages(propertyId);
      setProgress(updatedStages);
      setIsCreatingStage(false);
    } catch (err) {
      setError('Failed to create stage');
      console.error(err);
    }
  };

  // Add a debug reset function and button
  const handleDebugReset = async () => {
    try {
      const response = await fetch(`http://localhost:8000/properties/${propertyId}/reset-stages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to reset stages');
      toast.success('Stages and timeline reset!');
      // Optionally, refresh data
      window.location.reload();
    } catch (err) {
      toast.error('Reset failed: ' + err.message);
    }
  };

  // Function to send message (buyer/seller)
  const handleSendMessage = async (stageId) => {
    setMessagePending(true);
    setMessageStatus('');
    try {
      const response = await fetch(`http://localhost:8000/properties/${propertyId}/stages/${stageId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageText })
      });
      if (!response.ok) throw new Error('Failed to send message');
      setMessageStatus('Message sent for agent approval.');
      setMessageText('');
      setShowMessageForm(false);
    } catch (err) {
      setMessageStatus('Failed to send message: ' + err.message);
    } finally {
      setMessagePending(false);
    }
  };

  // Add unlock handler
  const handleUnlockTimeline = async () => {
    try {
      await propertyStageAPI.unlockTimeline(localProperty.id);
      toast.success('Timeline unlocked!');
      await fetchTimelineState();
      await refreshPropertyData();
    } catch (err) {
      toast.error('Failed to unlock timeline: ' + (err?.message || err));
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(steps);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    // Update UI immediately
    setProgress(reordered);
    // Call backend to persist order
    try {
      await propertyStageAPI.reorderStages(propertyId, reordered.map(s => s.id));
      toast.success('Stages reordered!');
    } catch (err) {
      toast.error('Failed to reorder: ' + (err?.message || err));
    }
  };

  if (showHeaderOnly) {
    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        {/* Reset Timeline Button */}
        <button
          style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, fontSize: 12, padding: '4px 8px', background: '#f59e42', color: 'white', borderRadius: 4, border: 'none', opacity: 0.7, cursor: 'pointer' }}
          onClick={handleDebugReset}
          title="Reset stages and unlock timeline (debug)"
        >
          Reset Timeline
        </button>
        {/* Timeline Approval Status (if applicable) */}
        {(userRole === 'Buyer Solicitor' || userRole === 'Seller Solicitor' || userRole === 'solicitor') && (
          <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">Timeline Approval Status</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">Buyer Solicitor:</span>
                <span className={`px-3 py-1 rounded-full font-semibold ${localProperty.timeline_approved_by_buyer_solicitor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{localProperty.timeline_approved_by_buyer_solicitor ? 'Approved' : 'Pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Seller Solicitor:</span>
                <span className={`px-3 py-1 rounded-full font-semibold ${localProperty.timeline_approved_by_seller_solicitor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{localProperty.timeline_approved_by_seller_solicitor ? 'Approved' : 'Pending'}</span>
              </div>
              {localProperty.timeline_locked && (
                <div className="ml-auto px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">Timeline Locked</div>
              )}
            </div>
            {localProperty.timeline_locked ? (
              <>
                <div className="mt-4 bg-red-100 text-red-800 p-4 rounded-lg font-semibold flex items-center gap-2">
                  <span role="img" aria-label="locked">🔒</span>
                  Timeline is <b>closed</b>. No further changes can be made to the stages.
                </div>
                {isSolicitor && (
                  <button
                    className="mt-4 bg-yellow-500 text-white rounded-md px-4 py-2 font-semibold hover:bg-yellow-600 transition-colors"
                    onClick={handleUnlockTimeline}
                  >
                    Unlock Timeline
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="mt-4 bg-green-100 text-green-800 p-4 rounded-lg font-semibold flex items-center gap-2">
                  <span role="img" aria-label="unlocked">🟢</span>
                  Timeline is <b>open</b>. Stages can be edited.
                </div>
                {/* Approve Timeline Button */}
                {userRole && userRole.toLowerCase().includes('solicitor') &&
                  !((userInfo.id === localProperty.buyer_solicitor_id && localProperty.timeline_approved_by_buyer_solicitor) ||
                    (userInfo.id === localProperty.seller_solicitor_id && localProperty.timeline_approved_by_seller_solicitor)) && (
                  <button
                    className="mt-4 bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
                    onClick={handleTimelineApproval}
                  >
                    Approve Timeline
                  </button>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex justify-end items-center mb-4">
          <div className="text-blue-700 font-bold text-lg tracking-wide">
            Approximate Completion: {localProperty.completion_date
              ? dayjs(localProperty.completion_date).format('MMM YYYY')
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
        <div className="flex flex-col space-y-6">
          {localProperty && !localProperty.timeline_locked ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="stages-droppable">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {filteredSteps.map((step, idx) => (
                      <Draggable key={step.id} draggableId={String(step.id)} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              marginBottom: '1.5rem',
                              boxShadow: snapshot.isDragging ? '0 4px 16px rgba(37,99,235,0.15)' : undefined
                            }}
                          >
                            <SolicitorStepCard
                              step={step}
                              expanded={expandedStep === idx}
                              onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
                              onAction={handleAction}
                              isEditing={editingStepId === step.id}
                              onEditChange={handleEditChange}
                              onEditSave={handleEditSave}
                              onEditCancel={handleEditCancel}
                              editValues={editValues}
                              userRole={userRole}
                              propertyId={propertyId}
                              recipients={localRecipients}
                              stageEstimates={stageEstimates}
                              userInfo={userInfo}
                              property={localProperty}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            filteredSteps.map((step, idx) => (
              <SolicitorStepCard
                key={step.id ? `${step.id}-${idx}` : idx}
                step={step}
                expanded={expandedStep === idx}
                onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
                onAction={handleAction}
                isEditing={editingStepId === step.id}
                onEditChange={handleEditChange}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                editValues={editValues}
                userRole={userRole}
                propertyId={propertyId}
                recipients={localRecipients}
                stageEstimates={stageEstimates}
                userInfo={userInfo}
                property={localProperty}
              />
            ))
          )}
        </div>
        {/* Add New Stage Button (robust role check) */}
        {userRole && (userRole.toLowerCase().includes('solicitor') || userRole.toLowerCase().includes('estate agent')) && !localProperty.timeline_locked && !isCreatingStage && (
          <div className="flex justify-center mt-8 mb-6">
            <button
              className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => setIsCreatingStage(true)}
            >
              Add New Stage
            </button>
          </div>
        )}
        {/* Show CreateStageForm when isCreatingStage is true and timeline is not locked */}
        {isCreatingStage && !localProperty.timeline_locked && (
          <CreateStageForm
            onSubmit={async (formData) => {
              try {
                await handleCreateStage(formData);
              } catch (err) {
                setError('Failed to create stage: ' + (err?.message || err));
              }
            }}
            onCancel={() => setIsCreatingStage(false)}
            steps={steps}
          />
        )}
        {/* Show error if present */}
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4 font-semibold">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Debug Reset Button */}
      <button
        style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000, fontSize: 12, padding: '4px 8px', background: '#f59e42', color: 'white', borderRadius: 4, border: 'none', opacity: 0.7, cursor: 'pointer' }}
        onClick={handleDebugReset}
        title="Reset stages and unlock timeline (debug)"
      >
        Reset Timeline
      </button>
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard/solicitor" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Conveyancer
            </Link>
            <div className="flex gap-2">
              <Link 
                to={`/solicitor/property/${propertyId}`} 
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
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">{localProperty.address}</h1>
                {localProperty.status && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm
                    ${localProperty.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      localProperty.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'}`}
                  >
                    {localProperty.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Timeline Approval Status (if applicable) */}
          {(userRole === 'Buyer Solicitor' || userRole === 'Seller Solicitor' || userRole === 'solicitor') && (
            <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="mb-2 text-lg font-semibold text-blue-900">Timeline Approval Status</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Buyer Solicitor:</span>
                  <span className={`px-3 py-1 rounded-full font-semibold ${localProperty.timeline_approved_by_buyer_solicitor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{localProperty.timeline_approved_by_buyer_solicitor ? 'Approved' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Seller Solicitor:</span>
                  <span className={`px-3 py-1 rounded-full font-semibold ${localProperty.timeline_approved_by_seller_solicitor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{localProperty.timeline_approved_by_seller_solicitor ? 'Approved' : 'Pending'}</span>
                </div>
                {localProperty.timeline_locked && (
                  <div className="ml-auto px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">Timeline Locked</div>
                )}
              </div>
              {localProperty.timeline_locked ? (
                <>
                  <div className="mt-4 bg-red-100 text-red-800 p-4 rounded-lg font-semibold flex items-center gap-2">
                    <span role="img" aria-label="locked">🔒</span>
                    Timeline is <b>closed</b>. No further changes can be made to the stages.
                  </div>
                  {isSolicitor && (
                    <button
                      className="mt-4 bg-yellow-500 text-white rounded-md px-4 py-2 font-semibold hover:bg-yellow-600 transition-colors"
                      onClick={handleUnlockTimeline}
                    >
                      Unlock Timeline
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-4 bg-green-100 text-green-800 p-4 rounded-lg font-semibold flex items-center gap-2">
                    <span role="img" aria-label="unlocked">🟢</span>
                    Timeline is <b>open</b>. Stages can be edited.
                  </div>
                  {/* Approve Timeline Button */}
                  {userRole && userRole.toLowerCase().includes('solicitor') &&
                    !((userInfo.id === localProperty.buyer_solicitor_id && localProperty.timeline_approved_by_buyer_solicitor) ||
                      (userInfo.id === localProperty.seller_solicitor_id && localProperty.timeline_approved_by_seller_solicitor)) && (
                    <button
                      className="mt-4 bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
                      onClick={handleTimelineApproval}
                    >
                      Approve Timeline
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          {/* Progress Count */}
          <div className="flex justify-end items-center mb-4">
            <div className="text-blue-700 font-bold text-lg tracking-wide">
              Approximate Completion: {localProperty.completion_date
                ? dayjs(localProperty.completion_date).format('MMM YYYY')
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
          {/* Stepper */}
          <div className="flex flex-col space-y-6">
            {localProperty && !localProperty.timeline_locked ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stages-droppable">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {filteredSteps.map((step, idx) => (
                        <Draggable key={step.id} draggableId={String(step.id)} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                marginBottom: '1.5rem',
                                boxShadow: snapshot.isDragging ? '0 4px 16px rgba(37,99,235,0.15)' : undefined
                              }}
                            >
                              <SolicitorStepCard
                                step={step}
                                expanded={expandedStep === idx}
                                onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
                                onAction={handleAction}
                                isEditing={editingStepId === step.id}
                                onEditChange={handleEditChange}
                                onEditSave={handleEditSave}
                                onEditCancel={handleEditCancel}
                                editValues={editValues}
                                userRole={userRole}
                                propertyId={propertyId}
                                recipients={localRecipients}
                                stageEstimates={stageEstimates}
                                userInfo={userInfo}
                                property={localProperty}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              filteredSteps.map((step, idx) => (
                <SolicitorStepCard
                  key={step.id ? `${step.id}-${idx}` : idx}
                  step={step}
                  expanded={expandedStep === idx}
                  onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
                  onAction={handleAction}
                  isEditing={editingStepId === step.id}
                  onEditChange={handleEditChange}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  editValues={editValues}
                  userRole={userRole}
                  propertyId={propertyId}
                  recipients={localRecipients}
                  stageEstimates={stageEstimates}
                  userInfo={userInfo}
                  property={localProperty}
                />
              ))
            )}
          </div>
          {/* Add New Stage Button (robust role check) */}
          {userRole && (userRole.toLowerCase().includes('solicitor') || userRole.toLowerCase().includes('estate agent')) && !localProperty.timeline_locked && !isCreatingStage && (
            <div className="flex justify-center mt-8 mb-6">
              <button
                className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => setIsCreatingStage(true)}
              >
                Add New Stage
              </button>
            </div>
          )}
          {/* Show CreateStageForm when isCreatingStage is true and timeline is not locked */}
          {isCreatingStage && !localProperty.timeline_locked && (
            <CreateStageForm
              onSubmit={async (formData) => {
                try {
                  await handleCreateStage(formData);
                } catch (err) {
                  setError('Failed to create stage: ' + (err?.message || err));
                }
              }}
              onCancel={() => setIsCreatingStage(false)}
              steps={steps}
            />
          )}
          {/* Show error if present */}
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded mb-4 font-semibold">{error}</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SolicitorConveyancingProcess; 