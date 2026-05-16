/**
 * ========================================
 * STUDENT SERVICE - API CLIENT
 * ========================================
 * 
 * Wraps all API calls for student-related endpoints. Students use these functions
 * to fetch opportunities and manage applications. All student endpoints are namespaced
 * under /student to reduce repetition and keep backend routing clean.
 * 
 * @author Anxhela Valisi
 * @contributor Megi Shehi
 */

import api from './api';

// ===== API NAMESPACE PREFIX =====
const studentApi = {
  get: (url, config) => api.get(`/student${url}`, config),
  post: (url, data, config) => api.post(`/student${url}`, data, config),
  put: (url, data, config) => api.put(`/student${url}`, data, config),
  delete: (url, config) => api.delete(`/student${url}`, config),
};

// ===== ERROR HANDLING =====
// Izabela: "Consistent error handling - log to console and throw user-friendly message"
const handleError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  throw error.response?.data?.error || error.response?.data?.message || 'Something went wrong';
};

export const studentService = {
  /**
   * Anxhela: "Fetch opportunities list with pagination and filters.
   *          Students use this to browse all available jobs."
   */
  getOpportunities: (params) =>
    studentApi.get('/opportunities', { params })
      .then(response => response.data)
      .catch(handleError),

  /**
   * Megi: "Get full details for a single opportunity.
   *       Used when student clicks 'View Details' on an opportunity card."
   */
  getOpportunity: (id) =>
    studentApi.get(`/opportunities/${id}`)
      .then(response => response.data)
      .catch(handleError),

  /**
   * Izabela: "Apply to an opportunity. Can include CV upload or other data.
   *          FormData handling is important for file uploads."
   */
  async applyToOpportunity(opportunityId, applicationData) {
    const isFormData = typeof FormData !== 'undefined' && applicationData instanceof FormData
    const response = await studentApi.post(`/opportunities/${opportunityId}/apply`, applicationData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
    return response.data
  },

  /**
   * Anxhela: "Fetch the student's own applications.
   *          Shows history of where they've applied and status of each."
   */
  getApplications: (params) =>
    studentApi.get('/applications', { params })
      .then(response => response.data)
      .catch(handleError),

  /**
   * Megi: "Get opportunities the student has saved/bookmarked.
   *       They can come back to these later."
   */
  getSavedOpportunities: (params) =>
    studentApi.get('/opportunities/saved', { params })
      .then(response => response.data)
      .catch(handleError),

  /**
   * Izabela: "Toggle save status of an opportunity.
   *          Same endpoint handles both save and unsave."
   */
  saveOpportunity: (id) =>
    studentApi.post(`/opportunities/${id}/save`)
      .then(response => response.data)
      .catch(handleError),

  // TODO: Maybe keep a mock fallback for development? Let's comment out.
  // Anxhela: "Could be useful for testing without backend, but let's keep it simple for now"
  // getMockOpportunities: (page = 1, limit = 10, filters = {}) => {
  //   console.warn('Using mock data - backend not connected');
  //   // ... mock implementation ...
  // },
};

export default studentService;