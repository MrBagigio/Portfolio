// assets/js/setup/projectGallery.js

const createVideo = src => {
    const v = document.createElement('video');
    v.loop = true; v.muted = true; v.playsInline = true; v.preload = 'none';
    const s = document.createElement('source');
    s.src = src; s.type = 'video/mp4';
    v.appendChild(s);
    return v;
};

function setupVideoLoading(grid) {
    const videoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slider = entry.target.querySelector('.comparison-slider');
                if (slider && !slider.dataset.videosLoaded) {
                    slider.dataset.videosLoaded = "true";
                    slider.querySelector('.video-background').appendChild(createVideo(slider.dataset.videoBeforeMp4));
                    slider.querySelector('.video-foreground').appendChild(createVideo(slider.dataset.videoAfterMp4));
                    slider.querySelectorAll('video').forEach(v => v.load());
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    grid.querySelectorAll('.project-card').forEach(card => videoObserver.observe(card));
}

function setupSliderInteractions(grid) {
    grid.querySelectorAll('.comparison-slider').forEach(slider => {
        slider.addEventListener('click', e => e.preventDefault());
        const fg = slider.querySelector('.video-foreground');
        const handle = slider.querySelector('.slider-handle');
        let targetX = 50, currentX = 50, animationFrame, timeoutId = null;

        const animate = () => {
            currentX += (targetX - currentX) * 0.15;
            fg.style.clipPath = `polygon(0 0, ${currentX}% 0, ${currentX}% 100%, 0 100%)`;
            handle.style.left = `${currentX}%`;
            animationFrame = requestAnimationFrame(animate);
        };

        slider.addEventListener('mousemove', e => {
            targetX = (e.clientX - slider.getBoundingClientRect().left) / slider.clientWidth * 100;
        });
        slider.addEventListener('mouseleave', () => { targetX = 50; });

        const card = slider.closest('.project-card');
        card.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
            slider.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
            cancelAnimationFrame(animationFrame);
            animate();
        });
        card.addEventListener('mouseleave', () => {
            slider.querySelectorAll('video').forEach(v => v.pause());
            timeoutId = setTimeout(() => cancelAnimationFrame(animationFrame), 300);
        });
    });
}

function setupSliderTapInteractions(grid, { prefersReducedMotion = false } = {}) {
    grid.querySelectorAll('.project-card').forEach(card => {
        const slider = card.querySelector('.comparison-slider');
        const poster = card.querySelector('.poster-image');
        const innerCard = card.querySelector('.card-inner');
        if (!slider || !poster || !innerCard) return;

        let isPreviewActive = false;
        let resetTimer = null;
        card.addEventListener('click', (e) => {
            if (!isPreviewActive) {
                e.preventDefault();
                e.stopPropagation();
                isPreviewActive = true;
                slider.style.opacity = 1;
                slider.style.pointerEvents = 'auto';
                poster.style.opacity = 0;
                if (!prefersReducedMotion) {
                    card.classList.add('is-hovered');
                    gsap.to(innerCard, {
                        scale: 1.04,
                        translateZ: 32,
                        '--thrust-opacity': 0.8,
                        '--thrust-length': 1.25,
                        '--thrust-spread': 1.15,
                        duration: 0.45,
                        ease: 'back.out(1.25)'
                    });
                }
                slider.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
                if (resetTimer) clearTimeout(resetTimer);
                resetTimer = setTimeout(() => {
                    if (!isPreviewActive) return;
                    isPreviewActive = false;
                    if (!prefersReducedMotion) {
                        card.classList.remove('is-hovered');
                    }
                    slider.style.opacity = 0;
                    slider.style.pointerEvents = 'none';
                    poster.style.opacity = 1;
                    if (!prefersReducedMotion) {
                        gsap.to(innerCard, {
                            rotationY: 0,
                            rotationX: 0,
                            scale: 1,
                            translateZ: 0,
                            '--thrust-opacity': 0,
                            '--thrust-length': 1,
                            '--thrust-spread': 1,
                            ease: 'power3.out',
                            duration: 0.6
                        });
                    }
                    slider.querySelectorAll('video').forEach(v => v.pause());
                }, 6000);
            } else {
                if (resetTimer) clearTimeout(resetTimer);
                isPreviewActive = false;
                if (!prefersReducedMotion) {
                    card.classList.remove('is-hovered');
                }
                slider.style.opacity = 0;
                slider.style.pointerEvents = 'none';
                poster.style.opacity = 1;
                if (!prefersReducedMotion) {
                    gsap.to(innerCard, {
                        rotationY: 0,
                        rotationX: 0,
                        scale: 1,
                        translateZ: 0,
                        '--thrust-opacity': 0,
                        '--thrust-length': 1,
                        '--thrust-spread': 1,
                        ease: 'back.out(1.2)',
                        duration: 0.6
                    });
                }
                slider.querySelectorAll('video').forEach(v => v.pause());
            }
        });
        card.addEventListener('mouseleave', () => {
            if (!isPreviewActive) return;
            if (resetTimer) clearTimeout(resetTimer);
            isPreviewActive = false;
            if (!prefersReducedMotion) {
                card.classList.remove('is-hovered');
            }
            slider.style.opacity = 0;
            slider.style.pointerEvents = 'none';
            poster.style.opacity = 1;
            if (!prefersReducedMotion) {
                gsap.to(innerCard, {
                    rotationY: 0,
                    rotationX: 0,
                    scale: 1,
                    translateZ: 0,
                    '--thrust-opacity': 0,
                    '--thrust-length': 1,
                    '--thrust-spread': 1,
                    ease: 'power3.out',
                    duration: 0.6
                });
            }
            slider.querySelectorAll('video').forEach(v => v.pause());
        });
    });
}

