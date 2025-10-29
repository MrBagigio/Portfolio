// assets/js/modules/CommandLine.js
import { TextScramble } from './TextScramble.js';
import { telemetry } from '../services/TelemetryService.js';

const COMMAND_HISTORY_KEY = 'apis_command_history';
const MAX_HISTORY = 20;

export class CommandLine {
    constructor({ inputElement, outputElement, promptElement, onSubmit }) {
        this.input = inputElement;
        this.output = outputElement;
        this.prompt = promptElement;
        this.onSubmit = onSubmit;
        this.scrambler = new TextScramble(this.output);
        this.history = this.loadHistory();
        this.historyIndex = -1;

        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleFocus = this.handleFocus.bind(this);
        this.boundHandleBlur = this.handleBlur.bind(this);

        this.init();
    }

    init() {
        this.input.addEventListener('keydown', this.boundHandleKeyDown);
        this.input.addEventListener('focus', this.boundHandleFocus);
        this.input.addEventListener('blur', this.boundHandleBlur);
        this.setText('READY // SELECT ROUTE');
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const command = this.input.value.trim();
            if (command) {
                this.addToHistory(command);
                this.execute(command);
                this.input.value = '';
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (this.history.length > 0) {
                this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
                this.input.value = this.history[this.historyIndex];
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = -1;
                this.input.value = '';
            }
        }
    }

    handleFocus() {
        this.prompt.parentElement.classList.add('is-focused');
    }

    handleBlur() {
        this.prompt.parentElement.classList.remove('is-focused');
    }

    execute(command) {
        this.setText(`EXEC: ${command}...`);
        if (this.onSubmit) {
            this.onSubmit(command);
        }
        // Simula una risposta dopo un breve ritardo
        setTimeout(() => {
            this.setText(`OK. // READY`);
            telemetry.update('last-command-status', 'OK');
        }, 800);
    }

    setText(text, isError = false) {
        if (isError) {
            this.output.classList.add('is-error');
        } else {
            this.output.classList.remove('is-error');
        }
        this.scrambler.setText(text);
    }

    loadHistory() {
        try {
            const stored = window.localStorage.getItem(COMMAND_HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    saveHistory() {
        try {
            window.localStorage.setItem(COMMAND_HISTORY_KEY, JSON.stringify(this.history));
        } catch (e) {
            console.warn('Failed to save command history.');
        }
    }

    addToHistory(command) {
        // Aggiunge in cima e rimuove duplicati
        this.history = [command, ...this.history.filter(c => c !== command)];
        if (this.history.length > MAX_HISTORY) {
            this.history.pop();
        }
        this.historyIndex = -1;
        this.saveHistory();
    }

    destroy() {
        this.input.removeEventListener('keydown', this.boundHandleKeyDown);
        this.input.removeEventListener('focus', this.boundHandleFocus);
        this.input.removeEventListener('blur', this.boundHandleBlur);
    }
}
