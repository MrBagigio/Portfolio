// File: /assets/js/modules/NLU.js

// Importiamo la base di conoscenza per renderla disponibile all'NLU
import { KNOWLEDGE_BASE } from './knowledgeBase.js';

/**
 * Sistema avanzato di sinonimi e variazioni linguistiche
 */
const SYNONYM_MAP = {
    // Azioni
    'apri': ['apri', 'mostra', 'vedi', 'visualizza', 'carica', 'lancia', 'avvia', 'esegui'],
    'vai': ['vai', 'naviga', 'spostati', 'vai a', 'portami a', 'muovi', 'salta'],
    'cerca': ['cerca', 'trova', 'scopri', 'localizza', 'identifica', 'ricerca'],
    'imposta': ['imposta', 'cambia', 'modifica', 'altera', 'configura', 'regola', 'metti'],
    'analizza': ['analizza', 'controlla', 'esamina', 'verifica', 'ispeziona', 'studi'],
    'calcola': ['calcola', 'risolvi', 'computa', 'elabora', 'determina', 'valuta'],
    
    // Oggetti
    'progetto': ['progetto', 'lavoro', 'portfolio', 'realizzazione', 'creazione', 'opera'],
    'cursore': ['cursore', 'puntatore', 'mouse', 'pointer', 'cursore del mouse'],
    'tema': ['tema', 'modalità', 'aspetto', 'skin', 'tema visivo', 'colore'],
    'battuta': ['battuta', 'scherzo', 'barzelletta', 'joke', 'facezia', 'spiritosaggine'],
    
    // Sezioni del sito
    'hero': ['hero', 'home', 'inizio', 'principale', 'homepage', 'benvenuto'],
    'projects': ['projects', 'progetti', 'lavori', 'portfolio', 'galleria', 'opere'],
    'about': ['about', 'chi sono', 'profilo', 'biografia', 'su di me', 'informazioni'],
    'contact': ['contact', 'contatti', 'contatto', 'scrivimi', 'email', 'messaggio'],
    
    // Cursori
    'pacman': ['pacman', 'pac-man', 'pacman game', 'mangia palline'],
    'asteroids': ['asteroids', 'asteroidi', 'spazio', 'navicella', 'astronave'],
    'default': ['default', 'normale', 'standard', 'classico', 'originale'],
    
    // Temi
    'scuro': ['scuro', 'dark', 'notte', 'nero', 'scura', 'buio'],
    'chiaro': ['chiaro', 'light', 'giorno', 'bianco', 'luminoso', 'luce'],
    
    // Tecnologie
    'javascript': ['javascript', 'js', 'java script', 'ecmascript'],
    'webgl': ['webgl', 'web gl', 'opengl web', '3d web'],
    'three.js': ['three.js', 'threejs', 'three js', 'libreria 3d'],
    'react': ['react', 'reactjs', 'react js', 'facebook react'],
    'vue': ['vue', 'vuejs', 'vue js', 'vue.js'],
    
    // Comandi generali
    'aiuto': ['aiuto', 'help', 'aiutami', 'soccorso', 'guida', 'istruzioni'],
    'info': ['info', 'informazioni', 'dettagli', 'dati', 'statistiche'],
    'tempo': ['tempo', 'meteo', 'clima', 'pioggia', 'sole', 'temperatura']
};

/**
 * Sistema di contesto conversazionale per NLU
 */
class ContextManager {
    constructor() {
        this.context = {
            currentTopic: null,
            recentEntities: [],
            conversationHistory: [],
            userPreferences: {},
            lastIntent: null,
            confidence: 0
        };
    }

    updateContext(intent, entities, confidence) {
        this.context.lastIntent = intent;
        this.context.confidence = confidence;
        
        // Aggiorna entità recenti
        Object.keys(entities).forEach(key => {
            if (entities[key]) {
                this.context.recentEntities.unshift(entities[key]);
                this.context.recentEntities = this.context.recentEntities.slice(0, 5); // Mantieni ultime 5
            }
        });
        
        // Determina topic corrente basato sull'intent
        this.updateTopic(intent, entities);
    }

