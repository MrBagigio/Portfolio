/**
 * commands/projects.js
 * Project and learning related commands
 */

import { Command } from './index.js';
import siteActions from '../core/siteActions.js';
import ConversationManager from '../core/ConversationManager.js';

export class SearchProjectsCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'technology';
    }

    async execute(entities = {}) {
        if (!entities.technology) {
            return ConversationManager.askFor('technology', 'Quale tecnologia vuoi cercare?');
        }
        return await siteActions.searchProjectsByTechnology(entities.technology);
    }
}

export class SuggestActionCommand extends Command {
    async execute(entities = {}) {
        return siteActions.suggestNextAction();
    }
}

export class AnalyzeCodeCommand extends Command {
    async execute(entities = {}) {
        return siteActions.analyzeCode();
    }
}

export class GitStatusCommand extends Command {
    async execute(entities = {}) {
        return siteActions.gitStatus();
    }
}

export class LearnPreferenceCommand extends Command {
    requiresEntity(entityName) {
        return ['preference', 'value'].includes(entityName);
    }

    async execute(entities = {}) {
        if (!entities.preference || !entities.value) {
            return ConversationManager.askFor('preference', 'Cosa vuoi che impari? (es: "preferisci tema scuro")');
        }
        return siteActions.learnPreference(entities.preference, entities.value);
    }
}

export class CodeSnippetCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'language';
    }

    async execute(entities = {}) {
        if (!entities.language) {
            return ConversationManager.askFor('language', 'In quale linguaggio vuoi il codice?');
        }
        return siteActions.codeSnippet(entities.language);
    }
}

export class CalculateCommand extends Command {
    requiresEntity(entityName) {
        return entityName === 'expression';
    }

    async execute(entities = {}) {
        if (!entities.expression) {
            return ConversationManager.askFor('expression', 'Cosa vuoi calcolare?');
        }
        return siteActions.calculate(entities.expression);
    }
}