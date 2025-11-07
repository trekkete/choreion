/**
 * Animation Module
 * Handles playback animation of choreographies
 */

import {
    getPeople,
    getRoutes,
    getCurrentBPM,
    getIsPlaying,
    setIsPlaying,
    getAnimationTime,
    setAnimationTime,
    getLastTime,
    setLastTime,
    getAnimationFrame,
    setAnimationFrame,
    resetAnimationState,
    getCurrentChoreographySteps
} from '../state.js';
import { getLayer } from './stage.js';
import { resetPositions } from './person.js';
import { t } from '../../i18n/i18n.js';

/**
 * Toggle play/pause animation
 */
export function togglePlayPause() {
    const isPlaying = !getIsPlaying();
    setIsPlaying(isPlaying);

    const btn = document.getElementById('playPause');
    if (btn) {
        const translationKey = isPlaying ? 'controls.pause' : 'controls.play';
        const icon = isPlaying ? '⏸' : '▶';
        btn.textContent = icon;
        btn.setAttribute('data-i18n-title', translationKey);
        btn.setAttribute('title', t(translationKey));
    }

    if (isPlaying) {
        setLastTime(performance.now());
        animate();
    } else {
        const frame = getAnimationFrame();
        if (frame) {
            cancelAnimationFrame(frame);
        }
    }
}

/**
 * Stop animation and reset
 */
export function stopAnimation() {
    resetAnimationState();

    const playPauseBtn = document.getElementById('playPause');
    const timeDisplay = document.getElementById('timeDisplay');
    const totalSteps = getCurrentChoreographySteps();

    if (playPauseBtn) {
        playPauseBtn.textContent = '▶';
        playPauseBtn.setAttribute('data-i18n-title', 'controls.play');
        playPauseBtn.setAttribute('title', t('controls.play'));
    }
    if (timeDisplay) timeDisplay.textContent = `0 / ${totalSteps}`;

    resetPositions();
}

/**
 * Animation loop
 */
function animate() {
    if (!getIsPlaying()) return;

    const now = performance.now();
    const lastTime = getLastTime();
    const deltaTime = (now - lastTime) / 1000;
    setLastTime(now);

    // Calculate time per step based on BPM
    const bpm = getCurrentBPM();
    const timePerStep = 60 / bpm;

    let animationTime = getAnimationTime();
    animationTime += deltaTime;
    setAnimationTime(animationTime);

    // Calculate current step
    const currentStep = Math.floor(animationTime / timePerStep);
    const totalSteps = getCurrentChoreographySteps();

    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
        timeDisplay.textContent = `${Math.min(currentStep + 1, totalSteps)} / ${totalSteps}`;
    }

    const people = getPeople();
    const routes = getRoutes();
    const layer = getLayer();

    people.forEach((person) => {
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

    if (layer) {
        layer.batchDraw();
    }

    const frame = requestAnimationFrame(animate);
    setAnimationFrame(frame);
}
