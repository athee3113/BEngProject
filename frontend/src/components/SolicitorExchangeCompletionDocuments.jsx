import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

const EXCHANGE_COMPLETION_DOCUMENTS = [
  { key: 'SIGNED_CONTRACT', value: 'signed_contract', label: 'Signed Contract' },
  { key: 'DEPOSIT_RECEIPT', value: 'deposit_receipt', label: 'Deposit Receipt' },
  { key: 'COMPLETION_STATEMENT', value: 'completion_statement', label: 'Completion Statement' },
];

function SolicitorExchangeCompletionDocuments() {
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
            <h2>Exchange & Completion</h2>
            <p>Finalise the transaction with seller's solicitor</p>
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
                </tr>
              </thead>
              <tbody>
                {EXCHANGE_COMPLETION_DOCUMENTS.map(doc => {
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
                          <Link to={uploadedFile.file_path} target="_blank" rel="noopener noreferrer">
                            View
                          </Link>
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

export default SolicitorExchangeCompletionDocuments; 