import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './components/HomePage'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import BuyerDashboard from './components/BuyerDashboard'
import PropertyDashboard from './components/PropertyDashboard'
import ConveyancingProgress from './components/ConveyancingProgress'
import PropertyDocuments from './components/PropertyDocuments'
import SolicitorDashboard from './components/SolicitorDashboard'
import SolicitorPropertyView from './components/SolicitorPropertyView'
import SolicitorConveyancingProcess from './components/SolicitorConveyancingProcess'
import SolicitorDocuments from './components/SolicitorDocuments'
import EstateAgentDashboard from './components/EstateAgentDashboard'
import StageMessages from './components/StageMessages'
import StageChat from './components/StageChat'
import SellerBuyerChat from './components/SellerBuyerChat'
import PendingMessages from './components/PendingMessages'
import EstateAgentPropertyView from './components/EstateAgentPropertyView'
import BuyerPersonalDocuments from './components/BuyerPersonalDocuments'
import BuyerPropertyDocuments from './components/BuyerPropertyDocuments'
import BuyerLegalDocuments from './components/BuyerLegalDocuments'
import SolicitorBuyerReviewDocuments from './components/SolicitorBuyerReviewDocuments'
import SolicitorSearchesLegalDocuments from './components/SolicitorSearchesLegalDocuments'
import SolicitorExchangeCompletionDocuments from './components/SolicitorExchangeCompletionDocuments'
import SellerSolicitorContractPackDocuments from './components/SellerSolicitorContractPackDocuments'
import SellerSolicitorSearchesDocuments from './components/SellerSolicitorSearchesDocuments'
import SellerSolicitorExchangeCompletionDocuments from './components/SellerSolicitorExchangeCompletionDocuments'
import SellerSolicitorPropertyView from './components/SellerSolicitorPropertyView'
import SellerPersonalDocuments from './components/SellerPersonalDocuments'
import SellerDashboard from './components/SellerDashboard'
import SellerPropertyView from './components/SellerPropertyView'
import SellerPropertyDocuments from './components/SellerPropertyDocuments'
import SellerLegalDocuments from './components/SellerLegalDocuments'
import SellerExchangeDocuments from './components/SellerExchangeDocuments'
import './App.css'
import dayjs from 'dayjs'
import { fileAPI, userAPI } from './services/api'

