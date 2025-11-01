import { GRID_SIZE, GRID_SPACING, VERT_OFFSET, HORIZ_OFFSET, PERSON_RADIUS } from "./modules/constants.js";
import * as Api from "./modules/api.js"

let authToken = null;
let currentUser = null;
let userMappings = [];

let stage, layer, gridLayer;
let people = [];
let routes = {};
let mode = 'design';
let selectedPerson = null;
let isPlaying = false;
let animationTime = 0;
let lastTime = null;
let playbackSpeed = 1;
let animationFrame = null;
let currentChoreographyId = null;
let choreographies = [];

async function login(username, password) {
    try {

        const data = await Api.login(username, password);
        authToken = data.token;
        currentUser = data;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showApp();
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

async function register(username, email, fullName, password) {
    try {

        const data = await Api.register(username, email, fullName, password);
        authToken = data.token;
        currentUser = data;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showApp();
        return true;
    } catch (error) {
        console.error('Registration error:', error);
        return false;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    userMappings = [];
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');

    people = [];
    routes = {};
    choreographies = [];
    selectedPerson = null;
    currentChoreographyId = null;

    if (layer) {
        layer.destroyChildren();
        layer.draw();
    }

    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('userFullName').textContent = currentUser.fullName || currentUser.username;
    initializeApp();
}

function checkAuth() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showApp();
    }
}

async function fetchUserMappings() {
    try {

        userMappings = await Api.fetchUserMappings();
        renderUserMappings();
    } catch (error) {
        console.error('Error fetching mappings:', error);
    }
}

async function createUserMapping(personId) {
    try {
        await Api.createUserMapping(personId, currentChoreographyId, userMappings.length);

        await fetchUserMappings();
        renderPersonList();
        showStatus('Character mapped successfully!', 'success');
    } catch (error) {
        console.error('Error creating mapping:', error);
        showStatus('Error mapping character', 'error');
    }
}

async function deleteUserMapping(mappingId) {
    try {
        await APi.deleteUserMapping(mappingId);

        await fetchUserMappings();
        renderPersonList();
        showStatus('Mapping removed successfully!', 'success');
    } catch (error) {
        console.error('Error deleting mapping:', error);
        showStatus('Error removing mapping', 'error');
    }
}

function renderUserMappings() {
    const container = document.getElementById('userMappings');

    if (userMappings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 12px;">No character mappings yet. Click "Map to Me" on a person to create one.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    userMappings.forEach(mapping => {
        const item = document.createElement('div');
        item.className = 'person-item';

        item.innerHTML = `
            <div class="person-info">
                <div class="person-color-box" style="background: ${mapping.personColor};"></div>
                <div>
                    <div class="person-name">${mapping.personName}</div>
                    ${mapping.choreographyName ? `<div style="font-size: 11px; color: #7f8c8d;">${mapping.choreographyName}</div>` : ''}
                </div>
                ${mapping.isPrimary ? '<span class="user-mapping-badge">Primary</span>' : ''}
            </div>
            <button class="btn-danger btn-small" onclick="deleteUserMapping(${mapping.id})">✕</button>
        `;

        container.appendChild(item);
    });
}

async function saveChoreography() {
    const name = document.getElementById('choreographyName').value.trim();
    if (!name) {
        showStatus('Please enter a choreography name', 'error');
        return;
    }

    const choreographyData = {
        id: currentChoreographyId,
        name: name,
        routes: routes
    };

    try {
        const saved = await Api.saveChoreography(choreographyData);
        currentChoreographyId = saved.id;

        showStatus('Choreography saved successfully!', 'success');
        await loadChoreographyList();
    } catch (error) {
        console.error('Error saving choreography:', error);
        showStatus('Error saving choreography', 'error');
    }
}

