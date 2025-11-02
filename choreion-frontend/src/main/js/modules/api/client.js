import { API_BASE_URL } from "../constants.js";

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with Content-Type and Authorization
 */
export function getAuthHeaders() {
    const authToken = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

/**
 * Generic fetch wrapper with error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} Response data or null on error
 */
export async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

export { API_BASE_URL };
