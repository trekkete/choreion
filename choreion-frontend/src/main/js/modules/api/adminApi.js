import { API_BASE_URL, getAuthHeaders } from "./client.js";

// ============= User Management =============

/**
 * Fetch all users (admin only)
 * @returns {Promise<Array>} List of all users
 */
export async function fetchAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

/**
 * Create a new user (admin only)
 * @param {string} username - Username
 * @param {string} email - Email
 * @param {string} fullName - Full name
 * @param {string} password - Password
 * @param {string} role - Role (ROLE_USER, ROLE_CHOREOGRAPHER, ROLE_ADMIN)
 * @returns {Promise<Object>} Created user
 */
export async function createUser(username, email, fullName, password, role) {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ username, email, fullName, password, role })
        });
        if (!response.ok) throw new Error('Failed to create user');
        return await response.json();
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

/**
 * Update a user's role (admin only)
 * @param {number} userId - User ID
 * @param {string} role - New role
 */
export async function updateUserRole(userId, role) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ role })
        });
        if (!response.ok) throw new Error('Failed to update user role');
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
}

/**
 * Delete a user (admin only)
 * @param {number} userId - User ID
 */
export async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete user');
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// ============= Mapping Management (Admin) =============

/**
 * Fetch all user mappings (admin only)
 * @returns {Promise<Array>} List of all mappings
 */
export async function fetchAllMappings() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/mappings/all`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch mappings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching all mappings:', error);
        throw error;
    }
}

/**
 * Create a mapping for a specific user (admin only)
 * @param {number} userId - User ID
 * @param {number} personId - Person ID
 * @param {number} choreographyId - Choreography ID
 * @param {boolean} isPrimary - Is primary mapping
 * @returns {Promise<Object>} Created mapping
 */
export async function createMappingForUser(userId, personId, choreographyId, isPrimary) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/mappings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ personId, choreographyId, isPrimary })
        });
        if (!response.ok) throw new Error('Failed to create mapping');
        return await response.json();
    } catch (error) {
        console.error('Error creating mapping:', error);
        throw error;
    }
}

/**
 * Delete a mapping (admin only)
 * @param {number} mappingId - Mapping ID
 */
export async function deleteMappingAdmin(mappingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/mappings/${mappingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete mapping');
    } catch (error) {
        console.error('Error deleting mapping:', error);
        throw error;
    }
}
