/**
 * Glitchy Analytics Dashboard
 * Tracks AI performance, user interactions, and provides insights
 */

class GlitchyAnalytics {
    constructor(glitchyBrain) {
        this.glitchyBrain = glitchyBrain;
        this.analytics = {
            totalInteractions: 0,
            commandUsage: {},
            responseTimes: [],
            userSatisfaction: [],
            proactiveSuggestions: {
                shown: 0,
                accepted: 0,
                dismissed: 0
            },
            learningProgress: {
                preferencesLearned: 0,
                patternsRecognized: 0
            },
            sessionData: []
        };
        this.loadFromStorage();
    }

    // Track command execution
    trackCommand(command, success, responseTime) {
        this.analytics.totalInteractions++;
        this.analytics.commandUsage[command] = (this.analytics.commandUsage[command] || 0) + 1;
        this.analytics.responseTimes.push(responseTime);
        
        // Keep only last 100 response times
        if (this.analytics.responseTimes.length > 100) {
            this.analytics.responseTimes.shift();
        }
        
        this.saveToStorage();
    }

    // Track proactive suggestions
    trackProactiveSuggestion(action) {
        this.analytics.proactiveSuggestions.shown++;
        if (action === 'accepted') {
            this.analytics.proactiveSuggestions.accepted++;
        } else if (action === 'dismissed') {
            this.analytics.proactiveSuggestions.dismissed++;
        }
        this.saveToStorage();
    }

    // Track user satisfaction (from feedback)
    trackSatisfaction(rating) {
        this.analytics.userSatisfaction.push({
            rating: rating,
            timestamp: Date.now()
        });
        
        // Keep only last 50 ratings
        if (this.analytics.userSatisfaction.length > 50) {
            this.analytics.userSatisfaction.shift();
        }
        
        this.saveToStorage();
    }

    // Track learning progress
    trackLearning(type) {
        if (type === 'preference') {
            this.analytics.learningProgress.preferencesLearned++;
        } else if (type === 'pattern') {
            this.analytics.learningProgress.patternsRecognized++;
        }
        this.saveToStorage();
    }

    // Get analytics summary
    getSummary() {
        const avgResponseTime = this.analytics.responseTimes.length > 0 
            ? this.analytics.responseTimes.reduce((a, b) => a + b, 0) / this.analytics.responseTimes.length 
            : 0;
            
        const avgSatisfaction = this.analytics.userSatisfaction.length > 0
            ? this.analytics.userSatisfaction.reduce((a, b) => a + b.rating, 0) / this.analytics.userSatisfaction.length
            : 0;
            
        const proactiveAcceptanceRate = this.analytics.proactiveSuggestions.shown > 0
            ? (this.analytics.proactiveSuggestions.accepted / this.analytics.proactiveSuggestions.shown) * 100
            : 0;

        return {
            totalInteractions: this.analytics.totalInteractions,
            avgResponseTime: Math.round(avgResponseTime),
            avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
            proactiveAcceptanceRate: Math.round(proactiveAcceptanceRate),
            topCommands: Object.entries(this.analytics.commandUsage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([cmd, count]) => ({ command: cmd, count })),
            learningProgress: this.analytics.learningProgress
        };
    }

    // Generate insights
    getInsights() {
        const summary = this.getSummary();
        const insights = [];

        if (summary.avgResponseTime > 2000) {
            insights.push("⚠️ Tempo di risposta elevato - potrebbe essere necessario ottimizzare le funzioni");
        }

        if (summary.avgSatisfaction < 3) {
            insights.push("😞 Soddisfazione utente bassa - rivedere le risposte e funzionalità");
        }

        if (summary.proactiveAcceptanceRate < 20) {
            insights.push("💡 Suggerimenti proattivi poco efficaci - migliorare la contestualità");
        }

        if (summary.learningProgress.preferencesLearned > 5) {
            insights.push("🧠 Glitchy sta imparando bene le preferenze utente!");
        }

        if (insights.length === 0) {
            insights.push("✅ Tutto sembra funzionare bene!");
        }

        return insights;
    }

    // Export data for external analysis
    exportData() {
        return {
            ...this.analytics,
            summary: this.getSummary(),
            insights: this.getInsights(),
            exportDate: new Date().toISOString()
        };
    }

    // Storage methods
    saveToStorage() {
        try {
            localStorage.setItem('glitchy_analytics', JSON.stringify(this.analytics));
        } catch (e) {
            console.warn('Failed to save analytics to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('glitchy_analytics');
            if (data) {
                this.analytics = { ...this.analytics, ...JSON.parse(data) };
            }
        } catch (e) {
            console.warn('Failed to load analytics from localStorage:', e);
        }
    }

    // Reset analytics (for testing/debugging)
    reset() {
        this.analytics = {
            totalInteractions: 0,
            commandUsage: {},
            responseTimes: [],
            userSatisfaction: [],
            proactiveSuggestions: {
                shown: 0,
                accepted: 0,
                dismissed: 0
            },
            learningProgress: {
                preferencesLearned: 0,
                patternsRecognized: 0
            },
            sessionData: []
        };
        this.saveToStorage();
    }
}

export default GlitchyAnalytics;