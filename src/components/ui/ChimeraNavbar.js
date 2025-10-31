// src/components/ui/ChimeraNavbar.js - v9.8 (EventBus Integration)
import { TextScramble } from './TextScramble.js';
import { initCursor } from '../../setup/initialization/cursorManager.js';
import EventBus from '../../utils/events/EventBus.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class ChimeraNavbar {
    constructor() {
        this.navbar = document.getElementById('chimera-navbar');
        if (!this.navbar) {
            console.error('FATAL: Elemento #chimera-navbar non trovato.');
            return;
        }

        this.elements = {
            brand: this.navbar.querySelector('.navbar-brand'),
            navLinks: this.navbar.querySelectorAll('.nav-link'),
            navItems: this.navbar.querySelectorAll('.nav-item'),
            clock: this.navbar.querySelector('#system-clock'),
            highScoreDisplay: this.navbar.querySelector('#high-score-display span'),
            creditsDisplay: this.navbar.querySelector('#credits-display'),
            creditsValue: this.navbar.querySelector('#credits-display span'),
            logCpu: this.navbar.querySelector('#log-cpu'),
            logMem: this.navbar.querySelector('#log-mem'),
            logGpu: this.navbar.querySelector('#log-gpu'),
            logNet: this.navbar.querySelector('#log-net'),
            analysisConsole: this.navbar.querySelector('#analysis-console'),
        };

        if (!this.elements.brand || !this.elements.navLinks.length || !this.elements.clock || !this.elements.analysisConsole) {
            console.error("Errore critico: uno o più elementi fondamentali della navbar non sono stati trovati. L'interfaccia potrebbe non funzionare correttamente.");
        }

        this.scramblers = {};
        this.state = {
            isBooting: true,
            highScore: 0,
            credits: 0,
            analysisTimeout: null,
            scrollTimeout: null,
        };

        this._konamiHandler = null;
        this._scrollHandler = null;
    }

    async init() {
        if (!this.navbar) return;
        this.setupScramblers();
        this.bindEvents();
        this.initEasterEggs();
        this.startSystemTasks();
        await this.runBootSequence();
    }

    setupScramblers() {
        if (this.elements.analysisConsole) {
            this.scramblers.analysis = new TextScramble(this.elements.analysisConsole);
        }
    }

    initEasterEggs() {
        const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiPos = 0;

        this._konamiHandler = (e) => {
            const key = e.key;
            const expected = konami[konamiPos];
            if (key.toLowerCase() === expected.toLowerCase()) {
                konamiPos++;
                if (konamiPos >= konami.length) {
                    konamiPos = 0;
                    if (this.scramblers.analysis) {
                        this.scramblers.analysis.setText('CHEAT MODE: PACMAN ENGAGED').catch(() => {});
                    }
                    try {
                        initCursor({ deferActivation: false, cursorName: 'Pacman' });
                    } catch (err) {
                        console.warn('Konami: unable to init Pacman cursor', err);
                    }
                }
            } else {
                konamiPos = 0;
            }
        };

        EventBus.on('global:keydown', this._konamiHandler);
    }

    bindEvents() {
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state.isBooting) return;
                const targetId = link.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                } catch (error) {
                    console.error(`Selettore non valido: ${targetId}`, error);
                }
            });

            // Aggiungi effetto pulsante premuto
            link.addEventListener('mousedown', () => {
                link.classList.add('is-pressed');
            });

            link.addEventListener('mouseup', () => {
                link.classList.remove('is-pressed');
            });

            link.addEventListener('mouseleave', () => {
                link.classList.remove('is-pressed');
            });
        });

        if (this.elements.creditsDisplay) {
            this.elements.creditsDisplay.addEventListener('click', () => {
                if (this.state.credits < 99) {
                    this.state.credits++;
                    this.updateCredits();
                    try {
                        const coinAudio = document.getElementById('coin-audio');
                        if (coinAudio) {
                            coinAudio.currentTime = 0;
                            coinAudio.play().catch(() => {});
                        }
                    } catch (err) {}
                }
            });
        }

        this._scrollHandler = () => {
            if (this.state.scrollTimeout) clearTimeout(this.state.scrollTimeout);
            this.state.scrollTimeout = setTimeout(() => this.updateActiveLink(), 50); // Ridotto da 100ms a 50ms per aggiornamenti più fluidi
        };
        EventBus.on('global:scroll', this._scrollHandler);

        // Aggiungi anche un listener diretto per aggiornamenti più immediati
        const directScrollHandler = () => this.updateActiveLink();
        window.addEventListener('scroll', directScrollHandler, { passive: true });
        this._directScrollHandler = directScrollHandler;
    }

    startSystemTasks() {
        this.startClock();
        this.startHighScore();
        this.startSystemLog();
        this.startAnalysisConsole();
        this.updateCredits();
    }

    async runBootSequence() {
        await wait(200);
        this.navbar.classList.add('is-visible');
        await wait(800);

        if (this.elements.brand) {
            const brandScramble = new TextScramble(this.elements.brand);
            const brandText = this.elements.brand.dataset.text || 'A.P.I.S. TERMINAL';
            await brandScramble.setText(brandText);
        }

        const bootItems = Array.from(this.elements.navItems);
        bootItems.forEach(item => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        });
        await wait(100);

        this.navbar.classList.remove('is-booting');
        this.state.isBooting = false;
        this.updateActiveLink();
    }

    updateActiveLink() {
        if (this.state.isBooting) return;

        let currentSectionId = null;
        const offset = window.innerHeight / 2;
        const scrollY = window.scrollY;

        // Trova la sezione più vicina al centro dello schermo
        let closestDistance = Infinity;

        this.elements.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            try {
                const section = document.querySelector(href);
                if (section) {
                    const rect = section.getBoundingClientRect();
                    const sectionTop = scrollY + rect.top;
                    const sectionCenter = sectionTop + rect.height / 2;
                    const distanceFromCenter = Math.abs(scrollY + offset - sectionCenter);

                    if (distanceFromCenter < closestDistance) {
                        closestDistance = distanceFromCenter;
                        currentSectionId = href;
                    }
                }
            } catch (error) {
                console.warn(`Errore nel calcolo della sezione per ${href}:`, error);
            }
        });

        // Aggiorna le classi con una transizione fluida
        this.elements.navLinks.forEach(link => {
            const shouldBeActive = link.getAttribute('href') === currentSectionId;
            const isCurrentlyActive = link.classList.contains('is-active');

            if (shouldBeActive !== isCurrentlyActive) {
                // Piccola pausa per transizioni più fluide
                setTimeout(() => {
                    link.classList.toggle('is-active', shouldBeActive);
                }, 50);
            }
        });
    }

    startClock() {
        if (!this.elements.clock) return;
        const startTime = Date.now();
        const clockInterval = setInterval(() => {
            if (!document.body.contains(this.elements.clock)) {
                clearInterval(clockInterval);
                return;
            }
            const elapsedTime = Date.now() - startTime;
            const seconds = Math.floor((elapsedTime / 1000) % 60).toString().padStart(2, '0');
            const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60).toString().padStart(2, '0');
            const hours = Math.floor(elapsedTime / (1000 * 60 * 60)).toString().padStart(2, '0');
            const separator = '<span class="separator">:</span>';
            this.elements.clock.innerHTML = `UPTIME: ${hours}${separator}${minutes}${separator}${seconds}`;
        }, 1000);
    }

    startHighScore() {
        if (!this.elements.highScoreDisplay) return;
        const interval = setInterval(() => {
            if (!document.body.contains(this.elements.highScoreDisplay)) {
                clearInterval(interval);
                return;
            }
            this.state.highScore += Math.floor(Math.random() * 15);
            this.elements.highScoreDisplay.textContent = this.state.highScore.toString().padStart(6, '0');
        }, 1500);
    }

    updateCredits() {
        if (!this.elements.creditsValue) return;
        this.elements.creditsValue.textContent = this.state.credits;
        const display = this.elements.creditsDisplay;
        display.classList.toggle('insert-coin', this.state.credits === 0);
        display.title = this.state.credits === 0 ? "Click to insert coin!" : "";
    }

    startSystemLog() {
        const { logCpu, logMem, logGpu, logNet } = this.elements;
        if (!logCpu || !logMem || !logGpu || !logNet) return;

        const createUsageBar = (percentage, length = 10) => {
            const filledCount = Math.round(Math.max(0, Math.min(100, percentage)) / 100 * length);
            return `[${'|'.repeat(filledCount)}${'.'.repeat(length - filledCount)}]`;
        };

        const getStatusClass = (value, isNet = false) => {
            const highThreshold = isNet ? 100 : 85;
            const midThreshold = isNet ? 50 : 50;
            if (value > highThreshold) return 'status-critical';
            if (value > midThreshold) return 'status-warning';
            return 'status-nominal';
        };

        const logInterval = setInterval(() => {
            if (!document.body.contains(logCpu)) {
                clearInterval(logInterval);
                return;
            }
            const cpuValue = Math.floor(Math.random() * 99) + 1;
            logCpu.className = getStatusClass(cpuValue);
            logCpu.innerHTML = `CPU: ${createUsageBar(cpuValue)} <span class="${getStatusClass(cpuValue)}">${cpuValue}%</span>`;

            const memValue = Math.floor(Math.random() * 90) + 10;
            logMem.className = getStatusClass(memValue);
            logMem.innerHTML = `MEM: ${createUsageBar(memValue)} <span class="${getStatusClass(memValue)}">${memValue}%</span>`;

            const gpuValue = Math.floor(Math.random() * 99) + 1;
            logGpu.className = getStatusClass(gpuValue);
            logGpu.innerHTML = `GPU: ${createUsageBar(gpuValue)} <span class="${getStatusClass(gpuValue)}">${gpuValue}%</span>`;

            const netValue = Math.floor(Math.random() * 150) + 8;
            logNet.className = getStatusClass(netValue, true);
            logNet.innerHTML = `NET: ${createUsageBar(netValue / 2, 10)} <span class="${getStatusClass(netValue, true)}">${netValue}ms</span>`;
        }, 2000);
    }

    startAnalysisConsole() {
        if (!this.scramblers.analysis) return;
        const messages = [
            'SCANNING FOR VIRUSES...', 'CHECKING SYSTEM INTEGRITY...', 'COMPILING SHADERS...',
            'DEFRAGMENTING MEMORY...', 'CALIBRATING GPU CLOCKS...', 'SYSTEM STATUS: NOMINAL'
        ];
        let index = 0;
        const cycleMessages = async () => {
            if (!document.body.contains(this.elements.analysisConsole)) return;
            await this.scramblers.analysis.setText(messages[index]);
            index = (index + 1) % messages.length;
            this.state.analysisTimeout = setTimeout(cycleMessages, 4000);
        };
        clearTimeout(this.state.analysisTimeout);
        this.state.analysisTimeout = setTimeout(cycleMessages, 4000);
    }

    destroy() {
        if (this._konamiHandler) {
            EventBus.off('global:keydown', this._konamiHandler);
        }
        if (this._scrollHandler) {
            EventBus.off('global:scroll', this._scrollHandler);
        }
        if (this._directScrollHandler) {
            window.removeEventListener('scroll', this._directScrollHandler);
        }
        // ...altre operazioni di pulizia se necessario
    }
}
