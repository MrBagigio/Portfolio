// siteActions.js - Refactored with modular architecture

import EventBus from '../../../utils/events/EventBus.js';
import { DOMService } from '../../../services/dom/DOMService.js';
import { APIService } from '../../../services/api/APIService.js';
import { ProjectService } from '../../projects/ProjectService.js';
import { StateService } from '../../../services/state/StateService.js';
import { AudioManager } from '../../../services/audio/AudioManager.js';
import { I18n } from '../../../utils/i18n/i18n.js';
import { MathParser } from '../../../utils/math/MathParser.js';
import { KNOWLEDGE_BASE } from '../knowledge/knowledgeBase.js';
import { ACCESSIBILITY, THEMES, CURSORS, SOUNDS } from '../../../utils/config/Constants.js';

class SiteActionsManager {
    constructor(glitchyBrain = null, domService = null, apiService = null, projectService = null, stateService = null, audioManager = null, i18n = null) {
        this.glitchyBrain = glitchyBrain;
        this.eventBus = EventBus;
        this.domService = domService || new DOMService(this.eventBus);
        this.apiService = apiService || new APIService();
        this.projectService = projectService || new ProjectService(this.apiService);
        this.stateService = stateService || new StateService();
        this.audioManager = audioManager || new AudioManager();
        this.i18n = i18n || new I18n();
    }

    // Accessibility functions
    setAccessibility(option) {
        const body = document.body;
        if (!body) return { success: false, error: 'Body element not found' };

        switch (option) {
            case ACCESSIBILITY.TEXT_LARGE:
                this.domService.toggleClassOnBody(ACCESSIBILITY.TEXT_LARGE, ACCESSIBILITY.TEXT_NORMAL);
                localStorage.setItem('access_text_size', 'large');
                return { success: true, message: 'Text enlarged' };
            case ACCESSIBILITY.TEXT_NORMAL:
                this.domService.toggleClassOnBody(ACCESSIBILITY.TEXT_NORMAL, ACCESSIBILITY.TEXT_LARGE);
                localStorage.setItem('access_text_size', 'normal');
                return { success: true, message: 'Text set to normal' };
            case ACCESSIBILITY.CONTRAST_HIGH:
                this.domService.toggleClassOnBody(ACCESSIBILITY.CONTRAST_HIGH, ACCESSIBILITY.CONTRAST_NORMAL);
                localStorage.setItem('access_contrast', 'high');
                return { success: true, message: 'High contrast activated' };
            case ACCESSIBILITY.CONTRAST_NORMAL:
                this.domService.toggleClassOnBody(ACCESSIBILITY.CONTRAST_NORMAL, ACCESSIBILITY.CONTRAST_HIGH);
                localStorage.setItem('access_contrast', 'normal');
                return { success: true, message: 'Normal contrast activated' };
            default:
                return { success: false, error: 'Unknown accessibility option' };
        }
    }

    // Theme functions
    setTheme(theme) {
        const body = document.body;
        if (!body) return { success: false, error: 'Body element not found' };

        if (theme === 'scuro' || theme === 'dark') {
            this.domService.toggleClassOnBody(THEMES.DARK, THEMES.LIGHT);
            localStorage.setItem('site_theme', 'dark');
            return { success: true, message: 'Dark theme activated' };
        } else if (theme === 'chiaro' || theme === 'light') {
            this.domService.toggleClassOnBody(THEMES.LIGHT, THEMES.DARK);
            localStorage.setItem('site_theme', 'light');
            return { success: true, message: 'Light theme activated' };
        }
        return { success: false, error: 'Unknown theme' };
    }

    // Cursor functions
    setGameCursor(type) {
        if (!Object.values(CURSORS).includes(type)) {
            return { success: false, error: 'Unknown cursor type' };
        }

        this.stateService.setCurrentCursor(type);
        this.eventBus.emit('ui:setGameCursor', type);
        return { success: true, message: `Cursor set to ${type}` };
    }

    getCurrentCursor() {
        return this.stateService.getCurrentCursor();
    }

    undoCursor() {
        const prev = this.stateService.undoCursor();
        if (!prev) return { success: false, error: 'No previous cursor' };
        this.eventBus.emit('ui:setGameCursor', prev);
        return { success: true, message: `Cursor restored to ${prev}` };
    }

