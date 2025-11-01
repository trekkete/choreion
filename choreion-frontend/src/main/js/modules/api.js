import { API_BASE_URL } from "./constants.js";

function getAuthHeaders() {

    const authToken = localStorage.getItem('authToken');

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

export async function fetchPeople() {
    try {
        const response = await fetch(`${API_BASE_URL}/people`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch people');
        return await response.json();
    } catch (error) {
        console.error('Error fetching people:', error);
        return null;
    }
}

export async function fetchChoreographies() {
   try {
       const response = await fetch(`${API_BASE_URL}/choreographies`, {
           headers: getAuthHeaders()
       });
       if (!response.ok) throw new Error('Failed to fetch choreographies');
       return await response.json();
   } catch (error) {
       console.error('Error fetching choreographies:', error);
       return [];
   }
}

export async function fetchChoreography(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/choreographies/${id}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch choreography');
        return await response.json();
    } catch (error) {
        console.error('Error fetching choreography:', error);
        return null;
    }
}

export async function saveChoreography(choreographyData) {

    try {
        const url = choreographyData.id
            ? `${API_BASE_URL}/choreographies/${choreographyData.id}`
            : `${API_BASE_URL}/choreographies`;

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

export async function deleteChoreography(currentChoreographyId) {

    try {
        const response = await fetch(`${API_BASE_URL}/choreographies/${currentChoreographyId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete choreography');

    } catch (error) {
        console.error('Error deleting choreography:', error);
    }
}

export async function addPerson(personData) {

    try {
        const response = await fetch(`${API_BASE_URL}/people`, {
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

export async function removePerson(personId) {
    try {
        const response = await fetch(`${API_BASE_URL}/people/${personId}`, {
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

export async function register(username, email, fullName, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, fullName, password })
        });

        if (!response.ok) throw new Error('Registration failed');

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
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