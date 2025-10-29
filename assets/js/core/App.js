import * as THREE from 'three';
import { WebGLManager } from './WebGLManager.js';
import { InteractionManager } from './InteractionManager.js';
import { Router } from './Router.js';
import { setupPreloader } from '../modules/preloader.js';
import { TerminalCursor } from '../modules/TerminalCursor.js';
import { initCursor as initGameCursor } from '../setup/cursorManager.js';
import { ChimeraNavbar } from '../modules/ChimeraNavbar.js';
import { setupProjectGallery } from '../setup/projectGallery.js';
import { initRevealAnimations } from '../setup/revealAnimations.js';
import { switchView } from '../setup/pageTransitions.js';
import { setupSystemInfo } from '../setup/systemInfo.js';
import { GlobalCRTBackground } from '../modules/GlobalCRTBackground.js';
import { telemetry } from '../services/TelemetryService.js';

// L'import del nostro nuovo widget modulare. Il percorso è corretto.
import AIChatWidget from '../modules/GlitchyAI/AIChatWidget.js';

export class Application {
    constructor() {
        this.webglManager = null;
        this.interactionManager = new InteractionManager();
        this.router = null;
        this.projectData = [];
        this.crtBackground = null;
        this.activeCursor = null;
        this.terminalCursor = null;
        this.cursorName = null;
        this.isRecallingPreloader = false;
        this.boundPreloaderRecall = this.onPreloaderRecall.bind(this);
        this.navbar = null;
        
        // Qui creiamo una nuova istanza della nostra classe AIChatWidget.
        // Questo ora funziona perché AIChatWidget.js esporta una classe.
        this.chatWidget = new AIChatWidget();

        window.App = this; // Esponi per debugging
    }

    async init() {
        document.body.classList.add('no-scroll');
        this.crtBackground = new GlobalCRTBackground('global-background-canvas');

        const cursorData = initGameCursor({ deferActivation: true });
        this.cursorName = cursorData?.name || null;
        
        await this.runPreloader(cursorData.name);

        if (cursorData.activate) {
            try {
                cursorData.activate();
            } catch (err) {
                console.error('Cursor activation failed:', err);
            }
        }
        
        if (cursorData.instance) {
            this.activeCursor = cursorData.instance;
            this.interactionManager.setActiveCursor(this.activeCursor);
        }
        
        this.webglManager = new WebGLManager(document.getElementById('transition-canvas'));
        this.router = new Router(this.webglManager);

        this.terminalCursor = new TerminalCursor();
        this.terminalCursor.init();
        
        try {
            const chimeraNavbar = new ChimeraNavbar();
            chimeraNavbar.init();
            this.navbar = chimeraNavbar;
        } catch (error) {
            console.error("🔥 Errore critico durante l'inizializzazione di ChimeraNavbar:", error);
        }

        setupSystemInfo();
        this.projectData = await setupProjectGallery();

        if (this.activeCursor && this.cursorName === 'Asteroids') {
            const selectors = 'img, .project-card, .interactive-bounce';
            this.activeCursor.game.setBounceBoundaries(selectors);
        }

        this.router.setProjectData(this.projectData);
        this.interactionManager.initGlobalInteractions();
        initRevealAnimations();

        // Finalmente, inizializziamo il widget della chat!
        this.chatWidget.init();

        document.body.classList.add('js-enabled');
        this.bindGlobalEvents();
        
        const transition = this.webglManager.createTransition();
        await transition.play();
        document.body.classList.remove('is-loading');
        
        switchView('main-content');

        setTimeout(() => {
            document.body.classList.remove('no-scroll');
        }, 1500);
    }

    async runPreloader(cursorName) {
        const preloaderCursor = new TerminalCursor();
        preloaderCursor.init();
        const loadingManager = new THREE.LoadingManager();
        try { new THREE.TextureLoader(loadingManager).load('assets/img/social-preview.jpg'); } catch (e) {}
        await setupPreloader(loadingManager, true, preloaderCursor, cursorName);
        preloaderCursor.destroy();
    }

    bindGlobalEvents() {
        document.addEventListener('click', async (e) => {
            const projectCard = e.target.closest('.project-card');
            if (projectCard) {
                e.preventDefault();
                const projectId = projectCard.dataset.projectId;
                await this.router.navigateToCaseHistory(projectId);
            }
        });
        document.addEventListener('click', async (e) => {
            if (e.target.closest('#close-case-history')) {
                e.preventDefault();
                await this.router.navigateHome();
            }
        });
        window.addEventListener('apis:preloader:recall', this.boundPreloaderRecall);
    }

    async onPreloaderRecall() {
        if (this.isRecallingPreloader) return;
        this.isRecallingPreloader = true;
        if (this.terminalCursor) this.terminalCursor.setVisibility(false);
        const loadingManager = new THREE.LoadingManager();
        const preloaderCursor = new TerminalCursor();
        preloaderCursor.init();
        try {
            await setupPreloader(loadingManager, true, preloaderCursor, this.cursorName || 'Pacman');
        } catch (err) {
            console.error('Errore durante il richiamo del preloader:', err);
        } finally {
            preloaderCursor.destroy();
            window.dispatchEvent(new CustomEvent('apis:preloader:complete', { detail: { source: 'navbar' } }));
            this.isRecallingPreloader = false;
            if (this.terminalCursor) this.terminalCursor.setVisibility(true);
        }
    }
}