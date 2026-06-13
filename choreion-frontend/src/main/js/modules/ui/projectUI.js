/**
 * Project UI Module
 * Handles rendering and managing project-related UI
 */

import * as Api from '../api/index.js';
import { setProjects, getProjects, setCurrentProjectId } from '../state.js';
import { canDesign } from '../auth.js';
import { showProjectError } from './statusUI.js';

/**
 * Load and render project list
 */
export async function loadProjectList() {
    const projects = await Api.fetchProjects();
    setProjects(projects);
    renderProjectList();
}

/**
 * Render the project list
 */
export function renderProjectList() {
    const container = document.getElementById('projectList');
    if (!container) return;

    const projects = getProjects();

    if (projects.length === 0) {
        const message = canDesign()
            ? 'Create your first project to get started'
            : 'No projects available. Contact an administrator to get access.';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-folder"></i></div>
                <div>No projects yet</div>
                <div class="text-sm">${message}</div>
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
                    ${project.description ? `<div class="text-sm" style="color:var(--color-muted);">${project.description}</div>` : ''}
                    <div class="choreography-date">${dateStr}</div>
                </div>
            </div>
        `;

        item.addEventListener('click', () => {
            // Emit custom event for project selection
            window.dispatchEvent(new CustomEvent('project:selected', { detail: { projectId: project.id } }));
        });
        container.appendChild(item);
    });
}

/**
 * Create a new project
 */
export async function createNewProject() {
    const name = document.getElementById('newProjectName')?.value.trim();
    const description = document.getElementById('newProjectDescription')?.value.trim();

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
