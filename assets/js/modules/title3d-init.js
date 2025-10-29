import { Title3D } from './Title3D.js';

function initTitles() {
    const titles = Array.from(document.querySelectorAll('h2.title-3d'));
    // Force remove overlay if visible (debug)
    const overlay = document.querySelector('#page-transition-overlay');
    if (overlay && getComputedStyle(overlay).display !== 'none') {
        // Use setProperty to apply !important via the style API
        try {
            overlay.style.setProperty('display', 'none', 'important');
        } catch (e) {
            // Fallback to plain none if setProperty isn't supported
            overlay.style.display = 'none';
        }
    }
    // Note: Removed forced removal of is-loading class - let preloader handle this
    if (!window.__Title3DInstances) window.__Title3DInstances = [];
    titles.forEach((el, idx) => {
        // Force reveal the title (debug)
        el.classList.add('visible');
        // create a wrapper container to host canvas
        // if element is already wrapped, skip
        if (el.dataset._title3d === '1') return;
        el.dataset._title3d = '1';

        // Ensure container has some height for canvas
        el.style.minHeight = el.style.minHeight || '80px';
        el.style.display = 'block';
        el.style.position = 'relative';

        // instantiate Title3D and keep reference for debugging
        try {
            const instance = new Title3D(el, el.innerText.trim());
            window.__Title3DInstances.push(instance);
        } catch (e) {
            console.warn('title3d-init: errore inizializzazione Title3D', e);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for preloader to complete before initializing 3D titles
        if (document.body.classList.contains('is-loading')) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (!document.body.classList.contains('is-loading')) {
                            observer.disconnect();
                            initTitles();
                        }
                    }
                });
            });
            observer.observe(document.body, { attributes: true });
        } else {
            initTitles();
        }
    });
} else {
    // Wait for preloader to complete before initializing 3D titles
    if (document.body.classList.contains('is-loading')) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!document.body.classList.contains('is-loading')) {
                        observer.disconnect();
                        initTitles();
                    }
                }
            });
        });
        observer.observe(document.body, { attributes: true });
    } else {
        initTitles();
    }
}
