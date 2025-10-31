// src/setup/animations/revealAnimations.js

import { GlitchImage } from '../../components/effects/GlitchImage.js';
import { TextScramble } from '../../components/ui/TextScramble.js';

function initHeroTyping() {
    const heroParagraph = document.querySelector('#hero p');
    if (!heroParagraph) return;
    const phrases = ["> Accesso autorizzato...", "> Caricamento database progetti...", "> Benvenuto, Operatore."];
    const fx = new TextScramble(heroParagraph);
    let counter = 0;
    const next = () => {
        if (counter < phrases.length) {
            fx.setText(phrases[counter]).then(() => {
                setTimeout(next, 800);
            });
            counter++;
        }
    };
    setTimeout(next, 1000);
}

function initGenericReveal() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
    
    // --- MODIFICA CHIAVE: Aggiunta l'esclusione per .title-3d ---
    const revealTargets = Array.from(document.querySelectorAll('.reveal:not(#hero p):not(.dossier-item):not(.title-3d)'));
    revealTargets.forEach(el => observer.observe(el));

    const fallbackReveal = () => {
        revealTargets.forEach(el => {
            if (el.classList.contains('visible')) return;
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('visible');
                observer.unobserve(el);
            }
        });
    };

    fallbackReveal();
    window.addEventListener('load', fallbackReveal, { once: true });
    window.addEventListener('scroll', fallbackReveal, { once: true, passive: true });
}

function initDossierReveal() {
    const dossierList = document.querySelector('.dossier-list');
    if (!dossierList) return;

    const observer = new IntersectionObserver(async (entries, obs) => {
        if (entries[0].isIntersecting) {
            const items = dossierList.querySelectorAll('.dossier-item');
            
            const animateItem = async (item) => {
                const dd = item.querySelector('dd');
                if (!dd) return;

                const fx = new TextScramble(dd);
                item.style.opacity = 1;
                
                await fx.setText(dd.textContent);
                await new Promise(resolve => setTimeout(resolve, 100));
            };

            for (const item of items) {
                await animateItem(item);
            }

            obs.unobserve(dossierList);
        }
    }, { threshold: 0.5 });

    observer.observe(dossierList);
}

function initImageGlitch() {
    const profileCanvas = document.getElementById('profile-picture-canvas');
    if (!profileCanvas) return;
    const imageContainer = profileCanvas.parentElement;
    if (!imageContainer) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const containerWidth = imageContainer.clientWidth;
                profileCanvas.width = containerWidth;
                profileCanvas.height = containerWidth / (4 / 5);
                try {
                    const imagePath = 'assets/img/Foto_profilo.jpg';
                    const glitchEffect = new GlitchImage(profileCanvas, imagePath);
                    glitchEffect.init();
                } catch(error) {
                    console.error("Errore GlitchImage:", error);
                }
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.01 });
    
    observer.observe(imageContainer);
}

export function initRevealAnimations() {
    initHeroTyping();
    initGenericReveal();
    initDossierReveal();
    initImageGlitch();
}