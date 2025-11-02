/**
 * Grid Module
 * Handles grid drawing on the canvas
 */

import { GRID_SIZE, GRID_SPACING, VERT_OFFSET, HORIZ_OFFSET } from '../constants.js';

/**
 * Draw grid on the grid layer
 * @param {Konva.Layer} gridLayer - The grid layer
 */
export function drawGrid(gridLayer) {
    if (!gridLayer) return;

    for (let i = 0; i <= GRID_SIZE; i += GRID_SPACING) {
        gridLayer.add(new Konva.Line({
            points: [i, 0, i, GRID_SIZE],
            stroke: ((GRID_SIZE / i) == 2) ? '#f00' : (((i + (VERT_OFFSET * GRID_SPACING)) % (GRID_SPACING * 4)) == 0 ? '#333' : '#ddd'),
            strokeWidth: 1
        }));
        gridLayer.add(new Konva.Line({
            points: [0, i, GRID_SIZE, i],
            stroke: (i / (GRID_SPACING * 4)) == 2.5 ? '#f00' : (((i + (HORIZ_OFFSET * GRID_SPACING)) % (GRID_SPACING * 4)) == 0 ? '#333' : '#ddd'),
            strokeWidth: 1
        }));
    }
}
