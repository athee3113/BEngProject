import React, { useEffect, useState } from 'react';
import { messageAPI } from '../services/api';

function EstateAgentMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      setError('');
      try {
        // TODO: Replace with actual API call for pending messages for this estate agent
        const res = await fetch('http://localhost:8000/messages/pending', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      const endpoint = action === 'approve' ? '/messages/approve' : '/messages/reject';
      const res = await fetch(`http://localhost:8000${endpoint}?message_id=${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to update message');
      setMessages(msgs => msgs.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to update message');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div>Loading messages...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #eee' }}>
      <h2>Pending Messages for Approval</h2>
      {messages.length === 0 ? (
        <div>No pending messages.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {messages.map(msg => (
            <li key={msg.id} style={{ borderBottom: '1px solid #eee', marginBottom: 16, paddingBottom: 16 }}>
              <div><b>From:</b> {msg.sender_id}</div>
              <div><b>To:</b> {msg.recipient_id}</div>
              <div><b>Property:</b> {msg.property_id}</div>
              <div><b>Stage:</b> {msg.stage_id}</div>
              <div><b>Message:</b> {msg.content}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => handleAction(msg.id, 'approve')} disabled={actionLoading === msg.id + 'approve'} style={{ marginRight: 8, background: '#22c55e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4 }}>Approve</button>
                <button onClick={() => handleAction(msg.id, 'reject')} disabled={actionLoading === msg.id + 'reject'} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4 }}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EstateAgentMessages; 