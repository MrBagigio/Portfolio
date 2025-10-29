/**
 * MemoryAnalyzer.js
 * Analizza la memoria conversazionale di Glitchy per estrarre
 * insight e pattern di comportamento dell'utente.
 */
export default class MemoryAnalyzer {
    constructor() {
        this.insights = [];
    }

    /**
     * Analizza la memoria del cervello di Glitchy e produce insight.
     * @param {GlitchyBrain} glitchyBrain - L'istanza del cervello di Glitchy.
     * @returns {string[]} Un array di stringhe che rappresentano gli insight.
     */
    analyzeMemory(glitchyBrain) {
        if (!glitchyBrain) return [];

        const patterns = glitchyBrain.analyzeConversationPatterns();
        this.insights = [];

        // Insight sui topic preferiti
        if (patterns.favoriteTopics && Object.keys(patterns.favoriteTopics).length > 0) {
            const topTopic = Object.keys(patterns.favoriteTopics)
                .reduce((a, b) => patterns.favoriteTopics[a] > patterns.favoriteTopics[b] ? a : b, null);
            
            if (topTopic) {
                this.insights.push(`Il tuo topic preferito sembra essere "${topTopic}".`);
            }
        }

        // Insight sui pattern temporali
        if (patterns.timePatterns && Object.keys(patterns.timePatterns).length > 0) {
            const topTime = Object.keys(patterns.timePatterns)
                .reduce((a, b) => patterns.timePatterns[a] > patterns.timePatterns[b] ? a : b, null);
            
            if (topTime) {
                const hour = parseInt(topTime, 10);
                let timeLabel = 'notte';
                if (hour >= 6 && hour < 12) timeLabel = 'mattina';
                else if (hour >= 12 && hour < 18) timeLabel = 'pomeriggio';
                else if (hour >= 18 && hour < 23) timeLabel = 'sera';
                
                this.insights.push(`Sei più attivo di ${timeLabel}.`);
            }
        }

        // Insight sul trend del sentiment
        if (patterns.sentimentTrends && patterns.sentimentTrends.length > 0) {
            const recentTrend = patterns.sentimentTrends[patterns.sentimentTrends.length - 1];
            if (recentTrend === 'improving') {
                this.insights.push('Sembri di buon umore ultimamente! 😊');
            } else if (recentTrend === 'declining') {
                this.insights.push('Spero tutto vada bene. Sono qui se vuoi parlare.');
            }
        }
        
        return this.insights;
    }
}