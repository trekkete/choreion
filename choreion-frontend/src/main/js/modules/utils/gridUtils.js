/**
 * Grid Utilities
 * Helper functions for grid calculations
 */

import { GRID_SPACING } from '../constants.js';
import { getSnapToGrid } from '../state.js';

/**
 * Snap a value to the grid
 * @param {number} val - Value to snap
 * @returns {number} Snapped value
 */
export function snapToGrid(val) {
    if (getSnapToGrid()) {
        return Math.round(val / GRID_SPACING) * GRID_SPACING;
    }
    return val;
}
