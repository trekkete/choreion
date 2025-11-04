/**
 * Canvas Stage Module
 * Handles Konva.js stage and layer initialization with responsive sizing
 */

import { GRID_SIZE, getResponsiveGridSize, DEFAULT_GRID_SIZE } from '../constants.js';

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
 * Always scales relative to DEFAULT_GRID_SIZE (800px) as the reference point
 */
export function resizeStage() {
    if (!stage) return;

    const newGridSize = getResponsiveGridSize();

    // Only resize if size actually changed
    if (newGridSize === currentGridSize) return;

    const oldGridSize = currentGridSize;
    currentGridSize = newGridSize;

    // Always calculate scale factor relative to DEFAULT_GRID_SIZE
    const scaleFactor = newGridSize / DEFAULT_GRID_SIZE;

    // Update stage size
    stage.width(newGridSize);
    stage.height(newGridSize);

    // Scale all existing elements on the layers relative to DEFAULT_GRID_SIZE
    layer.children.forEach(child => {
        // Get original position/size (stored relative to DEFAULT_GRID_SIZE)
        const originalX = child.attrs.originalX !== undefined ? child.attrs.originalX : child.x() / (oldGridSize / DEFAULT_GRID_SIZE);
        const originalY = child.attrs.originalY !== undefined ? child.attrs.originalY : child.y() / (oldGridSize / DEFAULT_GRID_SIZE);

        // Store original values for future resizes
        child.attrs.originalX = originalX;
        child.attrs.originalY = originalY;

        // Apply new scale
        child.x(originalX * scaleFactor);
        child.y(originalY * scaleFactor);

        // Scale circles (person circles)
        if (child.radius) {
            const originalRadius = child.attrs.originalRadius !== undefined ? child.attrs.originalRadius : child.radius() / (oldGridSize / DEFAULT_GRID_SIZE);
            child.attrs.originalRadius = originalRadius;
            child.radius(originalRadius * scaleFactor);
        }

        // Scale text labels
        if (child.fontSize) {
            const originalFontSize = child.attrs.originalFontSize !== undefined ? child.attrs.originalFontSize : child.fontSize() / (oldGridSize / DEFAULT_GRID_SIZE);
            child.attrs.originalFontSize = originalFontSize;
            child.fontSize(originalFontSize * scaleFactor);
        }
    });

    // Dispatch custom event for other modules to react
    // This will trigger route coordinate scaling and grid redraw
    window.dispatchEvent(new CustomEvent('stageResize', {
        detail: {
            gridSize: newGridSize,
            oldGridSize: oldGridSize,
            scaleFactor
        }
    }));

    // Redraw layers
    gridLayer.batchDraw();
    layer.batchDraw();
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