    updateTopic(intent, entities) {
        const topicMap = {
            'openProject': 'projects',
            'navigate': 'navigation', 
            'searchProjects': 'projects',
            'setCursor': 'interface',
            'setTheme': 'interface',
            'analyzeCode': 'development',
            'gitStatus': 'development',
            'getWeather': 'external',
            'systemInfo': 'system',
            'calculate': 'math',
            'codeSnippet': 'development'
        };
        
        this.context.currentTopic = topicMap[intent] || null;
    }

    getContextualHints() {
        const hints = [];
        
        if (this.context.currentTopic === 'projects') {
            hints.push('progetto', 'portfolio', 'lavoro', 'tecnologia');
        } else if (this.context.currentTopic === 'interface') {
            hints.push('cursore', 'tema', 'colore', 'aspetto');
        } else if (this.context.currentTopic === 'development') {
            hints.push('codice', 'git', 'repository', 'programmare');
        }
        
        return hints;
    }

    getRecentEntities() {
        return this.context.recentEntities;
    }
}

const contextManager = new ContextManager();

/**
 * Servizio esterno per fallback NLU avanzato
 */
class ExternalNLUService {
    constructor() {
        this.apiKey = null; // In produzione, configurare con chiave API
        this.enabled = false;
    }

    async analyzeWithExternalService(text) {
        if (!this.enabled || !this.apiKey) {
            return null;
        }

        try {
            // Simulazione chiamata API esterna (es. OpenAI, Google Dialogflow, etc.)
            const response = await fetch('https://api.example.com/nlu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({ text, language: 'it' })
            });

            if (response.ok) {
                const result = await response.json();
                return this.normalizeExternalResult(result);
            }
        } catch (error) {
            console.warn('[ExternalNLU] Fallback service failed:', error);
        }

        return null;
    }

    normalizeExternalResult(externalResult) {
        // Normalizza il risultato dell'API esterna al formato interno
        return {
            intent: externalResult.intent || 'unknown',
            entities: externalResult.entities || {},
            confidence: externalResult.confidence || 0.5,
            sentiment: externalResult.sentiment || 'neutral'
        };
    }

    setApiKey(key) {
        this.apiKey = key;
        this.enabled = !!key;
    }
}

const externalNLU = new ExternalNLUService();

/**
 * Calcola la distanza di Levenshtein tra due stringhe (per fuzzy matching)
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Trova la corrispondenza fuzzy più vicina in una lista di parole
 */
function findFuzzyMatch(word, candidates, threshold = 0.8) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const candidate of candidates) {
        const distance = levenshteinDistance(word.toLowerCase(), candidate.toLowerCase());
        const maxLength = Math.max(word.length, candidate.length);
        const score = 1 - (distance / maxLength);
        
        if (score > threshold && score > bestScore) {
            bestMatch = candidate;
            bestScore = score;
        }
    }
    
    return bestMatch ? { match: bestMatch, score: bestScore } : null;
}

/**
 * Analizza il sentiment del testo (semplice implementazione basata su keywords)
 */
function analyzeSentiment(text) {
    const positiveWords = ['bene', 'ottimo', 'fantastico', 'bravo', 'grazie', 'perfetto', 'geniale', 'wow', 'incredibile', 'meraviglioso', 'splendido'];
    const negativeWords = ['male', 'terribile', 'orribile', 'pessimo', 'schifo', 'odio', 'fastidio', 'noioso', 'rotto', 'bug', 'errore'];
    const neutralWords = ['ok', 'normale', 'così', 'va', 'beh', 'mah'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    
    for (const word of words) {
        if (positiveWords.includes(word)) positiveScore++;
        if (negativeWords.includes(word)) negativeScore++;
        if (neutralWords.includes(word)) neutralScore++;
    }
    
    const total = positiveScore + negativeScore + neutralScore;
    if (total === 0) return 'neutral';
    
    if (positiveScore > negativeScore && positiveScore > neutralScore) return 'positive';
    if (negativeScore > positiveScore && negativeScore > neutralScore) return 'negative';
    return 'neutral';
}

/**
 * Riconosce e separa comandi concatenati
 */
function parseCommandChain(text) {
    const separators = [' e poi ', ' e quindi ', ' poi ', ' quindi ', ';', ' e '];
    let commands = [text];
    
    for (const separator of separators) {
        if (text.includes(separator)) {
            commands = text.split(separator).map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);
            break;
        }
    }
    
    return commands;
}

