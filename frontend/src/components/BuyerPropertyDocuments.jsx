import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

const PROPERTY_DOCUMENTS = [
  { key: 'epc', label: 'EPC (Energy Performance Certificate)', section: 'Property Documents', uploadedBy: 'Solicitor', requiredFrom: 'Seller Solicitor' },
  { key: 'title_plan', label: 'Title Plan', section: 'Property Documents', uploadedBy: 'Solicitor', requiredFrom: 'Seller Solicitor' },
  { key: 'title_deeds', label: 'Title Deeds', section: 'Property Documents', uploadedBy: 'Solicitor', requiredFrom: 'Seller Solicitor' },
  { key: 'property_photos', label: 'Property Photos', section: 'Property Documents', uploadedBy: 'Estate Agent', requiredFrom: 'Estate Agent' },
];

function BuyerPropertyDocuments() {
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
          formData.append('document_type', docKey);
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
            <h2>🏡 Property Documents</h2>
            <p>Official documents about the property you're buying</p>
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
                  <th>Last Updated</th>
                  <th>Notes</th>
                  <th>Action</th>
                  <th>Required From</th>
                </tr>
              </thead>
              <tbody>
                {PROPERTY_DOCUMENTS.map(doc => {
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
                        {uploadedFile ? new Date(uploadedFile.uploaded_at).toLocaleDateString() : '-'}
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

export default BuyerPropertyDocuments; 