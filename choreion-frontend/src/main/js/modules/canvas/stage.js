/**
 * Canvas Stage Module
 * Handles Konva.js stage and layer initialization with responsive sizing
 */

import { GRID_SIZE, getResponsiveGridSize, DEFAULT_GRID_SIZE, getResponsiveGridSpacing } from '../constants.js';

let stage     = null;
let layer     = null;
let gridLayer = null;
let currentGridSize = GRID_SIZE;
let resizeListener  = null;
let resizeObserver  = null;

// Zoom state
let currentZoom = 1;
const MAX_ZOOM         = 6;
const ZOOM_FACTOR      = 1.12;   // multiplicative step — smoother than additive
const ZOOM_OUT_MARGIN  = 0.92;   // at min zoom, the grid still fills ~92% of the limiting viewport dimension

/**
 * The most you're allowed to zoom out: just enough that the grid still
 * fills the viewport with a small margin, rather than shrinking into a
 * tiny square surrounded by empty canvas.
 */
function getMinZoom() {
    if (!stage) return 1;
    const fitScale = Math.min(stage.width(), stage.height()) / currentGridSize;
    return Math.min(1, fitScale) * ZOOM_OUT_MARGIN;
}

/**
 * The position that centers the grid inside the stage at scale=1.
 * Using stage.position() for centering (not CSS) keeps the Konva
 * coordinate system self-consistent: content coords are always in
 * [0, gridSize] regardless of viewport size.
 */
function getCenteredPosition() {
    return {
        x: (stage.width()  - currentGridSize) / 2,
        y: (stage.height() - currentGridSize) / 2,
    };
}

/**
 * Clamp a candidate stage position at a given scale so the grid can
 * never be panned past its own edges. When the scaled grid is smaller
 * than the viewport on an axis, that axis is locked centered (nothing
 * to pan there); otherwise the position is clamped so the grid always
 * fully covers the viewport on that axis.
 */
function getClampedPosition(pos, scale) {
    const scaledGrid = currentGridSize * scale;
    const stageW = stage.width();
    const stageH = stage.height();

    let x;
    if (scaledGrid <= stageW) {
        x = (stageW - scaledGrid) / 2;
    } else {
        x = Math.min(0, Math.max(stageW - scaledGrid, pos.x));
    }

    let y;
    if (scaledGrid <= stageH) {
        y = (stageH - scaledGrid) / 2;
    } else {
        y = Math.min(0, Math.max(stageH - scaledGrid, pos.y));
    }

    return { x, y };
}

/**
 * Initialize the Konva stage and layers.
 * Stage fills the canvas-wrapper; grid is centered via stage.position().
 */
export function initializeStage() {
    if (stage) return { stage, layer, gridLayer };

    currentGridSize = getResponsiveGridSize();

    const wrapper     = document.querySelector('.canvas-wrapper');
    const stageWidth  = wrapper ? wrapper.clientWidth  : currentGridSize;
    const stageHeight = wrapper ? wrapper.clientHeight : currentGridSize;

    stage = new Konva.Stage({
        container: 'container',
        width:  stageWidth,
        height: stageHeight,
    });

    gridLayer = new Konva.Layer();
    layer     = new Konva.Layer();
    stage.add(gridLayer);
    stage.add(layer);

    // Center the grid in the viewport at default zoom
    stage.position(getCenteredPosition());

    setupResizeListener();
    setupZoomAndPan();

    return { stage, layer, gridLayer };
}

export function getCurrentGridSize() { return currentGridSize; }
export function getCurrentZoom()     { return currentZoom; }
export function getStage()           { return stage; }
export function getLayer()           { return layer; }
export function getGridLayer()       { return gridLayer; }

/**
 * Convert a stage-container pointer position to content (grid) coordinates.
 * Always use this instead of raw stage.getPointerPosition().
 */
export function pointerToContent(screenPos) {
    return {
        x: (screenPos.x - stage.x()) / stage.scaleX(),
        y: (screenPos.y - stage.y()) / stage.scaleY(),
    };
}

/**
 * Resize stage to fill the canvas-wrapper.
 * Called on window resize.
 */
export function resizeStage() {
    if (!stage) return;

    const wrapper = document.querySelector('.canvas-wrapper');
    if (!wrapper) return;

    const newStageWidth  = wrapper.clientWidth;
    const newStageHeight = wrapper.clientHeight;

    stage.width(newStageWidth);
    stage.height(newStageHeight);

    const newGridSize = getResponsiveGridSize();
    if (newGridSize !== currentGridSize) {
        const oldGridSize  = currentGridSize;
        currentGridSize    = newGridSize;
        const scaleFactor  = newGridSize / DEFAULT_GRID_SIZE;

        layer.children.forEach(child => {
            const originalX = child.attrs.originalX !== undefined
                ? child.attrs.originalX
                : child.x() / (oldGridSize / DEFAULT_GRID_SIZE);
            const originalY = child.attrs.originalY !== undefined
                ? child.attrs.originalY
                : child.y() / (oldGridSize / DEFAULT_GRID_SIZE);

            child.attrs.originalX = originalX;
            child.attrs.originalY = originalY;
            child.x(originalX * scaleFactor);
            child.y(originalY * scaleFactor);

            if (child.radius) {
                const originalRadius = child.attrs.originalRadius !== undefined
                    ? child.attrs.originalRadius
                    : child.radius() / (oldGridSize / DEFAULT_GRID_SIZE);
                child.attrs.originalRadius = originalRadius;
                child.radius(originalRadius * scaleFactor);
            }

            if (child.fontSize) {
                const originalFontSize = child.attrs.originalFontSize !== undefined
                    ? child.attrs.originalFontSize
                    : child.fontSize() / (oldGridSize / DEFAULT_GRID_SIZE);
                child.attrs.originalFontSize = originalFontSize;
                child.fontSize(originalFontSize * scaleFactor);
            }
        });

        window.dispatchEvent(new CustomEvent('stageResize', {
            detail: { gridSize: newGridSize, oldGridSize, scaleFactor }
        }));
    }

    // Re-clamp zoom in case the new viewport size raised the minimum
    const minZoom = getMinZoom();
    if (currentZoom < minZoom) {
        currentZoom = minZoom;
        stage.scale({ x: currentZoom, y: currentZoom });
    }

    // Re-clamp position to the new viewport size (re-centers when the
    // grid fits; otherwise keeps the pan valid within the new bounds)
    stage.position(getClampedPosition(stage.position(), currentZoom));

    gridLayer.batchDraw();
    layer.batchDraw();
}

