/**
 * commands/system.js
 * System and utility commands
 */

import { Command } from './index.js';
import siteActions from '../core/siteActions.js';
import ConversationManager from '../core/ConversationManager.js';
import { CONFIG } from '../core/config.js';

export class PlaySoundCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'soundName';
    }

    async execute(entities = {}) {
        if (!entities.soundName) {
            return ConversationManager.askFor('soundName', 'Quale suono vuoi riprodurre?');
        }
        return siteActions.playSound(entities.soundName);
    }
}

export class GetWeatherCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'location';
    }

    async execute(entities = {}) {
        if (!entities.location) {
            return ConversationManager.askFor('location', 'Per quale città vuoi il meteo?');
        }
        return await siteActions.getWeather(entities.location);
    }
}

export class SystemInfoCommand extends Command {
    async execute(entities = {}) {
        return siteActions.systemInfo();
    }
}

export class ShowAnalyticsCommand extends Command {
    async execute(entities = {}) {
        return { ok: true, msg: this.analytics.getSummary() };
    }
}

export class ShowPersonalityCommand extends Command {
    async execute(entities = {}) {
        const traits = this.brain.dynamicPersonality.traits;
        const mood = this.brain.dynamicPersonality.getCurrentMood();
        const history = this.brain.dynamicPersonality.moodHistory.slice(-5);

        let msg = `🧠 Personalità di ${CONFIG.name} (evoluta dinamicamente):\n\n`;
        msg += `📊 Tratti attuali:\n`;
        msg += `• Sarcastico: ${Math.round(traits.sarcasm * 100)}%\n`;
        msg += `• Utile: ${Math.round(traits.helpfulness * 100)}%\n`;
        msg += `• Verboso: ${Math.round(traits.verbosity * 100)}%\n`;
        msg += `• Empatico: ${Math.round(traits.empathy * 100)}%\n`;
        msg += `• Creativo: ${Math.round(traits.creativity * 100)}%\n`;
        msg += `• Sicuro: ${Math.round(traits.confidence * 100)}%\n\n`;
        msg += `🥳 Umore attuale: ${mood}\n\n`;

        if (history.length > 0) {
            msg += `📈 Ultimi stati d'animo:\n`;
            history.forEach((h, i) => {
                msg += `${i + 1}. Soddisfazione: ${h.satisfaction}/5 - Sentiment: ${h.sentiment}\n`;
            });
        }
        msg += `\n✨ ${CONFIG.name} si adatta automaticamente al tuo feedback!`;
        return { ok: true, msg: msg };
    }
}