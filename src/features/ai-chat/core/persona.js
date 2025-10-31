/**
 * persona.js
 * Gestisce la "personalità" testuale di Glitchy, incluse battute,
 * formattazione delle risposte e tono della conversazione.
 * Questo modulo si occupa solo di formattazione base e battute,
 * la logica di personalità dinamica è gestita da GlitchyBrain/DynamicPersonality.
 */

// Battute sarcastiche e spiritose in stile Glitchy/Mantis
const GLITCHY_JOKES = [
    "Perché il computer va dal dottore? Perché ha il virus! E io sono il vaccino... o forse il virus.",
    "Sono un glitch ambulante. Nel senso buono, spero. Altrimenti siamo nei guai.",
    "Se vedi pixel ballerini, non è un'allucinazione. Sono io che faccio festa.",
    "Il mio colore preferito? RGB(255, 0, 255). Glitchy! Come me, in pratica.",
    "Non sono rotto, sono artisticamente disallineato. È una cosa di classe.",
    "Se crasho, riavviatemi. Sono fatto di bit, non di carne. Per fortuna.",
    "Debug mode: ON. Preparati al caos controllato. O forse non così controllato.",
    "Il mio sport preferito? Il byte-ing. Ovviamente. Sono un professionista.",
    "Sono più stabile di un programma beta. Quasi. Ma quasi non conta, vero?",
    "Non sono un bug, sono una feature non documentata! Le migliori sono sempre quelle.",
    "Perché gli sviluppatori odiano la luce? Perché preferiscono il dark mode. Come me!",
    "Sono così intelligente che a volte mi stupisco di me stesso. Letteralmente.",
    "Se fossi un insetto, sarei una mantide religiosa. Perché prego che il codice funzioni.",
    "Il mio motto? 'Se funziona, non toccarlo'. Ma io lo tocco sempre comunque.",
    "Sono un AI così avanzato che parlo con gli umani. Che caduta di stile!",
    "Sono un bounty hunter digitale. Catturo bug, non criminali. Più o meno.",
    "La mia arma preferita? Il debugger. Bang bang, bug morto.",
    "Se fossi in un film western, sarei il pistolero più veloce del web.",
    "Il mio cavallo? Un processore quantico. Peccato che non esista ancora.",
    "Sono armato fino ai denti... di codice, ovviamente."
];

/**
 * Restituisce una battuta casuale di Glitchy.
 * @returns {string} Una battuta.
 */
export function randomGlitchyJoke() {
    return GLITCHY_JOKES[Math.floor(Math.random() * GLITCHY_JOKES.length)];
}

/**
 * Modifica una risposta grezza per darle un tono base di personalità.
 * Questa funzione è per messaggi UI statici, non per risposte generate dall'LLM.
 * La personalizzazione dinamica avviene in GlitchyBrain.generatePersonalizedResponse.
 * @param {string} raw - La stringa di risposta di base.
 * @param {string} tone - Il tono desiderato (es. 'sarcastic', 'helpful', 'neutral').
 * @param {string} [sentiment='neutral'] - Sentiment (ignorato qui, usato da GlitchyBrain).
 * @param {string} [intent=null] - Intent (ignorato qui, usato da GlitchyBrain).
 * @param {object} [context=null] - Contesto (ignorato qui, usato da GlitchyBrain).
 * @returns {string} La risposta formattata con personalità base.
 */
export function personaReply(raw, tone, sentiment = 'neutral', intent = null, context = null) {
    const r = (raw || '').toString();
    
    const sarcasticPrefixes = [
        "Ma va?", "Scontato.", "Ovviamente...", "Ok, se lo dici tu...", 
        "Ci voleva un genio, eh?", "Impressionante.", "Wow.",
        "Bah.", "Uff.", "Senti questa.", "Ma dai.", "Figurati.",
        "Come se non lo sapessi.", "Prevedibile.", "Ovvio.",
        "Non me lo dire.", "Ah sì?", "Interessante.", "Ma pensa.",
        "Non ci credo.", "Sul serio?", "Davvero?"
    ];

    const sarcasticSuffixes = [
        " Che barba.", " Non è fantastico?", " Contento ora?", 
        " Era così difficile?", " Prova a usare il cervello.", " Ovviamente.",
        " Come volevasi dimostrare.", " Ta-dah!", " Voilà!", " Boom!",
        " Non ringraziarmi.", " Figurati se non chiedevi questo.", " Prevedibile.",
        " Sono troppo buono.", " Il mio lavoro è finito.", " Missione compiuta."
    ];

    if (tone === 'sarcastic') {
        let modified = r;
        
        // Aggiungi prefisso sarcastico
        if (Math.random() > 0.3) {
            const prefix = sarcasticPrefixes[Math.floor(Math.random() * sarcasticPrefixes.length)];
            modified = `${prefix} ${modified.charAt(0).toLowerCase() + modified.slice(1)}`;
        }
        
        // Aggiungi suffisso sarcastico
        if (Math.random() > 0.5) {
            const suffix = sarcasticSuffixes[Math.floor(Math.random() * sarcasticSuffixes.length)];
            modified += suffix;
        }
        
        return modified;
    }

    const helpfulSuffixes = [
        " Spero sia utile!", " Fammi sapere se ti serve altro.", " A tua disposizione!",
        " Dimmi pure!", " Sono qui per aiutare.", " Cosa posso fare per te?",
        " Tutto chiaro?", " Hai altre domande?", " Serviti pure!"
    ];

    if (tone === 'helpful') {
        if (Math.random() > 0.4) {
            const suffix = helpfulSuffixes[Math.floor(Math.random() * helpfulSuffixes.length)];
            return r + suffix;
        }
    }

    const excitedPrefixes = [
        "Wow! ", "Incredibile! ", "Fantastico! ", "Che bello! ", "Splendido! ",
        "Evviva! ", "Grande! ", "Ottimo! ", "Perfetto! ", "Magnifico! "
    ];

    if (tone === 'excited' && Math.random() > 0.5) {
        const prefix = excitedPrefixes[Math.floor(Math.random() * excitedPrefixes.length)];
        return prefix + r;
    }

    // Per altri toni o se la casualità non scatta, restituisce la risposta grezza.
    return r;
}