import { API_BASE_URL, getAuthHeaders } from "./client.js";

/**
 * Fetch current user's mappings
 * @returns {Promise<Array>} List of user mappings
 */
export async function fetchUserMappings() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/mappings`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch mappings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching mappings:', error);
        throw error;
    }
}

/**
 * Create a user mapping
 * @param {number} personId - Person ID
 * @param {number} choreographyId - Choreography ID
 * @param {number} userMappingsSize - Current number of user mappings
 * @returns {Promise<Object>} Created mapping
 */
export async function createUserMapping(personId, choreographyId, userMappingsSize) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/mappings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                personId: personId,
                choreographyId: choreographyId,
                isPrimary: userMappingsSize === 0
            })
        });

        if (!response.ok) throw new Error('Failed to create mapping');

        return await response.json();
    } catch (error) {
        console.error('Error creating mapping:', error);
        throw error;
    }
}

/**
 * Delete a user mapping
 * @param {number} mappingId - Mapping ID
 */
export async function deleteUserMapping(mappingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/mappings/${mappingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete mapping');
    } catch (error) {
        console.error('Error deleting mapping:', error);
        throw error;
    }
}
