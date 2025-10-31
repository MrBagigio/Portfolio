// src/core/app/main.js

import { Application } from './App.js';
import { globalEventManager } from '../events/GlobalEventManager.js';
import EventBus from '../../utils/events/EventBus.js';
import '../../utils/htmlSanitizer.js'; // Import HTML sanitizer for XSS protection

// Inizializza subito il gestore di eventi globali
globalEventManager.init();

// Avvia l'intera applicazione quando il DOM è pronto.
EventBus.on('global:domcontentloaded', () => {
    const app = new Application();
    
    // Inizializza l'applicazione e gestisci eventuali errori critici.
    app.init().catch(err => {
        console.error("🔥 Errore critico durante l'inizializzazione dell'App:", err);
        // Fallback: Se tutto fallisce, almeno mostra il contenuto.
        document.body.classList.remove('is-loading');
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.classList.add('active');
    });
});

EventBus.on('global:load', () => {
    // Fallback: se il body è ancora marcato come loading, mostra il contenuto
    if (document.body.classList.contains('is-loading')) {
        document.body.classList.remove('is-loading');
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.classList.add('active');
    }
});