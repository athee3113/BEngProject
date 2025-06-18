import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { messageAPI, userAPI } from '../services/api';
import dayjs from 'dayjs';

function PendingMessages() {
  const { propertyId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMap, setUserMap] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      setError('');
      try {
        const pendingMessages = await messageAPI.getPendingMessages(propertyId);
        setMessages(pendingMessages);

        // Fetch user info for senders and recipients
        const userIds = new Set(pendingMessages.flatMap(m => [m.sender_id, m.recipient_id]));
        const userMapObj = {};
        await Promise.all([...userIds].map(async id => {
          try {
            const user = await userAPI.getUser(id);
            userMapObj[id] = user;
          } catch (err) {
            userMapObj[id] = { first_name: 'Unknown', last_name: 'User', role: 'Unknown' };
          }
        }));
        setUserMap(userMapObj);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [propertyId]);

  const handleAction = async (messageId, action) => {
    setActionLoading(messageId + action);
    try {
      if (action === 'approve') {
        await messageAPI.approveMessage(messageId);
      } else {
        await messageAPI.rejectMessage(messageId);
      }
      // Remove the message from the list
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      setError(err.message || `Failed to ${action} message`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="pending-messages-container">Loading messages...</div>;
  if (error) return <div className="pending-messages-container" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="pending-messages-container" style={{ maxWidth: 800, margin: '2rem auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          to={`/estate-agent/property/${propertyId}`}
          style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
        >
          &larr; Back to Property
        </Link>
      </div>

      <h1 style={{ marginBottom: '2rem' }}>Pending Messages</h1>

      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          No pending messages to review.
        </div>
      ) : (
        <div className="messages-list">
          {messages.map(message => {
            const sender = userMap[message.sender_id] || {};
            const recipient = userMap[message.recipient_id] || {};
            
            return (
              <div 
                key={message.id} 
                style={{ 
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>
                    From: {sender.first_name} {sender.last_name} ({sender.role})
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    To: {recipient.first_name} {recipient.last_name} ({recipient.role})
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    {dayjs(message.timestamp).format('MMM D, YYYY h:mm A')}
                  </div>
                </div>

                <div style={{ 
                  background: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  marginBottom: '1rem'
                }}>
                  <div><b>Original:</b> {message.original_content}</div>
                  <div style={{ marginTop: 8 }}><b>AI Filtered:</b> {message.filtered_content}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleAction(message.id, 'approve')}
                    disabled={actionLoading === message.id + 'approve'}
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      opacity: actionLoading === message.id + 'approve' ? 0.7 : 1
                    }}
                  >
                    {actionLoading === message.id + 'approve' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(message.id, 'reject')}
                    disabled={actionLoading === message.id + 'reject'}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      opacity: actionLoading === message.id + 'reject' ? 0.7 : 1
                    }}
                  >
                    {actionLoading === message.id + 'reject' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PendingMessages; 