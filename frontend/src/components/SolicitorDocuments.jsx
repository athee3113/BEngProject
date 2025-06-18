import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PropertyDashboard.css';
import dayjs from 'dayjs';

// Define the document sections and structure similar to PropertyDocuments.jsx
const REQUIRED_DOCUMENTS = [
  // Pre-Contract
  { key: 'proof_of_id', label: 'Proof of ID', section: 'Pre-Contract', requiredBy: 'Buyer', expiryMonths: 3 },
  { key: 'proof_of_address', label: 'Proof of Address', section: 'Pre-Contract', requiredBy: 'Buyer', expiryMonths: 3 },
  { key: 'source_of_funds', label: 'Source of Funds', section: 'Pre-Contract', requiredBy: 'Buyer' },
  // Contract Pack
  { key: 'draft_contract', label: 'Draft Contract', section: 'Contract Pack', requiredBy: 'Solicitor' },
  { key: 'title_register_plan', label: 'Title Register & Plan', section: 'Contract Pack', requiredBy: 'Solicitor' },
  { key: 'ta6_ta10_forms', label: 'TA6 / TA10 Forms', section: 'Contract Pack', requiredBy: 'Solicitor' },
  { key: 'epc', label: 'EPC', section: 'Contract Pack', requiredBy: 'Solicitor' },
  // Searches
  { key: 'local_authority_search', label: 'Local Authority Search', section: 'Searches', requiredBy: 'Solicitor', expiryMonths: 6 },
  { key: 'water_drainage', label: 'Water & Drainage', section: 'Searches', requiredBy: 'Solicitor', expiryMonths: 6 },
  { key: 'environmental_search', label: 'Environmental Search', section: 'Searches', requiredBy: 'Solicitor', expiryMonths: 6 },
  // Mortgage & Survey
  { key: 'mortgage_offer', label: 'Mortgage Offer', section: 'Mortgage & Survey', requiredBy: 'Buyer/Solicitor' },
  { key: 'signed_mortgage_deed', label: 'Signed Mortgage Deed', section: 'Mortgage & Survey', requiredBy: 'Buyer' },
  { key: 'survey_report', label: 'Survey Report', section: 'Mortgage & Survey', requiredBy: 'Buyer', expiryMonths: 6 },
  // Exchange
  { key: 'signed_contract', label: 'Signed Contract', section: 'Exchange', requiredBy: 'Buyer' },
  { key: 'deposit_receipt', label: 'Deposit Receipt', section: 'Exchange', requiredBy: 'Solicitor' },
  // Completion
  { key: 'tr1_transfer_deed', label: 'TR1 Transfer Deed', section: 'Completion', requiredBy: 'Solicitor' },
  { key: 'completion_statement', label: 'Completion Statement', section: 'Completion', requiredBy: 'Solicitor' },
  // Post-Completion
  { key: 'sdlt_confirmation', label: 'SDLT Confirmation', section: 'Post-Completion', requiredBy: 'Solicitor' },
  { key: 'final_title_register', label: 'Final Title Register', section: 'Post-Completion', requiredBy: 'Solicitor' },
  { key: 'final_report_to_client', label: 'Final Report to Client', section: 'Post-Completion', requiredBy: 'Solicitor' },
  // Handover Documents
  { key: 'manuals', label: 'Manuals', section: 'Handover Documents', requiredBy: 'Seller' },
  { key: 'alarm_codes_wifi', label: 'Alarm Codes / Wi-Fi', section: 'Handover Documents', requiredBy: 'Seller' },
  { key: 'guarantees_certificates', label: 'Guarantees & Certificates', section: 'Handover Documents', requiredBy: 'Seller' },
];

