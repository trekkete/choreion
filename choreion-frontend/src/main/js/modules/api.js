import { API_BASE_URL } from "./constants.js";

export async function fetchPeople() {
    try {
        const response = await fetch(`${API_BASE_URL}/people`);
        if (!response.ok) throw new Error('Failed to fetch people');
        return await response.json();
    } catch (error) {
        console.error('Error fetching people:', error);
        showStatus('Error loading people from server', 'error');
        return null;
    }
}

export async function fetchChoreographies() {
   try {
       const response = await fetch(`${API_BASE_URL}/choreographies`);
       if (!response.ok) throw new Error('Failed to fetch choreographies');
       return await response.json();
   } catch (error) {
       console.error('Error fetching choreographies:', error);
       showStatus('Error loading choreographies from server', 'error');
       return [];
   }
}

export async function fetchChoreography(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/choreographies/${id}`);
        if (!response.ok) throw new Error('Failed to fetch choreography');
        return await response.json();
    } catch (error) {
        console.error('Error fetching choreography:', error);
        showStatus('Error loading choreography', 'error');
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(choreographyData)
        });

        if (!response.ok) throw new Error('Failed to save choreography');

        return await response.json();
    } catch (error) {
        console.error('Error saving choreography:', error);
        showStatus('Error saving choreography', 'error');
    }
}

export async function deleteChoreography(currentChoreographyId) {

    try {
        const response = await fetch(`${API_BASE_URL}/choreographies/${currentChoreographyId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete choreography');

    } catch (error) {
        console.error('Error deleting choreography:', error);
        showStatus('Error deleting choreography', 'error');
    }
}

export async function addPerson(personData) {

    try {
        const response = await fetch(`${API_BASE_URL}/people`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personData)
        });

        if (!response.ok) throw new Error('Failed to add person');

        return await response.json();
    } catch (error) {
        console.error('Error adding person:', error);
        showStatus('Error adding person', 'error');
    }
}

export async function removePerson(personId) {
    try {
        const response = await fetch(`${API_BASE_URL}/people/${personId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to remove person');
    } catch (error) {
        console.error('Error removing person:', error);
        showStatus('Error removing person', 'error');
    }
}