function setupResizeListener() {
    let resizeTimeout;
    resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeStage, 250);
    };
    window.addEventListener('resize', resizeListener);
    window.addEventListener('orientationchange', resizeListener);

    // CSS-transition-driven layout changes (e.g. sidebar collapse/expand)
    // don't fire window 'resize', but they do fire ResizeObserver.
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper && 'ResizeObserver' in window) {
        let observerTimeout;
        resizeObserver = new ResizeObserver(() => {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(resizeStage, 60);
        });
        resizeObserver.observe(wrapper);
    }
}

/**
 * Set zoom level, keeping pointerScreenPos fixed on screen.
 * @param {number}       newZoom         — target zoom level (will be clamped)
 * @param {{x,y}|null}  pointerScreenPos — position in stage-container coords
 *                                         to use as the zoom anchor
 */
export function setZoom(newZoom, pointerScreenPos = null) {
    if (!stage) return;

    const clampedZoom = Math.max(getMinZoom(), Math.min(MAX_ZOOM, newZoom));
    const oldScale    = stage.scaleX();

    if (pointerScreenPos) {
        // Standard Konva zoom-to-pointer formula:
        // keep the content point under the pointer fixed on screen.
        const mousePointTo = {
            x: (pointerScreenPos.x - stage.x()) / oldScale,
            y: (pointerScreenPos.y - stage.y()) / oldScale,
        };
        stage.scale({ x: clampedZoom, y: clampedZoom });
        const newPos = {
            x: pointerScreenPos.x - mousePointTo.x * clampedZoom,
            y: pointerScreenPos.y - mousePointTo.y * clampedZoom,
        };
        stage.position(getClampedPosition(newPos, clampedZoom));
    } else {
        stage.scale({ x: clampedZoom, y: clampedZoom });
        stage.position(getClampedPosition(stage.position(), clampedZoom));
    }

    currentZoom = clampedZoom;
    stage.batchDraw();

    window.dispatchEvent(new CustomEvent('zoomChanged', { detail: { zoom: currentZoom } }));
}

/** Zoom in, anchored to the viewport centre. */
export function zoomIn() {
    setZoom(currentZoom * ZOOM_FACTOR, {
        x: stage.width()  / 2,
        y: stage.height() / 2,
    });
}

/** Zoom out, anchored to the viewport centre. */
export function zoomOut() {
    setZoom(currentZoom / ZOOM_FACTOR, {
        x: stage.width()  / 2,
        y: stage.height() / 2,
    });
}

/** Reset to default zoom and re-center the grid. */
export function resetZoom() {
    if (!stage) return;
    currentZoom = 1;
    stage.scale({ x: 1, y: 1 });
    stage.position(getClampedPosition({ x: 0, y: 0 }, 1));
    stage.batchDraw();
    window.dispatchEvent(new CustomEvent('zoomChanged', { detail: { zoom: 1 } }));
}

let panEnabled = true;

export function setPanEnabled(enabled) {
    panEnabled = enabled;
    if (stage) stage.draggable(enabled);
}

function setupZoomAndPan() {
    if (!stage) return;

    stage.draggable(panEnabled);
    stage.dragBoundFunc((pos) => getClampedPosition(pos, stage.scaleX()));

    // Mouse-wheel zoom — multiplicative, anchored to the cursor
    stage.on('wheel', (e) => {
        e.evt.preventDefault();
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newZoom   = direction > 0
            ? currentZoom * ZOOM_FACTOR
            : currentZoom / ZOOM_FACTOR;
        setZoom(newZoom, stage.getPointerPosition());
    });

    // Pinch-to-zoom (touch)
    let lastDist   = 0;

    stage.on('touchmove', (e) => {
        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];
        if (!touch1 || !touch2) return;

        stage.draggable(false);

        const dist = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY,
        );

        if (lastDist) {
            const rect = stage.container().getBoundingClientRect();
            const pinchCenter = {
                x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
                y: ((touch1.clientY + touch2.clientY) / 2) - rect.top,
            };
            setZoom((dist / lastDist) * currentZoom, pinchCenter);
        }

        lastDist = dist;
    });

    stage.on('touchend', () => {
        lastDist = 0;
        stage.draggable(panEnabled);
    });
}

export function cleanupStage() {
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
        window.removeEventListener('orientationchange', resizeListener);
        resizeListener = null;
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (stage) {
        stage.destroy();
        stage = null;
        layer = null;
        gridLayer = null;
    }
    currentZoom = 1;
}
