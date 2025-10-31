// File: /assets/js/modules/knowledgeBase.js

// Questa è la memoria permanente di A.P.I.S.
// Contiene tutte le informazioni fattuali sul portfolio e sull'operatore.

export const KNOWLEDGE_BASE = {
  operator: {
    name: "Alessandro Giacobbi",
    id: "ALESSANDRO GIACOBBI",
    status: "ATTIVO",
    role: "3D Artist",
    specialization: "3D Environment, Character Design",
    bio: "La mia passione per il 3D nasce dalla volontà di creare mondi e storie immersive. Ogni progetto è un'esplorazione, una sfida tecnica e un'opportunità per dare vita a qualcosa di unico.",
    contact: "alessandro.giacobbi.3d@gmail.com",
    skills: ["3D Modeling", "Texturing", "UV Mapping", "Lighting", "Rendering", "Character Design", "Environment Design"],
    experience: "Esperto in creazione di ambienti 3D dettagliati e personaggi memorabili per giochi e media digitali.",
    location: "Italia",
    tools: {
      primary: ["Maya", "ZBrush", "Blender", "Substance Painter"],
      secondary: ["Mari", "Arnold", "V-Ray", "Cycles", "Nuke", "After Effects"]
    }
  },
  site: {
    name: "A.P.I.S. TERMINAL v4.0",
    version: "4.0",
    description: "Portfolio interattivo futuristico con elementi arcade e AI integrata",
    features: {
      cursors: ["Pacman", "Asteroids", "Default"],
      themes: ["Dark", "Light"],
      audio: ["Coin", "Transition", "Hover", "Notify"],
      accessibility: ["Text Large", "High Contrast"]
    },
    sections: {
      hero: "Sezione principale con presentazione e interfaccia futuristica",
      projects: "Galleria interattiva con slider before/after e video lazy-loading",
      about: "Profilo operatore con dossier stile arcade",
      contact: "Sezione contatti con email e toolkit",
      shop: "Sezione negozio (placeholder per future implementazioni)"
    },
    interactiveElements: {
      navbar: "Console interattiva con monitor di sistema e arcade display",
      chatWidget: "AI Glitchy con personalità dinamica e apprendimento",
      magneticTargets: "Elementi che reagiscono ai cursori speciali",
      crtEffects: "Effetti visivi retrò con rumore e scanlines"
    }
  },
  cursors: {
    pacman: {
      description: "Cursore interattivo con gameplay Pacman completo",
      features: ["Raccolta pallini", "Fantasmi inseguitore", "Power-ups", "Sistema punteggio", "Effetti sonori"],
      activation: "Automatico casuale o comando 'setCursor pacman'",
      states: ["Active", "Inactive", "Magnetic"]
    },
    asteroids: {
      description: "Navicella spaziale con elementi distruttibili",
      features: ["Asteroidi da distruggere", "Nemici alieni", "Power-ups", "Monete", "Onde progressive", "Particellari"],
      activation: "Automatico casuale o comando 'setCursor asteroids'",
      states: ["Space", "Cursor", "Magnetic"]
    },
    glitch: {
      description: "Cursore cyberpunk con effetto Matrix rain",
      features: ["Pioggia di caratteri Matrix", "Trail digitale del cursore", "Effetti glitch", "Modalità magnetica"],
      activation: "Comando 'setCursor glitch'",
      states: ["Active", "Inactive", "Magnetic"]
    },
    default: {
      description: "Cursore standard del browser",
      features: ["Nessun effetto speciale", "Comportamento standard"],
      activation: "Comando 'setCursor default'"
    }
  },
  commands: {
    // Navigazione
    navigate: "Naviga verso sezioni: hero, projects, about, contact, shop",
    openProject: "Apre progetti specifici: biosphaera, lp",

    // Configurazione
    setCursor: "Cambia cursore: pacman, asteroids, glitch, default",
    setTheme: "Cambia tema: chiaro/scuro, light/dark",
    setAccessibility: "Accessibilità: testo-grande, contrasto-alto",

    // Audio
    playSound: "Riproduce suoni: coin, transition, hover, notify",

    // Informazioni
    getWeather: "Meteo per città specifiche",
    getGeneralKnowledge: "Spiegazioni di termini tecnici",
    getNewsHeadlines: "Notizie per categoria",
    previewMultimedia: "Analizza URL YouTube/GitHub",

    // Sviluppo
    analyzeCode: "Analizza struttura del sito",
    gitStatus: "Stato repository (demo)",
    codeSnippet: "Esempi codice: javascript, html, css, react, webgl",
    calculate: "Calcoli matematici",

    // AI
    showPersonality: "Mostra tratti personalità dinamica",
    showAnalytics: "Statistiche conversazione",
    suggestAction: "Suggerimenti contestuali",

    // Sistema
    systemInfo: "Informazioni browser e sistema"
  },
  easterEggs: {
    konamiCode: {
      sequence: "↑↑↓↓←→←→BA",
      effect: "Attiva forzatamente cursore Pacman",
      detection: "Globale tastiera"
    },
    creditsClick: {
      trigger: "Click ripetuto su 'CREDITS' navbar",
      effect: "Aumenta contatore crediti",
      sound: "Coin sound effect"
    }
  },
  telemetry: {
    metrics: ["CPU", "Memory", "GPU", "Network"],
    display: "Barre grafiche realtime nella navbar",
    arcade: {
      highScore: "Punteggio massimo salvato",
      credits: "Contatore sistema arcade",
      uptime: "Timer sistema HH:MM:SS"
    }
  },
  tools: {
    modellazione: ["Maya", "ZBrush", "Blender"],
    texturing: ["Substance Painter", "Mari"],
    rendering: ["Arnold", "V-Ray", "Cycles"],
    animation: ["Maya", "Blender"],
    compositing: ["Nuke", "After Effects"]
  },
  siteSections: {
    hero: "Sezione principale del terminale con interfaccia futuristica.",
    projects: "Galleria interattiva dei lavori 3D con descrizioni dettagliate.",
    about: "Profilo completo dell'artista, biografia e specializzazioni tecniche.",
    contact: "Informazioni di contatto, email e collegamenti ai social/professionali."
  },
  technologies: {
    webgl: "Tecnologia per rendering 3D direttamente nel browser web.",
    threejs: "Libreria JavaScript per creare esperienze 3D interattive.",
    javascript: "Linguaggio di programmazione principale per lo sviluppo web.",
    html5: "Standard per contenuti multimediali interattivi nel web.",
    css3: "Linguaggio per definire lo stile e il layout delle pagine web."
  },
  generalKnowledge: {
    ai: "Intelligenza Artificiale: sistemi che simulano l'intelligenza umana per risolvere problemi complessi.",
    machineLearning: "Apprendimento Automatico: branca dell'AI che permette ai sistemi di imparare dai dati.",
    neuralNetworks: "Reti Neurali: modelli ispirati al cervello umano per elaborare informazioni.",
    portfolio: "Raccolta di lavori che dimostrano le competenze e l'esperienza di un professionista.",
    bountyHunter: "Cacciatore di taglie: personaggio che lavora per conto proprio catturando criminali."
  },
  faq: [
    {
      question: "Che tipo di progetti realizzi?",
      answer: "Creo ambienti 3D dettagliati, personaggi e scene per giochi, film e media digitali."
    },
    {
      question: "Quali software usi?",
      answer: "Principalmente Maya, ZBrush, Blender per la modellazione, Substance Painter per il texturing, e vari motori di rendering."
    },
    {
      question: "Come posso contattarti?",
      answer: "Puoi scrivermi all'email alessandro.giacobbi.3d@gmail.com o utilizzare il form di contatto del sito."
    },
    {
      question: "Sei disponibile per commissioni?",
      answer: "Sì, sono sempre interessato a nuovi progetti. Contattami per discutere i dettagli."
    },
    {
      question: "Qual è la tua specializzazione?",
      answer: "Mi specializzo in design di ambienti 3D e character design, con focus su mondi immersivi e storie coinvolgenti."
    },
    {
      question: "Quanti progetti hai nel portfolio?",
      answer: "Attualmente ho 2 progetti completi: Biosphaera (142MB, 2023) e LP Project (89MB, 2023)."
    },
    {
      question: "Il sito è responsive?",
      answer: "Sì, ottimizzato per desktop e dispositivi mobili con layout adattivo."
    },
    {
      question: "Cosa sono i cursori speciali?",
      answer: "Pacman e Asteroids sono cursori interattivi con gameplay completo che seguono il mouse."
    },
    {
      question: "Come funziona Glitchy AI?",
      answer: "Glitchy è un AI con personalità dinamica che apprende dalle interazioni e può controllare il sito."
    }
  ],
  // La lista dei progetti verrà caricata qui dinamicamente.
  projects: [],

  // Risposte standard per i comandi informativi
  responses: {
    query_skills: "Alessandro ha competenze in JavaScript, WebGL, Three.js, animazione 3D, sviluppo web, e creazione di esperienze interattive.",
    query_tools: "Alessandro lavora principalmente con JavaScript, Three.js per la grafica 3D, Blender per la modellazione, e vari framework web come React e Node.js.",
    query_contact: "Puoi contattare Alessandro tramite email o LinkedIn. Vuoi che ti fornisca i dettagli di contatto?",
    query_project_count: "Alessandro ha realizzato diversi progetti nel portfolio. Alcuni dei principali sono Biosphaera (progetto 3D interattivo) e LP (landing page animata).",
    query_technologies: "Le tecnologie principali includono JavaScript, WebGL, Three.js, HTML5, CSS3, Node.js, e varie librerie per l'animazione e l'interattività.",
    query_faq: "Posso rispondere a domande sui progetti, sulle competenze tecniche, sui contatti, e aiutarti a navigare il sito. Cosa vuoi sapere?",
    query_about_operator: "Alessandro è uno sviluppatore full-stack specializzato in web development, 3D e animazione. Ha esperienza in JavaScript, Three.js, WebGL e molto altro!"
  },

  aiCapabilities: {
    introduction: "Sono Glitchy, un'intelligenza artificiale integrata in questo sito. Posso aiutarti a esplorare i progetti, a personalizzare la tua esperienza e a rispondere a domande su Alessandro e il suo lavoro. Ecco un riepilogo di ciò che posso fare:",
    
    coreFunctions: [
      {
        category: "Navigazione del Sito",
        description: "Posso guidarti attraverso le diverse sezioni del portfolio.",
        examples: [
          "Vai alla sezione 'progetti'",
          "Portami alla pagina dei contatti",
          "Mostrami la sezione 'about'"
        ]
      },
      {
        category: "Interazione con i Progetti",
        description: "Posso fornirti informazioni sui progetti, aprirli e cercarli in base alla tecnologia.",
        examples: [
          "Apri il progetto Biosphaera",
          "Parlami del progetto LP",
          "Quali progetti usano WebGL?",
          "Cerca progetti realizzati con Three.js"
        ]
      },
      {
        category: "Personalizzazione dell'Interfaccia",
        description: "Puoi chiedermi di modificare l'aspetto e il comportamento del sito.",
        examples: [
          "Cambia il cursore in 'pacman'",
          "Attiva il tema scuro",
          "Metti il testo grande per una migliore leggibilità"
        ]
      },
      {
        category: "Informazioni Generali",
        description: "Posso rispondere a domande su Alessandro, le sue competenze e gli strumenti che utilizza.",
        examples: [
          "Quali sono le competenze di Alessandro?",
          "Che software usa per modellare?",
          "Come posso contattarlo?"
        ]
      },
      {
        category: "Funzionalità Avanzate",
        description: "Posso eseguire comandi più complessi e fornirti informazioni tecniche.",
        examples: [
          "Mostrami un esempio di codice JavaScript",
          "Che tempo fa a Milano?",
          "Analizza il codice di questa pagina"
        ]
      }
    ],
    
    conclusion: "Prova a farmi una di queste domande o a esplorare liberamente. Sono qui per aiutarti!"
  }
};

