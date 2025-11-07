/**
 * Main Application Entry Point (Refactored)
 * This is the main orchestrator that ties all modules together
 */

import { GRID_SIZE, GRID_SPACING, PERSON_RADIUS, DEFAULT_GRID_SIZE } from "./modules/constants.js";
import * as Api from "./modules/api/index.js";
import * as Auth from "./modules/auth.js";
import * as State from "./modules/state.js";
import { initI18n, setLocale, t } from "./i18n/i18n.js";
import { applyRoleBasedUI } from "./modules/ui/roleUI.js";
import { loadProjectList, createNewProject, renderProjectList } from "./modules/ui/projectUI.js";
import { loadChoreographyList, loadChoreographyFromItem, saveChoreography, deleteChoreography } from "./modules/ui/choreographyUI.js";
import { renderPersonList, addPerson, removePerson, renderUserMappings } from "./modules/ui/personUI.js";
import { showAdminPanel, hideAdminPanel, createNewUser, loadAdminMappingData, onProjectChange, createAdminMapping } from "./modules/ui/adminUI.js";
import { showStatus } from "./modules/ui/statusUI.js";
import { showLoginScreen, showProjectSelection, showApp, isMobile } from "./modules/utils/screenUtils.js";
import { snapToGrid } from "./modules/utils/gridUtils.js";
import { initializeStage, getStage, getLayer, getGridLayer, zoomIn, zoomOut, resetZoom, setPanEnabled } from "./modules/canvas/stage.js";
import { drawGrid } from "./modules/canvas/grid.js";
import { createPerson, createPeopleFromData, addPersonToCanvas, removePersonFromCanvas, resetPositions } from "./modules/canvas/person.js";
import { redrawRoutes, clearRoute, clearAllRoutes } from "./modules/canvas/routes.js";
import { togglePlayPause, stopAnimation } from "./modules/canvas/animation.js";

// Track step counter text
let stepCounterText = null;

// ============= Auth Functions =============

async function handleLogin(username, password) {
    const success = await Auth.login(username, password);
    if (success) {
        await showProjectSelectionScreen();
        return true;
    }
    return false;
}

function handleLogout() {
    Auth.logout();
    State.resetAllState();

    const layer = getLayer();
    if (layer) {
        layer.destroyChildren();
        layer.draw();
    }

    showLoginScreen();
}

// ============= Screen Navigation =============

async function showProjectSelectionScreen() {
    showProjectSelection();
    applyRoleBasedUI();
    await loadProjectList();
}

function selectProject(projectId) {
    State.setCurrentProjectId(projectId);
    State.setHasUnsavedChanges(false);

    // Set the project title
    const project = State.getProjectById(projectId);
    if (project) {
        const projectNameEl = document.getElementById('currentProjectName');
        if (projectNameEl) projectNameEl.textContent = project.name;
    }

    showMainApp();
}

function showMainApp() {
    const user = Auth.getCurrentUser();
    showApp(user);
    applyRoleBasedUI();
    initializeApp();
}

function switchToProjectSelection() {
    if (State.getHasUnsavedChanges()) {
        if (!confirm(t('confirm.unsavedChanges'))) {
            return;
        }
    }

    State.resetProjectState();

    const layer = getLayer();
    if (layer) {
        layer.destroyChildren();
        layer.draw();
    }

    showProjectSelectionScreen();
}

// ============= Auth Check =============

async function checkAuth() {
    if (!Auth.restoreAuth()) {
        return;
    }

    const projectId = State.restoreProjectId();
    if (projectId) {
        await loadProjectList();
        const project = State.getProjectById(projectId);
        if (project) {
            const projectNameEl = document.getElementById('currentProjectName');
            if (projectNameEl) projectNameEl.textContent = project.name;
        }
        showMainApp();
    } else {
        await showProjectSelectionScreen();
    }
}

// ============= Initialize App =============

async function initializeFromBackend() {
    const projectId = State.getCurrentProjectId();

    // Clear existing people from state to avoid duplicates
    State.clearPeople();

    const peopleData = await Api.fetchPeople(projectId);

    if (peopleData && peopleData.length > 0) {
        createPeopleFromData(peopleData);

        // Initialize routes for all people
        const routes = {};
        State.getPeople().forEach(person => {
            routes[person.id] = [];
        });

        State.setRoutes(routes);
    }

    renderPersonList();
    await loadChoreographyList();
    await fetchUserMappings();
}

