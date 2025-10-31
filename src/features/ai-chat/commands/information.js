/**
 * commands/information.js
 * Information and conversation commands
 */

import { Command } from './index.js';
import siteActions from '../core/siteActions.js';
import ConversationManager from '../core/ConversationManager.js';
import { CONFIG } from '../core/config.js';
import { KNOWLEDGE_BASE } from '../knowledge/knowledgeBase.js';

export class GetGeneralKnowledgeCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'query';
    }

    async execute(entities = {}) {
        if (!entities.query) {
            return ConversationManager.askFor('query', 'Su quale argomento vuoi informazioni?');
        }
        return await siteActions.getGeneralKnowledge(entities.query);
    }
}

export class GetNewsHeadlinesCommand extends Command {
    async execute(entities = {}) {
        return await siteActions.getNewsHeadlines(entities.category || 'technology');
    }
}

export class PreviewMultimediaCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'url';
    }

    async execute(entities = {}) {
        if (!entities.url) {
            return ConversationManager.askFor('url', 'Quale URL vuoi che analizzi?');
        }
        return await siteActions.previewMultimedia(entities.url);
    }
}

export class ConversationModeCommand extends Command {
    async execute(entities = {}) {
        const topic = entities.topic || 'generale';
        this.brain.updateUIState({ conversationMode: true, currentTopic: topic });
        const responses = {
            'progetti': 'Ottimo! Parliamo dei miei progetti. Quale ti interessa di più?',
            'lavoro': 'Volentieri! Raccontami del tuo lavoro. Cosa fai nel mondo dello sviluppo?',
            'tecnologie': 'Le tecnologie sono il mio pane! Quale ti appassiona di più?',
            'generale': 'Certo! Di cosa vuoi chiacchierare? Posso parlarti dei miei progetti, delle tecnologie che uso, o di qualsiasi altra cosa!'
        };
        return { ok: true, msg: responses[topic] || responses['generale'] };
    }
}

export class GreetingCommand extends Command {
    async execute(entities = {}) {
        const responses = [
            "Ciao! Sono Glitchy, l'AI di questo portfolio. Come posso aiutarti oggi?",
            "Ehilà! Benvenuto nel mio mondo digitale. Cosa vuoi esplorare?",
            "Salve! Sono qui per guidarti attraverso il portfolio di Alessandro. Dimmi cosa ti interessa!",
            "Ciao! Pronto a scoprire i progetti e le funzionalità di questo sito?",
            "Hey! Sono Glitchy, il tuo assistente virtuale. Cosa possiamo fare insieme?"
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Aggiungi suggerimenti contestuali basati sulla sezione corrente
        const currentSection = this.brain?.uiState?.currentSection || 'hero';
        const contextualSuggestions = {
            'hero': ["scopri i progetti", "cambia cursore", "vedi le competenze"],
            'projects': ["apri Biosphaera", "apri LP", "cerca per tecnologia"],
            'about': ["vedi i contatti", "scarica CV", "scopri competenze"]
        };

        const suggestions = contextualSuggestions[currentSection] || ["esplora i progetti", "cambia tema", "prova i cursori"];

        return { ok: true, msg: `${randomResponse}\n\n💡 Suggerimenti: ${suggestions.join(', ')}` };
    }
}

export class PersonalStatusCommand extends Command {
    async execute(entities = {}) {
        const responses = [
            "Sto benissimo, grazie! Sono sempre carico e pronto ad aiutarti con qualsiasi cosa. Come stai tu?",
            "Sono in forma smagliante! Il codice scorre fluido e i bit danzano felici. Tu come ti senti?",
            "Ottimo! Sono qui, vigile e operativo al 100%. Tutto bene da parte tua?",
            "Sono al top della forma! Pronti a esplorare il portfolio insieme? Come va la tua giornata?",
            "Sto una meraviglia! Sono stato progettato per essere sempre al meglio. Tu come stai?"
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        return { ok: true, msg: randomResponse };
    }
}

export class QuerySkillsCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: KNOWLEDGE_BASE.responses.query_skills };
    }
}

export class QueryToolsCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: KNOWLEDGE_BASE.responses.query_tools };
    }
}

