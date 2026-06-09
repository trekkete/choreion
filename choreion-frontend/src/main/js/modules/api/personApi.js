import { API_BASE_URL, getAuthHeaders } from "./client.js";

/**
 * Fetch all people for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of people
 */
export async function fetchPeople(projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/people?projectId=${projectId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch people');
        return await response.json();
    } catch (error) {
        console.error('Error fetching people:', error);
        return null;
    }
}

/**
 * Add a new person to a project
 * @param {Object} personData - Person data (name, color, letter)
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Created person
 */
export async function addPerson(personData, projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/people?projectId=${projectId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(personData)
        });

        if (!response.ok) throw new Error('Failed to add person');

        return await response.json();
    } catch (error) {
        console.error('Error adding person:', error);
        throw error;
    }
}

/**
 * Import multiple people into a project from a list
 * @param {Array<Object>} peopleData - Array of person data (name, color, letter)
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Created people
 */
export async function importPeople(peopleData, projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/people/bulk?projectId=${projectId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(peopleData)
        });
        if (!response.ok) throw new Error('Failed to import people');
        return await response.json();
    } catch (error) {
        console.error('Error importing people:', error);
        throw error;
    }
}

/**
 * Remove a person from a project
 * @param {number} personId - Person ID
 * @param {number} projectId - Project ID
 */
export async function removePerson(personId, projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/people/${personId}?projectId=${projectId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to remove person');
    } catch (error) {
        console.error('Error removing person:', error);
        throw error;
    }
}
