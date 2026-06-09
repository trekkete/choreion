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

// Zoom and pan state
let currentZoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

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

    // Enable dragging for panning (will be controlled by mode)
    setupZoomAndPan();

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
 * Setup zoom and pan functionality for the stage
 */
function setupZoomAndPan() {
    if (!stage) return;

    // Enable stage dragging for panning
    stage.draggable(true);

    // Constrain panning using dragmove event
    stage.on('dragmove', function() {
        const wrapper = document.querySelector('.canvas-wrapper');
        if (!wrapper) return;

        const viewportWidth = wrapper.clientWidth;
        const viewportHeight = wrapper.clientHeight;
        const stageWidth = stage.width();
        const stageHeight = stage.height();
        const scale = currentZoom;
        const pos = stage.position();

        // Calculate scaled dimensions
        const scaledWidth = stageWidth * scale;
        const scaledHeight = stageHeight * scale;

        // Calculate center position (accounts for Konva scaling from top-left)
        // To keep the grid center visible when scaling
        const centerX = (stageWidth / 2) * (1 - scale);
        const centerY = (stageHeight / 2) * (1 - scale);

        let newX, newY;

        // Handle X-axis bounds
        if (scaledWidth <= viewportWidth) {
            // Stage fits within viewport - keep centered
            newX = centerX;
        } else {
            // Stage is larger - allow panning with bounds
            // Account for flexbox centering of #container within .canvas-wrapper
            const containerOffsetX = (viewportWidth - stageWidth) / 2;
            const maxX = -containerOffsetX; // Left edge visible at viewport left
            const minX = viewportWidth - scaledWidth - containerOffsetX; // Right edge visible at viewport right
            newX = Math.max(minX, Math.min(maxX, pos.x));
        }

        // Handle Y-axis bounds
        if (scaledHeight <= viewportHeight) {
            // Stage fits within viewport - keep centered
            newY = centerY;
        } else {
            // Stage is larger - allow panning with bounds
            const containerOffsetY = (viewportHeight - stageHeight) / 2;
            const maxY = -containerOffsetY; // Top edge visible at viewport top
            const minY = viewportHeight - scaledHeight - containerOffsetY; // Bottom edge visible at viewport bottom
            newY = Math.max(minY, Math.min(maxY, pos.y));
        }

        // Apply constrained position
        stage.position({ x: newX, y: newY });
    });

    // Pinch-to-zoom for touch devices
    let lastDist = 0;
    let lastCenter = null;

    stage.on('touchmove', function (e) {
        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        if (touch1 && touch2) {
            // Disable dragging when using pinch gesture
            stage.draggable(false);

            // Calculate distance between two touches
            const dist = getDistance({
                x: touch1.clientX,
                y: touch1.clientY
            }, {
                x: touch2.clientX,
                y: touch2.clientY
            });

            if (!lastDist) {
                lastDist = dist;
            }

            // Calculate center point between touches
            const center = getCenter({
                x: touch1.clientX,
                y: touch1.clientY
            }, {
                x: touch2.clientX,
                y: touch2.clientY
            });

            // Calculate new scale
            const pointTo = {
                x: (center.x - stage.x()) / currentZoom,
                y: (center.y - stage.y()) / currentZoom,
            };

            const scale = (dist / lastDist) * currentZoom;
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));

            setZoom(newZoom, pointTo);

            lastDist = dist;
            lastCenter = center;
        }
    });

    stage.on('touchend', function () {
        lastDist = 0;
        lastCenter = null;
        stage.draggable(panEnabled);
    });

    // Mouse wheel zoom for desktop (useful for testing)
    stage.on('wheel', (e) => {
        e.evt.preventDefault();

        const oldZoom = currentZoom;
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldZoom,
            y: (pointer.y - stage.y()) / oldZoom,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + direction * ZOOM_STEP));

        setZoom(newZoom, mousePointTo);
    });
}

