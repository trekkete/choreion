/**
 * Mobile Playback Entry Point
 * Minimal, read-only playback experience for mobile devices.
 * Reuses the shared auth/state/canvas modules; never imports the
 * desktop editor's UI modules (sidebar, admin, route drawing).
 */

import { DEFAULT_GRID_SIZE } from "./modules/constants.js";
import * as Api from "./modules/api/index.js";
import * as Auth from "./modules/auth.js";
import * as State from "./modules/state.js";
import { initI18n, setLocale, getCurrentLocale, t } from "./i18n/i18n.js";
import { loadChoreographyList, loadChoreographyFromItem } from "./modules/ui/choreographyUI.js";
import { initializeStage, getGridLayer, resetZoom, focusOnContentPoint, keepContentPointVisible } from "./modules/canvas/stage.js";
import { drawGrid } from "./modules/canvas/grid.js";
import { createPeopleFromData, resetPositions } from "./modules/canvas/person.js";
import { togglePlayPause, stopAnimation } from "./modules/canvas/animation.js";

const FOCUS_ZOOM = 2.2;

// ============= Bootstrap =============

async function loadPeople(projectId) {
    State.clearPeople();
    const peopleData = await Api.fetchPeople(projectId);
    if (peopleData && peopleData.length > 0) {
        createPeopleFromData(peopleData);
        const routes = {};
        State.getPeople().forEach(person => {
            routes[person.id] = [];
        });
        State.setRoutes(routes);
    }
}

function populateChoreographySelect() {
    const select = document.getElementById('mobileChoreographySelect');
    if (!select) return;

    select.innerHTML = '';
    const choreographies = State.getChoreographies();

    if (choreographies.length === 0) {
        select.appendChild(new Option(t('mobile.choreography.empty'), ''));
        select.disabled = true;
        return;
    }

    select.disabled = false;
    choreographies.forEach(c => select.appendChild(new Option(c.name, c.id)));
}

function populatePersonFocusSelect() {
    const select = document.getElementById('mobilePersonSelect');
    if (!select) return;

    select.innerHTML = '';

    let people = State.getPeople();
    const restricted = !Auth.canDesign();

    if (restricted) {
        const choreoId = State.getCurrentChoreographyId();
        // A mapping with no choreography set applies to every choreography.
        const allowedIds = new Set(
            State.getUserMappings()
                .filter(m => m.choreographyId == null || m.choreographyId === choreoId)
                .map(m => m.personId)
        );
        people = people.filter(p => allowedIds.has(p.id));
    }

    const placeholderKey = (restricted && people.length === 0) ? 'mobile.person.empty' : 'mobile.person.none';
    select.appendChild(new Option(t(placeholderKey), ''));
    people.forEach(p => select.appendChild(new Option(p.name, p.id)));

    State.setFocusPersonId(null);
    select.value = '';
    resetZoom();

    // A ROLE_USER mapped to exactly one person should land on their own
    // route without an extra tap.
    if (restricted && people.length === 1) {
        select.value = String(people[0].id);
        onPersonFocusChange();
    }
}

async function selectChoreography(id) {
    await loadChoreographyFromItem(id);
    const select = document.getElementById('mobileChoreographySelect');
    if (select) select.value = String(id);
    populatePersonFocusSelect();
}

async function bootMobileApp(projectId) {
    initializeStage();
    drawGrid(getGridLayer(), null, null, true);

    if (!Auth.canDesign()) {
        try {
            const mappings = await Api.fetchUserMappings();
            State.setUserMappings(mappings);
        } catch (error) {
            console.error('Error fetching mappings:', error);
        }
    }

    await loadPeople(projectId);
    await loadChoreographyList();
    populateChoreographySelect();

    const choreographies = State.getChoreographies();
    if (choreographies.length > 0) {
        await selectChoreography(choreographies[0].id);
    } else {
        populatePersonFocusSelect();
    }

    setupMobileEventListeners();
}

// ============= Focus / camera =============

function onPersonFocusChange() {
    const select = document.getElementById('mobilePersonSelect');
    const raw = select ? select.value : '';
    const id = raw ? parseInt(raw, 10) : null;

    State.setFocusPersonId(id);

    if (id === null) {
        resetZoom();
        return;
    }

    const person = State.getPersonById(id);
    if (person) focusOnContentPoint(person.circle.x(), person.circle.y(), FOCUS_ZOOM);
}

// ============= Language =============

function updateLanguageButtonLabel() {
    const btn = document.getElementById('mobileLanguageToggle');
    if (btn) btn.textContent = getCurrentLocale().toUpperCase();
}

// ============= Event wiring =============

function setupMobileEventListeners() {
    document.getElementById('mobileChoreographySelect')?.addEventListener('change', (e) => {
        const id = parseInt(e.target.value, 10);
        if (!isNaN(id)) selectChoreography(id);
    });

    document.getElementById('mobilePersonSelect')?.addEventListener('change', onPersonFocusChange);

    document.getElementById('playPause')?.addEventListener('click', togglePlayPause);

    document.getElementById('stop')?.addEventListener('click', () => {
        stopAnimation();
        const focusId = State.getFocusPersonId();
        if (focusId !== null) {
            const person = State.getPersonById(focusId);
            if (person) keepContentPointVisible(person.circle.x(), person.circle.y());
        }
    });

    document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
        Auth.logout();
        State.resetAllState();
        window.location.href = 'index.html';
    });

    document.getElementById('mobileLanguageToggle')?.addEventListener('click', async () => {
        const next = getCurrentLocale() === 'en' ? 'it' : 'en';
        await setLocale(next);
        updateLanguageButtonLabel();
    });

    window.addEventListener('canvas:resetPositions', () => {
        resetPositions();
    });

    // stage.js dispatches this on viewport resize regardless of which page
    // hosts it; mirrors main.js's listener but intentionally duplicated
    // rather than shared, to keep this file dependency-free of main.js.
    window.addEventListener('stageResize', (event) => {
        const { gridSize, oldGridSize } = event.detail;

        const gridLayer = getGridLayer();
        if (gridLayer) {
            drawGrid(gridLayer, gridSize, null, true);
        }

        const routes = State.getRoutes();
        const oldScaleFactor = oldGridSize / DEFAULT_GRID_SIZE;
        const newScaleFactor = gridSize / DEFAULT_GRID_SIZE;
        const scaledRoutes = {};

        Object.keys(routes).forEach(personId => {
            const route = routes[personId];
            scaledRoutes[personId] = route.map(point => ({
                x: (point.x / oldScaleFactor) * newScaleFactor,
                y: (point.y / oldScaleFactor) * newScaleFactor
            }));
        });

        State.setRoutes(scaledRoutes);
        resetPositions();
    });
}

// ============= DOM Ready =============

document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    updateLanguageButtonLabel();

    if (!Auth.restoreAuth()) {
        window.location.href = 'index.html';
        return;
    }

    const projectId = State.restoreProjectId();
    if (!projectId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        await bootMobileApp(projectId);
    } finally {
        document.getElementById('mobileLoadingScreen')?.classList.add('hidden');
    }
});
