/**
 * Application State Management
 * Centralized state for the application
 */

// ============= Project State =============
let currentProjectId = null;
let projects = [];

export function setCurrentProjectId(projectId) {
    currentProjectId = projectId;
    if (projectId) {
        localStorage.setItem('currentProjectId', projectId);
    } else {
        localStorage.removeItem('currentProjectId');
    }
}

export function getCurrentProjectId() {
    return currentProjectId;
}

export function restoreProjectId() {
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId) {
        currentProjectId = parseInt(savedProjectId);
    }
    return currentProjectId;
}

export function setProjects(projectsList) {
    projects = projectsList;
}

export function getProjects() {
    return projects;
}

export function getProjectById(projectId) {
    return projects.find(p => p.id === projectId);
}

// ============= Choreography State =============
let currentChoreographyId = null;
let currentChoreographySteps = 8;
let choreographies = [];
let currentBPM = 165;

export function setCurrentChoreographyId(id) {
    currentChoreographyId = id;
}

export function getCurrentChoreographyId() {
    return currentChoreographyId;
}

export function setCurrentChoreographySteps(steps) {
    currentChoreographySteps = steps;
}

export function getCurrentChoreographySteps() {
    return currentChoreographySteps;
}

export function setChoreographies(choreographiesList) {
    choreographies = choreographiesList;
}

export function getChoreographies() {
    return choreographies;
}

export function setCurrentBPM(bpm) {
    currentBPM = bpm;
}

export function getCurrentBPM() {
    return currentBPM;
}

// ============= People State =============
let people = [];
let routes = {};

export function setPeople(peopleList) {
    people = peopleList;
}

export function getPeople() {
    return people;
}

export function addPersonToState(person) {
    people.push(person);
}

export function removePersonFromState(index) {
    const removed = people.splice(index, 1)[0];
    if (removed) {
        delete routes[removed.id];
    }
    return removed;
}

export function getPersonById(id) {
    return people.find(p => p.id === id);
}

export function getPersonByIndex(index) {
    return people[index];
}

export function clearPeople() {
    people = [];
}

// ============= Routes State =============
export function setRoutes(routesData) {
    routes = routesData;
}

export function getRoutes() {
    return routes;
}

export function getRouteForPerson(personId) {
    return routes[personId] || [];
}

export function setRouteForPerson(personId, route) {
    routes[personId] = route;
}

export function clearRouteForPerson(personId) {
    routes[personId] = [];
}

export function clearAllRoutes() {
    people.forEach(person => {
        routes[person.id] = [];
    });
}

// ============= Mode State =============
// Import isMobile to set default mode based on device
import { isMobile } from './utils/screenUtils.js';

// Default mode: playback on mobile, design on desktop
let mode = isMobile() ? 'playback' : 'design';

export function setMode(newMode) {
    mode = newMode;
}

export function getMode() {
    return mode;
}

export function isDesignMode() {
    return mode === 'design';
}

export function isPlaybackMode() {
    return mode === 'playback';
}

// ============= Input Mode State =============
let inputMode = 'click'; // 'click' | 'draw'

export function setInputMode(newInputMode) {
    inputMode = newInputMode;
}

export function getInputMode() {
    return inputMode;
}

// ============= Grid Visibility State =============
let gridVisible = true;

export function setGridVisible(visible) {
    gridVisible = visible;
}

export function getGridVisible() {
    return gridVisible;
}

export function toggleGridVisible() {
    gridVisible = !gridVisible;
    return gridVisible;
}

// ============= Selection State =============
let selectedPerson = null;

export function setSelectedPerson(personData) {
    selectedPerson = personData;
}

export function getSelectedPerson() {
    return selectedPerson;
}

export function clearSelectedPerson() {
    selectedPerson = null;
}

// ============= Animation State =============
let isPlaying = false;
let animationTime = 0;
let lastTime = null;
let animationFrame = null;

export function setIsPlaying(playing) {
    isPlaying = playing;
}

export function getIsPlaying() {
    return isPlaying;
}

export function setAnimationTime(time) {
    animationTime = time;
}

export function getAnimationTime() {
    return animationTime;
}

export function setLastTime(time) {
    lastTime = time;
}

export function getLastTime() {
    return lastTime;
}

export function setAnimationFrame(frame) {
    animationFrame = frame;
}

export function getAnimationFrame() {
    return animationFrame;
}

export function resetAnimationState() {
    isPlaying = false;
    animationTime = 0;
    lastTime = null;
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        //animationFrame = null;
    }
}

// ============= User Mappings State =============
let userMappings = [];

export function setUserMappings(mappings) {
    userMappings = mappings;
}

export function getUserMappings() {
    return userMappings;
}

// ============= Unsaved Changes State =============
let hasUnsavedChanges = false;

export function setHasUnsavedChanges(value) {
    hasUnsavedChanges = value;
}

export function getHasUnsavedChanges() {
    return hasUnsavedChanges;
}

// ============= Grid Settings State =============
let snapToGridEnabled = false;

export function setSnapToGrid(enabled) {
    snapToGridEnabled = enabled;
}

export function getSnapToGrid() {
    return snapToGridEnabled;
}

export function toggleSnapToGrid() {
    snapToGridEnabled = !snapToGridEnabled;
    return snapToGridEnabled;
}

// ============= Reset Functions =============
export function resetProjectState() {
    currentProjectId = null;
    localStorage.removeItem('currentProjectId');
    hasUnsavedChanges = false;
    people = [];
    routes = {};
    choreographies = [];
    selectedPerson = null;
    currentChoreographyId = null;
}

export function resetAllState() {
    resetProjectState();
    projects = [];
    userMappings = [];
}
