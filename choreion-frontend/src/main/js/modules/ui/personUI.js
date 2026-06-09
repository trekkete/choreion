/**
 * Person UI Module
 * Handles rendering and managing person-related UI
 */

import * as Api from '../api/index.js';
import {
    getPeople,
    getSelectedPerson,
    getCurrentProjectId,
    setHasUnsavedChanges
} from '../state.js';
import { showStatus } from './statusUI.js';

/**
 * Render the person list in the sidebar
 */
export function renderPersonList() {
    const container = document.getElementById('personList');
    if (!container) return;

    const people = getPeople();

    const selected = getSelectedPerson();

    if (people.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div>No people yet</div>
                <div style="font-size: 12px;">Add people to start creating choreographies</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    people.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'person-item';
        if (selected && selected.index === index) {
            item.classList.add('selected');
        }

        item.innerHTML = `
            <div class="person-info">
                <div class="person-color-box" style="background: ${person.color};">
                    <div class="person-color-box-letter">${person.letter}</div>
                </div>
                <div class="person-name">${person.name}</div>
            </div>
            <button class="btn-danger btn-small clear-route-btn" data-person-id="${person.id}">Clear route</button>
            <button class="btn-danger btn-small remove-person-btn" data-index="${index}">✕</button>
        `;

        item.querySelector('.person-info').addEventListener('click', () => {
            // Emit event for person selection
            window.dispatchEvent(new CustomEvent('person:selected', {
                detail: { id: person.id, index }
            }));
        });
        container.appendChild(item);
    });
}

/**
 * Add a new person
 */
export async function addPerson() {
    const name = document.getElementById('newPersonName')?.value.trim();
    const color = document.getElementById('newPersonColor')?.value;
    const letter = document.getElementById('newPersonLetter')?.value.trim();

    if (!name) {
        showStatus('Please enter a person name', 'error');
        return;
    }

    const personData = {
        name: name,
        color: color,
        letter: letter
    };

    try {
        const projectId = getCurrentProjectId();
        const saved = await Api.addPerson(personData, projectId);

        // Emit event to create person on canvas
        window.dispatchEvent(new CustomEvent('person:created', {
            detail: { person: saved, personData }
        }));

        const nameInput = document.getElementById('newPersonName');
        const letterInput = document.getElementById('newPersonLetter');
        if (nameInput) nameInput.value = '';
        if (letterInput) letterInput.value = '';

        renderPersonList();
        showStatus('Person added successfully!', 'success');
    } catch (error) {
        console.error('Error adding person:', error);
        showStatus('Error adding person', 'error');
    }
}

/**
 * Import people from a CSV file (columns: fullName, initial, hexColor)
 * @param {File} file - The CSV file
 */
export async function importPeopleFromCsv(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);

            const peopleData = [];
            for (const line of lines) {
                const parts = line.split(',').map(p => p.trim());
                if (parts.length < 3) continue;

                const [name, letter, color] = parts;
                // Skip header row
                if (name.toLowerCase() === 'fullname' || name.toLowerCase() === 'name') continue;
                if (!name || !letter || !color) continue;

                peopleData.push({ name, letter, color });
            }

            if (peopleData.length === 0) {
                showStatus('No valid people found in CSV', 'error');
                resolve();
                return;
            }

            try {
                const projectId = getCurrentProjectId();
                const saved = await Api.importPeople(peopleData, projectId);

                saved.forEach(person => {
                    window.dispatchEvent(new CustomEvent('person:created', {
                        detail: { person, personData: { color: person.color, letter: person.letter } }
                    }));
                });

                renderPersonList();
                showStatus(`Imported ${saved.length} people successfully!`, 'success');
                resolve();
            } catch (error) {
                console.error('Error importing people:', error);
                showStatus('Error importing people from CSV', 'error');
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Remove a person
 * @param {number} index - Person index
 */
export async function removePerson(index) {
    const people = getPeople();
    const person = people[index];

    if (!person) return;
    if (!confirm(`Remove ${person.name}?`)) return;

    try {
        const projectId = getCurrentProjectId();
        await Api.removePerson(person.id, projectId);

        // Emit event to remove person from canvas
        window.dispatchEvent(new CustomEvent('person:removed', {
            detail: { index }
        }));

        renderPersonList();
        showStatus('Person removed successfully!', 'success');
    } catch (error) {
        console.error('Error removing person:', error);
        showStatus('Error removing person', 'error');
    }
}

/**
 * Render user mappings
 */
export function renderUserMappings(userMappings) {
    const container = document.getElementById('userMappings');
    if (!container) return;

    if (userMappings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 12px;">No character mappings yet. Click "Map to Me" on a person to create one.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    userMappings.forEach(mapping => {
        const item = document.createElement('div');
        item.className = 'person-item';

        item.innerHTML = `
            <div class="person-info">
                <div class="person-color-box" style="background: ${mapping.personColor};"></div>
                <div>
                    <div class="person-name">${mapping.personName}</div>
                    ${mapping.choreographyName ? `<div style="font-size: 11px; color: #7f8c8d;">${mapping.choreographyName}</div>` : ''}
                </div>
                ${mapping.isPrimary ? '<span class="user-mapping-badge">Primary</span>' : ''}
            </div>
            <button class="btn-danger btn-small" data-mapping-id="${mapping.id}">✕</button>
        `;

        const deleteBtn = item.querySelector('.btn-danger');
        deleteBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('userMapping:delete', {
                detail: { mappingId: mapping.id }
            }));
        });

        container.appendChild(item);
    });
}
