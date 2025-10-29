/**
 * ReinforcementLearner.js
 * Implementa il sistema di apprendimento per rinforzo (Q-learning)
 * per ottimizzare le risposte di Glitchy nel tempo.
 */
export default class ReinforcementLearner {
    constructor() {
        this.qTable = this.loadQTable();
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.explorationRate = 0.2;
        this.rewardHistory = [];
    }

    loadQTable() {
        const saved = localStorage.getItem('glitchy_qtable');
        try {
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to load Q-Table, starting fresh.');
            return {};
        }
    }

    saveQTable() {
        try {
            localStorage.setItem('glitchy_qtable', JSON.stringify(this.qTable));
        } catch (e) {
            console.warn('Failed to save Q-Table.');
        }
    }

    getStateKey(state) {
        // Crea una chiave unica per lo stato basato su intent, sentiment e ora del giorno
        const timeOfDay = state.timeOfDay || (new Date().getHours() < 12 ? 'morning' : 'evening');
        return `${state.intent || 'unknown'}_${state.sentiment || 'neutral'}_${timeOfDay}`;
    }

    chooseAction(state, availableActions) {
        const stateKey = this.getStateKey(state);

        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = {};
            availableActions.forEach(action => {
                this.qTable[stateKey][action] = 0; // Inizializza a 0
            });
        }

        // Strategia Epsilon-greedy
        if (Math.random() < this.explorationRate) {
            // Esplorazione: scegli un'azione casuale
            return availableActions[Math.floor(Math.random() * availableActions.length)];
        } else {
            // Sfruttamento: scegli l'azione con il valore Q più alto
            let bestAction = availableActions[0];
            let bestValue = this.qTable[stateKey][bestAction] || -Infinity;

            for (const action of availableActions) {
                const value = this.qTable[stateKey][action] || 0;
                if (value > bestValue) {
                    bestValue = value;
                    bestAction = action;
                }
            }
            return bestAction;
        }
    }

    updateQValue(state, action, reward, nextState) {
        const stateKey = this.getStateKey(state);
        const nextStateKey = this.getStateKey(nextState);

        if (!this.qTable[stateKey]) {
            this.qTable[stateKey] = {};
        }
        
        const currentQ = this.qTable[stateKey][action] || 0;
        
        const maxNextQ = (nextStateKey && this.qTable[nextStateKey])
            ? Math.max(...Object.values(this.qTable[nextStateKey]))
            : 0;

        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
        this.qTable[stateKey][action] = newQ;

        this.rewardHistory.push({ state, action, reward, newQ, timestamp: Date.now() });
        if (this.rewardHistory.length > 100) {
            this.rewardHistory.shift();
        }

        this.saveQTable();
    }

    getBestActionForState(state) {
        const stateKey = this.getStateKey(state);
        if (!this.qTable[stateKey] || Object.keys(this.qTable[stateKey]).length === 0) {
            return null; // Nessuna azione conosciuta per questo stato
        }

        let bestAction = null;
        let bestValue = -Infinity;

        for (const [action, value] of Object.entries(this.qTable[stateKey])) {
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        }
        return bestAction;
    }
}