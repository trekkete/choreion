import { API_BASE_URL, getAuthHeaders } from "./client.js";

/**
 * Fetch all projects
 * @returns {Promise<Array>} List of projects
 */
export async function fetchProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        return await response.json();
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

/**
 * Create a new project
 * @param {string} name - Project name
 * @param {string} description - Project description
 * @returns {Promise<Object>} Created project
 */
export async function createProject(name, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, description })
        });
        if (!response.ok) throw new Error('Failed to create project');
        return await response.json();
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}

/**
 * Delete a project
 * @param {number} projectId - Project ID
 */
export async function deleteProject(projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete project');
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}