function initializeApp() {
    if (!Auth.isAuthenticated()) {
        console.log('No auth token, skipping initialization');
        return;
    }

    let stage = getStage();
    if (!stage) {
        const { stage: newStage, layer, gridLayer } = initializeStage();
        drawGrid(gridLayer);
        setupEventListeners();
    }

    // Update mode info based on current mode (which defaults to playback on mobile)
    const currentMode = State.getMode();
    const info = document.getElementById('modeInfo');

    if (currentMode === 'playback' && info) {
        info.innerHTML = `<strong data-i18n="mode.playback">${t('mode.playback')}:</strong> <span data-i18n="mode.playback.info">${t('mode.playback.info')}</span>`;
        // Enable panning for playback mode (default on mobile)
        setPanEnabled(true);
    } else {
        // Disable panning for design mode
        setPanEnabled(false);
    }

    initializeFromBackend();
}

// ============= User Mappings =============

async function fetchUserMappings() {
    try {
        const mappings = await Api.fetchUserMappings();
        State.setUserMappings(mappings);
        renderUserMappings(mappings);
    } catch (error) {
        console.error('Error fetching mappings:', error);
    }
}

async function createUserMapping(personId) {
    try {
        const choreographyId = State.getCurrentChoreographyId();
        const mappings = State.getUserMappings();
        await Api.createUserMapping(personId, choreographyId, mappings.length);

        await fetchUserMappings();
        renderPersonList();
        showStatus(t('status.mapping.created'), 'success');
    } catch (error) {
        console.error('Error creating mapping:', error);
        showStatus(t('status.mapping.error.create'), 'error');
    }
}

async function deleteUserMapping(mappingId) {
    try {
        await Api.deleteUserMapping(mappingId);

        await fetchUserMappings();
        renderPersonList();
        showStatus(t('status.mapping.removed'), 'success');
    } catch (error) {
        console.error('Error deleting mapping:', error);
        showStatus(t('status.mapping.error.remove'), 'error');
    }
}

// ============= Canvas Event Handlers =============

function selectPerson(id, index) {
    State.setSelectedPerson({ id, index });
    renderPersonList();
    redrawRoutes();
}

function toggleSnapping() {
    const enabled = State.toggleSnapToGrid();
    const btn = document.getElementById('toggleSnapping');
    if (btn) {
        const translationKey = enabled ? 'controls.snapToGrid.on' : 'controls.snapToGrid.off';
        btn.setAttribute('data-i18n-title', translationKey);
        btn.setAttribute('title', t(translationKey));
    }
}

function deleteLastStep() {
    const selectedPerson = State.getSelectedPerson();
    if (!selectedPerson) {
        showStatus(t('status.step.selectPerson'), 'error');
        return;
    }

    const routes = State.getRoutes();
    const route = routes[selectedPerson.id];
    if (!route || route.length === 0) {
        showStatus(t('status.step.noSteps'), 'error');
        return;
    }

    route.pop();
    State.setHasUnsavedChanges(true);
    redrawRoutes();
}

function toggleMode() {
    const currentMode = State.getMode();
    const newMode = currentMode === 'design' ? 'playback' : 'design';

    // Prevent switching to design mode on mobile devices
    if (newMode === 'design' && isMobile()) {
        console.log('Design mode is not available on mobile devices');
        return;
    }

    State.setMode(newMode);

    const btn = document.getElementById('toggleMode');
    const info = document.getElementById('modeInfo');
    const playbackControls = document.getElementById('playbackControls');
    const designControls = document.getElementById('designControls');

    if (newMode === 'playback') {
        if (btn) {
            btn.setAttribute('data-i18n', 'button.switch.design');
            btn.textContent = t('button.switch.design');
        }
        if (info) info.innerHTML = `<strong data-i18n="mode.playback">${t('mode.playback')}:</strong> <span data-i18n="mode.playback.info">${t('mode.playback.info')}</span>`;
        if (playbackControls) playbackControls.classList.remove('hidden');
        if (designControls) designControls.classList.add('hidden');

        // Enable panning in playback mode
        setPanEnabled(true);

        const layer = getLayer();
        if (layer) {
            layer.find('.route-line').forEach(line => line.destroy());
            layer.find('.route-point').forEach(point => point.destroy());
            layer.batchDraw();
        }
    } else {
        if (btn) {
            btn.setAttribute('data-i18n', 'button.switch.playback');
            btn.textContent = t('button.switch.playback');
        }
        if (info) info.innerHTML = `<strong data-i18n="mode.design">${t('mode.design')}:</strong> <span data-i18n="mode.design.info">${t('mode.design.info')}</span>`;
        if (playbackControls) playbackControls.classList.add('hidden');
        if (designControls) designControls.classList.remove('hidden');

        // Disable panning in design mode to allow clicking for route points
        setPanEnabled(false);

        stopAnimation();
        redrawRoutes();
    }
}

