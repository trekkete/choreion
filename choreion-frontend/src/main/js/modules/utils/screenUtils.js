/**
 * Screen Utilities
 * Helper functions for managing screen visibility and device detection
 */

// Breakpoint constants (in pixels)
export const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1025
};

/**
 * Check if current device is mobile (screen width < 768px)
 * @returns {boolean}
 */
export function isMobile() {
    return window.innerWidth < BREAKPOINTS.MOBILE;
}

/**
 * Check if current device is tablet (screen width between 768px and 1024px)
 * @returns {boolean}
 */
export function isTablet() {
    return window.innerWidth >= BREAKPOINTS.MOBILE && window.innerWidth < BREAKPOINTS.DESKTOP;
}

/**
 * Check if current device is desktop (screen width >= 1025px)
 * @returns {boolean}
 */
export function isDesktop() {
    return window.innerWidth >= BREAKPOINTS.DESKTOP;
}

/**
 * Get viewport dimensions
 * @returns {{width: number, height: number}}
 */
export function getViewportDimensions() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

/**
 * Check if device is in portrait orientation
 * @returns {boolean}
 */
export function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

/**
 * Check if device is in landscape orientation
 * @returns {boolean}
 */
export function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

/**
 * Check if device is touch-enabled
 * @returns {boolean}
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get device type as string
 * @returns {'mobile'|'tablet'|'desktop'}
 */
export function getDeviceType() {
    if (isMobile()) return 'mobile';
    if (isTablet()) return 'tablet';
    return 'desktop';
}

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
