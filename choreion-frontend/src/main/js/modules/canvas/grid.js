/**
 * Grid Module
 * Handles grid drawing on the canvas with responsive sizing
 */

import { GRID_SIZE, GRID_SPACING, VERT_OFFSET, HORIZ_OFFSET, getResponsiveGridSize, getResponsiveGridSpacing } from '../constants.js';
import { getCurrentGridSize } from './stage.js';

/**
 * Draw grid on the grid layer
 * @param {Konva.Layer} gridLayer - The grid layer
 * @param {number} gridSize - Optional grid size (uses current grid size if not provided)
 * @param {number} gridSpacing - Optional grid spacing (calculated if not provided)
 */
export function drawGrid(gridLayer, gridSize = null, gridSpacing = null, gridVisible = true) {
    if (!gridLayer) return;

    // Use provided sizes or get current sizes
    const actualGridSize = gridSize || getCurrentGridSize() || GRID_SIZE;
    const actualGridSpacing = gridSpacing || getResponsiveGridSpacing(actualGridSize);

    // Clear existing grid
    gridLayer.destroyChildren();

    if (!gridVisible) {
        // Show only the border and the two red center lines
        gridLayer.add(new Konva.Rect({
            x: 0, y: 0,
            width: actualGridSize, height: actualGridSize,
            stroke: '#333', strokeWidth: 2,
            fill: 'transparent', listening: false
        }));
        gridLayer.add(new Konva.Line({
            points: [actualGridSize / 2, 0, actualGridSize / 2, actualGridSize],
            stroke: '#f00', strokeWidth: 2, listening: false
        }));
        gridLayer.add(new Konva.Line({
            points: [0, 10 * actualGridSpacing, actualGridSize, 10 * actualGridSpacing],
            stroke: '#f00', strokeWidth: 2, listening: false
        }));
        gridLayer.batchDraw();
        return;
    }

    // Calculate center line position
    const centerLine = actualGridSize / 2;

    for (let i = 0; i <= actualGridSize; i += actualGridSpacing) {
        // Vertical lines
        const isVerticalCenter = (i === centerLine);
        const isVerticalMajor = ((i + (VERT_OFFSET * actualGridSpacing)) % (actualGridSpacing * 4)) === 0;
        gridLayer.add(new Konva.Line({
            points: [i, 0, i, actualGridSize],
            stroke: isVerticalCenter ? '#f00' : (isVerticalMajor ? '#333' : '#ddd'),
            strokeWidth: isVerticalCenter ? 2 : 1
        }));

        // Horizontal lines
        const isHorizontalCenter = (i / actualGridSpacing == 10);
        const isHorizontalMajor = ((i + (HORIZ_OFFSET * actualGridSpacing)) % (actualGridSpacing * 4)) === 0;
        gridLayer.add(new Konva.Line({
            points: [0, i, actualGridSize, i],
            stroke: isHorizontalCenter ? '#f00' : (isHorizontalMajor ? '#333' : '#ddd'),
            strokeWidth: isHorizontalCenter ? 2 : 1
        }));
    }

    gridLayer.batchDraw();
}
