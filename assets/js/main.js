// assets/js/main.js

// Il percorso corretto per importare App.js dalla cartella 'core'
import { Application } from './core/App.js';

// Avvia l'intera applicazione quando il DOM è pronto.
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    
    // Esponi l'app globalmente per un facile debugging dalla console del browser.
    // Rimuovi o commenta questa riga per la versione finale del sito.
    // window.App = app; 
    
    // Inizializza l'applicazione e gestisci eventuali errori critici.
    app.init().catch(err => {
        console.error("🔥 Errore critico durante l'inizializzazione dell'App:", err);
        // Fallback: Se tutto fallisce, almeno mostra il contenuto.
        document.body.classList.remove('is-loading');
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.classList.add('active');
    });
});

window.addEventListener('load', () => {
    // Fallback: se il body è ancora marcato come loading, mostra il contenuto
    if (document.body.classList.contains('is-loading')) {
        document.body.classList.remove('is-loading');
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.classList.add('active');
    }
});