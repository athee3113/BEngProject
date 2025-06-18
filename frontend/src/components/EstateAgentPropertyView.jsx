import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';
import ConveyancingProgress from './ConveyancingProgress';
import { userAPI } from '../services/api';
import { HomeIcon, BellIcon, ClipboardDocumentCheckIcon, DocumentTextIcon } from '@heroicons/react/24/solid';

const EstateAgentPropertyView = ({ property }) => {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [progressRecipients, setProgressRecipients] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState(null);

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
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    }
    fetchNotifications();
  }, [propertyId]);

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
        setProgressRecipients(recipientDetails.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        })));
        setProgressError(null);
      } catch (err) {
        setProgressError('Failed to fetch recipients');
      } finally {
        setProgressLoading(false);
      }
    }
    fetchRecipients();
  }, [property]);

  // Mark as read handler
  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Only show the 3 most recent notifications
  const recentNotifications = notifications.slice(0, 3);

  if (!property) {
    return <div className="property-dashboard-container">No property data available.</div>
  }

  // Format completion date if it exists
  const formattedCompletionDate = property.completion_date 
    ? dayjs(property.completion_date).format('DD MMM YYYY')
    : '-';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-2xl font-bold text-blue-600">Conveyancer</span>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('token');
                navigate('/');
              }}
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
            <p className="text-lg font-bold text-gray-900">{property.type || '-'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Bedrooms</h3>
            <p className="text-lg font-bold text-gray-900">{property.bedrooms || '-'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Bathrooms</h3>
            <p className="text-lg font-bold text-gray-900">{property.bathrooms || '-'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Price</h3>
            <p className="text-lg font-bold text-gray-900">{property.price || '-'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Tenure</h3>
            <p className="text-lg font-bold text-gray-900">{property.tenure || '-'}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Expected Completion</h3>
            <p className="text-lg font-bold text-gray-900">{formattedCompletionDate}</p>
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
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title || notification.message?.split('.')[0]}</h3>
                      <span className="text-xs text-gray-400 font-medium">
                        {dayjs(notification.created_at).format('MMM D, YYYY, HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                  </div>
                  <button className="mark-read-btn ml-4" onClick={() => handleMarkAsRead(notification.id)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', fontWeight: 500, cursor: 'pointer' }}>Mark as Read</button>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-semibold rounded-lg shadow text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={() => navigate(`/estate-agent/property/${propertyId}/notifications`)}
            >
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
              onClick={() => navigate(`/estate-agent/property/${propertyId}/documents`)}
            >
              View Documents
            </button>
          </div>
        </div>

        {/* Progress Tracker Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-gray-100">
          <div className="flex items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-400 mr-2" />
              Progress Tracker
            </h2>
          </div>
          {progressLoading ? (
            <div>Loading...</div>
          ) : progressError ? (
            <div style={{ color: 'red' }}>{progressError}</div>
          ) : (
            <ConveyancingProgress property={property} recipients={progressRecipients} hideHeaderInfo={true} />
          )}
        </div>
      </main>
    </div>
  )
}

export default EstateAgentPropertyView 