    // Project functions
    async getProjects() {
        try {
            return { success: true, data: await this.projectService.getProjects() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async openProjectCase(projectKey) {
        try {
            const projects = await this.projectService.getProjects();
            if (!projects || projects.length === 0) {
                return { success: false, error: 'Project data not available' };
            }

            const found = this.projectService.findProject(projects, projectKey);
            if (!found) {
                return { success: false, error: `Project '${projectKey}' not found` };
            }

            this.eventBus.emit('ui:openProject', found);
            return { success: true, message: `Opened project ${found.title}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async searchProjectsByTechnology(technology) {
        try {
            const foundProjects = await this.projectService.searchProjectsByTechnology(technology);
            if (foundProjects.length === 0) {
                return { success: false, error: `No projects found mentioning ${technology}` };
            }

            const message = foundProjects.length > 1
                ? `Found ${foundProjects.length} projects related to ${technology}. Which one interests you?`
                : `Found this project related to ${technology}:`;

            return {
                success: true,
                message,
                data: {
                    projects: foundProjects,
                    quickReplies: foundProjects.map(p => ({
                        label: p.title,
                        action: 'open-project',
                        payload: p.id
                    }))
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Navigation
    navigateTo(section) {
        const success = this.domService.navigateTo(section);
        return success
            ? { success: true, message: `Navigated to ${section}` }
            : { success: false, error: 'Section not found' };
    }

    // Audio
    playSound(name) {
        if (!Object.values(SOUNDS).includes(name)) {
            return { success: false, error: 'Unknown sound' };
        }

        const success = this.audioManager.playSound(name);
        return success
            ? { success: true, message: `Played ${name}` }
            : { success: false, error: 'Sound not available' };
    }

    // External APIs
    async getWeather(location = 'Milano') {
        try {
            const weatherData = await this.apiService.fetchWeather(location);
            const message = `Weather in ${weatherData.location}: ${weatherData.temperature}°C, ${this.i18n.translateWeatherCondition(weatherData.condition, weatherData.condition)}${weatherData.fallback ? ' (simulated data)' : ''}, humidity ${weatherData.humidity}%, wind ${weatherData.windSpeed} km/h${weatherData.feelsLike ? `, feels like ${weatherData.feelsLike}°C` : ''}`;
            return { success: true, message, data: weatherData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getGeneralKnowledge(query) {
        try {
            const knowledge = await this.apiService.getGeneralKnowledge(query);
            if (knowledge) {
                return {
                    success: true,
                    message: `📚 ${knowledge.title}: ${knowledge.summary.substring(0, 200)}... [Source: ${knowledge.source}]`,
                    data: knowledge
                };
            }
            return { success: false, error: 'No information found on this topic. Try different keywords.' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getNewsHeadlines(category = 'technology') {
        try {
            const headlines = await this.apiService.getNewsHeadlines(category);
            if (headlines && headlines.length > 0) {
                let message = `📰 Latest news on ${category}:\n`;
                headlines.forEach((news, index) => {
                    message += `${index + 1}. ${news.title}\n`;
                });
                return { success: true, message, data: headlines };
            }
            return { success: false, error: 'Unable to retrieve news at this time.' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async previewMultimedia(url) {
        try {
            const preview = await this.apiService.previewMultimedia(url);
            let message = '';
            switch (preview.type) {
                case 'youtube':
                    message = `🎥 YouTube video: "${preview.title}"${preview.channel ? ` by ${preview.channel}` : ''}`;
                    break;
                case 'github':
                    message = `📁 GitHub repo: ${preview.title}${preview.description ? ` - ${preview.description.substring(0, 100)}...` : ''}${preview.stars ? ` ⭐ ${preview.stars} stars` : ''}`;
                    break;
                case 'image':
                    message = `🖼️ Image: ${preview.title}`;
                    break;
                case 'video':
                    message = `🎬 Video: ${preview.title}`;
                    break;
                case 'webpage':
                    message = `🔗 Webpage: ${preview.title}`;
                    break;
                default:
                    message = `🔗 Link: ${preview.title || url}`;
            }
            return { success: true, message, data: preview };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Utility functions
    suggestNextAction() {
        const suggestions = [
            { label: 'Open "Biosphaera"', action: 'open-project', payload: 'biosphaera' },
            { label: 'Change cursor', action: 'set-cursor', payload: CURSORS.PACMAN },
            { label: 'Search WebGL projects', action: 'search-projects', payload: 'webgl' },
            { label: 'Go to contact section', action: 'navigate', payload: 'contact' }
        ];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

        return {
            success: true,
            message: 'How about trying one of these?',
            data: {
                quickReplies: [randomSuggestion]
            }
        };
    }

    analyzeCode() {
        try {
            const scripts = document.querySelectorAll('script[src]');
            const totalScripts = scripts.length;
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
            const totalCSS = cssLinks.length;

            const buttons = document.querySelectorAll('button').length;
            const links = document.querySelectorAll('a').length;
            const images = document.querySelectorAll('img').length;

            const analysis = {
                scripts: totalScripts,
                stylesheets: totalCSS,
                buttons,
                links,
                images,
                totalElements: document.querySelectorAll('*').length
            };

            return {
                success: true,
                message: `Analysis completed: ${totalScripts} scripts, ${totalCSS} CSS, ${buttons} buttons, ${links} links, ${images} images. Total elements: ${analysis.totalElements}`,
                data: analysis
            };
        } catch (error) {
            return { success: false, error: 'Error during code analysis.' };
        }
    }

    gitStatus() {
        // In un ambiente di produzione, questa funzione non può accedere a Git.
        // Restituiamo un messaggio informativo.
        return {
            success: true,
            message: "L'analisi dello stato di Git è disponibile solo in un ambiente di sviluppo locale."
        };
    }

    learnPreference(preference, value) {
        if (this.glitchyBrain) {
            this.glitchyBrain.learnPreference(preference, value);
        }
        return {
            success: true,
            message: `Learned your preference for '${preference}' with value '${value}'. I'll remember it for the future!`
        };
    }

    codeSnippet(topic) {
        const snippets = {
            'javascript': '```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```',
            'html': '```html\n<div class="container">\n  <h1>Hello World</h1>\n</div>\n```',
            'css': '```css\n.container {\n  display: flex;\n  justify-content: center;\n}\n```',
            'react': '```jsx\nfunction App() {\n  return <h1>Hello React!</h1>;\n}\n```',
            'webgl': '```javascript\nconst canvas = document.getElementById(\'gl-canvas\');\nconst gl = canvas.getContext(\'webgl\');\n```'
        };

        const snippet = snippets[topic.toLowerCase()] || snippets['javascript'];

        return {
            success: true,
            message: `Here's an example of ${topic}:\n${snippet}`,
            data: { html: true }
        };
    }

    calculate(expression) {
        try {
            const result = MathParser.evaluate(expression);
            return {
                success: true,
                message: `${expression} = ${result}`
            };
        } catch (error) {
            return { success: false, error: 'Error in calculation. Try a simpler expression.' };
        }
    }

    getSystemInfo() {
        const info = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            online: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            currentTime: new Date().toLocaleString()
        };

        const message = `System: ${info.platform}, Browser: ${info.userAgent.split(' ')[0]}, Resolution: ${info.screenResolution}, Online: ${info.online ? 'Yes' : 'No'}`;
        return { success: true, message, data: info };
    }

    showAnalytics() {
        if (!this.glitchyBrain) {
            return { success: false, error: 'Analytics system not available.' };
        }

        const analytics = this.glitchyBrain.analytics;
        const insights = this.glitchyBrain.generateContextualInsights();

        const message = `Glitchy Analytics: ${analytics.conversationEpisodes.length} conversations, ${Object.keys(analytics.commandsUsed).length} commands used. Insights: ${insights.preferredSections ? Object.keys(insights.preferredSections).length : 0} preferred sections.`;

        return { success: true, message };
    }

    getSmartSuggestion() {
        if (!this.glitchyBrain) {
            return { success: false, error: 'Suggestion system not available.' };
        }

        const patterns = this.glitchyBrain.analyzeConversationPatterns();
        const insights = this.glitchyBrain.generateContextualInsights();

        let suggestion = 'Try exploring the projects or changing the theme!';

        if (patterns.favoriteTopics && patterns.favoriteTopics.projects > 2) {
            suggestion = 'Since you like projects, why not open Biosphaera?';
        } else if (insights.bestTimes && Object.keys(insights.bestTimes).length > 0) {
            const bestHour = Object.keys(insights.bestTimes).reduce((a, b) => 
                insights.bestTimes[a].successRate > insights.bestTimes[b].successRate ? a : b
            );
            suggestion = `Your interactions are most effective around ${bestHour}:00.`;
        }

        return { success: true, message: suggestion };
    }

    analyzeSentiment(text) {
        const positiveWords = ['bene', 'ottimo', 'fantastico', 'bravo', 'grazie', 'perfetto', 'geniale', 'wow', 'incredibile'];
        const negativeWords = ['male', 'terribile', 'orribile', 'pessimo', 'schifo', 'odio', 'fastidio'];

        const words = text.toLowerCase().split(/\s+/);
        let positive = 0, negative = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) positive++;
            if (negativeWords.includes(word)) negative++;
        });

        let sentiment = 'neutral';
        if (positive > negative) sentiment = 'positive';
        else if (negative > positive) sentiment = 'negative';

        return { success: true, message: `Your message seems ${sentiment} (${positive} positive words, ${negative} negative).` };
    }

