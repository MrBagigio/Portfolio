/**
 * commands/navigation.js
 * Navigation and UI-related commands
 */

import { Command } from './index.js';
import siteActions from '../core/siteActions.js';
import ConversationManager from '../core/ConversationManager.js';
import { personaReply } from '../core/persona.js';

export class OpenProjectCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'projectName';
    }

    async execute(entities = {}) {
        if (!entities.projectName) {
            return ConversationManager.askFor('projectName', 'Quale progetto vuoi aprire?');
        }
        return await siteActions.openProjectCase(entities.projectName);
    }
}

export class SetCursorCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'cursorType';
    }

    async execute(entities = {}) {
        if (!entities.cursorType) {
            return ConversationManager.askFor('cursorType', 'Quale cursore vuoi usare (pacman, asteroids, default)?');
        }
        return siteActions.setGameCursor(entities.cursorType);
    }
}

export class NavigateCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'sectionName';
    }

    async execute(entities = {}) {
        if (!entities.sectionName) {
            return ConversationManager.askFor('sectionName', 'A quale sezione vuoi andare (hero, projects, about, contact)?');
        }
        return siteActions.navigateTo(entities.sectionName);
    }
}

export class SetThemeCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'theme';
    }

    async execute(entities = {}) {
        if (!entities.theme) {
            return ConversationManager.askFor('theme', 'Vuoi il tema chiaro o scuro?');
        }
        return siteActions.setTheme(entities.theme);
    }
}

export class SetAccessibilityCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'accessibility';
    }

    async execute(entities = {}) {
        if (!entities.accessibility) {
            return ConversationManager.askFor('accessibility', 'Vuoi testo grande o contrasto alto?');
        }
        return siteActions.setAccessibility(entities.accessibility);
    }
}