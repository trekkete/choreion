/**
 * Admin UI Module
 * Handles admin panel UI for user and mapping management
 */

import * as Api from '../api/index.js';
import { getCurrentUser } from '../auth.js';
import { showAdminStatus, showMappingStatus } from './statusUI.js';

// ============= User Management =============

/**
 * Load all users
 */
export async function loadAllUsers() {
    try {
        const users = await Api.fetchAllUsers();
        renderAllUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showAdminStatus('Error loading users', 'error');
    }
}

/**
 * Render all users
 * @param {Array} users - List of users
 */
export function renderAllUsers(users) {
    const container = document.getElementById('adminUsersList');
    if (!container) return;

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

/**
 * Create a new user
 */
export async function createNewUser() {
    const username = document.getElementById('adminNewUsername')?.value.trim();
    const email = document.getElementById('adminNewEmail')?.value.trim();
    const fullName = document.getElementById('adminNewFullName')?.value.trim();
    const password = document.getElementById('adminNewPassword')?.value;
    const role = document.getElementById('adminNewRole')?.value;

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
        await populateMappingUserSelect();
    } catch (error) {
        showAdminStatus('Error creating user: ' + error.message, 'error');
    }
}

/**
 * Change user role
 * @param {number} userId - User ID
 */
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

/**
 * Delete a user
 * @param {number} userId - User ID
 */
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

// ============= Mapping Management =============

/**
 * Populate the user dropdown in the mapping form
 */
export async function populateMappingUserSelect() {
    const userSelect = document.getElementById('adminMappingUserId');
    if (!userSelect) return;

    const previousValue = userSelect.value;
    const users = await Api.fetchAllUsers();

    userSelect.innerHTML = '<option value="">Select a user...</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.fullName} (@${user.username})`;
        userSelect.appendChild(option);
    });

    if (previousValue && users.some(u => String(u.id) === previousValue)) {
        userSelect.value = previousValue;
    }
}

/**
 * Load admin mapping data (users, projects, mappings)
 */
export async function loadAdminMappingData() {
    try {
        // Load all users for dropdown
        await populateMappingUserSelect();

        // Load all projects for dropdown
        const allProjects = await Api.fetchProjects();
        const projectSelect = document.getElementById('adminMappingProjectId');
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">Select a project...</option>';
            allProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                projectSelect.appendChild(option);
            });
        }

        // Load and render all mappings
        await loadAllMappings();
    } catch (error) {
        console.error('Error loading mapping data:', error);
        showMappingStatus('Error loading data', 'error');
    }
}

/**
 * Load all mappings
 */
export async function loadAllMappings() {
    try {
        const mappings = await Api.fetchAllMappings();
        renderAllMappings(mappings);
    } catch (error) {
        console.error('Error loading mappings:', error);
        showMappingStatus('Error loading mappings', 'error');
    }
}

/**
 * Render all mappings
 * @param {Array} mappings - List of mappings
 */
function renderAllMappings(mappings) {
    const container = document.getElementById('adminMappingsList');
    if (!container) return;

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

/**
 * Handle project change in admin mapping form
 */
export async function onProjectChange() {
    const projectId = document.getElementById('adminMappingProjectId')?.value;

    if (!projectId) {
        const choreoSelect = document.getElementById('adminMappingChoreographyId');
        const personSelect = document.getElementById('adminMappingPersonId');
        if (choreoSelect) choreoSelect.innerHTML = '<option value="">Select a choreography...</option>';
        if (personSelect) personSelect.innerHTML = '<option value="">Select a person...</option>';
        return;
    }

    try {
        // Load choreographies for selected project
        const choreographies = await Api.fetchChoreographies(parseInt(projectId));
        const choreoSelect = document.getElementById('adminMappingChoreographyId');
        if (choreoSelect) {
            choreoSelect.innerHTML = '<option value="">Select a choreography...</option>';
            choreographies.forEach(choreo => {
                const option = document.createElement('option');
                option.value = choreo.id;
                option.textContent = choreo.name;
                choreoSelect.appendChild(option);
            });
        }

        // Load people for selected project
        const people = await Api.fetchPeople(parseInt(projectId));
        const personSelect = document.getElementById('adminMappingPersonId');
        if (personSelect) {
            personSelect.innerHTML = '<option value="">Select a person...</option>';
            if (people && people.length > 0) {
                people.forEach(person => {
                    const option = document.createElement('option');
                    option.value = person.id;
                    option.textContent = person.name;
                    personSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading project data:', error);
        showMappingStatus('Error loading project data', 'error');
    }
}

/**
 * Create admin mapping
 */
export async function createAdminMapping() {
    const userId = document.getElementById('adminMappingUserId')?.value;
    const personId = document.getElementById('adminMappingPersonId')?.value;
    const choreographyId = document.getElementById('adminMappingChoreographyId')?.value;
    const isPrimary = document.getElementById('adminMappingIsPrimary')?.checked;

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

/**
 * Delete mapping (admin)
 * @param {number} mappingId - Mapping ID
 */
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

/**
 * Show admin panel
 */
export function showAdminPanel() {
    document.getElementById('appContainer')?.classList.add('hidden');
    document.getElementById('projectSelectionScreen')?.classList.add('hidden');
    document.getElementById('adminContainer')?.classList.remove('hidden');

    const user = getCurrentUser();
    const userFullNameEl = document.getElementById('adminUserFullName');
    if (userFullNameEl && user) {
        userFullNameEl.textContent = user.fullName || user.username;
    }

    loadAllUsers();
    loadAdminMappingData();
}

/**
 * Hide admin panel
 */
export function hideAdminPanel() {
    document.getElementById('adminContainer')?.classList.add('hidden');
    document.getElementById('appContainer')?.classList.remove('hidden');
}
