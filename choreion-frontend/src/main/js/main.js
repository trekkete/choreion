import { GRID_SIZE, GRID_SPACING, VERT_OFFSET, HORIZ_OFFSET, PERSON_RADIUS } from "./modules/constants.js";
import * as Api from "./modules/api.js"

let authToken = null;
let currentUser = null;
let userMappings = [];
let currentProjectId = null;
let projects = [];
let hasUnsavedChanges = false;

let stage, layer, gridLayer;
let people = [];
let routes = {};
let mode = 'design';
let selectedPerson = null;
let stepCounterText = null;
let isPlaying = false;
let animationTime = 0;
let lastTime = null;
let animationFrame = null;
let currentChoreographyId = null;
let currentChoreographySteps = 8;
let choreographies = [];
let currentBPM = 165;
let snapToGridEnabled = true;

// Helper functions for role checking
function hasRole(role) {
    return currentUser && currentUser.roles && currentUser.roles.includes(role);
}

function isUser() {
    return hasRole('ROLE_USER');
}

function isChoreographer() {
    return hasRole('ROLE_CHOREOGRAPHER');
}

function isAdmin() {
    return hasRole('ROLE_ADMIN');
}

function canDesign() {
    return isChoreographer() || isAdmin();
}

function applyRoleBasedUI() {
    // Hide/show project creation for USER role
    const createProjectSection = document.querySelector('#projectSelectionScreen .form-group');
    const createProjectBtn = document.getElementById('createProjectBtn');
    if (createProjectSection && createProjectBtn) {
        if (!canDesign()) {
            createProjectSection.classList.add('hidden');
            createProjectBtn.classList.add('hidden');
        } else {
            createProjectSection.classList.remove('hidden');
            createProjectBtn.classList.remove('hidden');
        }
    }

    // Hide/show toggle mode button for USER role
    const toggleModeBtn = document.getElementById('toggleMode');
    if (toggleModeBtn) {
        if (!canDesign()) {
            toggleModeBtn.classList.add('hidden');
            // Force USER to playback mode
            if (mode === 'design') {
                mode = 'playback';
                const info = document.getElementById('modeInfo');
                const playbackControls = document.getElementById('playbackControls');
                const designControls = document.getElementById('designControls');
                info.innerHTML = '<strong>Playback Mode:</strong> Use controls to play the choreography animation.';
                playbackControls.classList.remove('hidden');
                designControls.classList.add('hidden');
            }
        } else {
            toggleModeBtn.classList.remove('hidden');
        }
    }

    // Hide People tab for USER role (they can't add/remove people)
    const peopleTab = document.querySelector('[data-tab="people"]');
    if (peopleTab) {
        if (!canDesign()) {
            peopleTab.classList.add('hidden');
        } else {
            peopleTab.classList.remove('hidden');
        }
    }

    // Hide choreography save/delete controls for USER role
    const choreographySaveSection = document.querySelector('#choreographiesTab .form-row');
    if (choreographySaveSection) {
        if (!canDesign()) {
            choreographySaveSection.classList.add('hidden');
        } else {
            choreographySaveSection.classList.remove('hidden');
        }
    }

    // Show/hide admin button for ADMIN role
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        if (isAdmin()) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    }
}

// Admin functions
function showAdminPanel() {
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('adminContainer').classList.remove('hidden');
    document.getElementById('adminUserFullName').textContent = currentUser.fullName || currentUser.username;
    loadAllUsers();
    loadAdminMappingData();
}

