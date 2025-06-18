import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { fileAPI } from '../services/api'
import MyTasks from './MyTasks'
import dayjs from 'dayjs'
import { HomeIcon, BellIcon, DocumentTextIcon, ClipboardDocumentCheckIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { propertyStageAPI } from '../services/api'
import { getAllowedRecipientsForRole } from '../utils/messagingAccess'
import ConveyancingProgress from './ConveyancingProgress'
import { userAPI } from '../services/api'
import { propertyAPI } from '../services/api'

// Import API_URL from api.js
const API_URL = 'http://localhost:8000';  // FastAPI default port

// Define the required documents
const REQUIRED_DOCUMENTS = [
  { key: 'proof_of_id', label: 'Proof of ID' },
  { key: 'proof_of_address', label: 'Proof of Address' },
  { key: 'survey_report', label: 'Survey Report' },
  { key: 'local_authority_search', label: 'Local Authority Search' },
  { key: 'draft_contract', label: 'Draft Contract' },
];

// Define stage order and estimates
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

function PropertyDashboard() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesValue, setNotesValue] = useState('')
  const [progress, setProgress] = useState([])
  const [expandedStep, setExpandedStep] = useState(null)
  const [filter, setFilter] = useState('all')
  const [recipients, setRecipients] = useState([])
  const [property, setProperty] = useState(null)
  const [propertyLoading, setPropertyLoading] = useState(true)

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role ? userInfo.role.toLowerCase() : '';

  const dashboardRoute =
    userRole === 'buyer' ? '/dashboard/buyer'
    : userRole === 'seller' ? '/dashboard/seller'
    : userRole.includes('solicitor') ? '/dashboard/solicitor'
    : userRole === 'estate_agent' ? '/dashboard/estate-agent'
    : '/';

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true)
      try {
        const files = await fileAPI.getPropertyFiles(propertyId)
        setDocuments(files)
      } catch (error) {
        setUploadError('Failed to fetch files')
      } finally {
        setLoading(false)
      }
    }
    fetchFiles()
  }, [propertyId])

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (err) {}
    }
    fetchNotifications();
  }, [propertyId]);

  useEffect(() => {
    async function fetchStages() {
      console.log('fetchStages called');
      try {
        const stages = await propertyStageAPI.getPropertyStages(propertyId)
        console.log('Fetched stages from API:', stages);
        setProgress(stages)
      } catch (err) {
        console.error('Failed to load stages:', err)
      }
    }
    fetchStages()
  }, [propertyId])

  useEffect(() => {
    async function fetchRecipients() {
      if (!property) return;
      try {
        const recipientIds = [
          property.buyer_id,
          property.buyer_solicitor_id,
          property.seller_solicitor_id,
          property.estate_agent_id,
          property.seller_id
        ].filter(id => id !== null && id !== undefined);
        const recipientDetails = await Promise.all(
          recipientIds.map(id => userAPI.getUser(id))
        );
        setRecipients(
          recipientDetails
            .filter(user => user && typeof user === 'object' && user.id && user.role)
            .map(user => ({
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              role: user.role
            }))
        );
        console.log('Recipients for progress tracker:', recipientDetails);
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchRecipients();
  }, [property]);

  useEffect(() => {
    async function fetchProperty() {
      setPropertyLoading(true);
      try {
        const data = await propertyAPI.getProperty(propertyId);
        console.log('Fetched property:', data);
        setProperty(data);
      } catch (err) {
        console.error('Failed to fetch property:', err);
      } finally {
        setPropertyLoading(false);
      }
    }
    fetchProperty();
  }, [propertyId]);

  console.log('propertyLoading:', propertyLoading, 'property:', property);
  if (propertyLoading || !property) {
    return <div>Loading property details...</div>;
  }

  const handleLogout = () => {
    // Clear the token from both localStorage and sessionStorage
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    // Redirect to homepage
    navigate('/')
  }

  const handleDocumentAction = async (docKey, action) => {
    if (action === 'upload') {
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploadingFile(true)
        setUploadError(null)
        try {
          console.log('Uploading file for document type:', docKey)
          await fileAPI.uploadFile(file, '', propertyId, docKey)
          // Fetch updated files list after successful upload
          const files = await fileAPI.getPropertyFiles(propertyId)
          setDocuments(files)
        } catch (error) {
          setUploadError('Failed to upload file')
        } finally {
          setUploadingFile(false)
        }
      }
      fileInput.click()
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    setUploadingFile(true);
    setUploadError(null);
    try {
      await fileAPI.deleteFile(fileId);
      // Refetch files after deletion
      const files = await fileAPI.getPropertyFiles(propertyId);
      setDocuments(files);
    } catch (error) {
      setUploadError('Failed to delete file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleNotesEdit = (fileId, currentNotes) => {
    setEditingNotes(fileId);
    setNotesValue(currentNotes || '');
  };

  const handleNotesSave = async (fileId) => {
    try {
      await fileAPI.updateFileNotes(fileId, notesValue);
      // Refresh the documents list
      const files = await fileAPI.getPropertyFiles(propertyId);
      setDocuments(files);
      setEditingNotes(null);
    } catch (error) {
      setUploadError('Failed to update notes');
    }
  };

  const handleNotesCancel = () => {
    setEditingNotes(null);
    setNotesValue('');
  };

  const handleMarkAsRead = async (notificationId) => {
    await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const recentNotifications = notifications.slice(0, 3);

  console.log('Progress state before sorting:', progress);
  const steps = progress
    .map(step => ({
      ...step,
      responsible: step.responsible || (step.stage.toLowerCase().includes('client') ? 'Client' : step.stage.toLowerCase().includes('solicitor') ? 'Solicitor' : 'Agent'),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  console.log('Sorted steps:', steps);

  const completedCount = steps.filter(s => s.status === 'completed').length
  const totalCount = steps.length
  const filteredSteps = steps.filter(step => {
    if (filter === 'all') return true
    if (filter === 'completed') return step.status === 'completed'
    if (filter === 'in-progress') return step.status === 'in-progress'
    if (filter === 'pending') return step.status === 'pending'
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to={dashboardRoute} className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Conveyancer
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 w-full">
        {/* Property Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-blue-100">
          <div className="flex items-center gap-4">
            <HomeIcon className="w-12 h-12 text-blue-200" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">{property.address}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm
                ${property.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  property.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'}`}
              >
                {property.status}
              </span>
            </div>
          </div>
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Property Type</h3>
            <p className="text-lg font-bold text-gray-900">{property.type}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Bedrooms</h3>
            <p className="text-lg font-bold text-gray-900">{property.bedrooms}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Bathrooms</h3>
            <p className="text-lg font-bold text-gray-900">{property.bathrooms}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Price</h3>
            <p className="text-lg font-bold text-gray-900">{property.price}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Tenure</h3>
            <p className="text-lg font-bold text-gray-900">{property.tenure}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Expected Completion</h3>
            <p className="text-lg font-bold text-gray-900">{property.completion_date}</p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BellIcon className="w-6 h-6 text-blue-400 mr-2" />
              Notifications
            </h2>
            {notifications.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                {notifications.length} new
              </span>
            )}
          </div>
          <div className="space-y-4">
            {recentNotifications.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-500 text-center">
                No new notifications
              </div>
            ) : (
              recentNotifications.map(notification => (
                <div key={notification.id} className={`flex items-start bg-gradient-to-r from-white via-blue-50 to-white rounded-xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}>
                  <BellIcon className="w-6 h-6 text-blue-400 mr-3 mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-900">{notification.message}</span>
                      <span className="text-xs text-gray-400 font-medium">
                        {dayjs(notification.created_at).format('DD MMM YYYY, HH:mm')}
                      </span>
                    </div>
                    {!notification.read && (
                      <button className="mt-2 px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors" onClick={() => handleMarkAsRead(notification.id)}>
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 flex justify-end">
            <button className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-semibold rounded-lg shadow text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" onClick={() => navigate(`/property/${propertyId}/notifications`)}>
              <BellIcon className="w-5 h-5" />
              View All Notifications
            </button>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <DocumentTextIcon className="w-6 h-6 text-blue-400 mr-2" />
              Documents
            </h2>
          </div>
          <div className="flex justify-center">
            <button
              className="bg-blue-600 text-white rounded-xl px-10 py-5 text-xl font-extrabold shadow-lg hover:bg-blue-700 transition-colors border-4 border-white hover:border-blue-200"
              onClick={() => navigate(`/property/${propertyId}/documents`)}
            >
              View Documents
            </button>
          </div>
        </div>

        {/* Progress Tracker Section */}
        <div className="w-full mt-8 mb-12 px-0">
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center mb-6">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-400 mr-2" />
              Progress Tracker
            </h2>
            <div className="max-w-5xl mx-auto">
              <ConveyancingProgress property={property} recipients={recipients} hideHeaderInfo={true} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PropertyDashboard 