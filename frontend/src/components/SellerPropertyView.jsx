import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { fileAPI } from '../services/api'
import './PropertyDashboard.css'
import dayjs from 'dayjs'

function SellerPropertyView() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesValue, setNotesValue] = useState('')
  const [property] = useState({
    id: propertyId,
    address: '123 Main Street, London, SW1A 1AA',
    status: 'In Progress',
    solicitor: 'Jane Cooper',
    lastUpdated: '2024-03-20',
    details: {
      type: 'Semi-detached house',
      bedrooms: 3,
      bathrooms: 2,
      price: '£450,000',
      tenure: 'Freehold',
      completionDate: '2024-06-15'
    },
    notifications: [
      {
        id: 1,
        title: 'Action Required: Upload Documents',
        message: 'Please upload your proof of ID and address to start the sale process.',
        urgent: true,
        date: '2024-03-20'
      },
      {
        id: 2,
        title: 'Contract Pack Requested',
        message: 'Your solicitor has requested the contract pack documents.',
        urgent: true,
        date: '2024-03-19'
      }
    ],
    progress: [
      {
        id: 1,
        stage: 'Initial Instructions',
        status: 'completed',
        date: '2024-03-01',
        description: 'Initial instructions received and client verification completed'
      },
      {
        id: 2,
        stage: 'Contract Pack Preparation',
        status: 'in-progress',
        date: '2024-03-20',
        description: 'Preparing contract pack documents for your solicitor'
      },
      {
        id: 3,
        stage: 'Exchange of Contracts',
        status: 'pending',
        date: null,
        description: 'Pending contract review and exchange'
      },
      {
        id: 4,
        stage: 'Completion',
        status: 'pending',
        date: null,
        description: 'Scheduled for 2024-06-15'
      }
    ]
  })

  const dashboardRoute = '/dashboard/seller';

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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    sessionStorage.removeItem('token')
    navigate('/')
  }

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
            <button
              className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-semibold rounded-lg shadow text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={() => navigate(`/seller/property/${propertyId}/progress`)}
            >
              View Progress Tracker
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          <div className="property-detail-card">
            <h3>Property Type</h3>
            <p>{property.details.type}</p>
          </div>
          <div className="property-detail-card">
            <h3>Bedrooms</h3>
            <p>{property.details.bedrooms}</p>
          </div>
          <div className="property-detail-card">
            <h3>Bathrooms</h3>
            <p>{property.details.bathrooms}</p>
          </div>
          <div className="property-detail-card">
            <h3>Price</h3>
            <p>{property.details.price}</p>
          </div>
          <div className="property-detail-card">
            <h3>Tenure</h3>
            <p>{property.details.tenure}</p>
          </div>
          <div className="property-detail-card">
            <h3>Expected Completion</h3>
            <p>{property.details.completionDate}</p>
          </div>
        </div>
        <div className="notifications-section">
          <div className="section-header">
            <h2>Notifications</h2>
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length} new</span>
            )}
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notification-card">
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className={`notification-card ${!notification.read ? 'urgent' : ''}`}>
                  <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#1f2937' }}>{notification.title || notification.message?.split('.')[0]}</span>
                    <span className="notification-date" style={{ color: '#6b7280', fontSize: '0.95em', marginLeft: '1rem' }}>
                      {dayjs(notification.date || notification.created_at).format('DD MMM YYYY, HH:mm')}
                    </span>
                  </div>
                  <div style={{ color: '#4b5563', lineHeight: 1.5 }}>{notification.message}</div>
                  {!notification.read && (
                    <button className="mark-read-btn" style={{ marginTop: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, cursor: 'pointer' }}>Mark as Read</button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="view-all-container">
            <button className="view-all-button" style={{ marginTop: 12 }}>
              View All Notifications
            </button>
          </div>
        </div>
        <div className="documents-section" style={{ marginTop: '2.5rem' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Documents</h2>
            <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '1rem' }}>Manage all property-related documents</span>
          </div>
          <div className="document-categories" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <div className="category-card" style={{ flex: '1 1 220px', minWidth: 220, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h3>Personal Documents</h3>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>Proof of ID and Address</p>
              <button className="category-button" onClick={() => navigate(`/seller/property/${propertyId}/personal-documents`)} style={{ marginTop: 'auto' }}>
                Go to Personal Documents
              </button>
            </div>
            <div className="category-card" style={{ flex: '1 1 220px', minWidth: 220, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h3>Property Documents</h3>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>EPC, Title Plan, Property Photos</p>
              <button className="category-button" onClick={() => navigate(`/seller/property/${propertyId}/property-documents`)} style={{ marginTop: 'auto' }}>
                Go to Property Documents
              </button>
            </div>
            <div className="category-card" style={{ flex: '1 1 220px', minWidth: 220, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h3>Legal Documents</h3>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>TA6/TA10 Forms, Draft Contract</p>
              <button className="category-button" onClick={() => navigate(`/seller/property/${propertyId}/legal-documents`)} style={{ marginTop: 'auto' }}>
                Go to Legal Documents
              </button>
            </div>
            <div className="category-card" style={{ flex: '1 1 220px', minWidth: 220, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h3>Exchange & Completion</h3>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>Signed Contract, Transfer Deed</p>
              <button className="category-button" onClick={() => navigate(`/seller/property/${propertyId}/exchange-documents`)} style={{ marginTop: 'auto' }}>
                Go to Exchange & Completion
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SellerPropertyView 