function AppRoutes() {
  const location = useLocation();
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
      <Route path="/dashboard/estate-agent" element={<EstateAgentDashboard />} />
      <Route path="/dashboard/seller" element={<SellerDashboard />} />
      <Route path="/property/:propertyId" element={<PropertyDashboard />} />
      <Route path="/property/:propertyId/progress" element={<ConveyancingProgressPage />} />
      <Route path="/property/:propertyId/stage/:stageId/chat/:recipientId" element={<StageChat />} />
      <Route path="/property/:propertyId/stage/:stageId/seller-buyer-chat" element={<SellerBuyerChat />} />
      <Route path="/property/:propertyId/documents" element={<PropertyDocuments />} />
      <Route path="/property/:propertyId/documents/personal" element={<BuyerPersonalDocuments />} />
      <Route path="/property/:propertyId/documents/property" element={<BuyerPropertyDocuments />} />
      <Route path="/property/:propertyId/documents/legal" element={<BuyerLegalDocuments />} />
      <Route path="/dashboard/solicitor" element={<SolicitorDashboard />} />
      <Route path="/solicitor/property/:propertyId" element={<SolicitorPropertyViewPage />} />
      <Route path="/solicitor/property/:propertyId/progress" element={<SolicitorConveyancingProgressPage />} />
      <Route path="/solicitor/property/:propertyId/documents" element={<SolicitorDocuments />} />
      <Route path="/solicitor/property/:propertyId/notifications" element={<AllNotificationsPage role="solicitor" />} />
      <Route path="/estate-agent/property/:propertyId/pending-messages" element={<PendingMessages />} />
      <Route path="/estate-agent/property/:propertyId" element={<EstateAgentPropertyViewPage />} />
      <Route path="/estate-agent/property/:propertyId/progress" element={<EstateAgentProgressPage />} />
      <Route path="/estate-agent/property/:propertyId/documents" element={<EstateAgentDocumentsPage />} />
      <Route path="/estate-agent/property/:propertyId/notifications" element={<EstateAgentAllNotificationsPage />} />
      <Route path="/property/:propertyId/notifications" element={<AllNotificationsPage role="buyer" />} />
      <Route path="/seller-solicitor/property/:propertyId/documents/contract-pack" element={<SellerSolicitorContractPackDocuments />} />
      <Route path="/seller-solicitor/property/:propertyId/documents/searches" element={<SellerSolicitorSearchesDocuments />} />
      <Route path="/seller-solicitor/property/:propertyId/documents/exchange-completion" element={<SellerSolicitorExchangeCompletionDocuments />} />
      <Route path="/seller-solicitor/property/:propertyId" element={<SellerSolicitorPropertyViewPage />} />
      <Route path="/seller-solicitor/property/:propertyId/documents/seller-personal" element={<SellerPersonalDocuments />} />
      <Route path="/seller-solicitor/property/:propertyId/progress" element={<SellerSolicitorConveyancingProgressPage />} />
      <Route path="/seller/property/:propertyId" element={<SellerPropertyView />} />
      <Route path="/seller/property/:propertyId/personal-documents" element={<SellerPersonalDocuments />} />
      <Route path="/seller/property/:propertyId/property-documents" element={<SellerPropertyDocuments />} />
      <Route path="/seller/property/:propertyId/legal-documents" element={<SellerLegalDocuments />} />
      <Route path="/seller/property/:propertyId/exchange-documents" element={<SellerExchangeDocuments />} />
      <Route path="/seller/property/:propertyId/progress" element={<SellerConveyancingProgressPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

// Wrapper to fetch property data and render ConveyancingProgress
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

function ConveyancingProgressPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPropertyAndRecipients() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const propertyData = await response.json();
        setProperty(propertyData);
        console.log('Fetched property:', propertyData); // Debug log

        // Fetch recipient user info
        const recipientIds = [
          propertyData.buyer_id,
          propertyData.buyer_solicitor_id,
          propertyData.seller_solicitor_id,
          propertyData.estate_agent_id,
          propertyData.seller_id
        ].filter(id => id !== null && id !== undefined);
        console.log('Recipient IDs:', recipientIds); // Debug log

        const recipientDetails = await Promise.all(
          recipientIds.map(id => userAPI.getUser(id))
        );
        console.log('Recipient details:', recipientDetails); // Debug log

        setRecipients(recipientDetails.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPropertyAndRecipients();
  }, [propertyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>No property found</div>;

  return <ConveyancingProgress property={property} recipients={recipients} />;
}

function SolicitorPropertyViewPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  useEffect(() => {
    // For now, use mock data. Replace with API call as needed.
    setProperty({
      id: propertyId,
      address: '123 Main Street, London, SW1A 1AA',
      price: '£450,000',
      type: 'Semi-detached house',
      bedrooms: 3,
      tenure: 'Freehold',
      expectedCompletion: '2024-06-15',
      buyer: 'Alex Smith',
      status: 'In Progress',
    });
  }, [propertyId]);
  return <SolicitorPropertyView property={property} />;
}

function SolicitorConveyancingProgressPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPropertyAndRecipients() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const propertyData = await response.json();
        setProperty(propertyData);
        // Fetch recipient user info
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
        setRecipients(recipientDetails.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPropertyAndRecipients();
  }, [propertyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>No property found</div>;

  return <SolicitorConveyancingProcess property={property} recipients={recipients} />;
}

function EstateAgentProgressPage() {
  return <ConveyancingProgressPage />;
}

function EstateAgentPropertyViewPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const propertyData = await response.json();
        setProperty(propertyData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [propertyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>No property found</div>;

  return <EstateAgentPropertyView property={property} />;
}

function EstateAgentDocumentsPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const propertyData = await response.json();
        setProperty(propertyData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [propertyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>No property found</div>;

  return <PropertyDocuments property={property} />;
}

function EstateAgentAllNotificationsPage() {
  const { propertyId } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [showRead, setShowRead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}/notifications/all`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [propertyId]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(notifications.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const filteredNotifications = notifications.filter(n => showRead ? true : !n.read);

  return (
    <div className="property-dashboard-container">
      <nav className="property-dashboard-nav">
        <div className="nav-content">
          <span className="logo">Conveyancer</span>
          <div className="nav-buttons">
            <button className="home-button" onClick={() => window.history.back()}>Back</button>
            <button className="logout-button" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
              sessionStorage.removeItem('token');
              window.location.href = '/';
            }}>Logout</button>
          </div>
        </div>
      </nav>
      <div className="property-dashboard-content">
        <div className="notifications-section">
          <div className="section-header">
            <h2>All Notifications</h2>
            <div>
              <label style={{ fontWeight: 500, marginRight: 12 }}>
                <input type="checkbox" checked={showRead} onChange={e => setShowRead(e.target.checked)} style={{ marginRight: 6 }} />
                Show Read
              </label>
            </div>
          </div>
          <div className="notifications-list">
            {loading ? <div>Loading...</div> : error ? <div style={{ color: 'red' }}>{error}</div> :
              filteredNotifications.length === 0 ? (
                <div className="notification-card">
                  <p>No notifications</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div key={notification.id} className={`notification-card ${!notification.read ? 'urgent' : ''}`}>
                    <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{notification.title || notification.message?.split('.')[0]}</span>
                      <span className="notification-date" style={{ color: '#6b7280', fontSize: '0.95em', marginLeft: '1rem' }}>
                        {dayjs(notification.created_at).format('DD MMM YYYY, HH:mm')}
                      </span>
                    </div>
                    <div style={{ color: '#4b5563', lineHeight: 1.5 }}>{notification.message}</div>
                    {!notification.read && (
                      <button className="mark-read-btn" onClick={() => handleMarkAsRead(notification.id)} style={{ marginTop: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, cursor: 'pointer' }}>Mark as Read</button>
                    )}
                  </div>
                ))
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AllNotificationsPage({ role }) {
  const { propertyId } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [showRead, setShowRead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}/notifications/all`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [propertyId]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(notifications.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const filteredNotifications = notifications.filter(n => showRead ? true : !n.read);

  return (
    <div className="property-dashboard-container">
      <nav className="property-dashboard-nav">
        <div className="nav-content">
          <span className="logo">Conveyancer</span>
          <div className="nav-buttons">
            <button className="home-button" onClick={() => window.history.back()}>Back</button>
            <button className="logout-button" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
              sessionStorage.removeItem('token');
              window.location.href = '/';
            }}>Logout</button>
          </div>
        </div>
      </nav>
      <div className="property-dashboard-content">
        <div className="notifications-section">
          <div className="section-header">
            <h2>All Notifications</h2>
            <div>
              <label style={{ fontWeight: 500, marginRight: 12 }}>
                <input type="checkbox" checked={showRead} onChange={e => setShowRead(e.target.checked)} style={{ marginRight: 6 }} />
                Show Read
              </label>
            </div>
          </div>
          <div className="notifications-list">
            {loading ? <div>Loading...</div> : error ? <div style={{ color: 'red' }}>{error}</div> :
              filteredNotifications.length === 0 ? (
                <div className="notification-card">
                  <p>No notifications</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div key={notification.id} className={`notification-card ${!notification.read ? 'urgent' : ''}`}>
                    <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{notification.title || notification.message?.split('.')[0]}</span>
                      <span className="notification-date" style={{ color: '#6b7280', fontSize: '0.95em', marginLeft: '1rem' }}>
                        {dayjs(notification.created_at).format('DD MMM YYYY, HH:mm')}
                      </span>
                    </div>
                    <div style={{ color: '#4b5563', lineHeight: 1.5 }}>{notification.message}</div>
                    {!notification.read && (
                      <button className="mark-read-btn" onClick={() => handleMarkAsRead(notification.id)} style={{ marginTop: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, cursor: 'pointer' }}>Mark as Read</button>
                    )}
                  </div>
                ))
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerSolicitorPropertyViewPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  useEffect(() => {
    // For now, use mock data. Replace with API call as needed.
    setProperty({
      id: propertyId,
      address: '123 Main Street, London, SW1A 1AA',
      price: '£450,000',
      type: 'Semi-detached house',
      bedrooms: 3,
      tenure: 'Freehold',
      expectedCompletion: '2024-06-15',
      buyer: 'Alex Smith',
      status: 'In Progress',
    });
  }, [propertyId]);
  return <SellerSolicitorPropertyView property={property} />;
}

function SellerConveyancingProgressPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPropertyAndRecipients() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const propertyData = await response.json();
        setProperty(propertyData);

        // Fetch recipient user info
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

        setRecipients(recipientDetails.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPropertyAndRecipients();
  }, [propertyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>No property found</div>;

  return <ConveyancingProgress property={property} recipients={recipients} />;
}

function SellerSolicitorConveyancingProgressPage() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPropertyAndRecipients() {
      try {
        const response = await fetch(`http://localhost:8000/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const propertyData = await response.json();
        setProperty(propertyData);

        // Fetch recipient user info
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

        setRecipients(recipientDetails.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPropertyAndRecipients();
  }, [propertyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>No property found</div>;

  return <SolicitorConveyancingProcess property={property} recipients={recipients} />;
}

export default App
