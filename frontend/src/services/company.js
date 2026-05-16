/**
 * ========================================
 * COMPANY SERVICE - API CLIENT
 * ========================================
 * 
 * Handles all company operations: posting opportunities, viewing applications,
 * updating profile. Includes CRUD operations for opportunities and file downloads
 * for application CVs so companies can review candidate documents directly.
 * 
 * @author Anxhela Valisi
 * @contributor Megi Shehi
 */

import api from './api';

/**
 * Company API service
 * 
 * Shërbimi për kompaninë - mbani të gjitha endpoint-et e dashboard-it të kompanisë.
 * (Service for company - holds all company dashboard endpoints.)
 * 
 * @author Anxhela Valisi
 * @collaboration Megi (backend)
 */

// ===== API NAMESPACE PREFIX =====
// Izabela: "All company endpoints are under /company, like with students"
const companyApi = {
  get: (url, config) => api.get(`/company${url}`, config),
  post: (url, data, config) => api.post(`/company${url}`, data, config),
  put: (url, data, config) => api.put(`/company${url}`, data, config),
  delete: (url, config) => api.delete(`/company${url}`, config),
};

// ===== ERROR HANDLING =====
const handleError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  throw error.response?.data?.error || error.response?.data?.message || 'Something went wrong';
};

/**
 * Megi: "Get all opportunities posted by the current company.
 *       Shows pagination and total count."
 * 
 * @returns {Promise<Array>} List of opportunities
 */
export const getCompanyOpportunities = async (params = {}) => {
  try {
    const response = await companyApi.get('/opportunities', { params });
    // Backend returns { opportunities: [], page, per_page, total, pages }
    return response.data.opportunities || [];
  } catch (error) {
    handleError(error);
  }
};

/**
 * Anxhela: "Create a new job opportunity posting.
 *          Company fills out a form and we send it here."
 * 
 * @param {Object} opportunityData - Opportunity details (title, description, salary, etc.)
 * @returns {Promise<Object>} Created opportunity
 */
export const createOpportunity = async (opportunityData) => {
  try {
    const response = await companyApi.post('/opportunities', opportunityData);
    // Backend returns { message, opportunity: { ... } }
    return response.data.opportunity;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Izabela: "Update an existing opportunity.
 *          Companies might need to change salary, deadline, description, etc."
 * 
 * @param {number} opportunityId - ID of opportunity to update
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} Updated opportunity
 */
export const updateOpportunity = async (opportunityId, updates) => {
  try {
    const response = await companyApi.put(`/opportunities/${opportunityId}`, updates);
    // Backend returns { message, opportunity: { ... } }
    return response.data.opportunity;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Megi: "Delete an opportunity listing.
 *       Remove it from the platform when no longer recruiting."
 * 
 * @param {number} opportunityId - ID of opportunity to delete
 * @returns {Promise<void>}
 */
export const deleteOpportunity = async (opportunityId) => {
  try {
    await companyApi.delete(`/opportunities/${opportunityId}`);
  } catch (error) {
    handleError(error);
  }
};

/**
 * Anxhela: "Get all applications for a specific opportunity.
 *          Companies see who's interested in their job posting."
 * 
 * @param {number} opportunityId - ID of opportunity
 * @returns {Promise<Array>} List of applications
 */
export const getOpportunityApplications = async (opportunityId, params = {}) => {
  try {
    const response = await companyApi.get(`/opportunities/${opportunityId}/applications`, { params });
    // Backend returns { applications: [] }
    return response.data.applications || [];
  } catch (error) {
    handleError(error);
  }
};

/**
 * Izabela: "Approve or deny an application.
 *          Company reviews candidates and makes decisions here."
 * 
 * @param {number} opportunityId - Opportunity ID
 * @param {number} applicationId - Application ID
 * @param {string} status - 'approved' or 'rejected'
 */
export const updateApplicationStatus = async (opportunityId, applicationId, status) => {
  try {
    const response = await companyApi.put(`/opportunities/${opportunityId}/applications/${applicationId}/status`, { status });
    return response.data.application;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Megi: "Download a student's CV or other uploaded files.
 *       This triggers a browser download so the company can review offline."
 * 
 * @param {number} applicationId - Application ID
 * @param {string} fileKind - 'cvs' or 'motivation_letters'
 * @param {number} fileIndex - File index inside the category
 * @param {string} fileName - Original file name for the downloaded file
 */
export const downloadApplicationFile = async (applicationId, fileKind, fileIndex, fileName) => {
  try {
    // ===== GET FILE AS BLOB =====
    // Anxhela: "Request the file with responseType: 'blob' so we get binary data"
    const response = await companyApi.get(
      `/applications/${applicationId}/files/${fileKind}/${fileIndex}`,
      { responseType: 'blob' }
    );

    // ===== TRIGGER BROWSER DOWNLOAD =====
    // Izabela: "Create an object URL from the blob and simulate a click to download"
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || `application-${applicationId}-${fileKind}-${fileIndex}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    handleError(error);
  }
};

/**
 * Megi: "Update company's profile information.
 *       Company name, description, contact info, etc."
 * 
 * @param {Object} profileData - New profile data
 * @returns {Promise<Object>} Updated profile
 */
export const updateCompanyProfile = async (profileData) => {
  try {
    const response = await companyApi.put('/profile', profileData);
    // Backend returns { message, user: { ... } }
    return response.data.user;
  } catch (error) {
    handleError(error);
  }
};

// TODO: Remove mock data after backend integration is verified
// console.log('Company service using real backend endpoints');