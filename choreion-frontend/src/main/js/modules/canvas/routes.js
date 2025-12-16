/**
 * Routes Module
 * Handles drawing and managing routes on the canvas
 */

import { getPeople, getSelectedPerson, getRoutes, setRouteForPerson } from '../state.js';
import { getLayer, getGridLayer, getCurrentGridSize } from './stage.js';

/**
 * Redraw all routes on the canvas
 * @param {Object} snapped - Optional snapped position for preview
 */
export function redrawRoutes(snapped = null) {
    const layer = getLayer();
    const gridLayer = getGridLayer();
    const people = getPeople();
    const selectedPerson = getSelectedPerson();
    const routes = getRoutes();

    if (!layer) return;

    // Remove existing route lines and points
    layer.find('.route-line').forEach(line => line.destroy());
    layer.find('.route-point').forEach(point => point.destroy());

    // Draw routes for non-selected people (faded)
    people.forEach((person) => {
        if (!selectedPerson || selectedPerson.id !== person.id) {
            const route = routes[person.id];
            if (route && route.length > 0) {
                if (route.length > 1) {
                    const points = route.flatMap(p => [p.x, p.y]);
                    const line = new Konva.Line({
                        points: points,
                        stroke: person.color,
                        strokeWidth: 3,
                        opacity: 0.3,
                        name: 'route-line',
                        dash: [10, 5]
                    });
                    layer.add(line);
                    line.moveToBottom();
                    gridLayer.moveToBottom();
                }

                route.forEach((point, idx) => {
                    const circle = new Konva.Circle({
                        x: point.x,
                        y: point.y,
                        radius: 5,
                        opacity: 0.4,
                        fill: idx === 0 ? '#4CAF50' : person.color,
                        stroke: '#333',
                        strokeWidth: 1,
                        name: 'route-point'
                    });
                    layer.add(circle);
                    circle.moveToBottom();
                });
            }
        }
    });

    // Draw selected person's route (highlighted)
    if (selectedPerson !== null) {
        const route = routes[selectedPerson.id];
        if (route && route.length > 0) {
            if (route.length > 1) {
                const points = route.flatMap(p => [p.x, p.y]);
                const line = new Konva.Line({
                    points: points,
                    stroke: people[selectedPerson.index].color,
                    strokeWidth: 3,
                    opacity: 0.6,
                    name: 'route-line',
                    dash: [10, 5]
                });
                layer.add(line);
                line.moveToBottom();
                gridLayer.moveToBottom();
            }

            route.forEach((point, idx) => {
                const circle = new Konva.Circle({
                    x: point.x,
                    y: point.y,
                    radius: 5,
                    fill: idx === 0 ? '#4CAF50' : people[selectedPerson.index].color,
                    stroke: '#333',
                    strokeWidth: 1,
                    name: 'route-point'
                });
                layer.add(circle);
            });
        }

        // Draw preview point if snapped position provided
        if (snapped) {
            layer.add(new Konva.Line({
                points: [snapped.x, 0, snapped.x, getCurrentGridSize()],
                stroke: '#f0f',
                strokeWidth: 1,
                name: 'route-line',
            }));

            layer.add(new Konva.Line({
                points: [0, snapped.y, getCurrentGridSize(), snapped.y],
                stroke: '#f0f',
                strokeWidth: 1,
                name: 'route-line',
            }));

            const circle = new Konva.Circle({
                x: snapped.x,
                y: snapped.y,
                radius: 5,
                fill: people[selectedPerson.index].color,
                stroke: '#333',
                strokeWidth: 1,
                name: 'route-point'
            });
            layer.add(circle);
        }
    }

    layer.batchDraw();
}

/**
 * Clear route for a specific person
 * @param {Object} person - Person object
 * @param {boolean} confirmAction - Whether to show confirmation dialog
 */
export function clearRoute(person, confirmAction = true) {
    if (confirmAction && !confirm(`Clear route for ${person.name}? This cannot be undone.`)) {
        return;
    }

    setRouteForPerson(person.id, []);
    resetPositions();
    redrawRoutes();
}

/**
 * Clear all routes
 * @param {boolean} confirmAction - Whether to show confirmation dialog
 */
export function clearAllRoutes(confirmAction = true) {
    if (confirmAction && !confirm('Clear all routes? This cannot be undone.')) {
        return;
    }

    const people = getPeople();
    people.forEach((person) => {
        setRouteForPerson(person.id, []);
    });

    resetPositions();
    redrawRoutes();
}

/**
 * Reset positions helper
 */
function resetPositions() {
    const people = getPeople();
    const routes = getRoutes();
    const layer = getLayer();
    if (!layer) return;

    people.forEach((person) => {
        const startPos = routes[person.id] && routes[person.id][0]
            ? routes[person.id][0]
            : { x: -2000, y: -2000 };

        person.circle.x(startPos.x);
        person.circle.y(startPos.y);
        person.label.x(startPos.x - 6);
        person.label.y(startPos.y - 7);
    });

    layer.batchDraw();
}
