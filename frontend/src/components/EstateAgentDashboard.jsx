import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { UserCircleIcon, CheckCircleIcon, InformationCircleIcon, HomeIcon, BellIcon, PlusIcon } from '@heroicons/react/24/solid'
import PropertyCreateForm from './PropertyCreateForm'

function EstateAgentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    notifications: [],
    properties: []
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      let properties = [];
      try {
        const propertiesResponse = await fetch('http://localhost:8000/properties', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (propertiesResponse.ok) {
          const data = await propertiesResponse.json();
          properties = data.filter(p => String(p.estate_agent_id) === String(userInfo.id));
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
      setUser(prev => ({
        ...prev,
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        properties
      }));
    }
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    navigate('/')
  }

  const handleCreateProperty = async (form) => {
    try {
      const token = localStorage.getItem('token');
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const { status, ...cleanForm } = form;
      const payload = {
        ...cleanForm,
        price: parseFloat(form.price),
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        estate_agent_id: parseInt(userInfo.id),
        buyer_id: form.buyer_id ? parseInt(form.buyer_id) : null,
        seller_id: form.seller_id ? parseInt(form.seller_id) : null,
        buyer_solicitor_id: form.buyer_solicitor_id ? parseInt(form.buyer_solicitor_id) : null,
        seller_solicitor_id: form.seller_solicitor_id ? parseInt(form.seller_solicitor_id) : null,
      };
      const res = await fetch('http://localhost:8000/properties', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create property');
      setShowCreateModal(false);
      const propertiesResponse = await fetch('http://localhost:8000/properties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (propertiesResponse.ok) {
        const data = await propertiesResponse.json();
        setUser(prev => ({ ...prev, properties: data.filter(p => String(p.estate_agent_id) === String(userInfo.id)) }));
      }
    } catch (err) {
      alert('Failed to create property: ' + err.message);
    }
  };

  // Stats
  const numProperties = user.properties.length
  const numNotifications = 0 // No notifications in this dashboard for now

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="flex items-center bg-white rounded-2xl shadow p-6 border border-blue-100">
            <HomeIcon className="w-10 h-10 text-blue-400 mr-4" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{numProperties}</div>
              <div className="text-gray-500 text-sm font-medium">Properties</div>
            </div>
          </div>
          <div className="flex items-center bg-white rounded-2xl shadow p-6 border border-blue-100">
            <BellIcon className="w-10 h-10 text-yellow-400 mr-4" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{numNotifications}</div>
              <div className="text-gray-500 text-sm font-medium">Notifications</div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10 flex items-center gap-6 border border-blue-100">
          <div className="flex-shrink-0">
            <UserCircleIcon className="w-16 h-16 text-blue-200" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
              Welcome back, <span className="text-blue-600">{user.firstName} {user.lastName}</span>
            </h1>
            <p className="text-lg text-gray-500">
              Manage your property listings and transactions
            </p>
          </div>
        </div>

        {/* Properties Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircleIcon className="w-6 h-6 text-green-400 mr-2" />
              Your Properties
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add New Property
            </button>
          </div>
          {user.properties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Property Address</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {user.properties.map(property => (
                    <tr key={property.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/estate-agent/property/${property.id}`} className="text-blue-600 hover:text-blue-800 font-semibold underline">
                          {property.address}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm
                          ${property.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            property.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'}`}
                        >
                          {property.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        £{property.price?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dayjs(property.updated_at).format('MMM D, YYYY')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏠</div>
              <p className="text-lg text-gray-600 mb-4">You haven't added any properties yet</p>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Add Your First Property
              </button>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <PropertyCreateForm 
              onSubmit={handleCreateProperty}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default EstateAgentDashboard 