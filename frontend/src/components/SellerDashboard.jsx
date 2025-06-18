import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { UserCircleIcon, CheckCircleIcon, InformationCircleIcon, HomeIcon, BellIcon } from '@heroicons/react/24/solid'

function SellerDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    notifications: [
      {
        id: 1,
        title: 'Action Required: Upload Documents',
        message: 'Please upload your proof of ID and address to start the sale process.',
        urgent: true,
        date: '2024-03-20',
        type: 'alert'
      },
      {
        id: 2,
        title: 'Contract Pack Requested',
        message: 'Your solicitor has requested the contract pack documents.',
        urgent: true,
        date: '2024-03-19',
        type: 'info'
      },
      {
        id: 3,
        title: 'Viewing Feedback',
        message: 'You have received new feedback from a recent property viewing.',
        urgent: false,
        date: '2024-03-18',
        type: 'success'
      }
    ],
    properties: [
      {
        id: 1,
        address: '123 Main Street, London, SW1A 1AA',
        status: 'In Progress',
        solicitor: 'Jane Cooper',
        lastUpdated: '2024-03-20'
      }
    ]
  })

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    setUser(prev => ({
      ...prev,
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || ''
    }));
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    navigate('/');
  }

  const handleViewAll = () => {
    // TODO: Implement view all notifications functionality
    console.log('Viewing all notifications...')
  }

  const notificationIcon = (type) => {
    switch(type) {
      case 'alert':
        return <InformationCircleIcon className="w-6 h-6 text-red-500 mr-3" />
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
      case 'info':
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-500 mr-3" />
    }
  }

  // Stats
  const numProperties = user.properties.length
  const numNotifications = user.notifications.length

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
              Track your property sale progress here
            </p>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <InformationCircleIcon className="w-6 h-6 text-blue-400 mr-2" />
              Recent Notifications
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
              {user.notifications.length}
            </span>
          </div>
          <div className="space-y-4">
            {user.notifications.map(notification => (
              <div
                key={notification.id}
                className="flex items-start bg-gradient-to-r from-white via-blue-50 to-white rounded-xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {notificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                    <span className="text-xs text-gray-400 font-medium">
                      {dayjs(notification.date).format('MMM D, YYYY')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleViewAll}
              className="inline-flex items-center gap-2 px-5 py-2 border border-transparent text-sm font-semibold rounded-lg shadow text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <InformationCircleIcon className="w-5 h-5" />
              View All Notifications
            </button>
          </div>
        </div>

        {/* Properties Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <CheckCircleIcon className="w-6 h-6 text-green-400 mr-2" />
              Your Properties
            </h2>
          </div>
          {user.properties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Property Address</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Solicitor</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {user.properties.map(property => (
                    <tr key={property.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/seller/property/${property.id}`}
                          className="text-blue-600 hover:text-blue-800 font-semibold underline"
                        >
                          {property.address}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm
                          ${property.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            property.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'}`}
                        >
                          {property.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {property.solicitor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dayjs(property.lastUpdated).format('MMM D, YYYY')}
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
              <Link
                to="/properties/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Add Your First Property
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default SellerDashboard 