// Funzione per caricare dinamicamente i dati dei progetti nella base di conoscenza.
export function loadProjectsIntoKB() {
  return fetch('assets/projects.json')
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(projectData => {
      KNOWLEDGE_BASE.projects = projectData;
      console.log('[KB] Base di conoscenza aggiornata con i dati dei progetti.');
      return true; // Indica successo
    })
    .catch(error => {
      console.error('[KB] Impossibile caricare i progetti nella base di conoscenza:', error);
      return false; // Indica fallimento
    });
}

// Metodi helper per la base di conoscenza
export const knowledgeBaseMethods = {
  getAllProjectNames: () => {
    if (!KNOWLEDGE_BASE.projects || !Array.isArray(KNOWLEDGE_BASE.projects)) {
      return [];
    }
    return KNOWLEDGE_BASE.projects.map(project => project.name || project.title || '').filter(name => name);
  },

  getProjectByName: (name) => {
    if (!KNOWLEDGE_BASE.projects || !Array.isArray(KNOWLEDGE_BASE.projects)) {
      return null;
    }
    return KNOWLEDGE_BASE.projects.find(project =>
      (project.name || project.title || '').toLowerCase().includes(name.toLowerCase())
    );
  },

  getCapabilities: () => {
    return KNOWLEDGE_BASE.aiCapabilities;
  },

  getAllSkills: () => {
    return KNOWLEDGE_BASE.operator.skills || [];
  },

  getAllTools: () => {
    const tools = KNOWLEDGE_BASE.operator.tools || {};
    return [...(tools.primary || []), ...(tools.secondary || [])];
  },

  findRelevant: (query, options = {}) => {
    const { limit = 5, semantic = true } = options;
    const relevant = [];
    const queryStr = typeof query === 'string' ? query : String(query || '');
    const lowerQuery = queryStr.toLowerCase();

    // Ricerca semantica avanzata
    if (semantic) {
      relevant.push(...knowledgeBaseMethods._semanticSearch(queryStr));
    }

    // Cerca nei progetti
    if (KNOWLEDGE_BASE.projects && Array.isArray(KNOWLEDGE_BASE.projects)) {
      for (const project of KNOWLEDGE_BASE.projects) {
        const title = (project.name || project.title || '').toLowerCase();
        const description = (project.description || '').toLowerCase();
        const technologies = (project.technologies || []).join(' ').toLowerCase();

        let relevance = 0;
        if (title.includes(lowerQuery)) relevance += 0.9;
        if (description.includes(lowerQuery)) relevance += 0.7;
        if (technologies.includes(lowerQuery)) relevance += 0.8;

        if (relevance > 0.3) {
          relevant.push({
            type: 'project',
            title: project.name || project.title,
            content: project.description,
            technologies: project.technologies,
            solution: `Informazioni sul progetto: ${project.description}`,
            relevance: relevance
          });
        }
      }
    }

    // Cerca nelle competenze
    if (KNOWLEDGE_BASE.operator.skills) {
      for (const skill of KNOWLEDGE_BASE.operator.skills) {
        const skillLower = skill.toLowerCase();
        let relevance = 0;
        if (skillLower.includes(lowerQuery)) relevance += 0.8;
        if (knowledgeBaseMethods._calculateSimilarity(skillLower, lowerQuery) > 0.6) relevance += 0.5;

        if (relevance > 0.4) {
          relevant.push({
            type: 'skill',
            content: skill,
            solution: `Competenza disponibile: ${skill}`,
            relevance: relevance
          });
        }
      }
    }

    // Cerca negli strumenti
    const allTools = knowledgeBaseMethods.getAllTools();
    for (const tool of allTools) {
      const toolLower = tool.toLowerCase();
      let relevance = 0;
      if (toolLower.includes(lowerQuery)) relevance += 0.7;
      if (knowledgeBaseMethods._calculateSimilarity(toolLower, lowerQuery) > 0.6) relevance += 0.4;

      if (relevance > 0.4) {
        relevant.push({
          type: 'tool',
          content: tool,
          solution: `Strumento disponibile: ${tool}`,
          relevance: relevance
        });
      }
    }

    // Cerca nelle sezioni del sito
    if (KNOWLEDGE_BASE.site.sections) {
      for (const [key, description] of Object.entries(KNOWLEDGE_BASE.site.sections)) {
        const descLower = description.toLowerCase();
        let relevance = 0;
        if (descLower.includes(lowerQuery) || key.includes(lowerQuery)) relevance += 0.6;
        if (knowledgeBaseMethods._calculateSimilarity(descLower, lowerQuery) > 0.5) relevance += 0.3;

        if (relevance > 0.3) {
          relevant.push({
            type: 'site_section',
            content: key,
            solution: `Sezione del sito: ${description}`,
            relevance: relevance
          });
        }
      }
    }

    // Cerca nelle FAQ
    if (KNOWLEDGE_BASE.faq) {
      for (const faq of KNOWLEDGE_BASE.faq) {
        const questionLower = faq.question.toLowerCase();
        const answerLower = faq.answer.toLowerCase();
        let relevance = 0;
        if (questionLower.includes(lowerQuery)) relevance += 0.8;
        if (answerLower.includes(lowerQuery)) relevance += 0.6;
        if (knowledgeBaseMethods._calculateSimilarity(questionLower + ' ' + answerLower, lowerQuery) > 0.5) relevance += 0.4;

        if (relevance > 0.4) {
          relevant.push({
            type: 'faq',
            content: faq.question,
            solution: faq.answer,
            relevance: relevance
          });
        }
      }
    }

    return relevant
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  },

  _semanticSearch: (query) => {
    const results = [];
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Espandi ricerca con sinonimi
    const expandedWords = knowledgeBaseMethods._expandWithSynonyms(queryWords);

    // Cerca concetti correlati
    const concepts = knowledgeBaseMethods._findRelatedConcepts(expandedWords);

    concepts.forEach(concept => {
      results.push({
        type: 'semantic',
        content: concept.term,
        solution: concept.explanation,
        relevance: concept.similarity
      });
    });

    return results;
  },

  _expandWithSynonyms: (words) => {
    const expanded = new Set(words);

    // Aggiungi sinonimi basati su conoscenza
    const synonymMap = {
      'progetto': ['lavoro', 'portfolio', 'realizzazione'],
      'competenza': ['skill', 'abilità', 'esperienza'],
      'strumento': ['software', 'tool', 'programma'],
      'sito': ['web', 'portfolio', 'website'],
      '3d': ['tridimensionale', 'modellazione', 'rendering']
    };

    words.forEach(word => {
      if (synonymMap[word]) {
        synonymMap[word].forEach(syn => expanded.add(syn));
      }
    });

    return Array.from(expanded);
  },

  _findRelatedConcepts: (words) => {
    const concepts = [];

    // Concetti da knowledge base
    const conceptMap = {
      'javascript': { explanation: 'Linguaggio di programmazione per il web', similarity: 0.8 },
      'webgl': { explanation: 'API per rendering 3D nel browser', similarity: 0.9 },
      'three.js': { explanation: 'Libreria JavaScript per grafica 3D', similarity: 0.9 },
      'blender': { explanation: 'Software open source per modellazione 3D', similarity: 0.7 },
      'maya': { explanation: 'Software professionale per animazione 3D', similarity: 0.7 }
    };

    words.forEach(word => {
      if (conceptMap[word]) {
        concepts.push({
          term: word,
          ...conceptMap[word]
        });
      }
    });

    return concepts;
  },

  _calculateSimilarity: (str1, str2) => {
    // Similarità semplice basata su Jaccard
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  },

  // Caricamento dinamico di contenuti aggiuntivi
  loadAdditionalContent: async (contentType) => {
    try {
      let url = '';
      switch (contentType) {
        case 'projects':
          url = 'assets/projects.json';
          break;
        case 'tutorials':
          url = 'assets/tutorials.json';
          break;
        case 'updates':
          url = 'assets/updates.json';
          break;
        default:
          return false;
      }

      const response = await fetch(url);
      if (!response.ok) return false;

      const data = await response.json();

      // Integra nella knowledge base
      if (contentType === 'projects' && Array.isArray(data)) {
        KNOWLEDGE_BASE.projects = [...(KNOWLEDGE_BASE.projects || []), ...data];
      }

      console.log(`[KB] Loaded additional ${contentType} content`);
      return true;
    } catch (error) {
      console.warn(`[KB] Failed to load ${contentType}:`, error);
      return false;
    }
  },

  // Aggiornamento dinamico della knowledge base
  updateKnowledge: (updates) => {
    try {
      for (const [key, value] of Object.entries(updates)) {
        if (KNOWLEDGE_BASE[key]) {
          if (Array.isArray(KNOWLEDGE_BASE[key])) {
            KNOWLEDGE_BASE[key].push(...value);
          } else if (typeof KNOWLEDGE_BASE[key] === 'object') {
            Object.assign(KNOWLEDGE_BASE[key], value);
          } else {
            KNOWLEDGE_BASE[key] = value;
          }
        }
      }
      console.log('[KB] Knowledge base updated');
      return true;
    } catch (error) {
      console.warn('[KB] Update failed:', error);
      return false;
    }
  }
};