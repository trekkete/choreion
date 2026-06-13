/**
 * Choreography UI Module
 * Handles rendering and managing choreography-related UI
 */

import * as Api from '../api/index.js';
import {
    setChoreographies,
    getChoreographies,
    getCurrentChoreographyId,
    setCurrentChoreographyId,
    setCurrentChoreographySteps,
    getCurrentProjectId,
    setRoutes,
    getPeople,
    getRoutes,
    setHasUnsavedChanges
} from '../state.js';
import { showStatus } from './statusUI.js';
import { DEFAULT_GRID_SIZE } from '../constants.js';
import { getCurrentGridSize } from '../canvas/stage.js';
import { t } from '../../i18n/i18n.js';

/**
 * Load choreography list for current project
 */
export async function loadChoreographyList() {
    const projectId = getCurrentProjectId();
    const choreographies = await Api.fetchChoreographies(projectId);
    setChoreographies(choreographies);
    renderChoreographyList();
}

/**
 * Render choreography list
 */
export function renderChoreographyList() {
    const container = document.getElementById('choreographyList');
    if (!container) return;

    const choreographies = getChoreographies();
    const currentId = getCurrentChoreographyId();

    if (choreographies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-theater-masks"></i></div>
                <div>No choreographies yet</div>
                <div class="text-sm">Create one by designing routes and clicking Save</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    choreographies.forEach(choreo => {
        const item = document.createElement('div');
        item.className = 'choreography-item';
        if (choreo.id === currentId) {
            item.classList.add('selected');
        }

        const date = new Date(choreo.updatedAt[0], choreo.updatedAt[1] - 1, choreo.updatedAt[2],
                             choreo.updatedAt[3], choreo.updatedAt[4], choreo.updatedAt[5]);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        item.innerHTML = `
            <div class="choreography-item-header">
                <div>
                    <div class="choreography-name">${choreo.name}</div>
                    <div class="choreography-date">${dateStr}</div>
                    <div class="choreography-steps">${choreo.steps} steps</div>
                </div>
            </div>
        `;

        item.addEventListener('click', () => {
            // Emit custom event for choreography load
            window.dispatchEvent(new CustomEvent('choreography:load', { detail: { id: choreo.id } }));
        });
        container.appendChild(item);
    });
}

/**
 * Load choreography from backend
 * @param {number} id - Choreography ID
 */
export async function loadChoreographyFromItem(id) {
    const projectId = getCurrentProjectId();
    const choreography = await Api.fetchChoreography(id, projectId);

    if (choreography) {
        setCurrentChoreographyId(choreography.id);
        setCurrentChoreographySteps(choreography.steps || 8);

        const nameInput = document.getElementById('choreographyName');
        const stepsInput = document.getElementById('choreographySteps');
        if (nameInput) nameInput.value = choreography.name;
        if (stepsInput) stepsInput.value = choreography.steps || 8;

        const routes = choreography.routes || {};
        const people = getPeople();

        // Scale routes based on current grid size
        // Choreographies are saved with coordinates relative to DEFAULT_GRID_SIZE (800px)
        // We need to scale them to the current grid size
        const currentGridSize = getCurrentGridSize() || DEFAULT_GRID_SIZE;
        const scaleFactor = currentGridSize / DEFAULT_GRID_SIZE;
        const scaledRoutes = {};

        Object.keys(routes).forEach(personId => {
            const route = routes[personId];
            if (route && route.length > 0) {
                scaledRoutes[personId] = route.map(point => ({
                    x: point.x * scaleFactor,
                    y: point.y * scaleFactor
                }));
            } else {
                scaledRoutes[personId] = [];
            }
        });

        // Initialize empty routes for people without routes
        people.forEach((person) => {
            if (!scaledRoutes[person.id] || scaledRoutes[person.id].length === 0) {
                scaledRoutes[person.id] = [];
            }
        });

        setRoutes(scaledRoutes);

        // Emit events for canvas updates
        window.dispatchEvent(new Event('canvas:resetPositions'));
        window.dispatchEvent(new Event('canvas:redrawRoutes'));

        showStatus(t('status.choreography.loaded'), 'success');
        renderChoreographyList();
    }
}

/**
 * Create a new empty choreography and select it
 */
export async function newChoreography() {
    const name = document.getElementById('choreographyName')?.value.trim();
    const steps = parseInt(document.getElementById('choreographySteps')?.value);

    if (!name) {
        showStatus(t('status.choreography.error.name'), 'error');
        return;
    }

    if (!steps || steps < 1) {
        showStatus(t('status.choreography.error.steps'), 'error');
        return;
    }

    const emptyRoutes = {};
    getPeople().forEach(person => {
        emptyRoutes[person.id] = [];
    });

    const choreographyData = {
        id: null,
        name,
        steps,
        routes: emptyRoutes
    };

    try {
        const projectId = getCurrentProjectId();
        const saved = await Api.saveChoreography(choreographyData, projectId);
        setCurrentChoreographyId(saved.id);
        setCurrentChoreographySteps(saved.steps);
        setHasUnsavedChanges(false);

        window.dispatchEvent(new CustomEvent('routes:clearAll', { detail: { confirm: false } }));
        showStatus(t('status.choreography.saved'), 'success');
        await loadChoreographyList();
    } catch (error) {
        console.error('Error creating choreography:', error);
        showStatus(t('status.choreography.error.save'), 'error');
    }
}

/**
 * Save current choreography
 */
export async function saveChoreography() {
    const name = document.getElementById('choreographyName')?.value.trim();
    const steps = parseInt(document.getElementById('choreographySteps')?.value);

    if (!name) {
        showStatus(t('status.choreography.error.name'), 'error');
        return;
    }

    if (!steps || steps < 1) {
        showStatus(t('status.choreography.error.steps'), 'error');
        return;
    }

    // Normalize routes to DEFAULT_GRID_SIZE before saving
    // This ensures choreographies can be loaded correctly on any device
    const currentGridSize = getCurrentGridSize() || DEFAULT_GRID_SIZE;
    const scaleFactor = DEFAULT_GRID_SIZE / currentGridSize;
    const currentRoutes = getRoutes();
    const normalizedRoutes = {};

    Object.keys(currentRoutes).forEach(personId => {
        const route = currentRoutes[personId];
        if (route && route.length > 0) {
            normalizedRoutes[personId] = route.map(point => ({
                x: point.x * scaleFactor,
                y: point.y * scaleFactor
            }));
        } else {
            normalizedRoutes[personId] = [];
        }
    });

    const choreographyData = {
        id: getCurrentChoreographyId(),
        name: name,
        steps: steps,
        routes: normalizedRoutes
    };

    try {
        const projectId = getCurrentProjectId();
        const saved = await Api.saveChoreography(choreographyData, projectId);
        setCurrentChoreographyId(saved.id);
        setCurrentChoreographySteps(saved.steps);
        setHasUnsavedChanges(false);

        showStatus(t('status.choreography.saved'), 'success');
        await loadChoreographyList();
    } catch (error) {
        console.error('Error saving choreography:', error);
        showStatus(t('status.choreography.error.save'), 'error');
    }
}

/**
 * Delete current choreography
 */
export async function deleteChoreography() {
    const currentId = getCurrentChoreographyId();

    if (!currentId) {
        showStatus('Please select a choreography to delete', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this choreography?')) return;

    try {
        const projectId = getCurrentProjectId();
        await Api.deleteChoreography(currentId, projectId);

        showStatus('Choreography deleted successfully!', 'success');
        setCurrentChoreographyId(null);

        const nameInput = document.getElementById('choreographyName');
        if (nameInput) nameInput.value = '';

        await loadChoreographyList();

        // Emit event to clear routes
        window.dispatchEvent(new CustomEvent('routes:clearAll', { detail: { confirm: false } }));
    } catch (error) {
        console.error('Error deleting choreography:', error);
        showStatus('Error deleting choreography', 'error');
    }
}