// ============= Event Listeners =============

function setupEventListeners() {
    const stage = getStage();
    const layer = getLayer();

    // Canvas click - add route point
    stage.on('click', (e) => {
        if (State.getMode() !== 'design') return;

        const selectedPerson = State.getSelectedPerson();
        if (!selectedPerson) return;

        const routes = State.getRoutes();
        const currentSteps = routes[selectedPerson.id] ? routes[selectedPerson.id].length : 0;
        const maxSteps = State.getCurrentChoreographySteps();

        if (currentSteps >= maxSteps) {
            showStatus(t('status.step.maxReached', { max: maxSteps }), 'error');
            return;
        }

        const pos = stage.getPointerPosition();
        const snappedX = snapToGrid(pos.x);
        const snappedY = snapToGrid(pos.y);

        routes[selectedPerson.id].push({ x: snappedX, y: snappedY });
        State.setHasUnsavedChanges(true);
        redrawRoutes();
    });

    // Canvas mousemove - show step counter
    stage.on('mousemove', (e) => {
        if (State.getMode() !== 'design') {
            if (stepCounterText) {
                stepCounterText.destroy();
                stepCounterText = null;
                layer.batchDraw();
            }
            return;
        }

        const selectedPerson = State.getSelectedPerson();
        if (!selectedPerson) {
            if (stepCounterText) {
                stepCounterText.destroy();
                stepCounterText = null;
                layer.batchDraw();
            }
            return;
        }

        const pos = stage.getPointerPosition();
        const snappedX = snapToGrid(pos.x);
        const snappedY = snapToGrid(pos.y);

        const routes = State.getRoutes();
        const currentSteps = routes[selectedPerson.id] ? routes[selectedPerson.id].length : 0;
        const maxSteps = State.getCurrentChoreographySteps();

        if (stepCounterText) {
            stepCounterText.destroy();
        }

        stepCounterText = new Konva.Text({
            x: snappedX + 15,
            y: snappedY - 15,
            text: `${currentSteps}/${maxSteps}`,
            fontSize: 16,
            fontStyle: 'bold',
            fill: currentSteps >= maxSteps ? '#e74c3c' : '#2ecc71',
            stroke: '#fff',
            strokeWidth: 1
        });

        layer.add(stepCounterText);
        redrawRoutes({ x: snappedX, y: snappedY });
    });

    // UI button event listeners
    document.getElementById('switchProjectBtn')?.addEventListener('click', switchToProjectSelection);
    document.getElementById('toggleMode')?.addEventListener('click', toggleMode);
    document.getElementById('clearAll')?.addEventListener('click', () => clearAllRoutes(true));
    document.getElementById('resetPositions')?.addEventListener('click', resetPositions);
    document.getElementById('playPause')?.addEventListener('click', togglePlayPause);
    document.getElementById('stop')?.addEventListener('click', stopAnimation);
    document.getElementById('saveChoreography')?.addEventListener('click', saveChoreography);
    document.getElementById('deleteChoreography')?.addEventListener('click', deleteChoreography);
    document.getElementById('addPerson')?.addEventListener('click', addPerson);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('toggleSnapping')?.addEventListener('click', toggleSnapping);
    document.getElementById('deleteLastStep')?.addEventListener('click', deleteLastStep);

    // Zoom control event listeners
    document.getElementById('zoomIn')?.addEventListener('click', zoomIn);
    document.getElementById('zoomOut')?.addEventListener('click', zoomOut);
    document.getElementById('resetZoom')?.addEventListener('click', resetZoom);

    // Person list event listeners
    document.getElementById('personList')?.addEventListener('click', (event) => {
        const clearBtn = event.target.closest('.clear-route-btn');
        const removeBtn = event.target.closest('.remove-person-btn');

        if (clearBtn) {
            const personId = parseInt(clearBtn.dataset.personId, 10);
            const person = State.getPeople().find(p => p.id === personId);
            if (person) clearRoute(person, true);
            return;
        }

        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index, 10);
            removePerson(index);
            return;
        }
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`)?.classList.add('active');
        });
    });

    // BPM input
    const bpmInput = document.getElementById('bpm');
    bpmInput?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 30 && value <= 300) {
            State.setCurrentBPM(value);
        }
    });
}

// ============= Custom Events =============

window.addEventListener('project:selected', (event) => {
    selectProject(event.detail.projectId);
});

window.addEventListener('person:selected', (event) => {
    selectPerson(event.detail.id, event.detail.index);
});

window.addEventListener('person:created', (event) => {
    const { person, personData } = event.detail;
    const startX = -100;
    const startY = -100;

    const personObj = createPerson(person, personData);
    State.addPersonToState(personObj);
    State.setRouteForPerson(person.id, []);

    addPersonToCanvas(personObj);
});

window.addEventListener('person:removed', (event) => {
    const { index } = event.detail;
    const people = State.getPeople();
    const person = people[index];

    if (person) {
        removePersonFromCanvas(person);
        State.removePersonFromState(index);

        const selectedPerson = State.getSelectedPerson();
        if (!selectedPerson || selectedPerson.index === index) {
            State.clearSelectedPerson();
        } else if (selectedPerson && selectedPerson.index > index) {
            State.setSelectedPerson({ ...selectedPerson, index: selectedPerson.index - 1 });
        }

        redrawRoutes();
    }
});

window.addEventListener('choreography:load', (event) => {
    loadChoreographyFromItem(event.detail.id);
});

window.addEventListener('canvas:resetPositions', () => {
    resetPositions();
});

window.addEventListener('canvas:redrawRoutes', () => {
    redrawRoutes();
});

window.addEventListener('routes:clearAll', (event) => {
    clearAllRoutes(event.detail.confirm);
});

window.addEventListener('userMapping:delete', (event) => {
    deleteUserMapping(event.detail.mappingId);
});

window.addEventListener('stageResize', (event) => {
    const { gridSize, oldGridSize } = event.detail;

    // Redraw grid with new size
    const gridLayer = getGridLayer();
    if (gridLayer) {
        drawGrid(gridLayer, gridSize);
    }

    // Scale all route coordinates relative to DEFAULT_GRID_SIZE
    // First, normalize routes back to DEFAULT_GRID_SIZE if needed
    const routes = State.getRoutes();
    const oldScaleFactor = oldGridSize / DEFAULT_GRID_SIZE;
    const newScaleFactor = gridSize / DEFAULT_GRID_SIZE;

    const scaledRoutes = {};

    Object.keys(routes).forEach(personId => {
        const route = routes[personId];
        scaledRoutes[personId] = route.map(point => ({
            // Convert to DEFAULT_GRID_SIZE coordinates, then scale to new size
            x: (point.x / oldScaleFactor) * newScaleFactor,
            y: (point.y / oldScaleFactor) * newScaleFactor
        }));
    });

    State.setRoutes(scaledRoutes);

    // Redraw routes with new coordinates
    redrawRoutes();
});

// ============= DOM Ready =============

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize i18n system
    await initI18n();

    // Hide loading screen after 2 seconds
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            showLoginScreen();
        }
    }, 2000);

    // Check if already logged in
    checkAuth();

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername')?.value;
        const password = document.getElementById('loginPassword')?.value;

        const success = await handleLogin(username, password);
        if (!success) {
            const loginError = document.getElementById('loginError');
            if (loginError) {
                loginError.textContent = t('login.error');
                loginError.style.display = 'block';
            }
        }
    });

    // Project selection event listeners
    document.getElementById('createProjectBtn')?.addEventListener('click', createNewProject);
    document.getElementById('logoutFromProjectsBtn')?.addEventListener('click', handleLogout);

    // Admin panel event listeners
    document.getElementById('adminBtn')?.addEventListener('click', showAdminPanel);
    document.getElementById('backToAppBtn')?.addEventListener('click', hideAdminPanel);
    document.getElementById('createUserBtn')?.addEventListener('click', createNewUser);
    document.getElementById('adminLogoutBtn')?.addEventListener('click', handleLogout);

    // Admin mapping event listeners
    document.getElementById('adminMappingProjectId')?.addEventListener('change', onProjectChange);
    document.getElementById('createMappingBtn')?.addEventListener('click', createAdminMapping);

    // Language selectors
    document.getElementById('languageSelector')?.addEventListener('change', async (e) => {
        await setLocale(e.target.value);
    });

    document.getElementById('loginLanguageSelector')?.addEventListener('change', async (e) => {
        await setLocale(e.target.value);
    });

    document.getElementById('projectLanguageSelector')?.addEventListener('change', async (e) => {
        await setLocale(e.target.value);
    });

    // Admin button on project selection screen
    document.getElementById('projectAdminBtn')?.addEventListener('click', showAdminPanel);
});
