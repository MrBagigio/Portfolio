/**
 * ReasoningEngine.js - Motore di Ragionamento Deduttivo/Induttivo/Abduttivo
 * Sistema modulare per ragionamento logico avanzato
 */

export class ReasoningEngine {
    constructor(memorySystem, knowledgeBase) {
        this.memorySystem = memorySystem;
        this.knowledgeBase = knowledgeBase;
        this.confidenceThreshold = 0.7; // Configurabile invece di hard-coded
    }

    /**
     * Ragionamento principale con catena deduttiva, induttiva e abduttiva
     */
    async reason(problem, context) {
        const simpleIntent = this.isSimpleIntent(problem);
        if (simpleIntent) {
            return this.generateSimpleResponse(simpleIntent);
        }

        const steps = [];
        const startTime = Date.now();

        try {
            // 1. Generazione ipotesi basata su pattern e conoscenza
            const hypotheses = await this.generateHypotheses(problem, context);

            // 2. Validazione ipotesi con evidenze concrete
            const validatedHypotheses = await this.validateHypotheses(hypotheses, context);

            // 3. Ragionamento deduttivo per ipotesi valide
            const deductiveSteps = this.performDeductiveReasoning(validatedHypotheses, context);
            steps.push(...deductiveSteps);

            /*
            // 4. Ragionamento induttivo basato su pattern storici
            const inductiveConclusions = await this.performInductiveReasoning(problem, context);
            if (inductiveConclusions.length > 0) {
                steps.push(...inductiveConclusions);
            }
            */

            // 5. Ragionamento abduttivo per ipotesi migliore
            const bestHypothesis = this.performAbductiveReasoning(steps, problem);

            // 6. Calcolo confidenza complessiva
            const overallConfidence = this.calculateOverallConfidence(steps);

            const reasoningTime = Date.now() - startTime;

            return {
                conclusion: bestHypothesis,
                reasoningChain: steps,
                confidence: overallConfidence,
                metadata: {
                    hypothesesGenerated: hypotheses.length,
                    stepsPerformed: steps.length,
                    reasoningTime,
                    method: this.determineReasoningMethod(steps)
                }
            };

        } catch (error) {
            console.error('[ReasoningEngine] Error in reasoning process:', error);
            return {
                conclusion: this.generateFallbackConclusion(problem),
                reasoningChain: [],
                confidence: 0.3,
                error: error.message
            };
        }
    }

