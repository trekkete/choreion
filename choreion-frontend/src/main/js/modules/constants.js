import { isMobile, isTablet, getViewportDimensions } from './utils/screenUtils.js';

export const API_BASE_URL = 'http://localhost:8080/api';

// Default grid size for desktop
export const DEFAULT_GRID_SIZE = 800;
export const DEFAULT_GRID_SPACING = 20;
export const DEFAULT_PERSON_RADIUS = 10;

// Legacy exports (kept for backward compatibility during migration)
export const GRID_SIZE = 800;
export const GRID_SPACING = 20;
export const PERSON_RADIUS = 10;
export const VERT_OFFSET = 0;
export const HORIZ_OFFSET = 2;

// Mobile-specific constants
export const MOBILE_PADDING = 20; // Padding on mobile devices
export const TABLET_PADDING = 40; // Padding on tablets
export const DESKTOP_PADDING = 0; // No padding on desktop (canvas is fixed)

// Touch target minimum size (44x44px recommended by Apple/Google)
export const MIN_TOUCH_TARGET = 44;

// Responsive grid size calculation
/**
 * Calculate grid size based on viewport
 * Ensures grid size creates a symmetrical grid with center line
 * @returns {number} Grid size in pixels
 */
export function getResponsiveGridSize() {
    const { width, height } = getViewportDimensions();

    let targetSize;

    if (isMobile()) {
        // Mobile: Use viewport width minus padding, make it square
        const availableWidth = width - (MOBILE_PADDING * 2);
        const availableHeight = height - 300; // Reserve space for header/controls
        targetSize = Math.min(availableWidth, availableHeight, 600); // Max 600px on mobile
    } else if (isTablet()) {
        // Tablet: Use 70% of available space or 800px max
        const availableWidth = (width * 0.7) - (TABLET_PADDING * 2);
        targetSize = Math.min(availableWidth, DEFAULT_GRID_SIZE);
    } else {
        // Desktop: Use default fixed size (800 = 40 cells * 20px spacing)
        return DEFAULT_GRID_SIZE;
    }

    // Round to nearest multiple of DEFAULT_GRID_SPACING
    let numCells = Math.round(targetSize / DEFAULT_GRID_SPACING);

    // Ensure EVEN number of cells for symmetry around center line
    // Center line is at gridSize / 2, which needs to fall on a grid line
    if (numCells % 2 !== 0) {
        numCells = numCells - 1; // Make it even (round down for better fit)
    }

    const gridSize = numCells * DEFAULT_GRID_SPACING;

    // Ensure minimum size (at least 20 cells = 400px for usable canvas)
    return Math.max(gridSize, DEFAULT_GRID_SPACING * 20);
}

/**
 * Calculate grid spacing based on grid size
 * @param {number} gridSize - Current grid size
 * @returns {number} Grid spacing in pixels
 */
export function getResponsiveGridSpacing(gridSize) {
    // Scale spacing proportionally to grid size
    const scaleFactor = gridSize / DEFAULT_GRID_SIZE;
    return Math.max(5, Math.round(DEFAULT_GRID_SPACING * scaleFactor));
}

/**
 * Calculate person radius based on grid size
 * @param {number} gridSize - Current grid size
 * @returns {number} Person radius in pixels
 */
export function getResponsivePersonRadius(gridSize) {
    // Scale person radius proportionally to grid size relative to DEFAULT_GRID_SIZE
    const scaleFactor = gridSize / DEFAULT_GRID_SIZE;
    return Math.max(3, Math.round(DEFAULT_PERSON_RADIUS * scaleFactor));
}