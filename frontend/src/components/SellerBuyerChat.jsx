import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI, userAPI, propertyStageAPI, propertyAPI } from '../services/api';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length === 1 ? parts[0][0] : parts[0][0] + parts[1][0];
}

function SellerBuyerChat() {
  const { propertyId, stageId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userMap, setUserMap] = useState({});
  const [stageName, setStageName] = useState('');
  const [buyer, setBuyer] = useState(null);
  const [seller, setSeller] = useState(null);
  const chatBottomRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const [actionLoading, setActionLoading] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        // Fetch all messages for the property using the new endpoint
        const allMessages = await messageAPI.getAllPropertyMessages(propertyId);
        const filtered = allMessages.filter(m =>
          String(m.stage_id) === String(stageId) &&
          m.is_buyer_seller_message
        );
        setMessages(filtered);

        // Fetch user info for buyer and seller
        const userMapObj = {};
        const property = await propertyAPI.getProperty(propertyId);
        
        // Fetch buyer and seller info
        const buyerInfo = await userAPI.getUser(property.buyer_id);
        const sellerInfo = await userAPI.getUser(property.seller_id);
        
        userMapObj[buyerInfo.id] = buyerInfo;
        userMapObj[sellerInfo.id] = sellerInfo;
        
        setUserMap(userMapObj);
        setBuyer(buyerInfo);
        setSeller(sellerInfo);

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
  }, [propertyId, stageId]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleBack = () => {
    // Route to the correct property view or progress page based on user role
    const role = (userInfo.role || '').toLowerCase();
    if (role === 'estate_agent') {
      navigate(`/estate-agent/property/${propertyId}`);
    } else if (role === 'buyer') {
      navigate(`/property/${propertyId}/progress`);
    } else if (role === 'seller') {
      navigate(`/seller/property/${propertyId}/progress`);
    } else if (role === 'solicitor') {
      navigate(`/solicitor/property/${propertyId}/progress`);
    } else {
      navigate(-1); // fallback
    }
  };

  const getUserDisplay = (id) => {
    const user = userMap[id];
    if (!user) return `User ${id}`;
    return `${user.first_name} ${user.last_name} (${user.role})`;
  };

  const handleApprove = async (messageId) => {
    setActionLoading('approve-' + messageId);
    try {
      await messageAPI.approveMessage(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'approved' } : m));
    } catch (err) {
      alert(err.message || 'Failed to approve message');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (messageId) => {
    setActionLoading('reject-' + messageId);
    try {
      await messageAPI.rejectMessage(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'rejected' } : m));
    } catch (err) {
      alert(err.message || 'Failed to reject message');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveVersion = async (messageId, version) => {
    setActionLoading('approve-' + version + '-' + messageId);
    try {
      await messageAPI.approveMessageVersion(propertyId, messageId, version);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'approved' } : m));
    } catch (err) {
      alert(err.message || 'Failed to approve message');
    } finally {
      setActionLoading(null);
    }
  };

  const recipientId = (userInfo.id === buyer?.id) ? seller?.id : buyer?.id;

  const handleSend = async () => {
    if (!messageContent.trim()) return;
    setSendLoading(true);
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      sender_id: userInfo.id,
      recipient_id: recipientId,
      property_id: Number(propertyId),
      stage_id: Number(stageId),
      original_content: messageContent,
      content: messageContent,
      filtered_content: '',
      approved_content: '',
      approval_status: 'pending',
      status: 'pending',
      timestamp: new Date().toISOString(),
      is_buyer_seller_message: true
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    setMessageContent('');
    try {
      await messageAPI.sendBuyerSellerMessage(propertyId, stageId, optimisticMsg.original_content);
    } catch (err) {
      alert(err.message || 'Failed to send message');
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSendLoading(false);
    }
  };

  // Merge backend and optimistic messages for rendering
  const mergedMessages = [
    ...messages.filter(m =>
      m.status !== 'pending' ||
      (m.status === 'pending' && (m.sender_id === userInfo.id || (userInfo.role && userInfo.role.toLowerCase() === 'estate_agent')))
    ),
    ...optimisticMessages.filter(optMsg =>
      !messages.some(
        m =>
          m.sender_id === optMsg.sender_id &&
          m.original_content === optMsg.original_content &&
          m.status === 'pending'
      )
    )
  ];

  // Debug log for all messages
  console.log('ALL MESSAGES', mergedMessages, 'Current user:', userInfo);
  mergedMessages.forEach(msg => {
    console.log('MSG:', msg);
  });

  return (
    <div className="stage-chat-container" style={{ maxWidth: 700, margin: '2rem auto', padding: '2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}>
      <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>
        Seller-Buyer Chat for Stage: <span style={{ color: '#2563eb' }}>{stageName}</span>
      </h2>
      <button 
        onClick={handleBack} 
        style={{ 
          marginBottom: 24, 
          display: 'inline-block', 
          color: '#2563eb', 
          textDecoration: 'none', 
          fontWeight: 500, 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          padding: 0 
        }}
      >
        &larr; Back to Progress
      </button>
      <div style={{ minHeight: 200, marginTop: 16, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {loading ? (
          <div>Loading chat...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div>No messages between buyer and seller for this stage.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mergedMessages.map(msg => {
              const sender = userMap[msg.sender_id];
              const isPending = msg.status === 'pending';
              const isAgent = userInfo.role && userInfo.role.toLowerCase() === 'estate_agent';
              const isOptimistic = msg.id && String(msg.id).startsWith('temp-');
              // Debug log for each message
              if (isPending && msg.sender_id === userInfo.id && !isAgent) {
                console.log('DEBUG: Rendering pending message for sender', {
                  msg,
                  userInfo
                });
              }
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender_id === buyer?.id ? 'flex-end' : 'flex-start',
                    background: msg.sender_id === buyer?.id ? '#e0e7ff' : '#f3f4f6',
                    borderRadius: 12,
                    padding: 16,
                    minWidth: 180,
                    maxWidth: 420,
                    boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
                    position: 'relative',
                    marginBottom: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: msg.sender_id === buyer?.id ? '#2563eb' : '#6b7280',
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
                  {/* Strict rendering for pending/approved/rejected (direct fix) */}
                  {isPending ? (
                    msg.sender_id === userInfo.id && !isAgent ? (
                      <div style={{ color: '#374151', marginBottom: 8, fontSize: 15 }}>{msg.original_content || msg.content}</div>
                    ) : isAgent ? (
                      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                        <div style={{ flex: 1, background: '#f9fafb', borderRadius: 8, padding: 10 }}>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>Original:</div>
                          <div style={{ color: '#374151', marginBottom: 8, fontSize: 15 }}>{msg.original_content}</div>
                          <button
                            onClick={() => handleApproveVersion(msg.id, 'original')}
                            disabled={actionLoading === 'approve-original-' + msg.id}
                            style={{
                              background: '#22c55e',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontWeight: 500,
                              cursor: 'pointer',
                              opacity: actionLoading === 'approve-original-' + msg.id ? 0.7 : 1,
                              width: '100%'
                            }}
                          >
                            {actionLoading === 'approve-original-' + msg.id ? 'Approving...' : 'Approve Original'}
                          </button>
                        </div>
                        <div style={{ flex: 1, background: '#f9fafb', borderRadius: 8, padding: 10 }}>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>Rephrased:</div>
                          <div style={{ color: '#374151', marginBottom: 8, fontSize: 15 }}>{msg.filtered_content}</div>
                          <button
                            onClick={() => handleApproveVersion(msg.id, 'filtered')}
                            disabled={actionLoading === 'approve-filtered-' + msg.id}
                            style={{
                              background: '#2563eb',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontWeight: 500,
                              cursor: 'pointer',
                              opacity: actionLoading === 'approve-filtered-' + msg.id ? 0.7 : 1,
                              width: '100%'
                            }}
                          >
                            {actionLoading === 'approve-filtered-' + msg.id ? 'Approving...' : 'Approve Rephrased'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleReject(msg.id)}
                            disabled={actionLoading === 'reject-' + msg.id}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontWeight: 500,
                              cursor: 'pointer',
                              opacity: actionLoading === 'reject-' + msg.id ? 0.7 : 1,
                              marginBottom: 8
                            }}
                          >
                            {actionLoading === 'reject-' + msg.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ) : null
                  ) : msg.status === 'approved' ? (
                    <div style={{ color: '#374151', marginBottom: 8, fontSize: 15 }}>{msg.approved_content}</div>
                  ) : msg.status === 'rejected' && msg.sender_id === userInfo.id && !isAgent ? (
                    <div style={{ color: '#374151', marginBottom: 8, fontSize: 15 }}>{msg.original_content || msg.content}</div>
                  ) : null}
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
          disabled={sendLoading || !messageContent.trim()}
          style={{ padding: '10px 22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: sendLoading || !messageContent.trim() ? 'not-allowed' : 'pointer', opacity: sendLoading || !messageContent.trim() ? 0.7 : 1 }}
        >
          {sendLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default SellerBuyerChat; 