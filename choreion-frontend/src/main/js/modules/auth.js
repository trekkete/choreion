/**
 * Authentication module
 * Handles user authentication, token management, and role-based permissions
 */

import * as Api from './api/index.js';

let authToken = null;
let currentUser = null;

/**
 * Login with username and password
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<boolean>} Success status
 */
export async function login(username, password) {
    try {
        const data = await Api.login(username, password);
        authToken = data.token;
        currentUser = data;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

/**
 * Logout and clear authentication data
 */
export function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentProjectId');
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
    return authToken !== null && currentUser !== null;
}

/**
 * Get current auth token
 * @returns {string|null} Auth token
 */
export function getAuthToken() {
    return authToken;
}

/**
 * Get current user
 * @returns {Object|null} Current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Restore authentication from localStorage
 * @returns {boolean} Success status
 */
export function restoreAuth() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

// ============= Role-based permissions =============

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} Has role
 */
export function hasRole(role) {
    return currentUser && currentUser.roles && currentUser.roles.includes(role);
}

/**
 * Check if user is a regular user
 * @returns {boolean}
 */
export function isUser() {
    return hasRole('ROLE_USER');
}

/**
 * Check if user is a choreographer
 * @returns {boolean}
 */
export function isChoreographer() {
    return hasRole('ROLE_CHOREOGRAPHER');
}

/**
 * Check if user is an admin
 * @returns {boolean}
 */
export function isAdmin() {
    return hasRole('ROLE_ADMIN');
}

/**
 * Check if user can design choreographies
 * @returns {boolean}
 */
export function canDesign() {
    return isChoreographer() || isAdmin();
}