const INTENT_PATTERNS = {
    // === INTENTS DI AZIONE (esistenti, potenziati) ===
    openProject: {
        regex: [/apri(?: il)? progetto\s+([\w-]+)/i, /mostra(?:mi)? il progetto\s+([\w-]+)/i],
        keywords: ['apri', 'progetto', 'mostra', 'portfolio', 'lavoro']
    },
    setCursor: {
        regex: [/imposta(?: il)? cursore\s+a?\s*(pacman|asteroids|default)/i, /cambia(?: il)? cursore\s+in\s*(pacman|asteroids|default)/i],
        keywords: ['cursore', 'pacman', 'asteroids', 'default', 'puntatore']
    },
    navigate: {
        regex: [/vai\s+a(?:lla)?\s+(hero|projects|about|contact|shop)/i, /naviga\s+verso\s+(hero|projects|about|contact|shop)/i],
        keywords: ['vai', 'naviga', 'sezione', 'hero', 'projects', 'about', 'contact', 'shop']
    },
    searchProjects: {
        regex: [/cerca progetti\s+su\s+([\w\s]+)/i, /trova(?:mi)?\s+progetti\s+che\s+usano\s+([\w\s]+)/i],
        keywords: ['cerca', 'trova', 'progetti', 'tecnologia', 'tool']
    },
    setTheme: {
        regex: [/imposta(?: il)? tema\s+su\s+(chiaro|scuro)/i, /cambia(?: il)? tema\s+in\s+(chiaro|scuro)/i, /tema\s+(chiaro|scuro)/i],
        keywords: ['tema', 'scuro', 'chiaro', 'dark', 'light', 'modalità']
    },
    suggestAction: {
        regex: [/cosa posso fare/i, /che comandi conosci/i, /suggerisci(?:mi)?\s+qualcosa/i, /aiuto/i],
        keywords: ['cosa', 'fare', 'comandi', 'suggerisci', 'aiuto', 'help']
    },

    // === NUOVI INTENTS AVANZATI ===
    analyzeCode: {
        regex: [/analizza(?: il)? codice/i, /controlla(?: il)? codice/i, /esamina(?: il)? codice/i],
        keywords: ['analizza', 'codice', 'controlla', 'esamina', 'debug', 'errore']
    },
    gitStatus: {
        regex: [/stato git/i, /status git/i, /git status/i, /cosa c'è in git/i],
        keywords: ['git', 'status', 'repository', 'commit', 'push', 'pull']
    },
    getWeather: {
        regex: [/che tempo fa/i, /meteo/i, /temperatura/i, /piove/i],
        keywords: ['tempo', 'meteo', 'pioggia', 'sole', 'temperatura', 'clima']
    },
    systemInfo: {
        regex: [/info sistema/i, /informazioni sistema/i, /specifiche/i, /performance/i],
        keywords: ['sistema', 'info', 'performance', 'cpu', 'ram', 'browser']
    },
    learnPreference: {
        regex: [/ricorda(?: che)? (.+)/i, /impara(?: che)? (.+)/i, /preferisco (.+)/i],
        keywords: ['ricorda', 'impara', 'preferisco', 'mi piace', 'non mi piace']
    },
    codeSnippet: {
        regex: [/mostra(?:mi)? (?:un )?esempio (?:di )?(.+)/i, /snippet (?:di )?(.+)/i],
        keywords: ['esempio', 'snippet', 'codice', 'dimostra', 'mostra']
    },
    calculate: {
        regex: [/calcola (.+)/i, /quanto fa (.+)/i, /risolvi (.+)/i],
        keywords: ['calcola', 'quanto', 'risolvi', 'math', 'matematica']
    },
    showAnalytics: {
        regex: [/mostra(?:mi)? analytics/i, /statistiche/i, /performance/i, /cosa hai imparato/i],
        keywords: ['analytics', 'statistiche', 'performance', 'imparato', 'dati', 'metriche']
    },

    // === NUOVI INTENTS PER SERVIZI ESTERNI ===
    getGeneralKnowledge: {
        regex: [/cosa sai su (.+)/i, /dimmi su (.+)/i, /informazioni su (.+)/i, /spiegami (.+)/i],
        keywords: ['cosa', 'sai', 'dimmi', 'informazioni', 'spiegami', 'conosci']
    },
    getNewsHeadlines: {
        regex: [/notizie/i, /news/i, /novità (.+)/i, /ultime notizie/i],
        keywords: ['notizie', 'news', 'novità', 'aggiornamenti', 'notizia']
    },
    previewMultimedia: {
        regex: [/analizza (.+)/i, /vedi (.+)/i, /preview (.+)/i, /mostra informazioni su (.+)/i],
        keywords: ['analizza', 'vedi', 'preview', 'informazioni', 'dettagli', 'url']
    },

    // === INTENTS DI INTERROGAZIONE (QUERY) ===
    query_about_operator: {
        keywords: ['chi sei', 'chi è alessandro', 'parlami di te', 'profilo', 'operatore', 'bio', 'biografia', 'informazioni su']
    },
    query_tools: {
        keywords: ['che software usi', 'programmi', 'toolkit', 'strumenti', 'che usi per modellare', 'con cosa lavori']
    },
    query_contact: {
        keywords: ['come posso contattarti', 'email', 'contatti', 'messaggio', 'scrivimi']
    },
    query_project_count: {
        keywords: ['quanti progetti hai', 'numero di lavori', 'totale progetti', 'quanti lavori']
    },
    // === NUOVI INTENTS PER COMANDI COMPLESSE ===
    compoundCommand: {
        regex: [/(.+?)\s+e\s+(.+)/i, /(.+?),\s*(.+)/i, /fai\s+(.+?)\s+e\s+(.+)/i],
        keywords: ['e', 'anche', 'poi', 'quindi', 'inoltre', 'dopo', 'successivamente']
    },
    conversationMode: {
        regex: [/parliamo\s+di\s+(.+)/i, /dimmi\s+di\s+(.+)/i, /raccontami\s+di\s+(.+)/i, /conversazione/i],
        keywords: ['parliamo', 'conversazione', 'chiacchiera', 'discutiamo', 'parla']
    },
};const ENTITY_PATTERNS = {
    projectName: ['biosphaera', 'lp', 'portfolio', 'v7'], // Verrà popolato dinamicamente
    cursorType: ['pacman', 'asteroids', 'default'],
    sectionName: ['hero', 'projects', 'about', 'contact', 'shop'],
    soundName: ['coin', 'transition', 'hover', 'notify'],
    technology: ['javascript', 'react', 'vue', 'webgl', 'three.js', 'glsl'],
    theme: ['chiaro', 'scuro', 'dark', 'light'],
    accessibility: ['grande', 'normale', 'alto contrasto', 'contrasto', 'testo', 'dimensione', 'contrasto alto', 'contrasto normale']
};

const ENTITY_NORMALIZATION_MAP = {
    // Sezioni
    'home': 'hero', 'inizio': 'hero', 'principale': 'hero',
    'progetti': 'projects', 'lavori': 'projects', 'galleria': 'projects',
    'contatti': 'contact',
    'chi sono': 'about', 'profilo': 'about', 'su di me': 'about',
    // Cursori e temi
    'standard': 'default', 'normale': 'default',
    'dark': 'scuro', 'notte': 'scuro',
    'light': 'chiaro', 'giorno': 'chiaro',
    // Accessibilità
    'grande': 'text-large',
    'testo grande': 'text-large',
    'aumenta testo': 'text-large',
    'testo normale': 'text-normal',
    'normale': 'text-normal',
    'contrasto alto': 'contrast-high',
    'alto contrasto': 'contrast-high',
    'contrasto normale': 'contrast-normal',
    'contrasto': 'contrast-high'
};

function normalizeEntity(entity, type) {
    const lowerEntity = entity.toLowerCase();
    if (ENTITY_NORMALIZATION_MAP[lowerEntity]) {
        return ENTITY_NORMALIZATION_MAP[lowerEntity];
    }
    return lowerEntity;
}

function extractEntities(text, intent) {
    // Questa funzione rimane invariata rispetto alla tua versione originale
    const entities = {};
    const words = text.toLowerCase().split(/\s+/);

    switch (intent) {
        case 'openProject':
            for (const word of words) {
                if (ENTITY_PATTERNS.projectName.includes(word)) {
                    entities.projectName = normalizeEntity(word, 'projectName');
                    break;
                }
            }
            // Fuzzy matching se non trova corrispondenza esatta
            if (!entities.projectName) {
                for (const word of words) {
                    const fuzzyMatch = findFuzzyMatch(word, ENTITY_PATTERNS.projectName);
                    if (fuzzyMatch) {
                        entities.projectName = normalizeEntity(fuzzyMatch.match, 'projectName');
                        break;
                    }
                }
            }
            break;
        case 'setCursor':
            for (const word of words) {
                if (ENTITY_PATTERNS.cursorType.includes(word)) {
                    entities.cursorType = normalizeEntity(word, 'cursorType');
                    break;
                }
            }
            // Fuzzy matching per cursori
            if (!entities.cursorType) {
                for (const word of words) {
                    const fuzzyMatch = findFuzzyMatch(word, ENTITY_PATTERNS.cursorType);
                    if (fuzzyMatch) {
                        entities.cursorType = normalizeEntity(fuzzyMatch.match, 'cursorType');
                        break;
                    }
                }
            }
            break;
        case 'navigate':
            for (const word of words) {
                if (ENTITY_PATTERNS.sectionName.includes(word)) {
                    entities.sectionName = normalizeEntity(word, 'sectionName');
                    break;
                }
            }
            // Fuzzy matching per sezioni
            if (!entities.sectionName) {
                for (const word of words) {
                    const fuzzyMatch = findFuzzyMatch(word, ENTITY_PATTERNS.sectionName);
                    if (fuzzyMatch) {
                        entities.sectionName = normalizeEntity(fuzzyMatch.match, 'sectionName');
                        break;
                    }
                }
            }
            break;
        case 'searchProjects':
            for (const word of words) {
                if (ENTITY_PATTERNS.technology.includes(word)) {
                    entities.technology = normalizeEntity(word, 'technology');
                    break;
                }
            }
            // Fuzzy matching per tecnologie
            if (!entities.technology) {
                for (const word of words) {
                    const fuzzyMatch = findFuzzyMatch(word, ENTITY_PATTERNS.technology);
                    if (fuzzyMatch) {
                        entities.technology = normalizeEntity(fuzzyMatch.match, 'technology');
                        break;
                    }
                }
            }
            break;
        case 'setTheme':
            for (const word of words) {
                if (ENTITY_PATTERNS.theme.includes(word)) {
                    entities.theme = normalizeEntity(word, 'theme');
                    break;
                }
            }
            // Fuzzy matching per temi
            if (!entities.theme) {
                for (const word of words) {
                    const fuzzyMatch = findFuzzyMatch(word, ENTITY_PATTERNS.theme);
                    if (fuzzyMatch) {
                        entities.theme = normalizeEntity(fuzzyMatch.match, 'theme');
                        break;
                    }
                }
            }
            break;
        case 'setAccessibility':
            // Cerca entità per accessibilità: testo grande/normale, contrasto alto/normale
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                // Cerca combinazioni tipo "testo grande", "contrasto alto"
                if ((word === 'testo' || word === 'contrasto') && words[i+1]) {
                    const combo = word + ' ' + words[i+1];
                    if (ENTITY_PATTERNS.accessibility.includes(combo)) {
                        entities.accessibility = normalizeEntity(combo, 'accessibility');
                        break;
                    }
                }
                if (ENTITY_PATTERNS.accessibility.includes(word)) {
                    entities.accessibility = normalizeEntity(word, 'accessibility');
                    break;
                }
            }
            break;
    }
    return entities;
}