    /**
     * Genera ipotesi basate su pattern simili e conoscenza
     */
    async generateHypotheses(problem, context) {
        const hypotheses = [];

        // Ipotesi basate su situazioni simili dalla memoria
        const similarSituations = await this.memorySystem.search(problem, { types: ['episodic'] });
        for (const situation of similarSituations) {
            hypotheses.push({
                type: 'analogical',
                content: `Basandomi su esperienze simili: ${this.adaptSolution(situation.data.solution, problem)}`,
                confidence: situation.confidence,
                evidence: situation.data.evidence,
                source: 'memory'
            });
        }

        // Ipotesi basate su conoscenza strutturata
        const knowledgeBased = this.generateKnowledgeBasedHypotheses(problem, context);
        hypotheses.push(...knowledgeBased);

        // Ipotesi contrarie per ragionamento critico
        const counterHypotheses = this.generateCounterHypotheses(problem);
        hypotheses.push(...counterHypotheses);

        // Ipotesi creative basate su goal e contesto
        const creativeHypotheses = this.generateCreativeHypotheses(problem, context);
        hypotheses.push(...creativeHypotheses);

        // Ordina per confidenza e limita numero
        return hypotheses
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, this.getMaxHypotheses());
    }

    /**
     * Valida ipotesi con evidenze concrete
     */
    async validateHypotheses(hypotheses, context) {
        const validated = [];

        for (const hypothesis of hypotheses) {
            const validation = await this.validateHypothesis(hypothesis, context);
            if (validation.isValid) {
                validated.push({
                    ...hypothesis,
                    validation
                });
            }
        }

        return validated;
    }

    /**
     * Valida singola ipotesi con metodo deterministico
     */
    async validateHypothesis(hypothesis, context) {
        let confidence = hypothesis.confidence;
        const reasoning = [];

        // La validazione ora si basa principalmente sulla consistenza con il contesto
        const contextConsistency = this.validateContextConsistency(hypothesis, context);
        confidence *= contextConsistency.score;
        reasoning.push(contextConsistency.reasoning);

        return {
            isValid: confidence > this.confidenceThreshold,
            confidence,
            evidence: hypothesis.evidence || [],
            reasoning: reasoning.join(' ')
        };
    }

    /**
     * Ragionamento deduttivo basato su regole logiche
     */
    performDeductiveReasoning(validatedHypotheses, context) {
        const steps = [];

        for (const hypothesis of validatedHypotheses) {
            if (hypothesis.validation.confidence > this.confidenceThreshold) {
                steps.push({
                    type: 'deduction',
                    hypothesis: hypothesis.content,
                    evidence: hypothesis.validation.evidence,
                    confidence: hypothesis.validation.confidence,
                    rule: this.identifyDeductiveRule(hypothesis)
                });
            }
        }

        return steps;
    }

    /**
     * Ragionamento induttivo basato su pattern
     */
    async performInductiveReasoning(problem, context) {
        const steps = [];

        // Trova pattern nella memoria
        const patterns = await this.memorySystem.findPatterns(problem);

        for (const pattern of patterns) {
            if (pattern.frequency > this.getMinPatternFrequency()) {
                const conclusion = this.induceConclusion(pattern, problem);

                steps.push({
                    type: 'induction',
                    pattern: pattern.description,
                    conclusion,
                    strength: pattern.frequency / this.getTotalEpisodes(),
                    evidence: pattern.examples
                });
            }
        }

        return steps;
    }

    /**
     * Ragionamento abduttivo per ipotesi migliore
     */
    performAbductiveReasoning(steps, problem) {
        if (steps.length === 0) {
            return this.generateDefaultConclusion(problem);
        }

        // Scegli l'ipotesi migliore basandoti su confidenza e pertinenza
        const bestStep = steps.reduce((best, current) => {
            const currentScore = (current.confidence * 0.7) + (this.calculateRelevance(current, problem) * 0.3);
            const bestScore = (best.confidence * 0.7) + (this.calculateRelevance(best, problem) * 0.3);
            return currentScore > bestScore ? current : best;
        });

        return bestStep.hypothesis || bestStep.conclusion;
    }

    /**
     * Calcola confidenza complessiva del ragionamento
     */
    calculateOverallConfidence(steps) {
        if (steps.length === 0) return 0;

        const weights = {
            deduction: 1.0,
            induction: 0.8,
            abduction: 0.6
        };

        let totalConfidence = 0;
        let totalWeight = 0;

        for (const step of steps) {
            const weight = weights[step.type] || 0.5;
            totalConfidence += step.confidence * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? totalConfidence / totalWeight : 0;
    }

    // Metodi di supporto per generazione ipotesi
    generateKnowledgeBasedHypotheses(problem, context) {
        const hypotheses = [];

        // Estrai il testo rilevante dal problem (può essere stringa o oggetto)
        const problemText = typeof problem === 'string' ? problem :
                           (problem.input || problem.context || JSON.stringify(problem));

        // Cerca nella knowledge base
        const relevantKnowledge = this.knowledgeBase.findRelevant(problemText);

        for (const knowledge of relevantKnowledge) {
            hypotheses.push({
                type: 'knowledge-based',
                content: knowledge.solution || knowledge.advice,
                confidence: knowledge.reliability || 0.6,
                evidence: [knowledge.source],
                source: 'knowledge_base'
            });
        }

        return hypotheses;
    }

    generateCounterHypotheses(problem) {
        // Genera ipotesi contrarie per ragionamento critico
        return [{
            type: 'counter',
            content: `Considerare l'opposto: ${this.negateProblem(problem)}`,
            confidence: 0.4,
            evidence: ['reasoning_critique'],
            source: 'counter_reasoning'
        }];
    }

    generateCreativeHypotheses(problem, context) {
        const hypotheses = [];

        // Ipotesi basate su goal attivi
        if (context && context.activeGoals) {
            for (const goal of context.activeGoals) {
                hypotheses.push({
                    type: 'creative',
                    content: `Per raggiungere ${goal}: ${this.adaptProblemToGoal(problem, goal)}`,
                    confidence: 0.5,
                    evidence: [`goal_alignment_${goal}`],
                    source: 'goal_driven'
                });
            }
        }

        return hypotheses;
    }

    // Metodi di validazione (semplificati)
    validateContextConsistency(hypothesis, context) {
        // Verifica consistenza con contesto corrente (logica di base)
        let consistencyScore = 1.0;
        const issues = [];

        if (context && context.currentState && context.currentState.activeSection) {
            if (hypothesis.content.includes('progetto') && context.currentState.activeSection !== 'projects') {
                consistencyScore *= 0.8;
                issues.push('section_mismatch');
            }
        }

        return {
            score: consistencyScore,
            reasoning: issues.length > 0 ? `Inconsistenza: ${issues.join(', ')}` : 'Consistente'
        };
    }

    // Metodi di supporto vari
    adaptSolution(solution, newProblem) {
        // Adatta soluzione a nuovo problema
        return solution.replace(/original_problem/g, newProblem);
    }

    negateProblem(problem) {
        // Crea versione negata del problema
        return `non ${problem}`;
    }

    adaptProblemToGoal(problem, goal) {
        // Adatta problema per raggiungere goal
        return `${problem} per conseguire ${goal}`;
    }

    identifyDeductiveRule(hypothesis) {
        // Identifica regola deduttiva applicata
        return 'modus_ponens'; // Placeholder per logica più complessa
    }

    induceConclusion(pattern, problem) {
        // Induce conclusione da pattern
        return `Basandomi sul pattern ${pattern.description}, ${problem} probabilmente...`;
    }

    generateDefaultConclusion(problem) {
        return `Per ${problem}, suggerisco di esplorare le opzioni disponibili.`;
    }

    generateFallbackConclusion(problem) {
        return `Non ho abbastanza informazioni per ragionare su ${problem}.`;
    }

    // Metodi di calcolo (semplificati)
    calculateRelevance(step, problem) {
        const problemText = typeof problem === 'string' ? problem : (problem.input || '');
        const stepText = step.hypothesis || step.conclusion || '';
        const problemWords = new Set(problemText.toLowerCase().split(/\s+/));
        const stepWords = new Set(stepText.toLowerCase().split(/\s+/));
        const intersection = new Set([...problemWords].filter(x => stepWords.has(x)));
        return intersection.size / problemWords.size || 0;
    }

    determineReasoningMethod(steps) {
        if (steps.length === 0) {
            return 'none';
        }
        // Determina metodo di ragionamento predominante
        const methodCounts = {};
        for (const step of steps) {
            methodCounts[step.type] = (methodCounts[step.type] || 0) + 1;
        }

        return Object.keys(methodCounts).reduce((a, b) =>
            methodCounts[a] > methodCounts[b] ? a : b
        );
    }

    // Metodi di configurazione
    getMaxHypotheses() {
        return 10; // Configurabile
    }

    getMinPatternFrequency() {
        return 3; // Configurabile
    }

    async getTotalEpisodes() {
        return await this.memorySystem.getEpisodeCount();
    }

    // Metodi per configurazione esterna
    configure(options) {
        if (options.confidenceThreshold) {
            this.confidenceThreshold = options.confidenceThreshold;
        }
        // Altri parametri configurabili...
    }

    isSimpleIntent(problem) {
        const text = typeof problem === 'string' ? problem.toLowerCase() : (problem.input || '').toLowerCase();
        if (/^(ciao|salve|hey)/.test(text)) {
            return 'greeting';
        }
        if (/^(come stai|come va)/.test(text)) {
            return 'personal_status';
        }
        if (/^(chi sei|chi ti ha creato)/.test(text)) {
            return 'query_about_operator';
        }
        if (/^(aiuto|help|cosa puoi fare)/.test(text)) {
            return 'help';
        }
        if (/^(grazie|grazie mille)/.test(text)) {
            return 'thanks';
        }
        if (/^(arrivederci|ciao|a dopo)/.test(text)) {
            return 'farewell';
        }
        return null;
    }

    generateSimpleResponse(intent) {
        const responses = {
            'greeting': 'Ciao! Sono Glitchy, la tua guida in questo portfolio. Chiedimi pure qualcosa!',
            'personal_status': 'Sto alla grande! Super efficiente e pronto ad assisterti. E tu?',
            'query_about_operator': 'Sono Glitchy, un\'intelligenza artificiale creata da Alessandro per guidarti nel suo portfolio. Sono qui per aiutarti a scoprire i suoi lavori e le sue competenze.',
            'help': 'Posso mostrarti i progetti, cambiare il cursore, navigare il sito e rispondere a domande su Alessandro. Prova a chiedermi "mostra progetti" o "cambia cursore in pacman".',
            'thanks': 'Prego! Se hai bisogno di altro, non esitare a chiedere.',
            'farewell': 'A presto! Torna a trovarmi quando vuoi.'
        };
        return {
            conclusion: responses[intent] || 'Certo!',
            reasoningChain: [],
            confidence: 0.95,
            metadata: {
                hypothesesGenerated: 0,
                stepsPerformed: 0,
                reasoningTime: 1,
                method: 'direct_response'
            }
        };
    }
}