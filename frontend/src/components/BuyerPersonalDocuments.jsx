import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

const PERSONAL_DOCUMENTS = [
  { key: 'PROOF_OF_ID', value: 'proof_of_id', label: 'Proof of ID', section: 'Personal Documents', uploadedBy: 'Client', expiryMonths: 3, requiredFrom: 'Buyer' },
  { key: 'PROOF_OF_ADDRESS', value: 'proof_of_address', label: 'Proof of Address', section: 'Personal Documents', uploadedBy: 'Client', expiryMonths: 3, requiredFrom: 'Buyer' },
  { key: 'SOURCE_OF_FUNDS', value: 'source_of_funds', label: 'Source of Funds', section: 'Personal Documents', uploadedBy: 'Client', requiredFrom: 'Buyer' },
  { key: 'MORTGAGE_OFFER', value: 'mortgage_offer', label: 'Mortgage Offer', section: 'Personal Documents', uploadedBy: 'Client/Solicitor', requiredFrom: 'Buyer' },
  { key: 'SIGNED_CONTRACT', value: 'signed_contract', label: 'Signed Contract', section: 'Personal Documents', uploadedBy: 'Client', requiredFrom: 'Buyer' },
];

function BuyerPersonalDocuments() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesValue, setNotesValue] = useState('');
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role;

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

  const handleDocumentAction = async (docKey, action) => {
    if (action === 'upload') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingFile(true);
        setUploadError(null);
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('property_id', propertyId);
          const doc = PERSONAL_DOCUMENTS.find(d => d.key === docKey);
          formData.append('document_type', doc.value);
          await fileAPI.uploadFile(formData);
          const files = await fileAPI.getPropertyFiles(propertyId);
          setDocuments(files);
        } catch (error) {
          setUploadError('Failed to upload file');
        } finally {
          setUploadingFile(false);
        }
      };
      fileInput.click();
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    setUploadingFile(true);
    setUploadError(null);
    try {
      await fileAPI.deleteFile(fileId);
      const files = await fileAPI.getPropertyFiles(propertyId);
      setDocuments(files);
    } catch (error) {
      setUploadError('Failed to delete file');
    } finally {
      setUploadingFile(false);
    }
  };

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

  return (
    <div className="property-dashboard-container">
      <nav className="property-dashboard-nav">
        <div className="nav-content">
          <Link to="/dashboard/buyer" className="logo">
            Conveyancer
          </Link>
          <div className="nav-buttons">
            <Link to={`/property/${propertyId}`} className="home-button">
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
            <h2>🧾 Your Documents</h2>
            <p>Personal information you need to upload or review</p>
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
                  <th>Expiry Date</th>
                  <th>Notes</th>
                  <th>Action</th>
                  <th>Required From</th>
                </tr>
              </thead>
              <tbody>
                {PERSONAL_DOCUMENTS.map(doc => {
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
                      <td>
                        {uploadedFile && doc.expiryMonths ? (
                          (() => {
                            const expiryDate = dayjs(uploadedFile.uploaded_at).add(doc.expiryMonths, 'month');
                            const daysLeft = expiryDate.diff(dayjs(), 'day');
                            let tagColor = '#22c55e'; // green
                            if (daysLeft <= 7) tagColor = '#ef4444'; // red
                            else if (daysLeft <= 30) tagColor = '#eab308'; // yellow
                            return (
                              <span style={{ color: tagColor }}>
                                {expiryDate.format('DD/MM/YYYY')} ({daysLeft} days left)
                              </span>
                            );
                          })()
                        ) : (
                          '-'
                        )}
                      </td>
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
                            <button onClick={() => handleDeleteFile(uploadedFile.id)} className="action-button delete" style={{ marginLeft: 8 }}>Delete</button>
                          </>
                        ) : (
                          doc.requiredFrom === 'Buyer' ? (
                            <button onClick={() => handleDocumentAction(doc.key, 'upload')} disabled={uploadingFile} className="action-button upload">
                              Upload
                            </button>
                          ) : (
                            <button className="action-button upload" disabled style={{ opacity: 0.5 }}>
                              Waiting for {doc.requiredFrom}
                            </button>
                          )
                        )}
                      </td>
                      <td>{doc.requiredFrom}</td>
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

export default BuyerPersonalDocuments; 