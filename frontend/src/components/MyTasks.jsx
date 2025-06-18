import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import './PropertyDashboard.css';

const CLIENT_TASKS = [
  {
    key: 'proof_of_id',
    title: 'Upload Proof of ID',
    stage: 'Pre-Contract',
    note: 'Valid for 3 months',
    dueDays: 3,
  },
  {
    key: 'proof_of_address',
    title: 'Upload Proof of Address',
    stage: 'Pre-Contract',
    note: 'Valid for 3 months',
    dueDays: 3,
  },
  {
    key: 'source_of_funds',
    title: 'Upload Proof of Funds',
    stage: 'Pre-Contract',
    note: '',
    dueDays: 5,
  },
  {
    key: 'survey_report',
    title: 'Upload Survey Report',
    stage: 'Mortgage & Survey',
    note: '',
    dueDays: 14,
  },
  {
    key: 'signed_mortgage_deed',
    title: 'Upload Signed Mortgage Deed',
    stage: 'Mortgage & Survey',
    note: '',
    dueDays: 21,
  },
  {
    key: 'signed_contract',
    title: 'Upload Signed Contract',
    stage: 'Exchange',
    note: '',
    dueDays: 30,
  },
];

function MyTasks() {
  const { propertyId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [completedTasks, setCompletedTasks] = useState(() => JSON.parse(localStorage.getItem('completedTasks') || '[]'));
  const [userRole, setUserRole] = useState('Client');
  const [uploadingKey, setUploadingKey] = useState(null);

  useEffect(() => {
    // Get user role
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (userInfo.role) setUserRole(userInfo.role);
    } catch {}
  }, []);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const files = await fileAPI.getPropertyFiles(propertyId);
        setDocuments(files);
      } catch {}
    }
    fetchFiles();
  }, [propertyId]);

  // Build tasks list, syncing with document upload status
  const today = dayjs();
  const tasks = CLIENT_TASKS.map(task => {
    const uploadedFile = documents.find(d => d.document_type === task.key);
    let status = 'Pending';
    let dueDate = dayjs().add(task.dueDays, 'day');
    let uploadedAt = null;
    if (uploadedFile) {
      status = 'Complete';
      uploadedAt = dayjs(uploadedFile.uploaded_at);
    } else if (completedTasks.includes(task.key)) {
      status = 'Complete';
    }
    // If not complete, set due date from property start or today
    return {
      ...task,
      status,
      dueDate: dueDate,
      uploadedAt,
    };
  })
    .filter(task => userRole === 'Client')
    .filter(task => filter === 'all' || task.status.toLowerCase() === filter)
    .sort((a, b) => a.dueDate.diff(b.dueDate));

  const markAsDone = (key) => {
    const updated = [...completedTasks, key];
    setCompletedTasks(updated);
    localStorage.setItem('completedTasks', JSON.stringify(updated));
  };

  // Upload handler for tasks
  const handleTaskUpload = async (taskKey) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingKey(taskKey);
      try {
        await fileAPI.uploadFile(file, '', propertyId, taskKey);
        // Refresh documents after upload
        const files = await fileAPI.getPropertyFiles(propertyId);
        setDocuments(files);
      } catch (error) {
        window.alert('Failed to upload file');
      } finally {
        setUploadingKey(null);
      }
    };
    fileInput.click();
  };

  if (userRole !== 'Client') return null;

  return (
    <div className="my-tasks-section">
      <div className="section-header">
        <h2>My Tasks</h2>
        <div className="task-filters">
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
          <button className={filter === 'complete' ? 'active' : ''} onClick={() => setFilter('complete')}>Complete</button>
        </div>
      </div>
      <div className="table-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Stage</th>
              <th>Due Date</th>
              <th>Status</th>
              {filter !== 'complete' && <th>Action</th>}
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const isOverdue = task.status !== 'Complete' && today.isAfter(task.dueDate, 'day');
              const uploadedFile = documents.find(d => d.document_type === task.key);
              return (
                <tr key={task.key} style={isOverdue ? { background: '#fee2e2' } : {}}>
                  <td>{task.title}</td>
                  <td>{task.stage}</td>
                  <td>
                    {task.dueDate.format('DD/MM/YYYY')}
                    {isOverdue && <span style={{ color: '#ef4444', fontWeight: 500, marginLeft: 8 }}>(Overdue)</span>}
                  </td>
                  <td>{task.status}</td>
                  {filter !== 'complete' && (
                    <td>
                      {task.status === 'Pending' && !uploadedFile && (
                        <button className="action-button upload" onClick={() => handleTaskUpload(task.key)} disabled={uploadingKey === task.key}>
                          {uploadingKey === task.key ? 'Uploading...' : 'Upload'}
                        </button>
                      )}
                      {task.status === 'Pending' && uploadedFile && (
                        <button className="action-button save" onClick={() => markAsDone(task.key)}>
                          Mark as Done
                        </button>
                      )}
                      {task.status === 'Complete' && (
                        <button className="action-button view" onClick={() => window.alert('View uploaded file for ' + task.title)}>
                          View
                        </button>
                      )}
                    </td>
                  )}
                  <td>
                    {task.note && <span title={task.note}>{task.note}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyTasks; 