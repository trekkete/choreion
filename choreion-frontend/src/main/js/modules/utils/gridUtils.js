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

/**
 * Sample n evenly-spaced points along a polyline by arc length.
 * @param {Array<{x:number,y:number}>} points
 * @param {number} n
 * @returns {Array<{x:number,y:number}>}
 */
export function samplePathUniform(points, n) {
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
        while (segIdx < lengths.length - 1 && lengths[segIdx] < targetLen) segIdx++;
        const segStart = lengths[segIdx - 1];
        const segEnd = lengths[segIdx];
        const ratio = segEnd === segStart ? 0 : (targetLen - segStart) / (segEnd - segStart);
        const x = points[segIdx - 1].x + ratio * (points[segIdx].x - points[segIdx - 1].x);
        const y = points[segIdx - 1].y + ratio * (points[segIdx].y - points[segIdx - 1].y);
        result.push({ x: snapToGrid(x), y: snapToGrid(y) });
    }
    return result;
}
