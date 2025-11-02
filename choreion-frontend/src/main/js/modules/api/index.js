/**
 * API Module Index
 * Barrel export for all API modules
 */

// Export all from individual API modules
export * from './authApi.js';
export * from './projectApi.js';
export * from './choreographyApi.js';
export * from './personApi.js';
export * from './userMappingApi.js';
export * from './adminApi.js';

// Export client utilities
export { getAuthHeaders, fetchJSON, API_BASE_URL } from './client.js';
