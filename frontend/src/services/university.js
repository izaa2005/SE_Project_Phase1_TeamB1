/**
 * ========================================
 * UNIVERSITY SERVICE - API CLIENT
 * ========================================
 * 
 * Handles university staff operations: verify that opportunities are legitimate,
 * match university standards, and monitor statistics. Universities approve/reject
 * students and opportunities - basically quality control for the platform to prevent
 * spam or misleading job listings.
 * 
 * @author Anxhela Valisi
 * @contributor Megi Shehi
 */

import api from './api';

/**
 * University API service
 * 
 * Shërbimi për universitetin - për verifikimin e mundësive dhe statistikat.
 * (Service for university - for opportunity verification and statistics.)
 * 
 * @author Anxhela Valisi
 * @collaboration Megi (backend)
 */

// ===== API NAMESPACE PREFIX =====
// Izabela: "All university endpoints are under /university"
const universityApi = {
  get: (url, config) => api.get(`/university${url}`, config),
  post: (url, data, config) => api.post(`/university${url}`, data, config),
  put: (url, data, config) => api.put(`/university${url}`, data, config),
  delete: (url, config) => api.delete(`/university${url}`, config),
};

// ===== ERROR HANDLING =====
const handleError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  throw error.response?.data?.error || error.response?.data?.message || 'Something went wrong';
};

// ===== HELPER FUNCTIONS FOR DATA TRANSFORMATION =====
// Megi: "Transform raw backend statistics into UI-friendly format"
const mapUniversityDashboardStats = (statistics) => {
  const byStatus = statistics?.opportunities_by_status || {};
  const pendingVerification = byStatus.pending || 0;
  const approved = byStatus.approved || 0;
  const rejected = byStatus.rejected || 0;
  const totalOpportunities = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
  const verifiedTotal = approved + rejected;
  const rejectionRate = verifiedTotal > 0
    ? `${Math.round((rejected / verifiedTotal) * 100)}%`
    : '0%';

  return {
    pendingVerification,
    totalOpportunities,
    verifiedThisMonth: statistics?.recent_verifications || 0,
    rejectionRate,
  };
};

// Anxhela: "Transform activity logs into a friendlier format for timeline display"
const mapRecentActivity = (statistics) => {
  const recentLogs = statistics?.recent_activity || [];
  return recentLogs.map((log, idx) => {
    const isApprove = log.action?.includes('APPROVE');
    const isReject = log.action?.includes('REJECT');
    return {
      id: `${log.table_name}-${log.record_id}-${idx}`,
      type: isApprove ? 'approve' : isReject ? 'reject' : 'note',
      message: `${log.action} on ${log.table_name} #${log.record_id}`,
      timestamp: log.timestamp || null,
    };
  });
};

/**
 * Izabela: "Get opportunities waiting for university verification.
 *          These were just posted by companies and need review."
 * 
 * @returns {Promise<Array>} List of pending opportunities
 */
export const getPendingOpportunities = async (params = {}) => {
  try {
    const response = await universityApi.get('/opportunities/pending', { params });
    // Backend returns { opportunities: [], page, per_page, total, pages }
    return response.data.opportunities || [];
  } catch (error) {
    handleError(error);
  }
};

/**
 * Megi: "Approve or reject an opportunity after reviewing it.
 *       University can add notes explaining their decision."
 * 
 * @param {number} opportunityId - ID of opportunity
 * @param {string} action - 'approve' or 'reject'
 * @param {string} [notes] - Optional notes for the decision
 * @returns {Promise<Object>} Updated opportunity
 */
export const verifyOpportunity = async (opportunityId, action, notes = '') => {
  try {
    const response = await universityApi.post(`/opportunities/${opportunityId}/verify`, { action, notes });
    // Backend returns { message, opportunity: { ... } }
    return response.data.opportunity;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Anxhela: "Get all opportunities for monitoring and statistics.
 *          University staff can see the full picture."
 * 
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<Array>} List of opportunities
 */
export const getAllOpportunities = async (filters = {}) => {
  try {
    const response = await universityApi.get('/opportunities', { params: filters });
    // Backend returns { opportunities: [], ... }
    return response.data.opportunities || [];
  } catch (error) {
    handleError(error);
  }
};

/**
 * Izabela: "Get raw statistics from the backend.
 *          Used by other functions to transform into UI-friendly format."
 * 
 * @returns {Promise<Object>} Statistics object
 */
export const getUniversityStatistics = async () => {
  try {
    const response = await universityApi.get('/statistics');
    // Backend returns raw statistics object
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Megi: "Get dashboard statistics - already transformed for display.
 *       Shows pending, approved, rejected counts and rejection rate."
 * 
 * @returns {Promise<Object>} { pendingVerification, totalOpportunities, verifiedThisMonth, rejectionRate }
 */
export const getUniversityDashboardStats = async () => {
  const raw = await getUniversityStatistics();
  return mapUniversityDashboardStats(raw);
};

/**
 * Anxhela: "Get recent activity log for display in dashboard.
 *          Shows what approvals/rejections happened recently."
 * 
 * @returns {Promise<Array>} Recent activities
 */
export const getRecentActivity = async () => {
  const raw = await getUniversityStatistics();
  return mapRecentActivity(raw);
};

/**
 * Izabela: "Get student accounts waiting for university approval.
 *          New students from that university need to be verified."
 * 
 * @param {Object} [params]
 * @returns {Promise<Object>} { students, page, per_page, total, pages }
 */
export const getPendingStudents = async (params = {}) => {
  try {
    const response = await universityApi.get('/students/pending', { params });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Megi: "Approve a student account - they can now use the platform.
 *       This confirms they're actually from the university."
 * 
 * @param {number} studentId
 * @returns {Promise<Object>}
 */
export const approveStudent = async (studentId) => {
  try {
    const response = await universityApi.post(`/students/${studentId}/approve`, {});
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Anxhela: "Reject a student account - usually means they can't verify their university email.
 *          We send them a reason for the rejection."
 * 
 * @param {number} studentId
 * @param {string} [reason]
 * @returns {Promise<Object>}
 */
export const rejectStudent = async (studentId, reason = 'Account does not meet requirements') => {
  try {
    const response = await universityApi.post(`/students/${studentId}/reject`, { reason });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Izabela: "Get approved student accounts - these are verified students 
 *          from the university who can post applications."
 * 
 * @param {Object} [params]
 * @returns {Promise<Object>} { students, page, per_page, total, pages }
 */
export const getApprovedStudents = async (params = {}) => {
  try {
    const response = await universityApi.get('/students/approved', { params });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};