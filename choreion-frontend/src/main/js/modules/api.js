import { API_BASE_URL } from "./constants.js";

function getAuthHeaders() {

    const authToken = localStorage.getItem('authToken');

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Project APIs
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
    }
}

export async function deleteChoreography(currentChoreographyId, projectId) {

    try {
        const response = await fetch(`${API_BASE_URL}/choreographies/${currentChoreographyId}?projectId=${projectId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete choreography');

    } catch (error) {
        console.error('Error deleting choreography:', error);
    }
}

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
    }
}

export async function removePerson(personId, projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/people/${personId}?projectId=${projectId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to remove person');
    } catch (error) {
        console.error('Error removing person:', error);
    }
}

export async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) throw new Error('Login failed');

        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
    }
}

export async function fetchUserMappings() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/mappings`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch mappings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching mappings:', error);
    }
}

export async function createUserMapping(personId, currentChoreographyId, userMappingsSize) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/mappings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                personId: personId,
                choreographyId: currentChoreographyId,
                isPrimary: userMappingsSize === 0
            })
        });

        if (!response.ok) throw new Error('Failed to create mapping');

    } catch (error) {
        console.error('Error creating mapping:', error);
    }
}

export async function deleteUserMapping(mappingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/mappings/${mappingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete mapping');

    } catch (error) {
        console.error('Error deleting mapping:', error);
    }
}

// Admin APIs
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

// Admin Mapping APIs
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