function setupTooltips(grid) {
    const tooltip = document.createElement('div');
    tooltip.className = 'project-tooltip';
    document.body.appendChild(tooltip);

    grid.querySelectorAll('.project-card').forEach(card => {
        const tools = card.dataset.tools;
        if (!tools) return;

        card.addEventListener('mouseenter', () => {
            tooltip.innerHTML = `// STRUMENTI: ${tools}`;
            tooltip.classList.add('visible');
        });
        card.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });
    
    window.addEventListener('mousemove', e => {
        gsap.to(tooltip, {
            x: e.clientX + 15,
            y: e.clientY + 15,
            duration: 0.4,
            ease: 'power3.out'
        });
    });
}

function setup3dTiltEffect(grid) {
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    grid.querySelectorAll('.project-card').forEach(card => {
        const innerCard = card.querySelector('.card-inner');
        const maxRotation = 8; // Intensificato leggermente da 6 a 8

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
            const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
            
            gsap.to(innerCard, {
                rotationY: mouseX * maxRotation * 2, // Ora fino a ±32 gradi
                rotationX: -mouseY * maxRotation * 2,
                ease: 'power1.out',
                duration: 0.8
            });
        });

        card.addEventListener('mouseenter', () => {
            gsap.to(innerCard, {
                scale: 1.08, // Intensificato leggermente da 1.05 a 1.08
                translateZ: 60, // Intensificato da 40 a 60 per più profondità
                '--thrust-opacity': 0.85,
                '--thrust-length': 1.35,
                '--thrust-spread': 1.2,
                duration: 0.55,
                ease: 'back.out(1.35)'
            });
            card.classList.add('is-hovered');
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(innerCard, {
                rotationY: 0,
                rotationX: 0,
                scale: 1,
                translateZ: 0,
                '--thrust-opacity': 0,
                '--thrust-length': 1,
                '--thrust-spread': 1,
                ease: 'back.out(1.2)',
                duration: 0.7
            });
            card.classList.remove('is-hovered');
        });
    });
}

export async function setupProjectGallery() {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) {
        console.error("Elemento '.project-grid' non trovato. Impossibile inizializzare la galleria.");
        return [];
    }
    if (projectGrid.hasAttribute('data-initialized')) return [];
    projectGrid.setAttribute('data-initialized', 'true');

    try {
        const response = await fetch('assets/projects.json');
        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`);
        }
        const projectData = await response.json();

        projectGrid.innerHTML = projectData.map(p => `
            <a href="#" data-project-id="${p.id}" class="project-card reveal" data-tools="${p.tools.join(', ')}">
                <div class="card-inner">
                    <div class="card-header">
                        <span class="file-name">PROGETTO_${p.id.toUpperCase()}.case</span>
                        <span class="file-size">${p.fileSize}</span>
                    </div>
                    <div class="card-visual">
                        <img src="${p.poster}" alt="Poster: ${p.title}" class="poster-image" loading="lazy">
                        <div class="comparison-slider" data-video-before-mp4="${p.videos.before.mp4}" data-video-after-mp4="${p.videos.after.mp4}">
                            <div class="video-container video-background"></div>
                            <div class="video-container video-foreground"></div>
                            <div class="slider-handle"><div class="slider-arrow"></div></div>
                        </div>
                        <div class="interactive-cue"></div>
                    </div>
                    <div class="card-footer">
                        <span class="file-date">MODIFICATO: ${p.date}</span>
                        <span class="file-action">APRI DOSSIER &rarr;</span>
                    </div>
                </div>
            </a>`).join('');
        
        setupVideoLoading(projectGrid);

        const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (isCoarsePointer) {
            projectGrid.classList.add('touch-friendly');
            setupSliderTapInteractions(projectGrid, { prefersReducedMotion });
        } else {
            setupSliderInteractions(projectGrid);
        }

        setupTooltips(projectGrid);

        if (!isCoarsePointer && !prefersReducedMotion) {
            setup3dTiltEffect(projectGrid);
        }

        return projectData;
    } catch (error) {
        console.error('Errore durante il caricamento o la creazione della galleria progetti:', error);
        projectGrid.innerHTML = `<div class="error-message">
            <p><strong>ERRORE DI CONNESSIONE</strong></p>
            <p>Impossibile caricare i dati dei progetti. Riprova più tardi.</p>
            <p class="error-details">Dettagli: ${error.message}</p>
        </div>`;
        return [];
    }
}