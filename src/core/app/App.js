import { InteractionManager } from '../interactions/InteractionManager.js';
import { Router } from './Router.js';
import { setupPreloader } from '../../setup/preloader.js';
import { TerminalCursor } from '../../components/ui/TerminalCursor.js';
import { initCursor as initGameCursor } from '../../setup/initialization/cursorManager.js';
import { ChimeraNavbar } from '../../components/ui/ChimeraNavbar.js';
import { setupProjectGallery } from '../../features/projects/projectGallery.js';
import { initRevealAnimations } from '../../setup/animations/revealAnimations.js';
import { switchView } from '../../setup/animations/pageTransitions.js';
import { setupSystemInfo } from '../../setup/initialization/systemInfo.js';
import { telemetry } from '../../services/telemetry/TelemetryService.js';
import EventBus from '../../utils/events/EventBus.js';

// Rimossi import pesanti - saranno caricati dinamicamente
// import * as THREE from 'three';
// import { WebGLManager } from '../rendering/WebGLManager.js';
// import { GlobalCRTBackground } from '../../components/ui/GlobalCRTBackground.js';
// import AIChatWidget from '../../features/ai-chat/core/AIChatWidget.js';

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

        // Componenti pesanti - saranno caricati dinamicamente
        this.chatWidget = null;
        this.WebGLManager = null;
        this.GlobalCRTBackground = null;

        window.App = this; // Esponi per debugging
    }

    async init() {
        document.body.classList.add('no-scroll');

        // Carica componenti pesanti in parallelo
        const [WebGLComponents, AIChatModule] = await Promise.all([
            this.loadWebGLComponents(),
            this.loadAIChatWidget()
        ]);

        // Assegna i moduli caricati
        this.WebGLManager = WebGLComponents.WebGLManager;
        this.GlobalCRTBackground = WebGLComponents.GlobalCRTBackground;

        // Inizializza CRT Background
        this.crtBackground = new this.GlobalCRTBackground('global-background-canvas');

    const cursorData = initGameCursor({ deferActivation: true, cursorName: 'Simple' });
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

        // Inizializza WebGL Manager
        this.webglManager = new this.WebGLManager(document.getElementById('transition-canvas'));
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

        // Inizializza AI Chat Widget (ora caricato dinamicamente)
        this.chatWidget = new AIChatModule.default();
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

        try {
            // Carica THREE dinamicamente per il preloader
            const THREE = await import('three');
            const loadingManager = new THREE.LoadingManager();
            try { new THREE.TextureLoader(loadingManager).load('assets/img/Foto_profilo.jpg'); } catch (e) {}
            await setupPreloader(loadingManager, true, preloaderCursor, cursorName);
        } catch (error) {
            console.error('Errore nel caricamento di THREE per il preloader:', error);
            // Fallback senza loading manager
            await setupPreloader(null, true, preloaderCursor, cursorName);
        } finally {
            preloaderCursor.destroy();
        }
    }

    bindGlobalEvents() {
        EventBus.on('global:click', async (e) => {
            const projectCard = e.target.closest('.project-card');
            if (projectCard) {
                e.preventDefault();
                const projectId = projectCard.dataset.projectId;
                await this.router.navigateToCaseHistory(projectId);
                return; // Evita che l'altro handler venga eseguito
            }

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

        const preloaderCursor = new TerminalCursor();
        preloaderCursor.init();

        try {
            // Carica THREE dinamicamente
            const THREE = await import('three');
            const loadingManager = new THREE.LoadingManager();
            await setupPreloader(loadingManager, true, preloaderCursor, this.cursorName || 'Pacman');
        } catch (error) {
            console.error('Errore nel caricamento di THREE per il richiamo del preloader:', error);
            // Fallback senza loading manager
            await setupPreloader(null, true, preloaderCursor, this.cursorName || 'Pacman');
        } finally {
            preloaderCursor.destroy();
            window.dispatchEvent(new CustomEvent('apis:preloader:complete', { detail: { source: 'navbar' } }));
            this.isRecallingPreloader = false;
            if (this.terminalCursor) this.terminalCursor.setVisibility(true);
        }
    }

    async loadWebGLComponents() {
        try {
            // Correzione della logica di import dinamico
            const [WebGLManagerModule, GlobalCRTBackgroundModule] = await Promise.all([
                import('../rendering/WebGLManager.js'),
                import('../../components/ui/GlobalCRTBackground.js')
            ]);
            // Estrazione corretta degli export dai moduli
            return {
                WebGLManager: WebGLManagerModule.WebGLManager,
                GlobalCRTBackground: GlobalCRTBackgroundModule.GlobalCRTBackground
            };
        } catch (error) {
            console.error('Errore nel caricamento dei componenti WebGL:', error);
            // Fallback: carica versioni leggere o disabilita funzionalità
            return {
                WebGLManager: class FallbackWebGLManager {
                    createTransition() { return { play: () => Promise.resolve() }; }
                },
                GlobalCRTBackground: class FallbackCRTBackground {
                    constructor() {}
                }
            };
        }
    }

    async loadAIChatWidget() {
        try {
            const AIChatModule = await import('../../features/ai-chat/core/AIChatWidget.js');
            return AIChatModule;
        } catch (error) {
            console.error('Errore nel caricamento del widget AI Chat:', error);
            // Fallback: widget disabilitato
            return {
                default: class FallbackAIChatWidget {
                    init() { console.log('AI Chat disabilitato per ottimizzazione bundle'); }
                }
            };
        }
    }
}