/**
 * persona.js
 * Gestisce la "personalità" testuale di Glitchy, incluse battute,
 * formattazione delle risposte e tono della conversazione.
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
    "Sono un AI così avanzato che parlo con gli umani. Che caduta di stile!"
];

/**
 * Restituisce una battuta casuale di Glitchy.
 * @returns {string} Una battuta.
 */
export function randomGlitchyJoke() {
    return GLITCHY_JOKES[Math.floor(Math.random() * GLITCHY_JOKES.length)];
}

/**
 * Modifica una risposta grezza per darle il tono della personalità di Glitchy.
 * @param {string} raw - La stringa di risposta di base.
 * @param {string} tone - Il tono desiderato (es. 'sarcastic', 'helpful').
 * @returns {string} La risposta formattata con personalità.
 */
export function personaReply(raw, tone) {
    const r = (raw || '').toString();
    
    // Al momento, questa è una logica semplice. In futuro, potrebbe usare
    // la DynamicPersonality per risposte ancora più complesse.
    const sarcasticPrefixes = [
        "Ma va?", "Scontato.", "Ovviamente...", "Ok, se lo dici tu...", 
        "Ci voleva un genio, eh?", "Impressionante.", "Wow."
    ];

    if (tone === 'sarcastic' && Math.random() > 0.4) {
        const prefix = sarcasticPrefixes[Math.floor(Math.random() * sarcasticPrefixes.length)];
        return `${prefix} ${r.charAt(0).toLowerCase() + r.slice(1)}`;
    }

    const helpfulSuffixes = [
        " Spero sia utile!", " Fammi sapere se ti serve altro.", " A tua disposizione!"
    ];

    if (tone === 'helpful' && Math.random() > 0.6) {
        const suffix = helpfulSuffixes[Math.floor(Math.random() * helpfulSuffixes.length)];
        return r + suffix;
    }

    return r;
}