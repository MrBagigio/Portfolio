/**
 * config.js
 * Contiene la configurazione globale per il widget AI.
 * Centralizzare la configurazione rende il codice più facile da mantenere.
 */

export const CONFIG = {
    // Impostazioni generali del bot
    name: 'Glitchy',
    defaultTone: 'sarcastic',

    // Impostazioni di performance e UX
    typingMsPerChar: 15, // Velocità di digitazione simulata
    
    // Impostazioni di storage
    persistKey: 'ai_chat_history', // Chiave per salvare la cronologia nel localStorage

    // Whitelist delle azioni che Glitchy è autorizzato a eseguire.
    // Questo è un meccanismo di sicurezza fondamentale.
    allowedActions: [
        'openProject', 
        'setCursor', 
        'navigate', 
        'playSound', 
        'searchProjects', 
        'setTheme', 
        'setAccessibility', 
        'suggestAction', 
        'analyzeCode', 
        'gitStatus', 
        'getWeather', 
        'systemInfo', 
        'learnPreference', 
        'codeSnippet', 
        'calculate', 
        'showAnalytics', 
        'getGeneralKnowledge', 
        'getNewsHeadlines', 
        'previewMultimedia', 
        'showPersonality'
    ]
};