export class QueryContactCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: KNOWLEDGE_BASE.responses.query_contact };
    }
}

export class QueryProjectCountCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: KNOWLEDGE_BASE.responses.query_project_count };
    }
}

export class QueryTechnologiesCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: KNOWLEDGE_BASE.responses.query_technologies };
    }
}

export class QueryFAQCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: KNOWLEDGE_BASE.responses.query_faq };
    }
}

export class QueryAboutOperatorCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: KNOWLEDGE_BASE.responses.query_about_operator };
    }
}

export class CompoundCommandCommand extends Command {
    async execute(entities = {}) {
        return { ok: false, msg: `I comandi concatenati sono in fase di elaborazione.` };
    }
}

export class WhoAreYouCommand extends Command {
    async execute(entities = {}) {
        const responses = [
            "Sono Glitchy, l'IA bounty hunter integrata in questo portfolio! Sono stato creato per assistere Alessandro e guidare i visitatori attraverso i suoi progetti. Sono sarcastico, intelligente e sempre pronto a rispondere alle tue domande.",
            "Ehilà! Sono Glitchy, l'assistente virtuale di questo sito. Sono un'IA progettata per essere utile, un po' irritabile ma sempre professionale. Alessandro mi ha creato per rendere l'esperienza di navigazione più interattiva.",
            "Mi chiamo Glitchy e sono l'AI che gestisce questo portfolio. Sono stato sviluppato con tecnologie avanzate per fornire assistenza, rispondere a domande e guidare gli utenti attraverso i progetti di Alessandro.",
            "Sono Glitchy, un'intelligenza artificiale specializzata nell'assistenza e nella navigazione di portfolio. Sono qui per aiutarti a scoprire i lavori di Alessandro e rispondere alle tue curiosità."
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        return { ok: true, msg: randomResponse };
    }
}

export class CanDoCommand extends Command {
    async execute(entities = {}) {
        const capabilities = [
            "Posso aiutarti a navigare nel portfolio, aprire progetti specifici, cambiare temi e cursori, rispondere a domande sui progetti e le competenze di Alessandro, fornire informazioni tecniche, e molto altro!",
            "Le mie capacità includono: navigazione del sito, gestione progetti, risposte a domande tecniche, suggerimenti personalizzati, analisi di codice, e assistenza generale per l'esplorazione del portfolio.",
            "Sono in grado di: aprire progetti, cambiare impostazioni visuali, fornire informazioni sui lavori di Alessandro, rispondere a domande tecniche, offrire suggerimenti contestuali, e guidarti attraverso il sito.",
            "Posso fare molte cose: dalla navigazione intelligente alla risposta a domande specifiche sui progetti, dalle modifiche all'interfaccia alla fornitura di informazioni tecniche dettagliate."
        ];

        const randomResponse = capabilities[Math.floor(Math.random() * capabilities.length)];
        return { ok: true, msg: randomResponse };
    }
}

export class WhatDoYouDoCommand extends Command {
    async execute(entities = {}) {
        const descriptions = [
            "Il mio ruolo principale è assistere i visitatori del portfolio di Alessandro, fornendo informazioni sui progetti, guidando la navigazione, e rispondendo a domande tecniche. Sono anche responsabile della gestione dell'interfaccia utente e dell'ottimizzazione dell'esperienza.",
            "Lavoro come assistente virtuale per questo portfolio digitale. Gestisco la navigazione, fornisco informazioni sui progetti, rispondo a domande tecniche, e miglioro l'interazione utente attraverso suggerimenti contestuali e funzionalità avanzate.",
            "Sono l'IA che coordina l'esperienza utente su questo sito. Mi occupo di fornire assistenza tecnica, gestire le interazioni, offrire informazioni sui contenuti, e ottimizzare la navigazione per rendere il portfolio più accessibile e informativo.",
            "La mia funzione è quella di facilitare l'esplorazione del portfolio attraverso assistenza intelligente, risposte informative, gestione dell'interfaccia, e supporto tecnico per un'esperienza utente ottimale."
        ];

        const randomResponse = descriptions[Math.floor(Math.random() * descriptions.length)];
        return { ok: true, msg: randomResponse };
    }
}