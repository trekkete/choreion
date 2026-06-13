/**
 * Grid Module
 * Handles grid drawing on the canvas with responsive sizing
 */

import { GRID_SIZE, GRID_SPACING, VERT_OFFSET, HORIZ_OFFSET, getResponsiveGridSize, getResponsiveGridSpacing } from '../constants.js';
import { getCurrentGridSize } from './stage.js';

const COLOR_MINOR_DOT  = 'rgba(0,0,0,0.18)';
const COLOR_MAJOR_LINE = 'rgba(0,0,0,0.12)';
const COLOR_AXIS       = 'rgba(52,152,219,0.55)';
const DOT_RADIUS       = 1.5;

/**
 * Draw grid on the grid layer
 * @param {Konva.Layer} gridLayer - The grid layer
 * @param {number|null} gridSize - Optional grid size (uses current grid size if not provided)
 * @param {number|null} gridSpacing - Optional grid spacing (calculated if not provided)
 * @param {boolean} gridVisible - Whether to show the full grid
 */
export function drawGrid(gridLayer, gridSize = null, gridSpacing = null, gridVisible = true) {
    if (!gridLayer) return;

    const actualGridSize    = gridSize    || getCurrentGridSize() || GRID_SIZE;
    const actualGridSpacing = gridSpacing || getResponsiveGridSpacing(actualGridSize);

    gridLayer.destroyChildren();

    const centerX = actualGridSize / 2;
    const centerY = 10 * actualGridSpacing;

    if (!gridVisible) {
        // Border + axis only
        gridLayer.add(new Konva.Rect({
            x: 0, y: 0,
            width: actualGridSize, height: actualGridSize,
            stroke: 'rgba(0,0,0,0.25)', strokeWidth: 1,
            fill: 'transparent', listening: false
        }));
        gridLayer.add(new Konva.Line({
            points: [centerX, 0, centerX, actualGridSize],
            stroke: COLOR_AXIS, strokeWidth: 2, listening: false
        }));
        gridLayer.add(new Konva.Line({
            points: [0, centerY, actualGridSize, centerY],
            stroke: COLOR_AXIS, strokeWidth: 2, listening: false
        }));
        gridLayer.batchDraw();
        return;
    }

    // Major lines (every 4 minor cells)
    for (let i = 0; i <= actualGridSize; i += actualGridSpacing) {
        const isVertCenter   = i === centerX;
        const isHorizCenter  = (i / actualGridSpacing) === 10;
        const isVertMajor    = ((i + VERT_OFFSET  * actualGridSpacing) % (actualGridSpacing * 4)) === 0;
        const isHorizMajor   = ((i + HORIZ_OFFSET * actualGridSpacing) % (actualGridSpacing * 4)) === 0;

        if (isVertCenter) {
            gridLayer.add(new Konva.Line({
                points: [i, 0, i, actualGridSize],
                stroke: COLOR_AXIS, strokeWidth: 2, listening: false
            }));
        } else if (isVertMajor) {
            gridLayer.add(new Konva.Line({
                points: [i, 0, i, actualGridSize],
                stroke: COLOR_MAJOR_LINE, strokeWidth: 1, listening: false
            }));
        }

        if (isHorizCenter) {
            gridLayer.add(new Konva.Line({
                points: [0, i, actualGridSize, i],
                stroke: COLOR_AXIS, strokeWidth: 2, listening: false
            }));
        } else if (isHorizMajor) {
            gridLayer.add(new Konva.Line({
                points: [0, i, actualGridSize, i],
                stroke: COLOR_MAJOR_LINE, strokeWidth: 1, listening: false
            }));
        }
    }

    // Minor dots at every intersection (skip intersections that fall on a major line)
    for (let x = 0; x <= actualGridSize; x += actualGridSpacing) {
        const onVertMajor  = x === centerX ||
            ((x + VERT_OFFSET * actualGridSpacing) % (actualGridSpacing * 4)) === 0;

        for (let y = 0; y <= actualGridSize; y += actualGridSpacing) {
            const onHorizMajor = (y / actualGridSpacing) === 10 ||
                ((y + HORIZ_OFFSET * actualGridSpacing) % (actualGridSpacing * 4)) === 0;

            if (onVertMajor || onHorizMajor) continue;

            gridLayer.add(new Konva.Circle({
                x, y,
                radius: DOT_RADIUS,
                fill: COLOR_MINOR_DOT,
                listening: false
            }));
        }
    }

    // Outer border
    gridLayer.add(new Konva.Rect({
        x: 0, y: 0,
        width: actualGridSize, height: actualGridSize,
        stroke: 'rgba(0,0,0,0.2)', strokeWidth: 1,
        fill: 'transparent', listening: false
    }));

    gridLayer.batchDraw();
}
