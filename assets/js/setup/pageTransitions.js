// assets/js/setup/pageTransitions.js

/**
 * Gestisce la transizione tra diverse "viste" (pagine virtuali) in una SPA.
 * @param {string} targetViewId - L'ID dell'elemento della vista da mostrare.
 */
export function switchView(targetViewId) {
    // Nascondi tutte le viste attive
    document.querySelectorAll('.page-view.active').forEach(view => {
        view.classList.remove('active');
        view.classList.add('is-leaving');
    });

    const targetView = document.getElementById(targetViewId);
    if (targetView) {
        targetView.classList.remove('is-leaving');
        targetView.classList.add('active');
        window.scrollTo(0, 0); // Torna in cima alla nuova vista
    } else {
        console.error(`Vista non trovata: ${targetViewId}`);
    }
}