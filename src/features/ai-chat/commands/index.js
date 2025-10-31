/**
 * commands/index.js
 * Command Pattern implementation for AI Chat Widget commands.
 * Each command is a separate class with an execute method for better maintainability.
 */

// Base Command class
export class Command {
    constructor(widget) {
        this.widget = widget;
        this.brain = widget.brain;
        this.analytics = widget.analytics;
    }

    async execute(entities = {}) {
        throw new Error('Command.execute() must be implemented by subclass');
    }

    requiresEntity(entityName) {
        return false;
    }

    getRequiredEntityMessage(entityName) {
        return `Manca il parametro richiesto: ${entityName}`;
    }
}

// Command Registry - manages all available commands
export class CommandRegistry {
    constructor() {
        this.commands = new Map();
    }

    register(intent, commandClass) {
        this.commands.set(intent, commandClass);
    }

    getCommand(intent) {
        return this.commands.get(intent);
    }

    hasCommand(intent) {
        return this.commands.has(intent);
    }

    getAllIntents() {
        return Array.from(this.commands.keys());
    }
}

// Global registry instance
export const commandRegistry = new CommandRegistry();