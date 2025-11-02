/**
 * Status Message UI Module
 * Handles displaying status messages to the user
 */

/**
 * Show a status message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 */
export function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    setTimeout(() => {
        statusEl.className = 'status';
    }, 3000);
}

/**
 * Show admin panel status message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 */
export function showAdminStatus(message, type = 'info') {
    const statusEl = document.getElementById('adminCreateStatus');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    setTimeout(() => {
        statusEl.className = 'status';
    }, 3000);
}

/**
 * Show mapping status message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 */
export function showMappingStatus(message, type = 'info') {
    const statusEl = document.getElementById('adminMappingStatus');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    setTimeout(() => {
        statusEl.className = 'status';
    }, 3000);
}

/**
 * Show project error message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 */
export function showProjectError(message, type = 'error') {
    const errorEl = document.getElementById('projectError');
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.className = `status ${type}`;
    errorEl.style.display = 'block';

    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 3000);
}
