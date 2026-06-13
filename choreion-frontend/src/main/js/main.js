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
import { loadChoreographyList, loadChoreographyFromItem, saveChoreography, deleteChoreography, newChoreography } from "./modules/ui/choreographyUI.js";
import { renderPersonList, addPerson, removePerson, renderUserMappings, importPeopleFromCsv } from "./modules/ui/personUI.js";
import { showAdminPanel, hideAdminPanel, createNewUser, loadAdminMappingData, onProjectChange, createAdminMapping } from "./modules/ui/adminUI.js";
import { showStatus } from "./modules/ui/statusUI.js";
import { showLoginScreen, showProjectSelection, showApp, isMobile } from "./modules/utils/screenUtils.js";
import { snapToGrid } from "./modules/utils/gridUtils.js";
import { initializeStage, getStage, getLayer, getGridLayer, zoomIn, zoomOut, resetZoom, setPanEnabled } from "./modules/canvas/stage.js";
import { drawGrid } from "./modules/canvas/grid.js";
import { createPerson, createPeopleFromData, addPersonToCanvas, removePersonFromCanvas, resetPositions } from "./modules/canvas/person.js";
import { redrawRoutes, clearRoute, clearAllRoutes, copyPersonRoute, computeCopiedRoute, drawRoutePreview, clearRoutePreview } from "./modules/canvas/routes.js";
import { togglePlayPause, stopAnimation } from "./modules/canvas/animation.js";

// Track step counter text
let stepCounterText = null;

// ============= Draw Mode State =============
let isDrawing = false;
let rawDrawPath = [];
let drawPreviewLine = null;
let pendingDrawPath = [];

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
        drawGrid(gridLayer, null, null, State.getGridVisible());
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
        btn.innerHTML = '<i class="fas fa-magnet"></i>';
        btn.setAttribute('data-i18n-title', enabled ? 'controls.snapToGrid.on' : 'controls.snapToGrid.off');
        btn.title = t(enabled ? 'controls.snapToGrid.on' : 'controls.snapToGrid.off');
        btn.classList.toggle('btn-mode-active', enabled);
    }
}

function toggleGrid() {
    const visible = State.toggleGridVisible();
    const gridLayer = getGridLayer();
    if (gridLayer) {
        drawGrid(gridLayer, null, null, visible);
    }
    const btn = document.getElementById('toggleGrid');
    if (btn) btn.classList.toggle('btn-mode-active', visible);
}