async function deleteChoreography() {
    if (!currentChoreographyId) {
        showStatus('Please select a choreography to delete', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this choreography?')) return;

    try {

        await Api.deleteChoreography(currentChoreographyId);

        showStatus('Choreography deleted successfully!', 'success');
        currentChoreographyId = null;
        document.getElementById('choreographyName').value = '';
        await loadChoreographyList();
        clearAllRoutes(false);
    } catch (error) {
        console.error('Error deleting choreography:', error);
        showStatus('Error deleting choreography', 'error');
    }
}

async function loadChoreographyFromItem(id) {
    const choreography = await Api.fetchChoreography(id);
    if (choreography) {
        currentChoreographyId = choreography.id;
        document.getElementById('choreographyName').value = choreography.name;
        routes = choreography.routes || {};

        people.forEach((person) => {
            if (!routes[person.id] || routes[person.id].length === 0) {
                routes[person.id] = [];
            }
        });

        resetPositions();
        redrawRoutes();
        showStatus('Choreography loaded successfully!', 'success');

        renderChoreographyList();
    }
}

async function loadChoreographyList() {
    choreographies = await Api.fetchChoreographies();
    renderChoreographyList();
}

function renderChoreographyList() {
    const container = document.getElementById('choreographyList');

    if (choreographies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎭</div>
                <div>No choreographies yet</div>
                <div style="font-size: 12px;">Create one by designing routes and clicking Save</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    choreographies.forEach(choreo => {
        const item = document.createElement('div');
        item.className = 'choreography-item';
        if (choreo.id === currentChoreographyId) {
            item.classList.add('selected');
        }

        const date = new Date(choreo.updatedAt[0], choreo.updatedAt[1] - 1, choreo.updatedAt[2], choreo.updatedAt[3], choreo.updatedAt[4], choreo.updatedAt[5]);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        item.innerHTML = `
            <div class="choreography-item-header">
                <div>
                    <div class="choreography-name">${choreo.name}</div>
                    <div class="choreography-date">${dateStr}</div>
                </div>
            </div>
        `;

        item.addEventListener('click', () => loadChoreographyFromItem(choreo.id));
        container.appendChild(item);
    });
}

async function addPerson() {
    const name = document.getElementById('newPersonName').value.trim();
    const color = document.getElementById('newPersonColor').value;
    const letter = document.getElementById('newPersonLetter').value.trim();

    if (!name) {
        showStatus('Please enter a person name', 'error');
        return;
    }

    const personData = {
        name: name,
        color: color,
        letter: letter
    };

    try {
        const saved = await Api.addPerson(personData);

        const startX = -100;
        const startY = -100;

        const circle = new Konva.Circle({
            x: startX,
            y: startY,
            radius: PERSON_RADIUS,
            fill: personData.color,
            stroke: '#333',
            strokeWidth: 2,
            id: `person-${saved.id}`
        });

        const label = new Konva.Text({
            x: startX - 6,
            y: startY - 7,
            text: personData.letter,
            fontSize: 14,
            fontStyle: 'bold',
            fill: 'white'
        });

        people.push({
            id: saved.id,
            name: personData.name,
            color: personData.color,
            letter: personData.letter,
            circle,
            label,
            startX,
            startY
        });
        routes[saved.id] = [];

        layer.add(circle);
        layer.add(label);

        document.getElementById('newPersonName').value = '';
        document.getElementById('newPersonLetter').value = '';
        renderPersonList();
        showStatus('Person added successfully!', 'success');
    } catch (error) {
        console.error('Error adding person:', error);
        showStatus('Error adding person', 'error');
    }
}

async function removePerson(index) {
    if (!confirm(`Remove ${people[index].name}?`)) return;

    try {
        const person = people[index];

        await Api.removePerson(person.id);

        person.circle.destroy();
        person.label.destroy();
        people.splice(index, 1);
        delete routes[person.id];

        if (!selectedPerson || selectedPerson.index === index) {
            selectedPerson = null;
        } else if (selectedPerson && selectedPerson.index > index) {
            selectedPerson--;
        }

        layer.batchDraw();
        renderPersonList();
        redrawRoutes();
        showStatus('Person removed successfully!', 'success');
    } catch (error) {
        console.error('Error removing person:', error);
        showStatus('Error removing person', 'error');
    }
}

function renderPersonList() {
    const container = document.getElementById('personList');
    container.innerHTML = '';

    if (people.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div>No people yet</div>
                <div style="font-size: 12px;">Add people to start creating choreographies</div>
            </div>
        `;
        return;
    }

    people.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'person-item';
        if (selectedPerson && selectedPerson.index === index) {
            item.classList.add('selected');
        }

        item.innerHTML = `
            <div class="person-info">
                <div class="person-color-box" style="background: ${person.color};">
                    <div class="person-color-box-letter">${person.letter}</div>
                </div>
                <div class="person-name">${person.name}</div>
            </div>
            <button class="btn-danger btn-small clear-route-btn" data-person-id="${person.id}">Clear route</button>
            <button class="btn-danger btn-small remove-person-btn" data-index="${index}">✕</button>
        `;

        item.querySelector('.person-info').addEventListener('click', () => selectPerson(person.id, index));
        container.appendChild(item);
    });
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    setTimeout(() => {
        statusEl.className = 'status';
    }, 3000);
}

async function initializeFromBackend() {
    const peopleData = await Api.fetchPeople();

    if (peopleData && peopleData.length > 0) {
        createPeopleFromData(peopleData);
    }

    renderPersonList();
    await loadChoreographyList();
    await fetchUserMappings();
}

function createPeopleFromData(peopleData) {
    peopleData.forEach((personData, i) => {
        const startX = -100;
        const startY = -100;

        const circle = new Konva.Circle({
            x: startX,
            y: startY,
            radius: PERSON_RADIUS,
            fill: personData.color,
            stroke: '#333',
            strokeWidth: 2,
            id: `person-${personData.id}`
        });

        const label = new Konva.Text({
            x: startX - 6,
            y: startY - 7,
            text: personData.letter,
            fontSize: 14,
            fontStyle: 'bold',
            fill: 'white'
        });

        people.push({
            id: personData.id,
            name: personData.name,
            color: personData.color,
            letter: personData.letter,
            circle,
            label,
            startX,
            startY
        });
        routes[personData.id] = [];

        layer.add(circle);
        layer.add(label);
    });
}

function drawGrid() {
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

function selectPerson(id, index) {
    selectedPerson = {id: id, index: index};
    renderPersonList();
    redrawRoutes();
}

function snapToGrid(val) {
    return Math.round(val / GRID_SPACING) * GRID_SPACING;
}

function setupEventListeners() {
    stage.on('click', (e) => {
        if (mode !== 'design' || selectedPerson === null) return;

        const pos = stage.getPointerPosition();
        const snappedX = snapToGrid(pos.x);
        const snappedY = snapToGrid(pos.y);

        routes[selectedPerson.id].push({x: snappedX, y: snappedY});
        redrawRoutes();
    });

    stage.on('mousemove', (e) => {
        if (mode !== 'design' || selectedPerson === null) return;

            const pos = stage.getPointerPosition();
            const snappedX = snapToGrid(pos.x);
            const snappedY = snapToGrid(pos.y);

            redrawRoutes({x: snappedX, y: snappedY});
    });

    document.getElementById('toggleMode').addEventListener('click', toggleMode);
    document.getElementById('clearAll').addEventListener('click', () => clearAllRoutes(true));
    document.getElementById('resetPositions').addEventListener('click', resetPositions);
    document.getElementById('playPause').addEventListener('click', togglePlayPause);
    document.getElementById('stop').addEventListener('click', stopAnimation);
    document.getElementById('saveChoreography').addEventListener('click', saveChoreography);
    document.getElementById('deleteChoreography').addEventListener('click', deleteChoreography);
    document.getElementById('addPerson').addEventListener('click', addPerson);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('personList').addEventListener('click', (event) => {
        const clearBtn = event.target.closest('.clear-route-btn');
        const removeBtn = event.target.closest('.remove-person-btn');

        // Handle "Clear route"
        if (clearBtn) {
            const personId = parseInt(clearBtn.dataset.personId, 10);
            const person = people.find(p => p.id === personId);
            if (person) clearRoute(person, true);
            return;
        }

        // Handle "Remove person"
        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index, 10);
            removePerson(index);
            return;
        }
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });

    const speedSlider = document.getElementById('speed');
    speedSlider.addEventListener('input', (e) => {
        playbackSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = playbackSpeed.toFixed(1) + 'x';
    });
}

function redrawRoutes(snapped) {
    layer.find('.route-line').forEach(line => line.destroy());
    layer.find('.route-point').forEach(point => point.destroy());

    people.forEach((person, idx) => {

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

    if (selectedPerson === null) {
        layer.batchDraw();
        return;
    }

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

    if (snapped) {
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

    layer.batchDraw();
}

function toggleMode() {
    mode = mode === 'design' ? 'playback' : 'design';
    const btn = document.getElementById('toggleMode');
    const info = document.getElementById('modeInfo');
    const playbackControls = document.getElementById('playbackControls');

    if (mode === 'playback') {
        btn.textContent = 'Switch to Design Mode';
        info.innerHTML = '<strong>Playback Mode:</strong> Use controls to play the choreography animation.';
        playbackControls.style.display = 'block';
        layer.find('.route-line').forEach(line => line.destroy());
        layer.find('.route-point').forEach(point => point.destroy());
        layer.batchDraw();
    } else {
        btn.textContent = 'Switch to Playback Mode';
        info.innerHTML = '<strong>Design Mode:</strong> Select a person from the sidebar and click on the grid to create their route.';
        playbackControls.style.display = 'none';
        stopAnimation();
        redrawRoutes();
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('playPause');
    btn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';

    if (isPlaying) {
        lastTime = performance.now();
        animate();
    } else {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    }
}

function stopAnimation() {
    isPlaying = false;
    animationTime = 0;
    lastTime = null;
    document.getElementById('playPause').textContent = '▶ Play';
    document.getElementById('timeDisplay').textContent = '0.0s';
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    resetPositions();
}

function animate() {
    if (!isPlaying) return;

    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    animationTime += deltaTime * playbackSpeed;
    document.getElementById('timeDisplay').textContent = animationTime.toFixed(1) + 's';

    people.forEach((person, idx) => {
        const route = routes[person.id];
        if (!route || route.length < 2) return;

        const totalSegments = route.length - 1;
        const totalDuration = totalSegments;

        if (animationTime >= totalDuration) {
            const last = route[route.length - 1];
            person.circle.x(last.x);
            person.circle.y(last.y);
            person.label.x(last.x - 6);
            person.label.y(last.y - 7);
            return;
        }

        const currentSegment = Math.floor(animationTime);
        const progress = animationTime % 1;

        const start = route[currentSegment];
        const end = route[(currentSegment + 1) % route.length];

        const x = start.x + (end.x - start.x) * progress;
        const y = start.y + (end.y - start.y) * progress;

        person.circle.x(x);
        person.circle.y(y);
        person.label.x(x - 6);
        person.label.y(y - 7);
    });

    layer.batchDraw();
    animationFrame = requestAnimationFrame(animate);
}

function resetPositions() {
    people.forEach((person, idx) => {
        const startPos = routes[person.id] && routes[person.id][0]
            ? routes[person.id][0]
            : {x: -100, y: -100};
        person.circle.x(startPos.x);
        person.circle.y(startPos.y);
        person.label.x(startPos.x - 6);
        person.label.y(startPos.y - 7);
    });
    layer.batchDraw();
}

function clearRoute(person, confirm_action) {
    if (confirm_action && !confirm(`Clear route for ${person.name}? This cannot be undone.`)) return;

    if (routes && routes[person.id]) {
        routes[person.id] = [];
    }

    resetPositions();
    redrawRoutes();
}

function clearAllRoutes(confirm_action) {
    if (confirm_action && !confirm('Clear all routes? This cannot be undone.')) return;

    people.forEach((person) => {
        routes[person.id] = [];
    });
    resetPositions();
    redrawRoutes();
}

function initializeApp() {
    if (!authToken) {
        console.log('No auth token, skipping initialization');
        return;
    }

    if (!stage) {
        // Only initialize Konva stage if not already done
        stage = new Konva.Stage({
            container: 'container',
            width: GRID_SIZE,
            height: GRID_SIZE
        });

        gridLayer = new Konva.Layer();
        layer = new Konva.Layer();

        drawGrid();

        stage.add(gridLayer);
        stage.add(layer);

        setupEventListeners();
    }

    initializeFromBackend();
}

// Login/Register Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    checkAuth();

    // Login tab switching
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.loginTab;
            document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.login-form-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabName}FormContent`).classList.add('active');
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const success = await login(username, password);
        if (!success) {
            document.getElementById('loginError').textContent = 'Invalid username or password';
            document.getElementById('loginError').style.display = 'block';
        }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const fullName = document.getElementById('registerFullName').value;
        const password = document.getElementById('registerPassword').value;

        const success = await register(username, email, fullName, password);
        if (!success) {
            document.getElementById('registerError').textContent = 'Registration failed. Username or email may already exist.';
            document.getElementById('registerError').style.display = 'block';
        }
    });
});