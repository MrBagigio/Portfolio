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
        'greeting',
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
        'showPersonality',
        'who_are_you',
        'can_do',
        'what_do_you_do'
    ],

    // Messaggi di benvenuto casuali
    welcomeMessages: [
        `Ehilà! Sono Glitchy, l'IA bounty hunter di questo portfolio. Alessandro è il tipo che crea mondi 3D. Prova "apri progetto Biosphaera" se vuoi vedere qualcosa.`,
        `Ciao, umano. Sono Glitchy, la guida digitale irritabile. Gestisco questo sito per conto di Alessandro. Prova a dire "mostra progetti" per vedere i suoi lavoretti.`,
        `Salve! Glitchy qui, l'IA con la tuta da bounty hunter. Alessandro è un 3D artist che lavora con Maya e compagnia. Digita "chi è Alessandro" per saperne di più.`,
        `Oh, un visitatore. Sono Glitchy, l'assistente virtuale di questo portfolio. Alessandro crea ambienti 3D spettacolari. Prova "cosa puoi fare" per vedere i miei comandi.`
    ],

    // Passi dell'onboarding
    onboardingSteps: [
        { text: `Benvenuto! Sono Glitchy. Vuoi una battuta per rompere il ghiaccio?`, quickReplies: [{ label: 'Certo, spara!', action: 'mantis-joke' }, { label: 'No, vai avanti', action: 'onboarding-next' }] },
        { text: 'Posso aprire i progetti per te. Prova a cliccare qui sotto.', quickReplies: [{ label: 'Apri "Biosphaera"', action: 'open-project', payload: 'biosphaera' }, { label: 'Avanti', action: 'onboarding-next' }] },
        { text: 'E anche cambiare il cursore. Che ne dici di Pacman?', quickReplies: [{ label: 'Mostrami Pacman', action: 'set-cursor', payload: 'pacman' }, { label: 'Salta', action: 'onboarding-skip' }] },
        { text: 'Perfetto! Il tour è finito. Se hai bisogno, premi "/" o clicca sulla mia icona.', quickReplies: [{ label: 'Ho capito!', action: 'onboarding-skip' }] }
    ],

    // Messaggi di errore specifici
    errorMessages: {
        networkError: 'Non riesco a connettermi ai miei server centrali in questo momento. Riprova più tardi.',
        apiUnavailable: 'La funzione API non è attiva. Assicurati di eseguire il server di sviluppo.',
        parsingError: 'Errore di elaborazione della risposta dal server.',
        genericError: 'Un errore inatteso ha bloccato l\'elaborazione.',
        commandNotImplemented: 'Il comando non è ancora implementato o ha parametri mancanti.',
        unauthorizedAction: 'Azione non autorizzata.',
        invalidCommand: 'Comando non valido.'
    },

    // Comandi slash disponibili
    slashCommands: {
        log: 'Mostra le ultime 10 interazioni della conversazione',
        exportlog: 'Esporta il log completo delle conversazioni in JSON',
        clearlog: 'Cancella tutto il log delle conversazioni'
    }
};