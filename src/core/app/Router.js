// src/core/app/Router.js

import { switchView } from '../../setup/animations/pageTransitions.js';
import { openCaseHistory, closeCaseHistory } from '../../setup/initialization/caseHistory.js';

export class Router {
    constructor(webglManager) {
        this.webglManager = webglManager;
        this.projectData = [];
        this.isNavigating = false;
    }

    setProjectData(data) {
        this.projectData = data;
    }

    async navigateToCaseHistory(projectId) {
        if (this.isNavigating) return;
        this.isNavigating = true;

        try {
            const transition = this.webglManager.createTransition();
            const transitionPromise = transition.play();
            await transition.halfway;

            openCaseHistory(projectId, this.projectData);
            switchView('case-history-view');

            await transitionPromise;
        } catch (error) {
            console.error('Navigation to case history failed:', error);
            // Fallback in caso di errore
            switchView('case-history-view', true); 
        } finally {
            this.isNavigating = false;
        }
    }

    async navigateHome() {
        if (this.isNavigating) return;
        this.isNavigating = true;

        try {
            const transition = this.webglManager.createTransition();
            const transitionPromise = transition.play();
            await transition.halfway;

            closeCaseHistory();
            switchView('main-content');

            await transitionPromise;
        } catch (error) {
            console.error('Navigation to home failed:', error);
            // Fallback in caso di errore
            switchView('main-content', true);
        } finally {
            this.isNavigating = false;
        }
    }
}
