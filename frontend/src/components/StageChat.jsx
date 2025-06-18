import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { messageAPI, userAPI, propertyStageAPI } from '../services/api';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length === 1 ? parts[0][0] : parts[0][0] + parts[1][0];
}

function StageChat() {
  const { propertyId, stageId, recipientId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMap, setUserMap] = useState({});
  const [stageName, setStageName] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role ? userInfo.role.toLowerCase() : '';
  const chatBottomRef = useRef(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        // Fetch all messages for the property and filter by stage and user pair
        const allMessages = await messageAPI.getAllPropertyMessages(propertyId);
        const filtered = allMessages.filter(m =>
          String(m.stage_id) === String(stageId) &&
          ((m.sender_id === userInfo.id && String(m.recipient_id) === String(recipientId)) ||
           (String(m.sender_id) === String(recipientId) && m.recipient_id === userInfo.id))
        );
        setMessages(filtered);
        // Fetch user info for both users
        const userMapObj = {};
        const ids = [userInfo.id, Number(recipientId)];
        await Promise.all(ids.map(async id => {
          try {
            if (id === undefined || id === null) {
              return;
            }
            const user = await userAPI.getUser(id);
            userMapObj[id] = user;
          } catch {
            userMapObj[id] = { id, first_name: 'Unknown', last_name: '', role: '' };
          }
        }));
        setUserMap(userMapObj);
        setRecipient(userMapObj[Number(recipientId)]);
        // Fetch stage name
        const stages = await propertyStageAPI.getPropertyStages(propertyId);
        const stage = stages.find(s => String(s.id) === String(stageId));
        setStageName(stage ? stage.stage : '');
      } catch (err) {
        setError(err.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [propertyId, stageId, recipientId, sendSuccess]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleBack = () => {
    navigate(`/property/${propertyId}`, { replace: true });
  };

  const getUserDisplay = (id) => {
    const user = userMap[id];
    if (!user) return `User ${id}`;
    return `${user.first_name} ${user.last_name} (${user.role})`;
  };

  const isSentByMe = (msg) => msg.sender_id === userInfo.id;

  const handleSend = async () => {
    setSendLoading(true);
    setSendError('');
    setSendSuccess('');
    try {
      // Determine if this is a buyer-seller message
      const senderRole = userRole;
      const recipientRole = recipient && recipient.role ? recipient.role.toLowerCase() : '';
      const isBuyerSellerChat =
        (senderRole === 'buyer' && recipientRole === 'seller') ||
        (senderRole === 'seller' && recipientRole === 'buyer');
      if (isBuyerSellerChat) {
        await messageAPI.sendBuyerSellerMessage(propertyId, stageId, messageContent);
      } else {
      await messageAPI.sendMessage(
        userInfo.id,
        Number(recipientId),
        propertyId,
        stageId,
        messageContent
      );
      }
      setSendSuccess('Message sent!');
      setMessageContent('');
      setTimeout(() => setSendSuccess(''), 1000);
    } catch (err) {
      setSendError(err.message || 'Failed to send message');
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="stage-chat-container" style={{ maxWidth: 700, margin: '2rem auto', padding: '2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}>
      <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>Chat with <span style={{ color: '#2563eb' }}>{recipient ? `${recipient.first_name} ${recipient.last_name} (${recipient.role})` : ''}</span> <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '1.1rem' }}>for Stage: {stageName}</span></h2>
      <button onClick={handleBack} style={{ marginBottom: 24, display: 'inline-block', color: '#2563eb', textDecoration: 'none', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>&larr; Back to Progress</button>
      <div style={{ minHeight: 200, marginTop: 16, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {loading ? (
          <div>Loading chat...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div>No messages yet. Start the conversation!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map(msg => {
              const sentByMe = isSentByMe(msg);
              const sender = userMap[msg.sender_id];
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: sentByMe ? 'flex-end' : 'flex-start',
                    background: sentByMe ? '#e0e7ff' : '#f3f4f6',
                    borderRadius: 12,
                    padding: 16,
                    minWidth: 180,
                    maxWidth: 420,
                    boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: sentByMe ? '#2563eb' : '#6b7280',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                      marginRight: 10,
                    }}>
                      {getInitials(sender ? `${sender.first_name} ${sender.last_name}` : '')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{getUserDisplay(msg.sender_id)}</div>
                    </div>
                  </div>
                  <div style={{ color: '#374151', marginBottom: 8, fontSize: 15 }}>
                    {msg.status === 'approved'
                      ? (msg.approved_content || msg.original_content || msg.content)
                      : ((msg.status === 'pending' || msg.status === 'rejected') && msg.sender_id === userInfo.id)
                        ? (msg.original_content || msg.content)
                        : msg.content}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{new Date(msg.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: msg.status === 'pending' ? '#eab308' : msg.status === 'approved' ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    Status: {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>
      {/* Message input */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <textarea
          value={messageContent}
          onChange={e => setMessageContent(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          style={{ flex: 1, borderRadius: 8, border: '1px solid #e5e7eb', padding: 10, fontSize: 15, resize: 'vertical' }}
        />
        <button
          onClick={handleSend}
          disabled={sendLoading || !messageContent}
          style={{ padding: '10px 22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: sendLoading || !messageContent ? 'not-allowed' : 'pointer', opacity: sendLoading || !messageContent ? 0.7 : 1 }}
        >
          {sendLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
      {sendError && <div style={{ color: 'red', marginTop: 8 }}>{sendError}</div>}
      {sendSuccess && <div style={{ color: 'green', marginTop: 8 }}>{sendSuccess}</div>}
    </div>
  );
}

export default StageChat; 