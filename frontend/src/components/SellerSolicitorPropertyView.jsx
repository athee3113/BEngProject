import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

const SellerSolicitorPropertyView = ({ property }) => {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [notifications, setNotifications] = useState([]);

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

  const handleMarkAsRead = async (notificationId) => {
    await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const recentNotifications = notifications.slice(0, 3);

  if (!property) {
    return <div className="property-dashboard-container">No property data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-2xl font-bold text-blue-600">Conveyancer</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" onClick={() => navigate('/dashboard/solicitor')}>Dashboard</button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('token');
                navigate('/');
              }}>Logout</button>
            </div>
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
            <div className="flex gap-2 mt-4 md:mt-0">
              <button className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-semibold rounded-lg shadow text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" onClick={() => navigate(`/seller-solicitor/property/${propertyId}/progress`)}>
                View Progress Tracker
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          <div className="property-detail-card">
            <h3>Property Type</h3>
            <p>{property.type || property.details?.type}</p>
          </div>
          <div className="property-detail-card">
            <h3>Bedrooms</h3>
            <p>{property.bedrooms ?? property.details?.bedrooms}</p>
          </div>
          <div className="property-detail-card">
            <h3>Bathrooms</h3>
            <p>{property.bathrooms ?? property.details?.bathrooms}</p>
          </div>
          <div className="property-detail-card">
            <h3>Price</h3>
            <p>{property.price || property.details?.price}</p>
          </div>
          <div className="property-detail-card">
            <h3>Tenure</h3>
            <p>{property.tenure || property.details?.tenure}</p>
          </div>
          <div className="property-detail-card">
            <h3>Expected Completion</h3>
            <p>{property.expectedCompletion || property.details?.completionDate}</p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="notifications-section">
          <div className="section-header">
            <h2>Notifications</h2>
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length} new</span>
            )}
          </div>
          <div className="notifications-list">
            {recentNotifications.length === 0 ? (
              <div className="notification-card">
                <p>No new notifications</p>
              </div>
            ) : (
              recentNotifications.map(notification => (
                <div key={notification.id} className={`notification-card ${!notification.read ? 'urgent' : ''}`}>
                  <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {notification.type === 'stage_completed' && (
                        <span style={{ color: '#059669' }}>✓</span>
                      )}
                      {notification.type === 'document_uploaded' && (
                        <span style={{ color: '#2563eb' }}>📄</span>
                      )}
                      {notification.type === 'message' && (
                        <span style={{ color: '#7c3aed' }}>💬</span>
                      )}
                      {notification.type === 'delivered' && (
                        <span style={{ color: '#059669' }}>📨</span>
                      )}
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{notification.message}</span>
                    </div>
                    <span className="notification-date" style={{ color: '#6b7280', fontSize: '0.95em', marginLeft: '1rem' }}>
                      {dayjs(notification.created_at).format('DD MMM YYYY, HH:mm')}
                    </span>
                  </div>
                  {!notification.read && (
                    <button className="mark-read-btn" onClick={() => handleMarkAsRead(notification.id)} style={{ marginTop: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, cursor: 'pointer' }}>Mark as Read</button>
                  )}
                </div>
              ))
            )}
          </div>
          <button className="view-all-btn" onClick={() => navigate(`/seller-solicitor/property/${propertyId}/notifications`)}>
            View All Notifications
          </button>
        </div>

        {/* Documents Section - seller solicitor */}
        <div className="documents-section" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>📋 Documents</h2>
            <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '1rem' }}>Manage all property-related documents</span>
          </div>
          <div className="document-categories">
            <div className="category-card">
              <h3>Seller Personal Documents</h3>
              <p>Review and approve the seller's personal documents (e.g. Proof of ID, Proof of Address, Source of Funds)</p>
              <button className="category-button" onClick={() => navigate(`/seller-solicitor/property/${propertyId}/documents/seller-personal`)}>
                View Seller Personal Documents
              </button>
            </div>
            <div className="category-card">
              <h3>Contract Pack Documents</h3>
              <p>Review and approve submissions for the contract pack</p>
              <button className="category-button" onClick={() => navigate(`/seller-solicitor/property/${propertyId}/documents/contract-pack`)}>
                View Contract Pack Documents
              </button>
            </div>
            <div className="category-card">
              <h3>Search Documents</h3>
              <p>Review and approve submissions for searches</p>
              <button className="category-button" onClick={() => navigate(`/seller-solicitor/property/${propertyId}/documents/searches`)}>
                View Search Documents
              </button>
            </div>
            <div className="category-card">
              <h3>Exchange & Completion</h3>
              <p>Review and approve submissions for exchange and completion</p>
              <button className="category-button" onClick={() => navigate(`/seller-solicitor/property/${propertyId}/documents/exchange-completion`)}>
                View Exchange & Completion
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerSolicitorPropertyView; 