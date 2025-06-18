import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

const EXCHANGE_COMPLETION_DOCUMENTS = [
  { key: 'deposit_receipt', label: 'Deposit Receipt', section: 'Exchange', uploadedBy: 'Solicitor' },
  { key: 'tr1_transfer_deed', label: 'TR1 Transfer Deed', section: 'Completion', uploadedBy: 'Solicitor' },
  { key: 'completion_statement', label: 'Completion Statement', section: 'Completion', uploadedBy: 'Solicitor' },
  { key: 'sdlt_confirmation', label: 'SDLT Confirmation', section: 'Post-Completion', uploadedBy: 'Solicitor' },
  { key: 'final_title_register', label: 'Final Title Register', section: 'Post-Completion', uploadedBy: 'Solicitor' },
  { key: 'final_report_to_client', label: 'Final Report to Client', section: 'Post-Completion', uploadedBy: 'Solicitor' },
];

function SellerSolicitorExchangeCompletionDocuments() {
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

  const handleUpload = async (docKey) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('property_id', propertyId);
        formData.append('document_type', docKey);
        await fileAPI.uploadFile(formData);
        let files = await fileAPI.getPropertyFiles(propertyId);
        const uploaded = files.find(f => f.document_type === docKey);
        if (uploaded) {
          await fileAPI.updateFileReview(uploaded.id, 'accepted');
          files = await fileAPI.getPropertyFiles(propertyId);
        }
        setDocuments(files);
      } catch (error) {
        setUploadError('Failed to upload file');
      } finally {
        setLoading(false);
      }
    };
    fileInput.click();
  };

  return (
    <div className="property-dashboard-container">
      <nav className="property-dashboard-nav">
        <div className="nav-content">
          <Link to={`/seller-solicitor/property/${propertyId}`} className="logo">
            Conveyancer
          </Link>
          <div className="nav-buttons">
            <Link to={`/seller-solicitor/property/${propertyId}`} className="home-button">
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
            <h2>Exchange & Completion Documents</h2>
            <p>Review and approve submissions for exchange and completion</p>
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
                {EXCHANGE_COMPLETION_DOCUMENTS.map(doc => {
                  const uploadedFile = documents.find(d => d.document_type === doc.key);
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
                      <td>Solicitor</td>
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
                            <button onClick={() => fileAPI.downloadFile(uploadedFile.id)} className="action-button view">View</button>
                            {uploadedFile.review_status === 'pending' && (
                              <>
                                <button onClick={() => handleAccept(uploadedFile.id)} className="action-button accept" style={{ marginLeft: 8 }}>Accept</button>
                                <button onClick={() => handleDeny(uploadedFile.id)} className="action-button deny" style={{ marginLeft: 8 }}>Deny</button>
                              </>
                            )}
                          </>
                        ) : (
                          <button className="action-button upload" onClick={() => handleUpload(doc.key)}>
                            Upload
                          </button>
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

export default SellerSolicitorExchangeCompletionDocuments; 