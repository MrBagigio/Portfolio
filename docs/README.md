# Portfolio Online V8 - Documentazione Progetto

## 🏗️ Struttura del Progetto

Il progetto è stato riorganizzato con una struttura modulare e scalabile per migliorare la manutenibilità e la leggibilità del codice.

### 📁 Struttura delle Cartelle

```
📁 PortfolioOnline/V8/
├── 📁 src/                           # Codice sorgente principale
│   ├── 📁 core/                      # Nucleo dell'applicazione
│   │   ├── 📁 app/                   # Logica principale dell'app
│   │   │   ├── App.js               # Classe principale Application
│   │   │   ├── Router.js            # Gestione routing
│   │   │   └── main.js              # Entry point dell'applicazione
│   │   ├── 📁 rendering/            # WebGL e rendering 3D
│   │   │   ├── WebGLManager.js
│   │   │   ├── webglUtils.js
│   │   │   └── shaders/
│   │   └── 📁 interactions/         # Gestione interazioni utente
│   │       └── InteractionManager.js
│   │
│   ├── 📁 components/                # Componenti UI riutilizzabili
│   │   ├── 📁 ui/                   # Componenti interfaccia base
│   │   │   ├── ChimeraNavbar.js
│   │   │   ├── TerminalCursor.js
│   │   │   ├── GlobalCRTBackground.js
│   │   │   └── TextScramble.js
│   │   ├── 📁 games/                # Componenti di gioco
│   │   │   ├── 📁 cursors/
│   │   │   │   ├── AsteroidsCursor.js
│   │   │   │   └── PacmanCursor.js
│   │   └── 📁 effects/              # Effetti visivi
│   │       ├── Title3D.js
│   │       ├── GlitchImage.js
│   │       └── VhsTransitionShader.js
│   │
│   ├── 📁 features/                 # Moduli funzionali specifici
│   │   ├── 📁 ai-chat/              # Sistema AI Chat
│   │   │   ├── 📁 core/             # Nucleo AI
│   │   │   │   ├── AIChatWidget.js
│   │   │   │   ├── ConversationManager.js
│   │   │   │   ├── GlitchyBrain.js
│   │   │   │   ├── siteActions.js
│   │   │   │   ├── dom.js
│   │   │   │   ├── persona.js
│   │   │   │   └── config.js
│   │   │   ├── 📁 nlu/              # Natural Language Understanding
│   │   │   │   ├── NLU.js
│   │   │   │   ├── nlu_pipeline.js
│   │   │   │   └── nlu_config.js
│   │   │   ├── 📁 commands/         # Sistema comandi
│   │   │   ├── 📁 analytics/        # Analytics AI
│   │   │   │   └── GlitchyAnalytics.js
│   │   │   └── 📁 knowledge/        # Knowledge base
│   │   │       └── knowledgeBase.js
│   │   ├── 📁 projects/             # Gestione progetti
│   │   │   ├── ProjectService.js
│   │   │   └── projectGallery.js
│   │   └── 📁 terminal/             # Sistema terminale
│   │       └── CommandLine.js
│   │
│   ├── 📁 services/                 # Servizi applicativi
│   │   ├── 📁 api/                  # Chiamate API esterne
│   │   │   ├── APIService.js
│   │   │   └── api_integration_test.js
│   │   ├── 📁 audio/                # Gestione audio
│   │   │   └── AudioManager.js
│   │   ├── 📁 state/                # Gestione stato applicazione
│   │   │   └── StateService.js
│   │   ├── 📁 telemetry/            # Telemetria e analytics
│   │   │   └── TelemetryService.js
│   │   └── 📁 dom/                  # Manipolazione DOM sicura
│   │       └── DOMService.js
│   │
│   ├── 📁 utils/                    # Utilità condivise
│   │   ├── 📁 math/                 # Utilità matematiche
│   │   │   └── MathParser.js
│   │   ├── 📁 i18n/                 # Internazionalizzazione
│   │   │   └── i18n.js
│   │   ├── 📁 config/               # Configurazioni
│   │   │   └── Constants.js
│   │   └── 📁 events/               # Sistema eventi
│   │       └── EventBus.js
│   │
│   └── 📁 setup/                    # Configurazione iniziale
│       ├── 📁 animations/           # Animazioni di setup
│       │   ├── revealAnimations.js
│       │   └── pageTransitions.js
│       ├── 📁 initialization/       # Inizializzazione componenti
│       │   ├── cursorManager.js
│       │   ├── navbar.js
│       │   ├── systemInfo.js
│       │   └── caseHistory.js
│       └── preloader.js
│
├── 📁 assets/                       # Asset statici
│   ├── 📁 audio/                    # File audio
│   ├── 📁 images/                   # Immagini
│   ├── 📁 videos/                   # Video
│   └── 📁 fonts/                    # Font
│
├── 📁 config/                       # Configurazioni progetto
│   ├── projects.json
│   └── projects_assets/
│
├── 📁 api/                          # API endpoints
│   └── chat.js
│
├── 📁 docs/                         # Documentazione
│   └── README.md
│
├── 📁 tools/                        # Tool di sviluppo
│   ├── 📁 build/                    # Script di build
│   ├── 📁 test/                     # Test
│   │   ├── integration_test.js
│   │   ├── test_imports.js
│   │   ├── api_integration_test.js
│   │   └── 📁 harnesses/
│   │       ├── testPacmanHarness.js
│   │       └── checkCanvasZindex.js
│   └── 📁 dev/                      # Utility sviluppo
│       └── testWebGLContext.js
│
├── 📁 legacy/                       # Codice legacy (backup)
│   ├── siteActions_backup.js
│   └── siteActions_old.js
│
├── index.html                       # Pagina principale
├── lp_project.html                  # Landing page progetti
├── test_ai.html                     # Pagina test AI
├── test_ai.js                       # Script test AI
└── testing.py                       # Script di testing Python
```

