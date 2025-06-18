import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

const BUYER_REVIEW_DOCUMENTS = [
  { key: 'PROOF_OF_ID', value: 'proof_of_id', label: 'Proof of ID' },
  { key: 'PROOF_OF_ADDRESS', value: 'proof_of_address', label: 'Proof of Address' },
  { key: 'SOURCE_OF_FUNDS', value: 'source_of_funds', label: 'Source of Funds' },
  { key: 'MORTGAGE_OFFER', value: 'mortgage_offer', label: 'Mortgage Offer' },
];

function SolicitorBuyerReviewDocuments() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesValue, setNotesValue] = useState('');

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      try {
        const files = await fileAPI.getPropertyFiles(propertyId);
        setDocuments(files);
      } catch (error) {
        setUploadError('Failed to fetch files');
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, [propertyId]);

  const handleNotesEdit = (fileId, currentNotes) => {
    setEditingNotes(fileId);
    setNotesValue(currentNotes || '');
  };

  const handleNotesSave = async (fileId) => {
    try {
      await fileAPI.updateFileNotes(fileId, notesValue);
      const files = await fileAPI.getPropertyFiles(propertyId);
      setDocuments(files);
      setEditingNotes(null);
    } catch (error) {
      setUploadError('Failed to update notes');
    }
  };

  const handleNotesCancel = () => {
    setEditingNotes(null);
    setNotesValue('');
  };

  const handleAccept = async (fileId) => {
    try {
      await fileAPI.updateFileReview(fileId, 'accepted');
      const files = await fileAPI.getPropertyFiles(propertyId);
      setDocuments(files);
    } catch (error) {
      setUploadError('Failed to accept document');
    }
  };

  const handleDeny = async (fileId) => {
    if (!window.confirm('Are you sure you want to deny this document? It will be deleted.')) return;
    try {
      await fileAPI.updateFileReview(fileId, 'denied');
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== fileId));
    } catch (error) {
      setUploadError('Failed to deny document');
    }
  };

  return (
    <div className="property-dashboard-container">
      <nav className="property-dashboard-nav">
        <div className="nav-content">
          <Link to={`/solicitor/property/${propertyId}`} className="logo">
            Conveyancer
          </Link>
          <div className="nav-buttons">
            <Link to={`/solicitor/property/${propertyId}`} className="home-button">
              Property Dashboard
            </Link>
            <button onClick={() => { localStorage.removeItem('token'); sessionStorage.removeItem('token'); localStorage.removeItem('userInfo'); navigate('/'); }} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="property-dashboard-content">
        <div className="documents-section">
          <div className="section-header">
            <h2>Buyer Review Documents</h2>
            <p>Review and approve submissions from the buyer</p>
          </div>
          <div className="table-container">
            {uploadError && (
              <div className="error-message">
                Error: {uploadError}
              </div>
            )}
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Review Status</th>
                  <th>Last Updated</th>
                  <th>Required By</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {BUYER_REVIEW_DOCUMENTS.map(doc => {
                  const uploadedFile = documents.find(d => d.document_type === doc.value);
                  return (
                    <tr key={doc.key}>
                      <td>{doc.label}</td>
                      <td>
                        {uploadedFile ? (
                          <span className="status-badge uploaded">Uploaded</span>
                        ) : (
                          <span className="status-badge pending">Pending</span>
                        )}
                      </td>
                      <td>
                        {uploadedFile ? (
                          uploadedFile.review_status === 'approved' ? (
                            <span className="status-badge accepted">Approved</span>
                          ) : uploadedFile.review_status === 'denied' ? (
                            <span className="status-badge denied">Denied</span>
                          ) : uploadedFile.review_status === 'pending' ? (
                            <span className="status-badge pending">Pending</span>
                          ) : (
                            <span className="status-badge">-</span>
                          )
                        ) : (
                          <span className="status-badge">-</span>
                        )}
                      </td>
                      <td>
                        {uploadedFile ? new Date(uploadedFile.uploaded_at).toLocaleDateString() : '-'}
                      </td>
                      <td>Buyer</td>
                      <td>
                        {uploadedFile ? (
                          editingNotes === uploadedFile.id ? (
                            <>
                              <input
                                type="text"
                                value={notesValue}
                                onChange={e => setNotesValue(e.target.value)}
                                style={{ width: '80%' }}
                              />
                              <button onClick={() => handleNotesSave(uploadedFile.id)} style={{ marginLeft: 4 }}>Save</button>
                              <button onClick={handleNotesCancel} style={{ marginLeft: 4 }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              {uploadedFile.notes || '-'}{' '}
                              <button onClick={() => handleNotesEdit(uploadedFile.id, uploadedFile.notes)} style={{ marginLeft: 4 }}>Edit</button>
                            </>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {uploadedFile ? (
                          <>
                            <Link to={uploadedFile.file_path} target="_blank" rel="noopener noreferrer">
                              View
                            </Link>
                            {uploadedFile.review_status === 'accepted' && (
                              <span className="review-status-text accepted" style={{ marginLeft: 8 }}>Accepted</span>
                            )}
                            {uploadedFile.review_status === 'denied' && (
                              <span className="review-status-text denied" style={{ marginLeft: 8 }}>Denied</span>
                            )}
                            {uploadedFile.review_status === 'pending' && (
                              <>
                                <button onClick={() => handleAccept(uploadedFile.id)} className="action-button accept" style={{ marginLeft: 8 }}>Accept</button>
                                <button onClick={() => handleDeny(uploadedFile.id)} className="action-button deny" style={{ marginLeft: 8 }}>Deny</button>
                              </>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SolicitorBuyerReviewDocuments; 