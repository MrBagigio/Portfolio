// nlu_config.js
// Configurazione NLU incorporata come moduli JavaScript

export const intents = {
  "greeting": {
    "description": "Saluti e convenevoli",
    "regex": [
      "^(?:ciao|salve|buongiorno|buonasera|hey|ehilà|saluto|hello|hi|grazie)(?:!|\\s|thanks|$)",
      "^(?:buon\\s+(giorno|sera|pomeriggio|notte))(?:!|\\s|$)",
      "^(?:grazie\\s+mille|thank\\s+you)(?:!|\\s|$)"
    ],
    "keywords": ["ciao", "salve", "buongiorno", "buonasera", "hey", "ehilà", "saluto", "hello", "hi", "buon giorno", "buon sera", "grazie", "thanks", "grazie mille"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.95,
      "keyword": 0.9,
      "entity": 0.0
    }
  },
  "openProject": {
    "description": "Apri un progetto specifico",
    "regex": [
      "apri(?: il)? progetto\\s+(biosphaera|lp|v7)",
      "mostra(?:mi)? (?:il\\s+)?progetto\\s+(biosphaera|lp|v7)",
      "vedi\\s+(?:il\\s+)?progetto\\s+(biosphaera|lp|v7)"
    ],
    "keywords": ["apri", "progetto", "biosphaera", "lp", "v7", "mostra progetto", "vedi progetto"],
    "entityDependencies": ["projectName"],
    "confidenceWeights": {
      "regex": 0.95,
      "keyword": 0.8,
      "entity": 0.9
    }
  },
  "show_projects": {
    "description": "Mostra i progetti/portfolio",
    "regex": [
      "mostra.*progetti",
      "vedi.*progetti",
      "dimmi.*progetti",
      "fammi vedere.*progetti",
      "apri.*progetto"  // Aggiunto per gestire expandSynonyms
    ],
    "keywords": ["mostra", "progetti", "vedi", "dimmi", "fammi vedere", "apri", "progetto"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.95,
      "keyword": 0.9,
      "entity": 0.0
    }
  },
  "setCursor": {
    "description": "Cambia il tipo di cursore",
    "regex": [
  "imposta(?: il)? cursore\\s+a?\\s*(pacman|asteroids|glitch|simple|default)",
  "cambia(?: il)? cursore\\s+in\\s*(pacman|asteroids|glitch|simple|default)",
  "cambia(?: il)? cursore\\s+a\\s*(pacman|asteroids|glitch|simple|default)",
  "cursore\\s+(pacman|asteroids|glitch|simple|default)"
    ],
  "keywords": ["cursore", "pacman", "asteroids", "glitch", "simple", "default", "puntatore", "cambia", "imposta"],
    "entityDependencies": ["cursorType"],
    "confidenceWeights": {
      "regex": 0.9,
      "keyword": 0.7,
      "entity": 0.8
    }
  },
  "navigate": {
    "description": "Naviga verso una sezione del sito",
    "regex": [
      "vai\\s+a(?:lla)?\\s+(hero|projects?|progetti|about|contact|contatti|shop|home|portfolio|galleria)",
      "naviga\\s+verso\\s+(hero|projects?|progetti|about|contact|contatti|shop|home|portfolio|galleria)",
      "portami\\s+a(?:lla)?\\s+(hero|projects?|progetti|about|contact|contatti|shop|home|portfolio|galleria|sezione)",
      "vai\\s+su\\s+(hero|projects?|progetti|about|contact|contatti|shop|home|portfolio|galleria)",
      "mostra(?:mi)?\\s+(?:il\\s+)?(?:portfolio|progetti|galleria|lavori)",
      "vedi\\s+(?:il\\s+)?(?:portfolio|progetti|galleria|lavori)",
      "voglio\\s+vedere\\s+(?:i\\s+)?(?:progetti|portfolio|galleria|lavori)",
      "fammi\\s+vedere\\s+(?:il\\s+)?(?:portfolio|progetti|galleria|lavori)",
      "apri\\s+(?:la\\s+)?(?:galleria|portfolio|progetti)"
    ],
    "keywords": ["vai", "naviga", "portami", "sezione", "hero", "projects", "progetto", "progetti", "about", "profilo", "contact", "contatti", "shop", "home", "portfolio", "galleria", "mostra", "vedi", "vedere", "apri", "lavori"],
    "entityDependencies": ["sectionName"],
    "confidenceWeights": {
      "regex": 0.9,
      "keyword": 0.8,
      "entity": 0.7
    }
  },
  "setTheme": {
    "description": "Cambia il tema dell'interfaccia",
    "regex": [
      "imposta(?: il)? tema\\s+su\\s+(chiaro|scuro)",
      "cambia(?: il)? tema\\s+in\\s+(chiaro|scuro)",
      "tema\\s+(chiaro|scuro)",
      "modalità\\s+(chiara|scura|dark|light)"
    ],
    "keywords": ["tema", "scuro", "chiaro", "dark", "light", "modalità", "cambia", "imposta"],
    "entityDependencies": ["theme"],
    "confidenceWeights": {
      "regex": 0.9,
      "keyword": 0.7,
      "entity": 0.8
    }
  },
  "suggestAction": {
    "description": "Suggerisci azioni disponibili",
    "regex": [
      "cosa posso fare",
      "cosa sai fare",  // Questo ora è in conflitto, sarà risolto dalle regole
      "che (cosa|comandi) (conosci|puoi fare|sai fare)",
      "cosa posso chiederti",
      "dimmi cosa sai fare",
      "suggerisci(?:mi)?\\s+qualcosa",
      "aiuto",
      "help"
    ],
    "keywords": ["cosa", "fare", "comandi", "suggerisci", "aiuto", "help", "chiederti", "conosci", "puoi"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.8,  // Ridotto da 0.9
      "keyword": 0.7, // Ridotto da 0.8
      "entity": 0.0
    }
  },
  "query_about_operator": {
    "description": "Domande su Alessandro/operatore",
    "keywords": ["chi sei", "chi è alessandro", "parlami di te", "profilo", "operatore", "bio", "biografia", "informazioni su", "presentati", "chi è"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.0,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "query_tools": {
    "description": "Domande sugli strumenti utilizzati",
    "keywords": ["che software usi", "programmi", "toolkit", "strumenti", "che usi per modellare", "con cosa lavori", "strumenti di lavoro", "software"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.0,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "query_contact": {
    "description": "Domande su come contattare",
    "keywords": ["come posso contattarti", "email", "contatti", "messaggio", "scrivimi", "contatto", "mail"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.0,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "query_project_count": {
    "description": "Domande sul numero di progetti",
    "keywords": ["quanti progetti hai", "numero di lavori", "totale progetti", "quanti lavori", "portfolio"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.0,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "query_skills": {
    "description": "Domande sulle competenze",
    "keywords": ["competenze", "skill", "cosa sai fare", "abilità", "specializzazioni", "esperienze"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.0,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "query_technologies": {
    "description": "Domande sulle tecnologie",
    "keywords": ["tecnologie", "webgl", "javascript", "three.js", "cosa è", "spiegami", "che cos è"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.0,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "query_faq": {
    "description": "Domande frequenti",
    "regex": [
      "^(?:faq|domande frequenti)$",
      "sei\\s+(?:disponibile|libero)",
      "quando\\s+sei\\s+(?:disponibile|libero)",
      "orari\\s+(?:di\\s+)?lavoro",
      "disponibilità"
    ],
    "keywords": ["faq", "domande frequenti", "commissioni", "disponibile", "prezzi", "costo", "orari", "lavoro", "quando", "sei"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.9,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "personal_status": {
    "description": "Domande sullo stato personale o come stai",
    "regex": [
      "^(?:come\\s+stai|come\\s+ti\\s+senti|come\\s+va|come\\s+butta|stai\\s+bene)(?:\\?|!|\\s|$)",
      "^(?:tutto\\s+(bene|ok|a posto))(?:\\?|!|\\s|$)",
      "^(?:come\\s+te\\s+la\\s+passi)(?:\\?|!|\\s|$)"
    ],
    "keywords": ["come stai", "come ti senti", "come va", "stai bene", "tutto bene", "tutto ok", "come butta", "come te la passi"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.95,
      "keyword": 0.9,
      "entity": 0.0
    }
  },
  "can_do": {
    "description": "Domande dirette su cosa può fare il sistema",
    "regex": [
      "cosa fai",
      "cosa sai fare",
      "che (cosa|comandi) sai fare",
      "quali sono le tue funzioni",
      "cosa puoi fare",
      "puoi\\s+(?:fare|dirmi|mostrarmi|aiutarmi|cambiarmi)\\s+(.+)",
      "sai\\s+(?:fare|dirmi|mostrarmi)\\s+(.+)"
    ],
    "keywords": ["cosa", "fai", "sai fare", "puoi fare", "funzioni", "capacità", "abilità", "puoi", "sai", "fare", "aiutare", "cambiare"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.95,  // Alto per regex esatti
      "keyword": 0.85, // Più alto di suggestAction
      "entity": 0.0
    }
  },
  "query_easter_eggs": {
    "description": "Domande su easter egg o features nascoste",
    "regex": [
      "(?:ci sono|esistono)\\s+easter\\s+egg",
      "features\\s+nascoste",
      "sorprese\\s+nel\\s+sito",
      "cosa\\s+c['è]\\s+di\\s+nascosto",
      "cosa\\s+è\\s+nascosto"
    ],
    "keywords": ["easter egg", "nascoste", "sorprese", "segrete", "features", "extra", "cosa c'è di nascosto", "nascosto"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.9,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "query_prices": {
    "description": "Domande su prezzi o commissioni",
    "regex": [
      "quanto\\s+(?:costi|costano|chiedi)",
      "prezzi",
      "commissioni",
      "tariffe",
      "costo\\s+(?:del\\s+)?servizio"
    ],
    "keywords": ["prezzo", "costo", "commissioni", "tariffe", "pagamento", "budget", "servizio"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.8,
      "keyword": 0.7,
      "entity": 0.0
    }
  },
  "explain_tech": {
    "description": "Spiegazioni di tecnologie o termini tecnici",
    "regex": [
      "(?:cosa\\s+è|spiegami|che\\s+cos\\'è)\\s+(webgl|three\\.js|javascript|html5|css3|node\\.js)",
      "spiega(?:mi)?\\s+(webgl|three\\.js|javascript|html5|css3|node\\.js)"
    ],
    "keywords": ["cosa è", "spiegami", "che cos'è", "spiega", "webgl", "three.js", "javascript", "html5", "css3", "node.js"],
    "entityDependencies": ["techName"],
    "confidenceWeights": {
      "regex": 0.9,
      "keyword": 0.6,
      "entity": 0.8
    }
  },
  "what_do_you_do": {
    "description": "Domande su cosa fa il sistema",
    "regex": [
      "cosa\\s+fai",
      "che\\s+(cosa\\s+)?fai",
      "cosa\\s+sei\\s+in\\s+grado\\s+di\\s+fare",
      "che\\s+sai\\s+fare",
      "cosa\\s+fare",
      "cosa\\s+competenze"  // Aggiunto per gestire expandSynonyms
    ],
    "keywords": ["cosa fai", "che fai", "cosa sei", "che sai fare", "capacità", "funzioni", "cosa fare", "competenze"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.95,
      "keyword": 0.9,
      "entity": 0.0
    }
  },
  "who_are_you": {
    "description": "Domande su chi è il sistema",
    "regex": [
      "chi\\s+sei",
      "tu\\s+chi\\s+sei",
      "chi\\s+sei\\s+tu",
      "che\\s+sei"
    ],
    "keywords": ["chi sei", "tu chi sei", "che sei", "identità", "nome"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.95,
      "keyword": 0.9,
      "entity": 0.0
    }
  },
  "random_fun": {
    "description": "Domande casuali o divertenti",
    "regex": [
      "raccontami\\s+una\\s+barzelletta",
      "cosa\\s+fai\\s+nel\\s+tempo\\s+libero",
      "hai\\s+hobby",
      "sei\\s+umano"
    ],
    "keywords": ["barzelletta", "tempo libero", "hobby", "umano", "divertente", "scherzo"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.8,
      "keyword": 0.6,
      "entity": 0.0
    }
  },
  "codeSnippet": {
    "description": "Richiesta di mostrare codice di esempio",
    "regex": [
      "mostra(?:mi)?\\s+(?:codice|esempio|snippet)\\s+(?:di\\s+)?(.+)",
      "esempio\\s+(?:di\\s+)?(?:codice\\s+)?(.+)",
      "come\\s+(?:si\\s+)?(?:scrive|fa)\\s+(.+)",
      "(?:codice|snippet|esempio)\\s+(?:per|di)\\s+(.+)",
      "(?:js|javascript|html|css|python)\\s+(?:code|codice|snippet)"
    ],
    "keywords": ["mostra", "codice", "esempio", "snippet", "javascript", "html", "css", "python", "come", "scrive", "esempio di", "js", "code", "codice per"],
    "entityDependencies": ["language"],
    "confidenceWeights": {
      "regex": 0.95,
      "keyword": 0.85,
      "entity": 0.8
    }
  },
  "calculate": {
    "description": "Richiesta di calcolare un'espressione matematica",
    "regex": [
      "^\\s*[\\d\\s+\\-*/().^=?!]+\\s*$",
      "(?:calcola|risolvi|quanto\\s+fa)\\s+(.+)",
      "\\d+(?:\\.\\d+)?\\s*[+\\-*/^=]\\s*\\d+(?:\\.\\d+)?(?:\\s*[+\\-*/^=]\\s*\\d+(?:\\.\\d+)?)*\\s*[=?]*\\s*[?!]*",
      "\\([^)]+\\)\\s*[+\\-*/^=]\\s*\\d+(?:\\.\\d+)?\\s*[=?]*\\s*[?!]*",
      "\\d+(?:\\.\\d+)?\\s*[=?]*\\s*[?!]+"
    ],
    "keywords": ["calcola", "risolvi", "quanto fa", "+", "-", "*", "/", "^", "=", "uguale", "?"],
    "entityDependencies": [],
    "confidenceWeights": {
      "regex": 0.99,
      "keyword": 0.8,
      "entity": 0.0
    }
  },
  "getNewsHeadlines": {
    "description": "Richiesta di notizie o headlines",
    "regex": [
      "notizie\\s+(.+)",
      "notizie\\s+(?:di|su|della?|riguardo\\s+a)\\s+(.+)",
      "cosa\\s+succede\\s+(?:in|nel|con)\\s+(.+)",
      "ultime\\s+notizie\\s+(?:su|di|della?)\\s+(.+)",
      "news\\s+(?:su|di|riguardo)\\s+(.+)",
      "(?:dimmi|raccontami)\\s+(?:le\\s+)?notizie"
    ],
    "keywords": ["notizie", "news", "ultime", "cosa succede", "tecnologia", "mondo", "italia", "politica", "sport"],
    "entityDependencies": ["category"],
    "confidenceWeights": {
      "regex": 0.9,
      "keyword": 0.75,
      "entity": 0.6
    }
  }
};

export const entities = {
  "projectName": {
    "patterns": ["biosphaera", "lp", "portfolio", "v7"],
    "normalization": {
      "biosphaera": "biosphaera",
      "lp": "lp",
      "portfolio": "portfolio",
      "v7": "v7"
    },
    "fuzzyMatching": true,
    "priority": 1
  },
  "cursorType": {
    "patterns": ["pacman", "asteroids", "glitch", "default"],
    "normalization": {
      "pacman": "pacman",
      "asteroids": "asteroids",
      "glitch": "glitch",
      "default": "default",
      "standard": "default",
      "normale": "default"
    },
    "fuzzyMatching": true,
    "priority": 1
  },
  "sectionName": {
    "patterns": ["hero", "projects", "progetti", "about", "contact", "contatti", "shop", "portfolio", "galleria"],
    "normalization": {
      "hero": "hero",
      "projects": "projects",
      "progetti": "projects",
      "about": "about",
      "contact": "contact",
      "contatti": "contact",
      "shop": "shop",
      "home": "hero",
      "inizio": "hero",
      "principale": "hero",
      "progetti": "projects",
      "lavori": "projects",
      "galleria": "projects",
      "portfolio": "projects",
      "contatti": "contact",
      "chi sono": "about",
      "profilo": "about",
      "su di me": "about"
    },
    "fuzzyMatching": true,
    "priority": 1
  },
  "techName": {
    "patterns": ["webgl", "three.js", "javascript", "html5", "css3", "node.js"],
    "normalization": {
      "webgl": "webgl",
      "three.js": "three.js",
      "javascript": "javascript",
      "html5": "html5",
      "css3": "css3",
      "node.js": "node.js"
    },
    "fuzzyMatching": true,
    "priority": 1
  },
  "theme": {
    "patterns": ["chiaro", "scuro", "dark", "light"],
    "normalization": {
      "chiaro": "chiaro",
      "scuro": "scuro",
      "dark": "scuro",
      "light": "chiaro",
      "notte": "scuro",
      "giorno": "chiaro"
    },
    "fuzzyMatching": true,
    "priority": 1
  },
  "location": {
    "patterns": ["italia", "milano", "lombardia", "europa", "mondo", "remoto", "online"],
    "normalization": {
      "italia": "italia",
      "milano": "milano",
      "lombardia": "lombardia",
      "europa": "europa",
      "mondo": "mondo",
      "remoto": "remoto",
      "online": "online"
    },
    "fuzzyMatching": true,
    "priority": 1
  },
  "category": {
    "patterns": ["web", "mobile", "desktop", "game", "portfolio", "ecommerce", "blog", "landing"],
    "normalization": {
      "web": "web",
      "mobile": "mobile",
      "desktop": "desktop",
      "game": "game",
      "portfolio": "portfolio",
      "ecommerce": "ecommerce",
      "blog": "blog",
      "landing": "landing",
      "sito web": "web",
      "app mobile": "mobile",
      "videogioco": "game",
      "e-commerce": "ecommerce",
      "landing page": "landing"
    },
    "fuzzyMatching": true,
    "priority": 1
  },
  "language": {
    "patterns": ["javascript", "typescript", "python", "java", "csharp", "php", "html", "css", "sql"],
    "normalization": {
      "javascript": "javascript",
      "typescript": "typescript",
      "python": "python",
      "java": "java",
      "csharp": "csharp",
      "c#": "csharp",
      "php": "php",
      "html": "html",
      "css": "css",
      "sql": "sql",
      "js": "javascript",
      "ts": "typescript",
      "py": "python"
    },
    "fuzzyMatching": true,
    "priority": 1
  }
};

export const synonyms = {
  "apri": ["apri", "mostra", "vedi", "visualizza", "carica", "dimmi", "fammi vedere", "ce l'hai"],
  "progetto": ["progetto", "lavoro", "portfolio", "realizzazione", "opera", "progetti"],
  "cursore": ["cursore", "puntatore", "mouse", "pointer", "freccetta"],
  "tema": ["tema", "modalità", "aspetto", "skin", "look", "stile"],
  "vai": ["vai", "naviga", "spostati", "muovi", "passa", "portami", "vammi"],
  "sezione": ["sezione", "pagina", "area", "parte", "sezioni"],
  "cosa": ["cosa", "che", "quale", "che cosa", "che roba"],
  "fare": ["fare", "eseguire", "compiere", "effettuare", "faccio", "fai"],
  "aiuto": ["aiuto", "help", "assistenza", "supporto", "aiutami", "dammi una mano"],
  "chi": ["chi", "quale persona", "che persona"],
  "sei": ["sei", "sei tu", "rappresenti"],
  "software": ["software", "programma", "applicazione", "tool", "strumento", "programmini", "apps"],
  "usare": ["usare", "utilizzare", "impiegare", "adottare", "usi", "usate"],
  "competenze": ["competenze", "skill", "abilità", "capacità", "conoscenze", "sai fare"],
  "tecnologie": ["tecnologie", "tech", "strumenti", "linguaggi", "framework"],
  "come": ["come", "in che modo", "come funziona", "spiegami"],
  "perché": ["perché", "perchè", "come mai", "per quale motivo"],
  "quando": ["quando", "in che momento"],
  "dove": ["dove", "in che posto"],
  "quanti": ["quanti", "quante", "quanto", "che numero"],
  "qual": ["qual", "quali", "che tipo", "che genere"],
  "posso": ["posso", "puoi", "è possibile", "si può"],
  "grazie": ["grazie", "thank you", "thanks", "graz", "grazie mille", "ti ringrazio"],
  "ciao": ["ciao", "hey", "ehilà", "salve", "buongiorno", "buonasera", "hello", "hi"],
  "sì": ["sì", "si", "yes", "certo", "ovvio", "naturalmente", "ok", "va bene"],
  "no": ["no", "not", "non", "neanche", "nemmeno", "mai", "niente"]
};

/**
 * Normalizza punteggiatura e caratteri speciali nel testo
 */
export function normalizePunctuation(text) {
  let normalized = text;

  // Rimuovi punteggiatura ripetuta (es: "!!!" -> "!")
  normalized = normalized.replace(/([!?.,])\1+/g, '$1');

  // Normalizza spazi attorno alla punteggiatura - assicurati che ci sia uno spazio dopo,
  // ma non tra caratteri di punteggiatura consecutivi
  normalized = normalized.replace(/\s*([!?.,;:'"])\s*(?![!?.,;:'"])/g, '$1 ');

  // Rimuovi spazi multipli
  normalized = normalized.replace(/\s+/g, ' ');

  // Normalizza sequenze di punteggiatura mista
  normalized = normalized.replace(/[!?.,;:'"]{2,}/g, match => {
    // Se finisce con ! o ?, mantieni quello, altrimenti .
    if (match.includes('!') && match.includes('?')) return '!?';
    if (match.includes('!')) return '!';
    if (match.includes('?')) return '?';
    return '.';
  });

  return normalized.trim();
}

/**
 * Espande sinonimi in una frase per migliorare matching
 */
export function expandSynonyms(text) {
  let expanded = text.toLowerCase();

  // Prima normalizza la punteggiatura
  expanded = normalizePunctuation(expanded);

  // Ordina i sinonimi per lunghezza decrescente per dare priorità alle frasi più lunghe
  const sortedSynonyms = Object.entries(synonyms).sort((a, b) => {
    const maxLenA = Math.max(...a[1].map(s => s.length));
    const maxLenB = Math.max(...b[1].map(s => s.length));
    return maxLenB - maxLenA;
  });

  for (const [base, syns] of sortedSynonyms) {
    for (const syn of syns) {
      if (expanded.includes(syn) && syn !== base) {
        // Non sostituire se la parola base è già presente nel testo originale
        if (text.toLowerCase().includes(base)) {
          continue;
        }
        // Usa word boundaries più flessibili per frasi
        const regex = syn.includes(' ') ?
          new RegExp(`\\b${syn.replace(/\s+/g, '\\s+')}\\b`, 'g') :
          new RegExp(`\\b${syn}\\b`, 'g');
        expanded = expanded.replace(regex, base);
      }
    }
  }
  return expanded;
}

/**
 * Calcola confidenza contestuale basata su storia conversazionale
 */
export function calculateContextualConfidence(intent, confidence, conversationHistory = []) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return confidence;
  }

  // Aumenta confidenza se intent simile a precedenti
  const recentIntents = conversationHistory.slice(-3).map(h => h.intent);
  const similarCount = recentIntents.filter(i => i === intent).length;

  if (similarCount > 0) {
    confidence += 0.1 * similarCount; // Bonus fino a 0.3
  }

  // Penalità per ripetizioni eccessive
  if (similarCount === 3) {
    confidence -= 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calcola confidenza dettagliata per un singolo intent con qualità del match
 */
function calculateIntentConfidence(text, intentName, intentConfig) {
  let confidence = 0;
  let matchQuality = 0;
  let matchDetails = {
    regexMatches: 0,
    keywordMatches: 0,
    entityMatches: 0,
    totalKeywords: intentConfig.keywords ? intentConfig.keywords.length : 0
  };

  // Regex matching con qualità
  if (intentConfig.regex) {
    for (const regex of intentConfig.regex) {
      try {
        const regexObj = new RegExp(regex, 'i');
        if (regexObj.test(text)) {
          confidence += intentConfig.confidenceWeights.regex;
          matchDetails.regexMatches++;
          matchQuality += 0.3; // Regex match è di alta qualità
          break; // Solo il primo match conta
        }
      } catch (e) {
        // Skip invalid regex
        continue;
      }
    }
  }

  // Keyword matching migliorato
  if (intentConfig.keywords) {
    const keywordMatches = intentConfig.keywords.filter(k =>
      text.includes(k.toLowerCase())
    ).length;

    if (keywordMatches > 0) {
      // Penalità per match parziali su testi lunghi
      const textWords = text.split(/\s+/).length;
      const matchRatio = keywordMatches / intentConfig.keywords.length;
      let keywordScore = intentConfig.confidenceWeights.keyword * matchRatio;

      // Riduci confidenza se ci sono pochi match su testo lungo
      if (textWords > 10 && matchRatio < 0.5) {
        keywordScore *= 0.7;
      }

      // Bonus per combinazioni chiave (es: "vai" + "progetti")
      if (intentName === 'navigate' && text.includes('vai') && (text.includes('progetti') || text.includes('progetto'))) {
        keywordScore *= 2.0;  // Aumentato significativamente
        matchQuality += 0.5;  // Aumentato significativamente
      }

      // Bonus aggiuntivo per intent navigate con keywords di movimento
      if (intentName === 'navigate' && (text.includes('vai') || text.includes('vedi') || text.includes('mostra'))) {
        keywordScore *= 1.3;  // Aumentato
        matchQuality += 0.2;  // Aumentato
      }

      confidence += keywordScore;
      matchDetails.keywordMatches = keywordMatches;
      matchQuality += matchRatio * 0.4; // Keywords contribuiscono alla qualità
    }
  }

  // Entity matching migliorato
  if (intentConfig.entityDependencies && intentConfig.entityDependencies.length > 0) {
    let entityScore = 0;
    let entityQuality = 0;

    for (const entityType of intentConfig.entityDependencies) {
      if (entities[entityType]) {
        const entityPatterns = entities[entityType].patterns || [];
        const matches = entityPatterns.filter(p => text.includes(p.toLowerCase())).length;
        if (matches > 0) {
          entityScore += intentConfig.confidenceWeights.entity;
          matchDetails.entityMatches += matches;
          entityQuality += 0.3; // Entities sono molto importanti
        }
      }
    }

    confidence += entityScore;
    matchQuality += entityQuality;
  }

  // Penalità per confidenza troppo alta senza entity match (per intent che richiedono entities)
  if (intentConfig.entityDependencies && intentConfig.entityDependencies.length > 0 && matchDetails.entityMatches === 0) {
    confidence *= 0.6; // Riduci confidenza se mancano entities richieste
    matchQuality *= 0.7;
  }

  // Normalizza qualità del match
  matchQuality = Math.min(1.0, matchQuality);

  return {
    confidence: Math.max(0, Math.min(1, confidence)),
    quality: matchQuality,
    details: matchDetails
  };
}

/**
 * Risolve conflitti tra intent con confidenza simile
 */
function resolveIntentConflicts(topCandidates, text) {
  const [first, second] = topCandidates;

  // Regole specifiche di conflitto migliorate
  const conflictRules = {
    'suggestAction vs can_do': () => {
      // can_do è più specifico per domande dirette sulle capacità
      const canDoKeywords = /\b(fai|sai fare|puoi fare|funzioni)\b/i;
      const suggestKeywords = /\b(aiuto|cosa posso|dimmi|spiegami)\b/i;

      if (canDoKeywords.test(text) && !suggestKeywords.test(text)) {
        return first.intent === 'can_do' ? first : second;
      } else if (suggestKeywords.test(text)) {
        return first.intent === 'suggestAction' ? first : second;
      }
      // Default: preferisci can_do per essere più specifici
      return first.intent === 'can_do' ? first : second;
    },

    'codeSnippet vs explain_tech': () => {
      const codeKeywords = /\b(codice|snippet|esempio|js|javascript|html|css|python|function|class|const|let|var)\b/i;
      const explainKeywords = /\b(cos'è|che cos'è|spiega|come funziona|definizione|significato)\b/i;

      if (codeKeywords.test(text) && !explainKeywords.test(text)) {
        return first.intent === 'codeSnippet' ? first : second;
      } else if (explainKeywords.test(text)) {
        return first.intent === 'explain_tech' ? first : second;
      }
      // Default: preferisci explain_tech per testi tecnici generici
      return first.intent === 'explain_tech' ? first : second;
    },

    'navigate vs query_project_count': () => {
      // Se contiene numeri o "quanti", preferisci query
      if (/\b(quanti|numero|totale|how many)\b/i.test(text)) {
        return first.intent === 'query_project_count' ? first : second;
      }
      return first.intent === 'navigate' ? first : second;
    },

    'navigate vs unknown': () => {
      // Se ha qualche match di navigazione, preferisci navigate
      return first.intent === 'navigate' ? first : second;
    }
  };

  const ruleKey = [first.intent, second.intent].sort().join(' vs ');
  if (conflictRules[ruleKey]) {
    return conflictRules[ruleKey]();
  }

  // Default: mantieni il candidato con qualità del match più alta
  return first.matchQuality >= second.matchQuality ? first : second;
}

/**
 * Calcola threshold dinamico basato sulla qualità del match
 */
function calculateDynamicThreshold(matchQuality) {
  // Threshold base più permissivo per casi semplici
  let threshold = 0.15;  // Ridotto da 0.25

  // Aumenta threshold per match di bassa qualità
  if (matchQuality < 0.3) {
    threshold = 0.35;  // Ridotto da 0.4
  } else if (matchQuality < 0.5) {
    threshold = 0.25; // Ridotto da 0.35
  }

  return threshold;
}
export function recognizeIntent(text, conversationHistory = []) {
  // Handle empty or very short input
  const trimmedText = text.trim();
  if (!trimmedText || trimmedText.length < 2) {
    return { intent: 'unknown', confidence: 0, entities: {} };
  }

  // Handle input that are just punctuation or numbers only
  if (/^[^a-zA-Z]*$/.test(trimmedText)) {
    return { intent: 'unknown', confidence: 0, entities: {} };
  }

  // Preprocessing for long inputs: limit analysis to first 300 characters
  // but keep full text for entity extraction
  const analysisText = trimmedText.length > 300 ? trimmedText.substring(0, 300) + '...' : trimmedText;
  const expandedText = expandSynonyms(analysisText);

  // Use context awareness for long inputs
  let contextBonus = 0;
  if (conversationHistory && conversationHistory.length > 0) {
    const recentIntents = conversationHistory.slice(-2).map(h => h.intent);
    // Boost confidence for continuation of recent conversation topics
    if (recentIntents.includes('navigate') && trimmedText.toLowerCase().includes('progett')) {
      contextBonus = 0.1;
    }
    if (recentIntents.includes('setCursor') && trimmedText.toLowerCase().includes('cursore')) {
      contextBonus = 0.1;
    }
  }

  let candidates = [];

  for (const [intentName, intentConfig] of Object.entries(intents)) {
    const matchResult = calculateIntentConfidence(expandedText, intentName, intentConfig);

    // Special handling for long inputs: penalize codeSnippet intent
    if (intentName === 'codeSnippet' && trimmedText.length > 200) {
      matchResult.confidence *= 0.3; // Reduce confidence for codeSnippet on long inputs
    }

    // Special handling for greetings in long inputs
    if (intentName === 'greeting' && trimmedText.length > 100) {
      // Reduce greeting confidence if text contains project/tech keywords
      const hasProjectKeywords = /\b(progett|portfolio|lavor|tecnolog|webgl|javascript|css|html)\b/i.test(trimmedText);
      const hasActionKeywords = /\b(vedi|mostra|apri|cambia|spiega)\b/i.test(trimmedText);
      if (hasProjectKeywords || hasActionKeywords) {
        matchResult.confidence *= 0.5; // Reduce greeting confidence
      }
    }

    if (matchResult.confidence > 0) {
      candidates.push({
        intent: intentName,
        confidence: matchResult.confidence,
        matchQuality: matchResult.quality,
        matchDetails: matchResult.details
      });
    }
  }

  if (candidates.length === 0) {
    return { intent: 'unknown', confidence: 0, entities: {} };
  }

  // Sort by confidence, then by match quality
  candidates.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence;
    }
    return b.matchQuality - a.matchQuality;
  });

  let bestCandidate = candidates[0];

  // Apply contextual confidence adjustment
  bestCandidate.confidence = calculateContextualConfidence(
    bestCandidate.intent,
    bestCandidate.confidence,
    conversationHistory
  );

  // Apply context bonus for long inputs
  bestCandidate.confidence = Math.min(1.0, bestCandidate.confidence + contextBonus);

  // Resolve conflicts with similar confidence scores
  if (candidates.length > 1) {
    const topTwo = candidates.slice(0, 2);
    const confidenceDiff = topTwo[0].confidence - topTwo[1].confidence;

    // If confidence difference is small, apply conflict resolution
    if (confidenceDiff < 0.15) {
      bestCandidate = resolveIntentConflicts(topTwo, expandedText);
    }
  }

  // Apply minimum confidence threshold with quality consideration
  const minThreshold = calculateDynamicThreshold(bestCandidate.matchQuality);
  if (bestCandidate.confidence < minThreshold || bestCandidate.confidence < 0.4) { // Aggiunta soglia minima assoluta
    return { intent: 'unknown', confidence: bestCandidate.confidence, entities: {} };
  }

  return {
    intent: bestCandidate.intent,
    confidence: Math.min(1.0, bestCandidate.confidence),
    entities: {},
    matchQuality: bestCandidate.matchQuality
  };
}