function hideAdminPanel() {
    document.getElementById('adminContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
}

async function loadAllUsers() {
    try {
        const users = await Api.fetchAllUsers();
        renderAllUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showAdminStatus('Error loading users', 'error');
    }
}

function renderAllUsers(users) {
    const container = document.getElementById('adminUsersList');

    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <div>No users found</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'admin-user-card';

        const rolesHtml = user.roles.map(role => {
            const roleClass = role === 'ROLE_ADMIN' ? 'role-admin'
                            : role === 'ROLE_CHOREOGRAPHER' ? 'role-choreographer'
                            : 'role-user';
            const roleName = role.replace('ROLE_', '');
            return `<span class="admin-user-role ${roleClass}">${roleName}</span>`;
        }).join('');

        card.innerHTML = `
            <div class="admin-user-header">
                <div>
                    <div class="admin-user-name">${user.fullName}</div>
                    <div class="admin-user-info">@${user.username} • ${user.email}</div>
                    <div>${rolesHtml}</div>
                </div>
                <div class="admin-user-actions">
                    <button class="btn-warning btn-small change-role-btn" data-user-id="${user.id}">Change Role</button>
                    <button class="btn-danger btn-small delete-user-btn" data-user-id="${user.id}">Delete</button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Add event listeners
    document.querySelectorAll('.change-role-btn').forEach(btn => {
        btn.addEventListener('click', () => changeUserRole(parseInt(btn.dataset.userId)));
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUserAdmin(parseInt(btn.dataset.userId)));
    });
}

async function createNewUser() {
    const username = document.getElementById('adminNewUsername').value.trim();
    const email = document.getElementById('adminNewEmail').value.trim();
    const fullName = document.getElementById('adminNewFullName').value.trim();
    const password = document.getElementById('adminNewPassword').value;
    const role = document.getElementById('adminNewRole').value;

    if (!username || !email || !fullName || !password) {
        showAdminStatus('Please fill in all fields', 'error');
        return;
    }

    try {
        await Api.createUser(username, email, fullName, password, role);
        showAdminStatus('User created successfully!', 'success');

        // Clear form
        document.getElementById('adminNewUsername').value = '';
        document.getElementById('adminNewEmail').value = '';
        document.getElementById('adminNewFullName').value = '';
        document.getElementById('adminNewPassword').value = '';
        document.getElementById('adminNewRole').value = 'ROLE_USER';

        // Reload users list
        await loadAllUsers();
    } catch (error) {
        showAdminStatus('Error creating user: ' + error.message, 'error');
    }
}

async function changeUserRole(userId) {
    const newRole = prompt('Enter new role (ROLE_USER, ROLE_CHOREOGRAPHER, or ROLE_ADMIN):');
    if (!newRole) return;

    const validRoles = ['ROLE_USER', 'ROLE_CHOREOGRAPHER', 'ROLE_ADMIN'];
    if (!validRoles.includes(newRole)) {
        showAdminStatus('Invalid role. Must be ROLE_USER, ROLE_CHOREOGRAPHER, or ROLE_ADMIN', 'error');
        return;
    }

    try {
        await Api.updateUserRole(userId, newRole);
        showAdminStatus('User role updated successfully!', 'success');
        await loadAllUsers();
    } catch (error) {
        showAdminStatus('Error updating user role: ' + error.message, 'error');
    }
}

async function deleteUserAdmin(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        await Api.deleteUser(userId);
        showAdminStatus('User deleted successfully!', 'success');
        await loadAllUsers();
    } catch (error) {
        showAdminStatus('Error deleting user: ' + error.message, 'error');
    }
}

function showAdminStatus(message, type) {
    const statusEl = document.getElementById('adminCreateStatus');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    setTimeout(() => {
        statusEl.className = 'status';
    }, 3000);
}

function showMappingStatus(message, type) {
    const statusEl = document.getElementById('adminMappingStatus');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    setTimeout(() => {
        statusEl.className = 'status';
    }, 3000);
}

// Admin Mapping functions
async function loadAdminMappingData() {
    try {
        // Load all users for dropdown
        const users = await Api.fetchAllUsers();
        const userSelect = document.getElementById('adminMappingUserId');
        userSelect.innerHTML = '<option value="">Select a user...</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.fullName} (@${user.username})`;
            userSelect.appendChild(option);
        });

        // Load all projects for dropdown
        const allProjects = await Api.fetchProjects();
        const projectSelect = document.getElementById('adminMappingProjectId');
        projectSelect.innerHTML = '<option value="">Select a project...</option>';
        allProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });

        // Load and render all mappings
        await loadAllMappings();
    } catch (error) {
        console.error('Error loading mapping data:', error);
        showMappingStatus('Error loading data', 'error');
    }
}

