/**
 * Canvas Stage Module
 * Handles Konva.js stage and layer initialization
 */

import { GRID_SIZE } from '../constants.js';

let stage = null;
let layer = null;
let gridLayer = null;

/**
 * Initialize the Konva stage and layers
 * @returns {Object} Stage and layers
 */
export function initializeStage() {
    if (stage) {
        // Already initialized
        return { stage, layer, gridLayer };
    }

    stage = new Konva.Stage({
        container: 'container',
        width: GRID_SIZE,
        height: GRID_SIZE
    });

    gridLayer = new Konva.Layer();
    layer = new Konva.Layer();

    stage.add(gridLayer);
    stage.add(layer);

    return { stage, layer, gridLayer };
}

/**
 * Get the current stage
 * @returns {Konva.Stage} Stage instance
 */
export function getStage() {
    return stage;
}

/**
 * Get the main layer
 * @returns {Konva.Layer} Layer instance
 */
export function getLayer() {
    return layer;
}

/**
 * Get the grid layer
 * @returns {Konva.Layer} Grid layer instance
 */
export function getGridLayer() {
    return gridLayer;
}
