import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

const SEARCHES_LEGAL_DOCUMENTS = [
  { key: 'LOCAL_AUTHORITY_SEARCH', value: 'local_authority_search', label: 'Local Authority Search' },
  { key: 'WATER_DRAINAGE', value: 'water_search', label: 'Water & Drainage' },
  { key: 'ENVIRONMENTAL_SEARCH', value: 'environmental_search', label: 'Environmental Search' },
  { key: 'SURVEY_REPORT', value: 'survey_report', label: 'Survey Report' },
  { key: 'DRAFT_CONTRACT', value: 'draft_contract', label: 'Draft Contract' },
  { key: 'REVIEWED_CONTRACT', value: 'reviewed_contract', label: 'Reviewed Contract' },
  { key: 'CONTRACT_FINAL', value: 'contract', label: 'Contract (Final)' },
];

function SolicitorSearchesLegalDocuments() {
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
            <h2>Searches & Legal Checks</h2>
            <p>Documents you upload to assess the property and satisfy lender/AML requirements</p>
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
                  <th>Required By</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {SEARCHES_LEGAL_DOCUMENTS.map(doc => {
                  const uploadedFile = documents.find(d => d.document_type === doc.key);
                  let requiredBy = 'Solicitor';
                  if (doc.requiredBy) requiredBy = doc.requiredBy;
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
                      <td>{requiredBy}</td>
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

export default SolicitorSearchesLegalDocuments; 