    logAction(action, payload) {
        this.stateService.logAction(action, payload);
    }

    configureExternalServices(config) {
        // This would configure API keys in the serverless functions
        console.log('External services configuration:', config);
    }

    setBrain(brainInstance) {
        this.glitchyBrain = brainInstance;
        console.log('[siteActions] GlitchyBrain injected.');
    }

    // Suggerisci la prossima azione basata sul contesto
    suggestNextAction() {
        if (!this.glitchyBrain) {
            return { success: false, message: 'Sistema AI non disponibile' };
        }

        try {
            // Usa il cervello di Glitchy per generare suggerimenti intelligenti
            const suggestions = this.glitchyBrain.generateSmartSuggestions(KNOWLEDGE_BASE);

            if (suggestions && suggestions.length > 0) {
                const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                return {
                    success: true,
                    message: `Ecco un suggerimento: ${randomSuggestion}`,
                    suggestion: randomSuggestion
                };
            } else {
                // Fallback con suggerimenti generici
                const fallbackSuggestions = [
                    'Perché non esplori i progetti?',
                    'Prova a cambiare il cursore con "cursore pacman"',
                    'Vuoi vedere le tue competenze tecniche?',
                    'Posso mostrarti come funziona il sito'
                ];
                const randomFallback = fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];
                return {
                    success: true,
                    message: randomFallback,
                    suggestion: randomFallback
                };
            }
        } catch (error) {
            console.error('[siteActions] Errore in suggestNextAction:', error);
            return {
                success: false,
                message: 'Non riesco a generare suggerimenti al momento'
            };
        }
    }
}