/**
 * Funzione di inizializzazione che insegna all'NLU i nomi dei progetti dalla Knowledge Base.
 */
export function initNLU() {
  if (!KNOWLEDGE_BASE.projects || KNOWLEDGE_BASE.projects.length === 0) {
    console.warn('[NLU] La Knowledge Base non contiene ancora i progetti. Assicurati di chiamare loadProjectsIntoKB() prima di initNLU().');
    return;
  }
  
  const projectNames = new Set(ENTITY_PATTERNS.projectName); // Parti con quelli hard-coded
  KNOWLEDGE_BASE.projects.forEach(p => {
    projectNames.add(p.id.toLowerCase());
    // Aggiungi parole singole dal titolo per una corrispondenza più flessibile
    p.title.toLowerCase().split(/[\s-]+/).forEach(word => projectNames.add(word));
  });

  ENTITY_PATTERNS.projectName = Array.from(projectNames);
  console.log('[NLU] Inizializzato con i nomi dei progetti dalla Knowledge Base.');
}

/**
 * Espande il testo con sinonimi per migliorare il riconoscimento
 */
function expandWithSynonyms(text) {
    const words = text.toLowerCase().split(/\s+/);
    const expandedWords = new Set();
    
    words.forEach(word => {
        expandedWords.add(word);
        // Aggiungi sinonimi
        Object.keys(SYNONYM_MAP).forEach(baseWord => {
            if (SYNONYM_MAP[baseWord].includes(word)) {
                SYNONYM_MAP[baseWord].forEach(synonym => expandedWords.add(synonym));
            }
        });
    });
    
    return Array.from(expandedWords);
}

