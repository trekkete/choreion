/**
 * Canvas Stage Module
 * Handles Konva.js stage and layer initialization with responsive sizing
 */

import { GRID_SIZE, getResponsiveGridSize } from '../constants.js';

let stage = null;
let layer = null;
let gridLayer = null;
let currentGridSize = GRID_SIZE;
let resizeListener = null;

/**
 * Initialize the Konva stage and layers
 * @returns {Object} Stage and layers
 */
export function initializeStage() {
    if (stage) {
        // Already initialized
        return { stage, layer, gridLayer };
    }

    // Calculate initial responsive grid size
    currentGridSize = getResponsiveGridSize();

    stage = new Konva.Stage({
        container: 'container',
        width: currentGridSize,
        height: currentGridSize
    });

    gridLayer = new Konva.Layer();
    layer = new Konva.Layer();

    stage.add(gridLayer);
    stage.add(layer);

    // Set up resize listener
    setupResizeListener();

    return { stage, layer, gridLayer };
}

/**
 * Get current grid size
 * @returns {number} Current grid size
 */
export function getCurrentGridSize() {
    return currentGridSize;
}

/**
 * Resize the stage based on current viewport
 */
export function resizeStage() {
    if (!stage) return;

    const newGridSize = getResponsiveGridSize();

    // Only resize if size actually changed
    if (newGridSize === currentGridSize) return;

    const scaleFactor = newGridSize / currentGridSize;
    currentGridSize = newGridSize;

    // Update stage size
    stage.width(newGridSize);
    stage.height(newGridSize);

    // Scale all existing elements on the layers
    layer.children.forEach(child => {
        if (child.x) child.x(child.x() * scaleFactor);
        if (child.y) child.y(child.y() * scaleFactor);
        if (child.radius) child.radius(child.radius() * scaleFactor);
    });

    // Redraw layers
    gridLayer.batchDraw();
    layer.batchDraw();

    // Dispatch custom event for other modules to react
    window.dispatchEvent(new CustomEvent('stageResize', {
        detail: { gridSize: newGridSize, scaleFactor }
    }));
}

/**
 * Setup window resize listener with debouncing
 */
function setupResizeListener() {
    let resizeTimeout;

    resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeStage();
        }, 250); // Debounce resize events
    };

    window.addEventListener('resize', resizeListener);
    window.addEventListener('orientationchange', resizeListener);
}

/**
 * Remove resize listener (cleanup)
 */
export function cleanupStage() {
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
        window.removeEventListener('orientationchange', resizeListener);
        resizeListener = null;
    }

    if (stage) {
        stage.destroy();
        stage = null;
        layer = null;
        gridLayer = null;
    }
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