/**
 * Calculate distance between two points
 */
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate center point between two points
 */
function getCenter(p1, p2) {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    };
}

/**
 * Constrain stage position to stay within bounds
 */
function constrainStageBounds() {
    if (!stage) return;

    const wrapper = document.querySelector('.canvas-wrapper');
    if (!wrapper) return;

    const viewportWidth = wrapper.clientWidth;
    const viewportHeight = wrapper.clientHeight;
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const scale = currentZoom;
    const pos = stage.position();

    // Calculate scaled dimensions
    const scaledWidth = stageWidth * scale;
    const scaledHeight = stageHeight * scale;

    // Calculate center position (accounts for Konva scaling from top-left)
    const centerX = (stageWidth / 2) * (1 - scale);
    const centerY = (stageHeight / 2) * (1 - scale);

    let newX, newY;

    // Handle X-axis bounds
    if (scaledWidth <= viewportWidth) {
        // Stage fits within viewport - keep centered
        newX = centerX;
    } else {
        // Stage is larger - allow panning with bounds
        const containerOffsetX = (viewportWidth - stageWidth) / 2;
        const maxX = -containerOffsetX;
        const minX = viewportWidth - scaledWidth - containerOffsetX;
        newX = Math.max(minX, Math.min(maxX, pos.x));
    }

    // Handle Y-axis bounds
    if (scaledHeight <= viewportHeight) {
        // Stage fits within viewport - keep centered
        newY = centerY;
    } else {
        // Stage is larger - allow panning with bounds
        const containerOffsetY = (viewportHeight - stageHeight) / 2;
        const maxY = -containerOffsetY;
        const minY = viewportHeight - scaledHeight - containerOffsetY;
        newY = Math.max(minY, Math.min(maxY, pos.y));
    }

    stage.position({ x: newX, y: newY });
}

/**
 * Set zoom level with optional center point
 * @param {number} newZoom - New zoom level
 * @param {Object} centerPoint - Optional center point {x, y}
 */
export function setZoom(newZoom, centerPoint = null) {
    if (!stage) return;

    const oldZoom = currentZoom;
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

    if (centerPoint) {
        const newPos = {
            x: centerPoint.x * currentZoom,
            y: centerPoint.y * currentZoom,
        };

        stage.position({
            x: -(newPos.x - (centerPoint.x * oldZoom - stage.x())),
            y: -(newPos.y - (centerPoint.y * oldZoom - stage.y())),
        });
    }

    stage.scale({ x: currentZoom, y: currentZoom });

    // Constrain position to stay within bounds
    constrainStageBounds();

    stage.batchDraw();

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('zoomChanged', {
        detail: { zoom: currentZoom }
    }));
}

/**
 * Zoom in by one step
 */
export function zoomIn() {
    const centerPoint = {
        x: stage.width() / 2,
        y: stage.height() / 2,
    };
    setZoom(currentZoom + ZOOM_STEP, centerPoint);
}

/**
 * Zoom out by one step
 */
export function zoomOut() {
    const centerPoint = {
        x: stage.width() / 2,
        y: stage.height() / 2,
    };
    setZoom(currentZoom - ZOOM_STEP, centerPoint);
}

/**
 * Reset zoom to 1
 */
export function resetZoom() {
    currentZoom = 1;
    if (stage) {
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();

        window.dispatchEvent(new CustomEvent('zoomChanged', {
            detail: { zoom: currentZoom }
        }));
    }
}

/**
 * Get current zoom level
 * @returns {number} Current zoom level
 */
export function getCurrentZoom() {
    return currentZoom;
}

/**
 * Enable or disable panning
 * @param {boolean} enabled - Enable panning
 */
let panEnabled = true;

export function setPanEnabled(enabled) {
    panEnabled = enabled;
    if (stage) {
        stage.draggable(enabled);
    }
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

    // Reset zoom
    currentZoom = 1;
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