/**
 * Migliora il riconoscimento usando il contesto conversazionale
 */
function applyContextualBoost(text, intent, baseConfidence) {
    let confidence = baseConfidence;
    
    // Boost basato sul topic corrente
    const contextualHints = contextManager.getContextualHints();
    const words = text.toLowerCase().split(/\s+/);
    
    const hasContextualWords = words.some(word => contextualHints.includes(word));
    if (hasContextualWords && contextManager.context.currentTopic) {
        confidence += 0.2; // Boost del 20% per parole contestuali
    }
    
    // Boost per ripetizioni recenti
    const recentEntities = contextManager.getRecentEntities();
    const hasRecentEntity = words.some(word => recentEntities.includes(word));
    if (hasRecentEntity) {
        confidence += 0.15; // Boost del 15% per entità recenti
    }
    
    return Math.min(confidence, 0.95); // Max 95% confidence
}

/**
 * Analizza il testo dell'utente per estrarre intenti ed entità.
 * La funzione `parse` rimane invariata nella sua logica, ma ora userà i nuovi pattern.
 */
export async function parse(text) {
    const trimmedText = text.trim();
    const sentiment = analyzeSentiment(trimmedText);
    
    // Espandi con sinonimi per analisi migliorata
    const expandedWords = expandWithSynonyms(trimmedText);
    const expandedText = expandedWords.join(' ');
    
    // Controlla se ci sono comandi concatenati
    const commandChain = parseCommandChain(trimmedText);
    
    if (commandChain.length > 1) {
        // Analizza ogni comando nella catena con espansione sinonimi
        const parsedCommands = commandChain.map(cmd => {
            const cmdSentiment = analyzeSentiment(cmd);
            const cmdExpanded = expandWithSynonyms(cmd);
            const cmdExpandedText = cmdExpanded.join(' ');
            
            // 1. Regex-based intent detection per comando con sinonimi
            for (const intent in INTENT_PATTERNS) {
                if (!INTENT_PATTERNS[intent].regex) continue;
                for (const regex of INTENT_PATTERNS[intent].regex) {
                    const match = cmdExpandedText.match(regex) || cmd.match(regex);
                    if (match) {
                        const entities = extractEntities(cmdExpandedText, intent) || extractEntities(cmd, intent);
                        if (match[1]) {
                            const entityType = Object.keys(entities)[0] || (intent === 'openProject' ? 'projectName' : 'query');
                            entities[entityType] = normalizeEntity(match[1], entityType);
                        }
                        const baseConfidence = 0.9;
                        const finalConfidence = applyContextualBoost(cmd, intent, baseConfidence);
                        return { intent, entities, confidence: finalConfidence, sentiment: cmdSentiment };
                    }
                }
            }
            
            // 2. Keyword-based intent detection con fuzzy matching e sinonimi
            const words = cmdExpanded;
            const intentScores = {};
            
            for (const intent in INTENT_PATTERNS) {
                let score = 0;
                if (INTENT_PATTERNS[intent].keywords) {
                    for (const keyword of INTENT_PATTERNS[intent].keywords) {
                        if (words.includes(keyword)) {
                            score++;
                        }
                    }
                    // Fuzzy matching per keywords degli intenti
                    if (score === 0) {
                        for (const word of words) {
                            const fuzzyMatch = findFuzzyMatch(word, INTENT_PATTERNS[intent].keywords);
                            if (fuzzyMatch && fuzzyMatch.score > 0.8) {
                                score += fuzzyMatch.score;
                            }
                        }
                    }
                }
                intentScores[intent] = score;
            }
            
            const bestIntent = Object.keys(intentScores).reduce((a, b) => intentScores[a] > intentScores[b] ? a : b);
            
            if (intentScores[bestIntent] > 0) {
                const entities = extractEntities(cmdExpandedText, bestIntent) || extractEntities(cmd, bestIntent);
                const baseConfidence = intentScores[bestIntent] / INTENT_PATTERNS[bestIntent].keywords.length;
                const finalConfidence = applyContextualBoost(cmd, bestIntent, baseConfidence);
                return { intent: bestIntent, entities, confidence: Math.min(finalConfidence, 0.7), sentiment: cmdSentiment };
            }
            
            return { intent: 'unknown', entities: {}, confidence: 0.1, sentiment: cmdSentiment };
        });
        
        return { 
            intent: 'commandChain', 
            entities: { commands: parsedCommands }, 
            confidence: 0.8, 
            sentiment,
            commandCount: commandChain.length 
        };
    }
    
    // Analisi singolo comando con espansione sinonimi
    const trimmedTextLower = trimmedText.toLowerCase();
    const expandedTextLower = expandedText.toLowerCase();

    // 1. Regex-based intent detection con sinonimi
    for (const intent in INTENT_PATTERNS) {
        if (!INTENT_PATTERNS[intent].regex) continue;
        for (const regex of INTENT_PATTERNS[intent].regex) {
            const match = expandedTextLower.match(regex) || trimmedTextLower.match(regex);
            if (match) {
                const entities = extractEntities(expandedTextLower, intent) || extractEntities(trimmedTextLower, intent);
                if (match[1]) {
                    const entityType = Object.keys(entities)[0] || (intent === 'openProject' ? 'projectName' : 'query');
                    entities[entityType] = normalizeEntity(match[1], entityType);
                }
                const baseConfidence = 0.9;
                const finalConfidence = applyContextualBoost(trimmedText, intent, baseConfidence);
                
                // Aggiorna contesto
                contextManager.updateContext(intent, entities, finalConfidence);
                
                return { intent, entities, confidence: finalConfidence, sentiment };
            }
        }
    }

    // 2. Keyword-based intent detection con fuzzy matching e sinonimi
    const words = expandedWords;
    const intentScores = {};

    for (const intent in INTENT_PATTERNS) {
        let score = 0;
        if (INTENT_PATTERNS[intent].keywords) {
            for (const keyword of INTENT_PATTERNS[intent].keywords) {
                if (words.includes(keyword)) {
                    score++;
                }
            }
            // Fuzzy matching per keywords degli intenti
            if (score === 0) {
                for (const word of words) {
                    const fuzzyMatch = findFuzzyMatch(word, INTENT_PATTERNS[intent].keywords);
                    if (fuzzyMatch && fuzzyMatch.score > 0.8) {
                        score += fuzzyMatch.score;
                    }
                }
            }
        }
        intentScores[intent] = score;
    }

    const bestIntent = Object.keys(intentScores).reduce((a, b) => intentScores[a] > intentScores[b] ? a : b);

    if (intentScores[bestIntent] > 0) {
        const entities = extractEntities(expandedTextLower, bestIntent) || extractEntities(trimmedTextLower, bestIntent);
        const baseConfidence = intentScores[bestIntent] / INTENT_PATTERNS[bestIntent].keywords.length;
        const finalConfidence = applyContextualBoost(trimmedText, bestIntent, baseConfidence);
        
        // Aggiorna contesto
        contextManager.updateContext(bestIntent, entities, finalConfidence);
        
        return { intent: bestIntent, entities, confidence: Math.min(finalConfidence, 0.7), sentiment };
    }

    // Fallback a servizio esterno se disponibile e confidence bassa
    const fallbackResult = await externalNLU.analyzeWithExternalService(trimmedText);
    if (fallbackResult && fallbackResult.confidence > 0.3) {
        contextManager.updateContext(fallbackResult.intent, fallbackResult.entities, fallbackResult.confidence);
        return fallbackResult;
    }

    return { intent: 'unknown', entities: {}, confidence: 0.1, sentiment };
}