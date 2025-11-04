/**
 * Person Module
 * Handles creating and managing person shapes on the canvas
 */

import { PERSON_RADIUS, DEFAULT_GRID_SIZE, getResponsivePersonRadius } from '../constants.js';
import { addPersonToState, removePersonFromState, getPeople, setRouteForPerson, getRouteForPerson } from '../state.js';
import { getLayer, getCurrentGridSize } from './stage.js';

/**
 * Create a person circle and label on the canvas
 * @param {Object} personData - Person data from API
 * @param {Object} visualData - Visual data (color, letter)
 * @returns {Object} Person object with circle, label, and data
 */
export function createPerson(personData, visualData) {
    const startX = -100;
    const startY = -100;

    // Use responsive radius based on current grid size
    const currentGridSize = getCurrentGridSize() || DEFAULT_GRID_SIZE;
    const radius = getResponsivePersonRadius(currentGridSize);

    const circle = new Konva.Circle({
        x: startX,
        y: startY,
        radius: radius,
        fill: visualData.color,
        stroke: '#333',
        strokeWidth: 2,
        id: `person-${personData.id}`
    });

    const label = new Konva.Text({
        x: startX - 6,
        y: startY - 7,
        text: visualData.letter,
        fontSize: 14,
        fontStyle: 'bold',
        fill: 'white'
    });

    const person = {
        id: personData.id,
        name: personData.name,
        color: visualData.color,
        letter: visualData.letter,
        circle,
        label,
        startX,
        startY
    };

    return person;
}

/**
 * Add person to canvas layer
 * @param {Object} person - Person object
 */
export function addPersonToCanvas(person) {
    const layer = getLayer();
    if (!layer) return;

    layer.add(person.circle);
    layer.add(person.label);
    layer.batchDraw();
}

/**
 * Remove person from canvas
 * @param {Object} person - Person object
 */
export function removePersonFromCanvas(person) {
    if (!person) return;

    person.circle.destroy();
    person.label.destroy();

    const layer = getLayer();
    if (layer) {
        layer.batchDraw();
    }
}

/**
 * Create people from backend data
 * @param {Array} peopleData - Array of person data from API
 */
export function createPeopleFromData(peopleData) {
    const layer = getLayer();
    if (!layer) return;

    peopleData.forEach((personData) => {
        const person = createPerson(personData, {
            color: personData.color,
            letter: personData.letter
        });

        addPersonToState(person);
        setRouteForPerson(person.id, []);
        layer.add(person.circle);
        layer.add(person.label);
    });

    layer.batchDraw();
}

/**
 * Reset all people to their starting positions
 */
export function resetPositions() {
    const people = getPeople();
    const layer = getLayer();
    if (!layer) return;

    people.forEach((person) => {
        const routes = getRouteForPerson(person.id) || {};
        const startPos = routes && routes[0]
            ? routes[0]
            : { x: -100, y: -100 };

        person.circle.x(startPos.x);
        person.circle.y(startPos.y);
        person.label.x(startPos.x - 6);
        person.label.y(startPos.y - 7);
    });

    layer.batchDraw();
}
