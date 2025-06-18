import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { messageAPI, userAPI, propertyStageAPI } from '../services/api';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length === 1 ? parts[0][0] : parts[0][0] + parts[1][0];
}

function StageMessages() {
  const { propertyId, stageId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMap, setUserMap] = useState({});
  const [stageName, setStageName] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        // Fetch all messages for the property and filter by stage
        const allMessages = await messageAPI.getAllPropertyMessages(propertyId);
        const filtered = allMessages.filter(m => String(m.stage_id) === String(stageId));
        setMessages(filtered);
        // Collect unique user IDs
        const userIds = Array.from(new Set(filtered.flatMap(m => [m.sender_id, m.recipient_id])));
        // Fetch user info for each
        const userMapObj = {};
        await Promise.all(userIds.map(async id => {
          try {
            const user = await userAPI.getUser(id);
            userMapObj[id] = user;
          } catch {
            userMapObj[id] = { id, first_name: 'Unknown', last_name: '', role: '' };
          }
        }));
        setUserMap(userMapObj);
        // Fetch stage name
        const stages = await propertyStageAPI.getPropertyStages(propertyId);
        const stage = stages.find(s => String(s.id) === String(stageId));
        setStageName(stage ? stage.stage : '');
      } catch (err) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [propertyId, stageId]);

  const getUserDisplay = (id) => {
    const user = userMap[id];
    if (!user) return `User ${id}`;
    return `${user.first_name} ${user.last_name} (${user.role})`;
  };

  const isSentByMe = (msg) => msg.sender_id === userInfo.id;

  return (
    <div className="stage-messages-container" style={{ maxWidth: 700, margin: '2rem auto', padding: '2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}>
      <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>Messages for Stage: <span style={{ color: '#2563eb' }}>{stageName}</span></h2>
      <Link to={`/property/${propertyId}/progress`} style={{ marginBottom: 24, display: 'inline-block', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>&larr; Back to Progress</Link>
      <div style={{ minHeight: 200, marginTop: 16 }}>
        {loading ? (
          <div>Loading messages...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div>No messages for this stage.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {messages.map(msg => {
              const sentByMe = isSentByMe(msg);
              const sender = userMap[msg.sender_id];
              const recipient = userMap[msg.recipient_id];
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: sentByMe ? 'flex-end' : 'flex-start',
                    background: sentByMe ? '#e0e7ff' : '#f3f4f6',
                    borderRadius: 12,
                    padding: 18,
                    minWidth: 220,
                    maxWidth: 420,
                    boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: sentByMe ? '#2563eb' : '#6b7280',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 18,
                      marginRight: 12,
                    }}>
                      {getInitials(sender ? `${sender.first_name} ${sender.last_name}` : '')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{getUserDisplay(msg.sender_id)}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>To: {getUserDisplay(msg.recipient_id)}</div>
                    </div>
                  </div>
                  <div style={{ color: '#374151', marginBottom: 10, fontSize: 16 }}>
                    {(msg.status === 'approved' && msg.approved_content === msg.original_content) ? msg.original_content :
                      ((msg.status === 'pending' || msg.status === 'rejected') && msg.sender_id === userInfo.id) ? (msg.original_content || msg.content) : msg.content}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{new Date(msg.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: msg.status === 'pending' ? '#eab308' : msg.status === 'approved' ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    Status: {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StageMessages; 