## 🎯 Principi Architetturali

### Separazione delle Responsabilità
- **Core**: Logica fondamentale dell'applicazione
- **Components**: Componenti UI riutilizzabili
- **Features**: Moduli funzionali specifici
- **Services**: Servizi applicativi
- **Utils**: Utilità condivise

### Organizzazione per Feature
Ogni feature complessa (come AI Chat) ha la sua cartella dedicata con sottocartelle per aspetti specifici (core, nlu, commands, analytics, knowledge).

### Configurazioni Centralizzate
- `config/`: Configurazioni del progetto
- `src/utils/config/`: Costanti dell'applicazione
- `src/setup/`: Configurazione iniziale

## 🚀 Come Eseguire il Progetto

1. Aprire `index.html` nel browser
2. Il sistema caricherà automaticamente tutti i moduli ES6

## 🛠️ Sviluppo

### Aggiungere una Nuova Feature
1. Creare una cartella in `src/features/nome-feature/`
2. Organizzare il codice in sottocartelle logiche
3. Aggiornare gli import path relativi
4. Testare l'integrazione

### Aggiungere un Nuovo Servizio
1. Creare il servizio in `src/services/nome-servizio/`
2. Implementare l'interfaccia richiesta
3. Registrarlo nel sistema di dependency injection

### Aggiungere un Nuovo Componente
1. Scegliere la categoria appropriata in `src/components/`
2. Implementare il componente con l'interfaccia standard
3. Testare la riutilizzabilità

## 📋 TODO e Manutenzione

- [ ] Implementare sistema di build automatizzato
- [ ] Aggiungere testing framework
- [ ] Creare documentazione API per i servizi
- [ ] Implementare hot reload per sviluppo
- [ ] Aggiungere linting e formattazione automatica

## 🔄 Migrazione dalla Struttura Precedente

La struttura precedente era organizzata in `assets/js/` con cartelle `core/`, `modules/`, `setup/`, `services/`. La nuova struttura separa chiaramente:

- Codice di produzione da codice di sviluppo/test
- Componenti UI da logica di business
- Feature specifiche da servizi condivisi
- Asset statici per tipo

Tutti gli import path sono stati aggiornati per riflettere la nuova struttura.