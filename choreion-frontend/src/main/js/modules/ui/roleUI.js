/**
 * Role-based UI Module
 * Handles showing/hiding UI elements based on user roles
 */

import { canDesign, isAdmin } from '../auth.js';
import { setMode, getMode } from '../state.js';
import { t } from '../../i18n/i18n.js';

/**
 * Apply role-based UI restrictions
 * Shows/hides elements based on current user's role
 */
export function applyRoleBasedUI() {
    const isDesigner = canDesign();
    const isAdminUser = isAdmin();

    // Hide/show project creation for USER role
    const createProjectSection = document.querySelector('#projectSelectionScreen .form-group');
    const createProjectBtn = document.getElementById('createProjectBtn');
    if (createProjectSection && createProjectBtn) {
        if (!isDesigner) {
            createProjectSection.classList.add('hidden');
            createProjectBtn.classList.add('hidden');
        } else {
            createProjectSection.classList.remove('hidden');
            createProjectBtn.classList.remove('hidden');
        }
    }

    // Hide/show toggle mode button for USER role
    const toggleModeBtn = document.getElementById('modeContainer');
    if (toggleModeBtn) {
        if (!isDesigner) {
            toggleModeBtn.classList.add('hidden');
            // Force USER to playback mode
            if (getMode() === 'design') {
                setMode('playback');
                const info = document.getElementById('modeInfo');
                const playbackControls = document.getElementById('playbackControls');
                const designControls = document.getElementById('designControls');
                if (info) info.innerHTML = `<strong data-i18n="mode.playback">${t('mode.playback')}:</strong> <span data-i18n="mode.playback.info">${t('mode.playback.info')}</span>`;
                if (playbackControls) playbackControls.classList.remove('hidden');
                if (designControls) designControls.classList.add('hidden');
            }
        } else {
            toggleModeBtn.classList.remove('hidden');
        }
    }

    // Hide People tab for USER role (they can't add/remove people)
    const peopleTab = document.querySelector('[data-tab="people"]');
    if (peopleTab) {
        if (!isDesigner) {
            peopleTab.classList.add('hidden');
        } else {
            peopleTab.classList.remove('hidden');
        }
    }

    // Hide choreography save/delete controls for USER role
    const choreographySaveSection = document.querySelector('#choreographiesTab .form-row');
    if (choreographySaveSection) {
        if (!isDesigner) {
            choreographySaveSection.classList.add('hidden');
        } else {
            choreographySaveSection.classList.remove('hidden');
        }
    }

    // Show/hide admin button for ADMIN role
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        if (isAdminUser) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    }

    // Show/hide admin button on project selection screen for ADMIN role
    const projectAdminBtn = document.getElementById('projectAdminBtn');
    if (projectAdminBtn) {
        if (isAdminUser) {
            projectAdminBtn.classList.remove('hidden');
        } else {
            projectAdminBtn.classList.add('hidden');
        }
    }
}