// Singleton instance for backward compatibility
let siteActionsInstance = null;

// Backward compatibility exports
export function setAccessibility(option) {
    return getSiteActionsManager().setAccessibility(option);
}

export function setTheme(theme) {
    return getSiteActionsManager().setTheme(theme);
}

export function getCurrentCursor() {
    return getSiteActionsManager().getCurrentCursor();
}

export function setGameCursor(type) {
    return getSiteActionsManager().setGameCursor(type);
}

export async function getProjects() {
    return getSiteActionsManager().getProjects();
}

export async function openProjectCase(projectKey) {
    return getSiteActionsManager().openProjectCase(projectKey);
}

export function undoCursor() {
    return getSiteActionsManager().undoCursor();
}

export function navigateTo(section) {
    return getSiteActionsManager().navigateTo(section);
}

export function playSound(name) {
    return getSiteActionsManager().playSound(name);
}

export async function searchProjectsByTechnology(technology) {
    return getSiteActionsManager().searchProjectsByTechnology(technology);
}

export function logAction(action, payload) {
    return getSiteActionsManager().logAction(action, payload);
}

export function analyzeCode() {
    return getSiteActionsManager().analyzeCode();
}

export function gitStatus() {
    return getSiteActionsManager().gitStatus();
}

export async function getWeather(location) {
    return getSiteActionsManager().getWeather(location);
}

export function systemInfo() {
    return getSiteActionsManager().getSystemInfo();
}

export function getSystemInfo() {
    return getSiteActionsManager().getSystemInfo();
}

export function learnPreference(preference, value) {
    return getSiteActionsManager().learnPreference(preference, value);
}

export function codeSnippet(topic) {
    return getSiteActionsManager().codeSnippet(topic);
}

export function calculate(expression) {
    return getSiteActionsManager().calculate(expression);
}

export function showAnalytics() {
    return getSiteActionsManager().showAnalytics();
}

export function getSmartSuggestion() {
    return getSiteActionsManager().getSmartSuggestion();
}

export function analyzeSentiment(text) {
    return getSiteActionsManager().analyzeSentiment(text);
}

export function configureExternalServices(config) {
    return getSiteActionsManager().configureExternalServices(config);
}

export async function getGeneralKnowledge(query) {
    return getSiteActionsManager().getGeneralKnowledge(query);
}

export async function getNewsHeadlines(category) {
    return getSiteActionsManager().getNewsHeadlines(category);
}

export async function previewMultimedia(url) {
    return getSiteActionsManager().previewMultimedia(url);
}

export function suggestNextAction() {
    return getSiteActionsManager().suggestNextAction();
}

// Initialize singleton instance
if (!siteActionsInstance) {
    siteActionsInstance = new SiteActionsManager();
}

// Default export for backward compatibility - singleton instance
export default siteActionsInstance;