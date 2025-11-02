import { API_BASE_URL, getAuthHeaders } from "./client.js";

/**
 * Fetch all choreographies for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of choreographies
 */
export async function fetchChoreographies(projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/choreographies?projectId=${projectId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch choreographies');
        return await response.json();
    } catch (error) {
        console.error('Error fetching choreographies:', error);
        return [];
    }
}

/**
 * Fetch a single choreography by ID
 * @param {number} id - Choreography ID
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Choreography data
 */
export async function fetchChoreography(id, projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/choreographies/${id}?projectId=${projectId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch choreography');
        return await response.json();
    } catch (error) {
        console.error('Error fetching choreography:', error);
        return null;
    }
}

/**
 * Save a choreography (create or update)
 * @param {Object} choreographyData - Choreography data
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Saved choreography
 */
export async function saveChoreography(choreographyData, projectId) {
    try {
        const url = choreographyData.id
            ? `${API_BASE_URL}/choreographies/${choreographyData.id}?projectId=${projectId}`
            : `${API_BASE_URL}/choreographies?projectId=${projectId}`;

        const method = choreographyData.id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(choreographyData)
        });

        if (!response.ok) throw new Error('Failed to save choreography');

        return await response.json();
    } catch (error) {
        console.error('Error saving choreography:', error);
        throw error;
    }
}

/**
 * Delete a choreography
 * @param {number} choreographyId - Choreography ID
 * @param {number} projectId - Project ID
 */
export async function deleteChoreography(choreographyId, projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/choreographies/${choreographyId}?projectId=${projectId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete choreography');
    } catch (error) {
        console.error('Error deleting choreography:', error);
        throw error;
    }
}