function SolicitorDocuments() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesValue, setNotesValue] = useState('');
  const [editingExpiry, setEditingExpiry] = useState(null);
  const [expiryValue, setExpiryValue] = useState('');

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

  const handleExpiryEdit = (fileId, currentExpiry) => {
    setEditingExpiry(fileId);
    setExpiryValue(currentExpiry ? dayjs(currentExpiry).format('YYYY-MM-DD') : '');
  };

  const handleExpiryCancel = () => {
    setEditingExpiry(null);
    setExpiryValue('');
  };

  const handleExpirySave = async (fileId) => {
    try {
      // Convert the date to ISO format with timezone
      const expiryDate = dayjs(expiryValue).toISOString();
      const updatedFile = await fileAPI.updateFileExpiry(fileId, expiryDate);
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === fileId ? { ...doc, expiry_date: updatedFile.expiry_date } : doc
        )
      );
      setEditingExpiry(null);
      setExpiryValue('');
    } catch (error) {
      setUploadError('Failed to update expiry date');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to={`/solicitor/property/${propertyId}`} className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Conveyancer
            </Link>
            <div className="flex gap-2">
              <Link 
                to={`/solicitor/property/${propertyId}`} 
                className="bg-blue-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-blue-700 transition-colors"
              >
                Property Dashboard
              </Link>
              <button onClick={() => { localStorage.removeItem('token'); sessionStorage.removeItem('token'); localStorage.removeItem('userInfo'); navigate('/') }} className="bg-blue-600 text-white rounded-md px-4 py-2 font-medium shadow hover:bg-blue-700 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <h2 className="text-2xl font-bold mb-6">Documents</h2>
        {uploadError && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4 font-semibold">Error: {uploadError}</div>
        )}
        <div className="space-y-10">
          {Array.from(new Set(REQUIRED_DOCUMENTS.map(doc => doc.section))).map(section => (
            <div key={section} className="bg-white rounded-xl shadow p-6">
              <div className="text-sm uppercase text-gray-500 mb-2 border-b pb-2 font-semibold tracking-wider">{section}</div>
              <div className="overflow-x-auto">
                <div className="min-w-[800px] flex flex-col gap-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 gap-4 text-gray-500 text-sm font-medium mb-2">
                    <div>Document</div>
                    <div>Required By</div>
                    <div>Status</div>
                    <div>Review</div>
                    <div>Last Updated</div>
                    <div>Expiry</div>
                    <div>Notes</div>
                    <div>Action</div>
                  </div>
                  {REQUIRED_DOCUMENTS.filter(doc => doc.section === section).map((doc, idx) => {
                    const uploadedFile = documents.find(d => d.document_type === doc.key);
                    return (
                      <div
                        key={doc.key}
                        className={
                          'grid grid-cols-8 gap-4 items-center rounded-lg p-4 ' +
                          (idx % 2 === 0 ? 'bg-gray-50' : 'bg-white') +
                          ' hover:shadow-sm transition-shadow duration-150'
                        }
                      >
                        {/* Document Name */}
                        <div className="font-semibold text-base text-gray-900">{doc.label}</div>
                        {/* Required By */}
                        <div className="text-gray-700 text-base">{doc.requiredBy || doc.required_by || '-'}</div>
                        {/* Status */}
                        <div>
                          {uploadedFile ? (
                            <span className="rounded-full text-sm px-3 py-1 bg-green-100 text-green-700 font-semibold">Uploaded</span>
                          ) : (
                            <span className="rounded-full text-sm px-3 py-1 bg-yellow-100 text-yellow-800 font-semibold">Pending</span>
                          )}
                        </div>
                        {/* Review Status */}
                        <div>
                          {uploadedFile ? (
                            ["accepted", "approved"].includes((uploadedFile.review_status || '').toLowerCase()) ? (
                              <span className="rounded-full text-sm px-3 py-1 bg-blue-100 text-blue-700 font-semibold">Approved</span>
                            ) : (uploadedFile.review_status || '').toLowerCase() === 'pending' ? (
                              <span className="rounded-full text-sm px-3 py-1 bg-yellow-100 text-yellow-800 font-semibold">Pending</span>
                            ) : (
                              <span className="rounded-full text-sm px-3 py-1 bg-gray-100 text-gray-700 font-semibold">{uploadedFile.review_status}</span>
                            )
                          ) : (
                            <span className="rounded-full text-sm px-3 py-1 bg-yellow-100 text-yellow-800 font-semibold">Pending</span>
                          )}
                        </div>
                        {/* Last Updated */}
                        <div className="text-gray-700 text-base">{uploadedFile ? new Date(uploadedFile.uploaded_at).toLocaleDateString() : '-'}</div>
                        {/* Expiry */}
                        <div style={{ minWidth: 180 }}>
                          {uploadedFile && doc.expiryMonths ? (
                            editingExpiry === uploadedFile.id ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="date"
                                  value={expiryValue}
                                  onChange={e => setExpiryValue(e.target.value)}
                                  className="border rounded px-2 py-1 text-sm w-full"
                                  style={{ minWidth: 120 }}
                                />
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => handleExpirySave(uploadedFile.id)}
                                    className="text-sm border border-blue-600 text-blue-600 rounded-full px-3 py-1 hover:bg-blue-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleExpiryCancel}
                                    className="text-sm border border-gray-400 text-gray-700 rounded-full px-3 py-1 hover:bg-gray-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-start gap-1">
                                {(() => {
                                  const expiryDate = uploadedFile.expiry_date ? dayjs(uploadedFile.expiry_date) : dayjs(uploadedFile.uploaded_at).add(doc.expiryMonths, 'month');
                                  const daysLeft = expiryDate.diff(dayjs(), 'day');
                                  let tagColor = 'text-green-600';
                                  if (daysLeft <= 7) tagColor = 'text-red-600';
                                  else if (daysLeft <= 30) tagColor = 'text-yellow-600';
                                  return (
                                    <span className={tagColor + ' text-sm font-semibold'}>
                                      {daysLeft < 0 ? 'Expired' : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                                      <br />
                                      <span className="text-gray-400 font-normal text-xs">{expiryDate.format('DD/MM/YYYY')}</span>
                                    </span>
                                  );
                                })()}
                                <button
                                  onClick={() => handleExpiryEdit(uploadedFile.id, uploadedFile.expiry_date || dayjs(uploadedFile.uploaded_at).add(doc.expiryMonths, 'month'))}
                                  className="text-xs border border-gray-300 rounded-full px-2 py-0.5 hover:bg-gray-100 mt-1"
                                >
                                  ✎ Edit
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </div>
                        {/* Notes */}
                        <div>
                          {uploadedFile && editingNotes === uploadedFile.id ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="Add notes..."
                                className="border rounded-md px-2 py-1 text-sm w-full"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleNotesSave(uploadedFile.id)}
                                  className="text-sm border border-blue-600 text-blue-600 rounded-full px-3 py-1 hover:bg-blue-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleNotesCancel}
                                  className="text-sm border border-gray-400 text-gray-700 rounded-full px-3 py-1 hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 text-sm">{uploadedFile?.notes || '-'}</span>
                              <button
                                onClick={() => handleNotesEdit(uploadedFile.id, uploadedFile.notes)}
                                className="text-xs border border-gray-300 rounded-full px-2 py-0.5 hover:bg-gray-100"
                              >
                                ✎
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Action */}
                        <div>
                          {uploadedFile ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => fileAPI.downloadFile(uploadedFile.id)}
                                className="border rounded-full px-3 py-1 text-sm text-blue-700 border-blue-600 hover:bg-blue-50"
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <span className="rounded-full text-sm px-3 py-1 bg-gray-100 text-gray-400 font-semibold cursor-not-allowed">No Access</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SolicitorDocuments; 