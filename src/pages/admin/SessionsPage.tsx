import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Edit, 
  Eye, 
  Play, 
  Square,
  RefreshCw,
  AlertCircle,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { sessionService, Session, SessionRegistration, DailySessionSettings } from '../../services/sessionService';
import './SessionsPage.css';

const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<SessionRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Session | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [dailySettings, setDailySettings] = useState<DailySessionSettings | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
    loadDailySettings();
  }, []);

  const loadSessions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionService.getSessionsWithPagination(page, 10);
      if (response.success) {
        setSessions(response.data.sessions);
        setTotalPages(response.data.totalPages);
        setTotalSessions(response.data.total);
        setCurrentPage(response.data.page);
      } else {
        setError('Failed to load sessions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadDailySettings = async () => {
    try {
      const response = await sessionService.getDailySessionSettings();
      if (response.success) {
        setDailySettings(response.data);
      }
    } catch (err) {
      console.error('Failed to load daily settings:', err);
    }
  };

  const loadUpcomingSessions = async () => {
    try {
      const response = await sessionService.getUpcomingSessions();
      if (response.success) {
        setUpcomingSessions(response.data);
        setShowUpcomingModal(true);
      } else {
        setError('Failed to load upcoming sessions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upcoming sessions');
    }
  };

  const handleUpdateDailySettings = async (settings: { time_start: string; registration_fee: number; is_active: boolean }) => {
    try {
      const response = await sessionService.updateDailySessionSettings(settings);
      if (response.success) {
        setShowSettingsModal(false);
        await loadDailySettings();
      } else {
        setError(response.message || 'Failed to update daily settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update daily settings');
    }
  };

  const handleCloseSession = async (sessionId: number) => {
    try {
      await sessionService.closeSession();
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close session');
    }
  };

  const handleUpdateTime = async (sessionId: number, timeStart: string) => {
    try {
      await sessionService.updateSessionTime(sessionId, timeStart);
      await loadSessions();
      setEditingSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session time');
    }
  };

  const handleUpdateFee = async (sessionId: number, registrationFee: number) => {
    try {
      await sessionService.updateSessionFee(sessionId, registrationFee);
      await loadSessions();
      setEditingSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session fee');
    }
  };

  const loadRegisteredUsers = async (sessionId: number) => {
    try {
      const users = await sessionService.getRegisteredUsers();
      // Filter users for the specific session
      const sessionUsers = users.filter(user => user.session_id === sessionId);
      setRegisteredUsers(sessionUsers);
      setShowUsersModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registered users');
    }
  };



  const handleUpdateSession = async (sessionId: number, sessionData: any) => {
    try {
      const response = await sessionService.updateSession(sessionId, sessionData);
      if (response.success) {
        setEditingSession(null);
        await loadSessions(currentPage);
      } else {
        setError(response.message || 'Failed to update session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      const response = await sessionService.deleteSession(sessionId);
      if (response.success) {
        setShowDeleteModal(null);
        await loadSessions(currentPage);
      } else {
        setError(response.message || 'Failed to delete session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadSessions(page);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (timeString: string | undefined | null) => {
    if (!timeString) return '09:00';
    return timeString.substring(0, 5); // Remove seconds
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' SMP';
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`status-badge ${status}`}>
        {status === 'active' ? (
          <>
            <Play size={12} />
            Active
          </>
        ) : (
          <>
            <Square size={12} />
            Closed
          </>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="sessions-page">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" />
          <p>Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Session Management</h1>
          <p>Manage trading sessions and view statistics</p>
          <div className="session-stats">
            <span>Total Sessions: {totalSessions}</span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="settings-btn" onClick={() => setShowSettingsModal(true)}>
            <Clock size={20} />
            Daily Settings
          </button>
          <button className="upcoming-btn" onClick={loadUpcomingSessions}>
            <Calendar size={20} />
            Upcoming Sessions
          </button>
          <button className="refresh-btn" onClick={() => loadSessions(currentPage)}>
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="sessions-grid">
        {sessions.map((session) => (
          <div key={session.id} className="session-card">
            <div className="session-header">
              <div className="session-date">
                <Calendar size={16} />
                <span>{formatDate(session.session_date)}</span>
              </div>
              {getStatusBadge(session.status)}
            </div>

            <div className="session-details">
              <div className="detail-item">
                <Clock size={16} />
                <span>Start Time: {formatTime(session.time_start)}</span>
              </div>
              <div className="detail-item">
                <DollarSign size={16} />
                <span>Fee: {formatCurrency(session.registration_fee)}</span>
              </div>
              <div className="detail-item">
                <Users size={16} />
                <span>Registrations: {session.registration_count || 0}</span>
              </div>
              {session.total_fees && (
                <div className="detail-item">
                  <DollarSign size={16} />
                  <span>Total Fees: {formatCurrency(session.total_fees)}</span>
                </div>
              )}
            </div>

            <div className="session-actions">
              <button
                className="action-btn view-btn"
                onClick={() => loadRegisteredUsers(session.id)}
              >
                <Eye size={16} />
                View Users
              </button>
              
              <button
                className="action-btn edit-btn"
                onClick={() => setEditingSession(session)}
              >
                <Edit size={16} />
                Edit
              </button>
              
              {session.status === 'active' && (
                <button
                  className="action-btn close-btn"
                  onClick={() => handleCloseSession(session.id)}
                >
                  <Square size={16} />
                  Close
                </button>
              )}
              
              <button
                className="action-btn delete-btn"
                onClick={() => setShowDeleteModal(session)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Session</h3>
              <button 
                className="close-btn"
                onClick={() => setEditingSession(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Start Time:</label>
                <input
                  type="time"
                  defaultValue={editingSession.time_start ? editingSession.time_start.substring(0, 5) : '09:00'}
                  onChange={(e) => {
                    const updatedSession = { ...editingSession, time_start: e.target.value + ':00' };
                    setEditingSession(updatedSession);
                  }}
                />
              </div>
              
              <div className="form-group">
                <label>Registration Fee (SMP):</label>
                <input
                  type="number"
                  step="0.00000001"
                  defaultValue={editingSession.registration_fee}
                  onChange={(e) => {
                    const updatedSession = { ...editingSession, registration_fee: parseFloat(e.target.value) };
                    setEditingSession(updatedSession);
                  }}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setEditingSession(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  if (editingSession) {
                    handleUpdateSession(editingSession.id, {
                      time_start: editingSession.time_start,
                      registration_fee: editingSession.registration_fee
                    });
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registered Users Modal */}
      {showUsersModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Registered Users</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUsersModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Registration Fee</th>
                      <th>Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.fullname}</td>
                        <td>{formatCurrency(user.registration_fee)}</td>
                        <td>{formatDate(user.registered_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowUsersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          
          <button 
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}



      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Session</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDeleteModal(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete this session?</p>
              <div className="session-info">
                <p><strong>Date:</strong> {formatDate(showDeleteModal.session_date)}</p>
                <p><strong>Time:</strong> {formatTime(showDeleteModal.time_start)}</p>
                <p><strong>Status:</strong> {showDeleteModal.status}</p>
              </div>
              <p className="warning">This action cannot be undone!</p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-danger"
                onClick={() => handleDeleteSession(showDeleteModal.id)}
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Daily Session Settings</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSettingsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="info-box">
                <p><strong>Note:</strong> These settings will be used to automatically create daily sessions. 
                Sessions will be created automatically when users try to access them if no session exists for that day.</p>
              </div>
              
              <div className="form-group">
                <label>Default Start Time:</label>
                <input
                  type="time"
                  id="daily-time-start"
                  defaultValue={dailySettings?.time_start ? dailySettings.time_start.substring(0, 5) : '09:00'}
                />
              </div>
              
              <div className="form-group">
                <label>Default Registration Fee (SMP):</label>
                <input
                  type="number"
                  step="0.00000001"
                  id="daily-registration-fee"
                  defaultValue={dailySettings?.registration_fee || 20000}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    id="daily-is-active"
                    defaultChecked={dailySettings?.is_active !== false}
                  />
                  Enable Automatic Session Creation
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowSettingsModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  const timeInput = document.getElementById('daily-time-start') as HTMLInputElement;
                  const feeInput = document.getElementById('daily-registration-fee') as HTMLInputElement;
                  const activeInput = document.getElementById('daily-is-active') as HTMLInputElement;
                  
                  handleUpdateDailySettings({
                    time_start: timeInput.value + ':00',
                    registration_fee: parseFloat(feeInput.value),
                    is_active: activeInput.checked
                  });
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions Modal */}
      {showUpcomingModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Upcoming Sessions (Next 7 Days)</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUpcomingModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="upcoming-sessions-list">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div key={session.id} className="upcoming-session-item">
                      <div className="session-info">
                        <div className="session-date">
                          <Calendar size={16} />
                          <span>{formatDate(session.session_date)}</span>
                        </div>
                        <div className="session-time">
                          <Clock size={16} />
                          <span>{formatTime(session.time_start)}</span>
                        </div>
                        <div className="session-fee">
                          <DollarSign size={16} />
                          <span>{formatCurrency(session.registration_fee)}</span>
                        </div>
                        <div className="session-registrations">
                          <Users size={16} />
                          <span>{session.registration_count || 0} registrations</span>
                        </div>
                      </div>
                      <div className="session-status">
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-sessions">
                    <p>No upcoming sessions found.</p>
                    <p>Sessions will be created automatically based on daily settings when users access them.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowUpcomingModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsPage; 