async function loadAllMappings() {
    try {
        const mappings = await Api.fetchAllMappings();
        renderAllMappings(mappings);
    } catch (error) {
        console.error('Error loading mappings:', error);
        showMappingStatus('Error loading mappings', 'error');
    }
}

function renderAllMappings(mappings) {
    const container = document.getElementById('adminMappingsList');

    if (mappings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔗</div>
                <div>No mappings found</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    mappings.forEach(mapping => {
        const card = document.createElement('div');
        card.className = 'admin-user-card';

        card.innerHTML = `
            <div class="admin-user-header">
                <div>
                    <div class="admin-user-name">${mapping.userFullName || mapping.username}</div>
                    <div class="admin-user-info">@${mapping.username} → ${mapping.personName} (${mapping.choreographyName || 'No choreography'})</div>
                    ${mapping.isPrimary ? '<span class="admin-user-role role-admin">PRIMARY</span>' : ''}
                </div>
                <div class="admin-user-actions">
                    <button class="btn-danger btn-small delete-mapping-btn" data-mapping-id="${mapping.id}">Delete</button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Add event listeners
    document.querySelectorAll('.delete-mapping-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteMappingFromAdmin(parseInt(btn.dataset.mappingId)));
    });
}

async function onProjectChange() {
    const projectId = document.getElementById('adminMappingProjectId').value;

    if (!projectId) {
        document.getElementById('adminMappingChoreographyId').innerHTML = '<option value="">Select a choreography...</option>';
        document.getElementById('adminMappingPersonId').innerHTML = '<option value="">Select a person...</option>';
        return;
    }

    try {
        // Load choreographies for selected project
        const choreographies = await Api.fetchChoreographies(parseInt(projectId));
        const choreoSelect = document.getElementById('adminMappingChoreographyId');
        choreoSelect.innerHTML = '<option value="">Select a choreography...</option>';
        choreographies.forEach(choreo => {
            const option = document.createElement('option');
            option.value = choreo.id;
            option.textContent = choreo.name;
            choreoSelect.appendChild(option);
        });

        // Load people for selected project
        const people = await Api.fetchPeople(parseInt(projectId));
        const personSelect = document.getElementById('adminMappingPersonId');
        personSelect.innerHTML = '<option value="">Select a person...</option>';
        if (people && people.length > 0) {
            people.forEach(person => {
                const option = document.createElement('option');
                option.value = person.id;
                option.textContent = person.name;
                personSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading project data:', error);
        showMappingStatus('Error loading project data', 'error');
    }
}

async function createAdminMapping() {
    const userId = document.getElementById('adminMappingUserId').value;
    const personId = document.getElementById('adminMappingPersonId').value;
    const choreographyId = document.getElementById('adminMappingChoreographyId').value;
    const isPrimary = document.getElementById('adminMappingIsPrimary').checked;

    if (!userId || !personId) {
        showMappingStatus('Please select a user and person', 'error');
        return;
    }

    try {
        await Api.createMappingForUser(
            parseInt(userId),
            parseInt(personId),
            choreographyId ? parseInt(choreographyId) : null,
            isPrimary
        );
        showMappingStatus('Mapping created successfully!', 'success');

        // Clear form
        document.getElementById('adminMappingUserId').value = '';
        document.getElementById('adminMappingProjectId').value = '';
        document.getElementById('adminMappingChoreographyId').innerHTML = '<option value="">Select a choreography...</option>';
        document.getElementById('adminMappingPersonId').innerHTML = '<option value="">Select a person...</option>';
        document.getElementById('adminMappingIsPrimary').checked = false;

        // Reload mappings list
        await loadAllMappings();
    } catch (error) {
        showMappingStatus('Error creating mapping: ' + error.message, 'error');
    }
}

async function deleteMappingFromAdmin(mappingId) {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    try {
        await Api.deleteMappingAdmin(mappingId);
        showMappingStatus('Mapping deleted successfully!', 'success');
        await loadAllMappings();
    } catch (error) {
        showMappingStatus('Error deleting mapping: ' + error.message, 'error');
    }
}

async function login(username, password) {
    try {

        const data = await Api.login(username, password);
        authToken = data.token;
        currentUser = data;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showProjectSelection();
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}


function logout() {
    authToken = null;
    currentUser = null;
    userMappings = [];
    currentProjectId = null;
    projects = [];
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentProjectId');

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
    document.getElementById('projectSelectionScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.add('hidden');
}

async function showProjectSelection() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('projectSelectionScreen').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');

    applyRoleBasedUI();
    await loadProjectList();
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('projectSelectionScreen').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('userFullName').textContent = currentUser.fullName || currentUser.username;
    applyRoleBasedUI();
    initializeApp();
}

async function checkAuth() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    const savedProjectId = localStorage.getItem('currentProjectId');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);

        if (savedProjectId) {
            currentProjectId = parseInt(savedProjectId);
            // Load projects to get the project name
            await loadProjectList();
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                document.getElementById('currentProjectName').textContent = project.name;
            }
            showApp();
        } else {
            showProjectSelection();
        }
    }
}

async function loadProjectList() {
    projects = await Api.fetchProjects();
    renderProjectList();
}

function renderProjectList() {
    const container = document.getElementById('projectList');

    if (projects.length === 0) {
        const message = canDesign()
            ? 'Create your first project to get started'
            : 'No projects available. Contact an administrator to get access.';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <div>No projects yet</div>
                <div style="font-size: 12px;">${message}</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'choreography-item';

        const date = new Date(project.updatedAt[0], project.updatedAt[1] - 1, project.updatedAt[2],
                               project.updatedAt[3], project.updatedAt[4], project.updatedAt[5]);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        item.innerHTML = `
            <div class="choreography-item-header">
                <div>
                    <div class="choreography-name">${project.name}</div>
                    ${project.description ? `<div style="font-size: 11px; color: #7f8c8d;">${project.description}</div>` : ''}
                    <div class="choreography-date">${dateStr}</div>
                </div>
            </div>
        `;

        item.addEventListener('click', () => selectProject(project.id));
        container.appendChild(item);
    });
}

async function createNewProject() {
    const name = document.getElementById('newProjectName').value.trim();
    const description = document.getElementById('newProjectDescription').value.trim();

    if (!name) {
        showProjectError('Please enter a project name');
        return;
    }

    try {
        await Api.createProject(name, description);
        document.getElementById('newProjectName').value = '';
        document.getElementById('newProjectDescription').value = '';
        await loadProjectList();
        showProjectError('Project created successfully!', 'success');
    } catch (error) {
        console.error('Error creating project:', error);
        showProjectError('Error creating project');
    }
}

function selectProject(projectId) {
    currentProjectId = projectId;
    localStorage.setItem('currentProjectId', projectId);
    hasUnsavedChanges = false;

    // Set the project title
    const project = projects.find(p => p.id === projectId);
    if (project) {
        document.getElementById('currentProjectName').textContent = project.name;
    }

    showApp();
}

function switchToProjectSelection() {
    if (hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. If you switch projects, all unsaved changes will be lost. Continue?')) {
            return;
        }
    }

    // Clear the current project data
    currentProjectId = null;
    localStorage.removeItem('currentProjectId');
    hasUnsavedChanges = false;

    // Clear canvas data
    people = [];
    routes = {};
    choreographies = [];
    selectedPerson = null;
    currentChoreographyId = null;

    if (layer) {
        layer.destroyChildren();
        layer.draw();
    }

    showProjectSelection();
}

function showProjectError(message, type = 'error') {
    const errorEl = document.getElementById('projectError');
    errorEl.textContent = message;
    errorEl.className = `status ${type}`;
    errorEl.style.display = 'block';

    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 3000);
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
        await Api.deleteUserMapping(mappingId);

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
    const steps = parseInt(document.getElementById('choreographySteps').value);

    if (!name) {
        showStatus('Please enter a choreography name', 'error');
        return;
    }

    if (!steps || steps < 1) {
        showStatus('Please enter a valid number of steps', 'error');
        return;
    }

    const choreographyData = {
        id: currentChoreographyId,
        name: name,
        steps: steps,
        routes: routes
    };

    try {
        const saved = await Api.saveChoreography(choreographyData, currentProjectId);
        currentChoreographyId = saved.id;
        currentChoreographySteps = saved.steps;
        hasUnsavedChanges = false;

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

        await Api.deleteChoreography(currentChoreographyId, currentProjectId);

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
    const choreography = await Api.fetchChoreography(id, currentProjectId);
    if (choreography) {
        currentChoreographyId = choreography.id;
        currentChoreographySteps = choreography.steps || 8;
        document.getElementById('choreographyName').value = choreography.name;
        document.getElementById('choreographySteps').value = currentChoreographySteps;
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
    choreographies = await Api.fetchChoreographies(currentProjectId);
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
                    <div class="choreography-steps">${choreo.steps} steps</div>
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
        const saved = await Api.addPerson(personData, currentProjectId);

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

        await Api.removePerson(person.id, currentProjectId);

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
    const peopleData = await Api.fetchPeople(currentProjectId);

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
    if (snapToGridEnabled) {
        return Math.round(val / GRID_SPACING) * GRID_SPACING;
    }
    return val;
}

function toggleSnapping() {
    snapToGridEnabled = !snapToGridEnabled;
    const btn = document.getElementById('toggleSnapping');
    btn.textContent = snapToGridEnabled ? '🧲 Snap to Grid: ON' : '🧲 Snap to Grid: OFF';
}

function deleteLastStep() {
    if (!selectedPerson) {
        showStatus('Please select a person first', 'error');
        return;
    }

    const route = routes[selectedPerson.id];
    if (!route || route.length === 0) {
        showStatus('No steps to delete', 'error');
        return;
    }

    route.pop();
    hasUnsavedChanges = true;
    redrawRoutes();
}

function setupEventListeners() {
    stage.on('click', (e) => {
        if (mode !== 'design' || selectedPerson === null) return;

        const currentSteps = routes[selectedPerson.id] ? routes[selectedPerson.id].length : 0;

        if (currentSteps >= currentChoreographySteps) {
            showStatus(`Maximum number of steps (${currentChoreographySteps}) reached!`, 'error');
            return;
        }

        const pos = stage.getPointerPosition();
        const snappedX = snapToGrid(pos.x);
        const snappedY = snapToGrid(pos.y);

        routes[selectedPerson.id].push({x: snappedX, y: snappedY});
        hasUnsavedChanges = true;
        redrawRoutes();
    });

    stage.on('mousemove', (e) => {
        if (mode !== 'design' || selectedPerson === null) {
            if (stepCounterText) {
                stepCounterText.destroy();
                stepCounterText = null;
                layer.batchDraw();
            }
            return;
        }

        const pos = stage.getPointerPosition();
        const snappedX = snapToGrid(pos.x);
        const snappedY = snapToGrid(pos.y);

        // Update step counter
        const currentSteps = routes[selectedPerson.id] ? routes[selectedPerson.id].length : 0;

        if (stepCounterText) {
            stepCounterText.destroy();
        }

        stepCounterText = new Konva.Text({
            x: snappedX + 15,
            y: snappedY - 15,
            text: `${currentSteps}/${currentChoreographySteps}`,
            fontSize: 16,
            fontStyle: 'bold',
            fill: currentSteps >= currentChoreographySteps ? '#e74c3c' : '#2ecc71',
            stroke: '#fff',
            strokeWidth: 1
        });

        layer.add(stepCounterText);
        redrawRoutes({x: snappedX, y: snappedY});
    });

    document.getElementById('switchProjectBtn').addEventListener('click', switchToProjectSelection);
    document.getElementById('toggleMode').addEventListener('click', toggleMode);
    document.getElementById('clearAll').addEventListener('click', () => clearAllRoutes(true));
    document.getElementById('resetPositions').addEventListener('click', resetPositions);
    document.getElementById('playPause').addEventListener('click', togglePlayPause);
    document.getElementById('stop').addEventListener('click', stopAnimation);
    document.getElementById('saveChoreography').addEventListener('click', saveChoreography);
    document.getElementById('deleteChoreography').addEventListener('click', deleteChoreography);
    document.getElementById('addPerson').addEventListener('click', addPerson);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('toggleSnapping').addEventListener('click', toggleSnapping);
    document.getElementById('deleteLastStep').addEventListener('click', deleteLastStep);
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

    const bpmInput = document.getElementById('bpm');
    bpmInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 30 && value <= 300) {
            currentBPM = value;
        }
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
    const designControls = document.getElementById('designControls');

    if (mode === 'playback') {
        btn.textContent = 'Switch to Design Mode';
        info.innerHTML = '<strong>Playback Mode:</strong> Use controls to play the choreography animation.';
        playbackControls.classList.remove('hidden');
        designControls.classList.add('hidden');
        layer.find('.route-line').forEach(line => line.destroy());
        layer.find('.route-point').forEach(point => point.destroy());
        layer.batchDraw();
    } else {
        btn.textContent = 'Switch to Playback Mode';
        info.innerHTML = '<strong>Design Mode:</strong> Select a person from the sidebar and click on the grid to create their route.';
        playbackControls.classList.add('hidden');
        designControls.classList.remove('hidden');
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

    // Calculate time per step based on BPM
    // Each beat = one step, so time per step = 60 / BPM
    const timePerStep = 60 / currentBPM;

    animationTime += deltaTime;
    document.getElementById('timeDisplay').textContent = animationTime.toFixed(1) + 's';

    people.forEach((person, idx) => {
        const route = routes[person.id];
        if (!route || route.length < 2) return;

        const totalSegments = route.length - 1;
        const totalDuration = totalSegments * timePerStep;

        if (animationTime >= totalDuration) {
            const last = route[route.length - 1];
            person.circle.x(last.x);
            person.circle.y(last.y);
            person.label.x(last.x - 6);
            person.label.y(last.y - 7);
            return;
        }

        const currentSegment = Math.floor(animationTime / timePerStep);
        const progress = (animationTime % timePerStep) / timePerStep;

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
        hasUnsavedChanges = true;
    }

    resetPositions();
    redrawRoutes();
}

function clearAllRoutes(confirm_action) {
    if (confirm_action && !confirm('Clear all routes? This cannot be undone.')) return;

    people.forEach((person) => {
        routes[person.id] = [];
    });
    hasUnsavedChanges = true;
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
    // Hide loading screen after 2 seconds
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
    }, 2000);

    // Check if already logged in
    checkAuth();

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

    // Project selection event listeners
    document.getElementById('createProjectBtn').addEventListener('click', createNewProject);
    document.getElementById('logoutFromProjectsBtn').addEventListener('click', logout);

    // Admin panel event listeners
    document.getElementById('adminBtn').addEventListener('click', showAdminPanel);
    document.getElementById('backToAppBtn').addEventListener('click', hideAdminPanel);
    document.getElementById('createUserBtn').addEventListener('click', createNewUser);
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);

    // Admin mapping event listeners
    document.getElementById('adminMappingProjectId').addEventListener('change', onProjectChange);
    document.getElementById('createMappingBtn').addEventListener('click', createAdminMapping);
});