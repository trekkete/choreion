/**
 * Screen Utilities
 * Helper functions for managing screen visibility
 */

/**
 * Show login screen
 */
export function showLoginScreen() {
    document.getElementById('loadingScreen')?.classList.add('hidden');
    document.getElementById('loginScreen')?.classList.remove('hidden');
    document.getElementById('projectSelectionScreen')?.classList.add('hidden');
    document.getElementById('appContainer')?.classList.add('hidden');
}

/**
 * Show project selection screen
 */
export function showProjectSelection() {
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('projectSelectionScreen')?.classList.remove('hidden');
    document.getElementById('appContainer')?.classList.add('hidden');
}

/**
 * Show main app screen
 * @param {Object} user - Current user
 */
export function showApp(user) {
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('projectSelectionScreen')?.classList.add('hidden');
    document.getElementById('appContainer')?.classList.remove('hidden');

    const userFullNameEl = document.getElementById('userFullName');
    if (userFullNameEl && user) {
        userFullNameEl.textContent = user.fullName || user.username;
    }
}