function toggleCollapsible(bodyId, toggleId) {
    const body = document.getElementById(bodyId);
    const toggle = document.getElementById(toggleId);
    if (!body) return;
    const isExpanded = body.classList.toggle('expanded');
    const icon = toggle?.querySelector('i');
    if (icon) icon.className = isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
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

// ============= Copy Route Modal =============

let pickingStartingPoint = false;
let copyStartingPoint = null;

function openCopyRouteModal() {
    const people = State.getPeople();
    if (people.length < 2) {
        showStatus(t('status.copyRoute.needTwoPeople'), 'error');
        return;
    }

    const fromSelect = document.getElementById('copyRouteFrom');
    const toSelect = document.getElementById('copyRouteTo');
    if (!fromSelect || !toSelect) return;

    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    people.forEach(p => {
        fromSelect.appendChild(new Option(p.name, p.id));
        toSelect.appendChild(new Option(p.name, p.id));
    });
    if (people.length > 1) toSelect.selectedIndex = 1;

    document.getElementById('mirrorHorizontal').checked = false;
    document.getElementById('mirrorVertical').checked = false;
    document.getElementById('mirrorModeGroup').style.display = 'none';
    document.getElementById('mirrorModeRoute').checked = true;

    copyStartingPoint = null;
    document.getElementById('startingPointDisplay').setAttribute('data-i18n', 'copyRoute.startingPoint.none');
    document.getElementById('startingPointDisplay').textContent = t('copyRoute.startingPoint.none');

    document.getElementById('copyRouteModal').classList.remove('hidden');
}

function closeCopyRouteModal() {
    clearRoutePreview();
    copyStartingPoint = null;
    document.getElementById('copyRouteModal').classList.add('hidden');
}

function confirmCopyRoute() {
    const fromId = parseInt(document.getElementById('copyRouteFrom').value, 10);
    const toId = parseInt(document.getElementById('copyRouteTo').value, 10);
    const mirrorX = document.getElementById('mirrorHorizontal').checked;
    const mirrorY = document.getElementById('mirrorVertical').checked;
    const mirrorMode = document.querySelector('input[name="mirrorMode"]:checked')?.value || 'route';

    if (fromId === toId) {
        showStatus(t('status.copyRoute.samePersonError'), 'error');
        return;
    }

    const success = copyPersonRoute(fromId, toId, mirrorX, mirrorY, mirrorMode, copyStartingPoint);
    if (success) {
        State.setHasUnsavedChanges(true);
        redrawRoutes();
        showStatus(t('status.copyRoute.success'), 'success');
        closeCopyRouteModal();
    } else {
        showStatus(t('status.copyRoute.emptySource'), 'error');
    }
}

function startPickStartingPoint() {
    document.getElementById('copyRouteModal').classList.add('hidden');
    pickingStartingPoint = true;
    document.getElementById('pickStartingPointBanner').classList.remove('hidden');
    document.body.style.cursor = 'crosshair';
}

function finishPickStartingPoint(x, y) {
    pickingStartingPoint = false;
    document.getElementById('pickStartingPointBanner').classList.add('hidden');
    document.body.style.cursor = '';
    clearRoutePreview();
    copyStartingPoint = { x, y };
    document.getElementById('startingPointDisplay').textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    document.getElementById('copyRouteModal').classList.remove('hidden');
}

function getMirrorPreviewParams() {
    const fromId = parseInt(document.getElementById('copyRouteFrom')?.value, 10);
    const mirrorX = document.getElementById('mirrorHorizontal')?.checked || false;
    const mirrorY = document.getElementById('mirrorVertical')?.checked || false;
    const mirrorMode = document.querySelector('input[name="mirrorMode"]:checked')?.value || 'route';
    return { fromId, mirrorX, mirrorY, mirrorMode };
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
        // Reset draw mode when leaving design mode
        clearDrawState();
        State.setInputMode('click');
        const inputModeBtn = document.getElementById('toggleInputMode');
        if (inputModeBtn) {
            inputModeBtn.innerHTML = '<i class="fas fa-mouse-pointer"></i>';
            inputModeBtn.classList.remove('btn-mode-active');
        }

        if (btn) {
            btn.setAttribute('data-i18n-title', 'button.switch.design');
            btn.innerHTML = '<i class="fas fa-edit"></i>';
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
            btn.setAttribute('data-i18n-title', 'button.switch.playback');
            btn.innerHTML = '<i class="fas fa-eye"></i>';
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

// ============= Floating Controls Panel =============

function toggleFloatingControls() {
    const panel = document.getElementById('floatingControls');
    const icon = document.querySelector('#floatingControlsToggle i');
    if (!panel) return;
    const isRetracted = panel.classList.toggle('retracted');
    if (icon) {
        icon.className = isRetracted ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    }
}

function toggleSidebar() {
    const outer = document.getElementById('sidebarOuter');
    const icon = document.querySelector('#sidebarToggle i');
    if (!outer) return;
    const isRetracted = outer.classList.toggle('retracted');
    if (icon) {
        icon.className = isRetracted ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
    }
}

// ============= Draw Mode =============

function clearDrawState() {
    isDrawing = false;
    rawDrawPath = [];
    const layer = getLayer();
    if (layer) {
        if (drawPreviewLine) {
            drawPreviewLine.destroy();
            drawPreviewLine = null;
        }
        layer.find('.draw-preview').forEach(el => el.destroy());
        layer.batchDraw();
    }
    drawPreviewLine = null;
    const stage = getStage();
    if (stage) stage.container().style.cursor = '';
}

function toggleInputMode() {
    const current = State.getInputMode();
    const next = current === 'click' ? 'draw' : 'click';
    State.setInputMode(next);

    // Clean up visual artifacts from the previous input mode
    if (stepCounterText) {
        stepCounterText.destroy();
        stepCounterText = null;
    }
    const layer = getLayer();
    if (layer) {
        layer.find('.draw-preview').forEach(el => el.destroy());
    }
    if (next === 'draw') {
        // Also remove click-mode route preview crosshair lines
        redrawRoutes();
        getStage()?.container() && (getStage().container().style.cursor = 'crosshair');
    } else {
        clearDrawState();
    }

    const btn = document.getElementById('toggleInputMode');
    if (btn) {
        if (next === 'draw') {
            btn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            btn.setAttribute('data-i18n-title', 'controls.inputMode.draw');
            btn.title = t('controls.inputMode.draw');
            btn.classList.add('btn-mode-active');
        } else {
            btn.innerHTML = '<i class="fas fa-mouse-pointer"></i>';
            btn.setAttribute('data-i18n-title', 'controls.inputMode.click');
            btn.title = t('controls.inputMode.click');
            btn.classList.remove('btn-mode-active');
        }
    }

    const info = document.getElementById('modeInfo');
    if (info && State.getMode() === 'design') {
        if (next === 'draw') {
            info.innerHTML = `<strong>${t('mode.design')}:</strong> <span>${t('drawMode.modeInfo')}</span>`;
        } else {
            info.innerHTML = `<strong>${t('mode.design')}:</strong> <span>${t('mode.design.info')}</span>`;
        }
    }
}

function samplePathUniform(points, n) {
    if (!points || points.length === 0 || n <= 0) return [];
    if (points.length === 1) return Array.from({ length: n }, () => ({ ...points[0] }));
    if (n === 1) return [{ ...points[points.length - 1] }];

    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        lengths.push(lengths[i - 1] + Math.hypot(dx, dy));
    }
    const totalLength = lengths[lengths.length - 1];
    if (totalLength === 0) return Array.from({ length: n }, () => ({ ...points[0] }));

    const result = [];
    for (let i = 0; i < n; i++) {
        const targetLen = (i / (n - 1)) * totalLength;
        let segIdx = 1;
        while (segIdx < lengths.length - 1 && lengths[segIdx] < targetLen) {
            segIdx++;
        }
        const segStart = lengths[segIdx - 1];
        const segEnd = lengths[segIdx];
        const ratio = segEnd === segStart ? 0 : (targetLen - segStart) / (segEnd - segStart);
        const x = points[segIdx - 1].x + ratio * (points[segIdx].x - points[segIdx - 1].x);
        const y = points[segIdx - 1].y + ratio * (points[segIdx].y - points[segIdx - 1].y);
        result.push({ x: snapToGrid(x), y: snapToGrid(y) });
    }
    return result;
}

function openDrawStepsModal() {
    const selectedPerson = State.getSelectedPerson();
    const routes = State.getRoutes();
    const currentSteps = selectedPerson ? (routes[selectedPerson.id]?.length || 0) : 0;
    const maxSteps = State.getCurrentChoreographySteps();
    const remaining = maxSteps - currentSteps;

    if (remaining <= 0) {
        showStatus(t('status.step.maxReached', { max: maxSteps }), 'error');
        return;
    }

    const input = document.getElementById('drawStepsCount');
    if (input) {
        input.max = remaining;
        input.value = Math.min(4, remaining);
    }

    const info = document.getElementById('drawStepsInfo');
    if (info) {
        info.textContent = t('drawMode.modal.stepsInfo', { remaining });
    }

    document.getElementById('drawStepsModal').classList.remove('hidden');
}

function closeDrawStepsModal() {
    pendingDrawPath = [];
    document.getElementById('drawStepsModal').classList.add('hidden');
}

function confirmDrawSteps() {
    const selectedPerson = State.getSelectedPerson();
    if (!selectedPerson || pendingDrawPath.length === 0) {
        closeDrawStepsModal();
        return;
    }

    const n = parseInt(document.getElementById('drawStepsCount').value, 10);
    if (isNaN(n) || n < 1) return;

    const routes = State.getRoutes();
    const currentSteps = routes[selectedPerson.id]?.length || 0;
    const maxSteps = State.getCurrentChoreographySteps();
    const remaining = maxSteps - currentSteps;
    const stepsToAdd = Math.min(n, remaining);

    const sampled = samplePathUniform(pendingDrawPath, stepsToAdd);
    sampled.forEach(pt => routes[selectedPerson.id].push(pt));

    State.setHasUnsavedChanges(true);
    redrawRoutes();
    closeDrawStepsModal();
    showStatus(t('drawMode.status.stepsAdded', { count: stepsToAdd }), 'success');
}

// ============= Event Listeners =============

function setupEventListeners() {
    const stage = getStage();
    const layer = getLayer();

    // Canvas mousedown - start draw mode path
    stage.on('mousedown', (e) => {
        if (State.getMode() !== 'design') return;
        if (State.getInputMode() !== 'draw') return;
        if (e.target !== stage) return;

        const selectedPerson = State.getSelectedPerson();
        if (!selectedPerson) {
            showStatus(t('status.step.selectPerson'), 'error');
            return;
        }

        const routes = State.getRoutes();
        const currentSteps = routes[selectedPerson.id]?.length || 0;
        const maxSteps = State.getCurrentChoreographySteps();

        if (currentSteps >= maxSteps) {
            showStatus(t('status.step.maxReached', { max: maxSteps }), 'error');
            return;
        }

        isDrawing = true;
        rawDrawPath = [];
        const pos = stage.getPointerPosition();
        rawDrawPath.push({ x: pos.x, y: pos.y });
    });

    // Canvas mouseup - finish draw mode path
    stage.on('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        layer.find('.draw-preview').forEach(el => el.destroy());
        drawPreviewLine = null;
        layer.batchDraw();

        if (rawDrawPath.length < 2) {
            rawDrawPath = [];
            return;
        }

        pendingDrawPath = [...rawDrawPath];
        rawDrawPath = [];
        openDrawStepsModal();
    });

    // Canvas click - add route point
    stage.on('click', (e) => {
        if (State.getInputMode() === 'draw') return;

        if (pickingStartingPoint) {
            const pos = stage.getPointerPosition();
            finishPickStartingPoint(snapToGrid(pos.x), snapToGrid(pos.y));
            return;
        }

        if (State.getMode() !== 'design') {
            if (stepCounterText) {
                stepCounterText.destroy();
                stepCounterText = null;
                layer.batchDraw();
            }
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

        if (State.getMode() !== 'design') return;

        const routes = State.getRoutes();
        var currentSteps = routes[selectedPerson.id] ? routes[selectedPerson.id].length : 0;
        const maxSteps = State.getCurrentChoreographySteps();

        if (currentSteps >= maxSteps) {
            showStatus(t('status.step.maxReached', { max: maxSteps }), 'error');
            return;
        }

        const pos = stage.getPointerPosition();
        const snappedX = snapToGrid(pos.x);
        const snappedY = snapToGrid(pos.y);
        currentSteps += 1;

        routes[selectedPerson.id].push({ x: snappedX, y: snappedY });
        State.setHasUnsavedChanges(true);

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
        redrawRoutes();
    });

    // Canvas mousemove - preview while picking starting point / draw mode path / step counter
    stage.on('mousemove', (e) => {
        if (pickingStartingPoint) {
            const pos = stage.getPointerPosition();
            const sx = snapToGrid(pos.x);
            const sy = snapToGrid(pos.y);
            const { fromId, mirrorX, mirrorY, mirrorMode } = getMirrorPreviewParams();
            const people = State.getPeople();
            const person = people.find(p => p.id === fromId);
            const source = fromId ? State.getRouteForPerson(fromId) : null;
            if (source && source.length > 0 && person) {
                const preview = computeCopiedRoute(source, mirrorX, mirrorY, mirrorMode, { x: sx, y: sy }, stage.width());
                drawRoutePreview(preview, person.color);
            }
            return;
        }

        if (State.getMode() !== 'design') {
            if (stepCounterText) {
                stepCounterText.destroy();
                stepCounterText = null;
                layer.batchDraw();
            }
            return;
        }

        // Draw mode: update live path preview while dragging
        if (State.getInputMode() === 'draw') {
            if (stepCounterText) {
                stepCounterText.destroy();
                stepCounterText = null;
            }
            if (isDrawing) {
                const pos = stage.getPointerPosition();
                const last = rawDrawPath[rawDrawPath.length - 1];
                if (!last || Math.hypot(pos.x - last.x, pos.y - last.y) > 5) {
                    rawDrawPath.push({ x: pos.x, y: pos.y });
                }
                if (rawDrawPath.length > 1) {
                    const selectedPerson = State.getSelectedPerson();
                    const people = State.getPeople();
                    const color = selectedPerson ? people[selectedPerson.index]?.color || '#888' : '#888';
                    if (!drawPreviewLine) {
                        drawPreviewLine = new Konva.Line({
                            points: [],
                            stroke: color,
                            strokeWidth: 2.5,
                            opacity: 0.75,
                            name: 'draw-preview'
                        });
                        layer.add(drawPreviewLine);
                    }
                    drawPreviewLine.points(rawDrawPath.flatMap(p => [p.x, p.y]));
                    layer.batchDraw();
                }
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
    document.getElementById('floatingControlsToggle')?.addEventListener('click', toggleFloatingControls);
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('switchProjectBtn')?.addEventListener('click', switchToProjectSelection);
    document.getElementById('toggleMode')?.addEventListener('click', toggleMode);
    document.getElementById('clearAll')?.addEventListener('click', () => clearAllRoutes(true));
    document.getElementById('resetPositions')?.addEventListener('click', resetPositions);
    document.getElementById('playPause')?.addEventListener('click', togglePlayPause);
    document.getElementById('stop')?.addEventListener('click', stopAnimation);
    document.getElementById('newChoreography')?.addEventListener('click', newChoreography);
    document.getElementById('saveChoreography')?.addEventListener('click', saveChoreography);
    document.getElementById('deleteChoreography')?.addEventListener('click', deleteChoreography);
    document.getElementById('addPerson')?.addEventListener('click', addPerson);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('toggleSnapping')?.addEventListener('click', toggleSnapping);
    document.getElementById('toggleGrid')?.addEventListener('click', toggleGrid);
    document.getElementById('deleteLastStep')?.addEventListener('click', deleteLastStep);
    document.getElementById('choreographyFormToggle')?.addEventListener('click', () => toggleCollapsible('choreographyFormBody', 'choreographyFormToggle'));
    document.getElementById('personFormToggle')?.addEventListener('click', () => toggleCollapsible('personFormBody', 'personFormToggle'));
    document.getElementById('toggleInputMode')?.addEventListener('click', toggleInputMode);
    document.getElementById('copyRoute')?.addEventListener('click', openCopyRouteModal);
    document.getElementById('copyRouteModalClose')?.addEventListener('click', closeCopyRouteModal);
    document.getElementById('copyRouteCancel')?.addEventListener('click', closeCopyRouteModal);
    document.getElementById('copyRouteConfirm')?.addEventListener('click', confirmCopyRoute);
    document.getElementById('pickStartingPointBtn')?.addEventListener('click', startPickStartingPoint);
    document.getElementById('drawStepsModalClose')?.addEventListener('click', closeDrawStepsModal);
    document.getElementById('drawStepsCancel')?.addEventListener('click', closeDrawStepsModal);
    document.getElementById('drawStepsConfirm')?.addEventListener('click', confirmDrawSteps);

    // Show/hide mirror mode group when mirror checkboxes change
    ['mirrorHorizontal', 'mirrorVertical'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            const anyChecked = document.getElementById('mirrorHorizontal').checked
                || document.getElementById('mirrorVertical').checked;
            document.getElementById('mirrorModeGroup').style.display = anyChecked ? 'block' : 'none';
        });
    });

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
        drawGrid(gridLayer, gridSize, null, State.getGridVisible());
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

// Escape key: cancel starting-point picking or close draw steps modal
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (pickingStartingPoint) {
        pickingStartingPoint = false;
        document.getElementById('pickStartingPointBanner').classList.add('hidden');
        document.body.style.cursor = '';
        clearRoutePreview();
        document.getElementById('copyRouteModal').classList.remove('hidden');
    } else if (!document.getElementById('drawStepsModal')?.classList.contains('hidden')) {
        closeDrawStepsModal();
    }
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

    // CSV import button (always registered, not dependent on canvas stage)
    const csvBtn = document.getElementById('importPersonCsvBtn');
    const csvInput = document.getElementById('csvPersonFileInput');
    csvBtn?.addEventListener('click', () => csvInput?.click());
    csvInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            importPeopleFromCsv(file);
            e.target.value = '';
        }
    });
});
