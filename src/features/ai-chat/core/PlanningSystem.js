/**
 * PlanningSystem.js - Sistema di Pianificazione Strategica
 * Pianificazione intelligente di azioni e goal con ottimizzazione
 */

export class PlanningSystem {
    constructor(memorySystem, knowledgeBase) {
        this.memorySystem = memorySystem;
        this.knowledgeBase = knowledgeBase;

        // Configurazioni
        this.config = {
            maxPlanningDepth: 5,
            maxAlternatives: 3,
            timeLimit: 5000, // 5 secondi
            riskTolerance: 0.7,
            optimizationEnabled: true,
            learningEnabled: true
        };

        // Cache per piani già calcolati
        this.planCache = new Map();
        this.performanceHistory = [];
    }

    /**
     * Pianificazione principale con goal decomposition e ottimizzazione
     */
    async plan(goal, currentState, constraints = {}) {
        const startTime = Date.now();
        const planId = this.generatePlanId(goal, currentState);

        // Controlla cache
        if (this.planCache.has(planId)) {
            const cached = this.planCache.get(planId);
            if (Date.now() - cached.timestamp < 300000) { // 5 minuti
                return this.enhanceCachedPlan(cached, constraints);
            }
        }

        try {
            // 1. Analisi dello stato corrente
            const stateAnalysis = await this.analyzeCurrentState(currentState, goal);

            // 2. Decomposizione del goal in sottogoal
            const subgoals = await this.decomposeGoal(goal, stateAnalysis, constraints);

            // 3. Generazione di piani alternativi
            const alternativePlans = await this.generateAlternativePlans(goal, currentState, constraints);

            // 4. Valutazione e ottimizzazione dei piani
            const optimizedPlans = await this.optimizePlans(alternativePlans, constraints);

            // 5. Selezione del piano migliore
            const bestPlan = this.selectBestPlan(optimizedPlans);

            // 6. Calcolo metriche del piano
            const metrics = this.calculatePlanMetrics(bestPlan, stateAnalysis);

            const plan = {
                id: planId,
                goal,
                steps: bestPlan.steps,
                estimatedTime: metrics.estimatedTime,
                successProbability: metrics.successProbability,
                alternatives: optimizedPlans.slice(1, this.config.maxAlternatives),
                metadata: {
                    planningTime: Date.now() - startTime,
                    depth: bestPlan.depth,
                    branches: alternativePlans.length,
                    constraints: constraints,
                    stateAnalysis: stateAnalysis
                }
            };

            // Cache il piano
            this.planCache.set(planId, {
                ...plan,
                timestamp: Date.now()
            });

            // Registra performance per learning
            this.recordPlanningPerformance(plan, metrics);

            return plan;

        } catch (error) {
            console.error('[PlanningSystem] Planning error:', error);
            return this.generateFallbackPlan(goal, currentState);
        }
    }

    /**
     * Analisi dello stato corrente rispetto al goal
     */
    async analyzeCurrentState(currentState, goal) {
        const analysis = {
            gaps: [],
            resources: [],
            obstacles: [],
            opportunities: [],
            readiness: 0,
            complexity: 0
        };

        // Identifica gap tra stato corrente e goal
        analysis.gaps = await this.identifyGaps(currentState, goal);

        // Valuta risorse disponibili
        analysis.resources = await this.assessAvailableResources(currentState);

        // Identifica ostacoli potenziali
        analysis.obstacles = await this.identifyObstacles(currentState, goal);

        // Trova opportunità
        analysis.opportunities = await this.identifyOpportunities(currentState, goal);

        // Calcola readiness (prontezza)
        analysis.readiness = this.calculateReadiness(analysis);

        // Stima complessità
        analysis.complexity = this.estimateComplexity(goal, analysis);

        return analysis;
    }

    /**
     * Decomposizione del goal in sottogoal gestibili
     */
    async decomposeGoal(goal, stateAnalysis, constraints) {
        const subgoals = [];
        const decomposition = await this.performGoalDecomposition(goal, constraints);

        for (const subGoal of decomposition.subgoals) {
            const subGoalAnalysis = await this.analyzeSubGoal(subGoal, stateAnalysis);

            subgoals.push({
                id: this.generateSubGoalId(),
                description: subGoal.description,
                type: subGoal.type,
                priority: subGoal.priority,
                dependencies: subGoal.dependencies || [],
                estimatedEffort: subGoalAnalysis.estimatedEffort,
                successProbability: subGoalAnalysis.successProbability,
                requiredResources: subGoalAnalysis.requiredResources,
                metadata: subGoalAnalysis
            });
        }

        // Ordina per priorità e dipendenze
        return this.orderSubGoals(subgoals);
    }

    /**
     * Generazione di piani alternativi
     */
    async generateAlternativePlans(goal, currentState, constraints) {
        const plans = [];

        // Piano principale (ottimizzato)
        const mainPlan = await this.generateMainPlan(goal, currentState, constraints);
        plans.push(mainPlan);

        // Piani alternativi con diverse strategie
        const alternativeStrategies = await this.generateAlternativeStrategies(goal, currentState);

        for (const strategy of alternativeStrategies) {
            const alternativePlan = await this.generatePlanFromStrategy(strategy, goal, currentState, constraints);
            if (alternativePlan) {
                plans.push(alternativePlan);
            }
        }

        // Piano conservativo (minimo rischio)
        const conservativePlan = await this.generateConservativePlan(goal, currentState, constraints);
        if (conservativePlan) {
            plans.push(conservativePlan);
        }

        // Piano aggressivo (massimo guadagno)
        const aggressivePlan = await this.generateAggressivePlan(goal, currentState, constraints);
        if (aggressivePlan) {
            plans.push(aggressivePlan);
        }

        return plans.filter(plan => plan.steps && plan.steps.length > 0);
    }

    /**
     * Ottimizzazione dei piani generati
     */
    async optimizePlans(plans, constraints) {
        if (!this.config.optimizationEnabled) {
            return plans;
        }

        const optimized = [];

        for (const plan of plans) {
            const optimizedPlan = await this.optimizeSinglePlan(plan, constraints);
            optimized.push(optimizedPlan);
        }

        return optimized;
    }

    /**
     * Selezione del piano migliore
     */
    selectBestPlan(plans) {
        if (plans.length === 0) {
            throw new Error('No valid plans generated');
        }

        if (plans.length === 1) {
            return plans[0];
        }

        // Calcola punteggio per ogni piano
        const scoredPlans = plans.map(plan => ({
            ...plan,
            score: this.calculatePlanScore(plan)
        }));

        // Seleziona il piano con punteggio più alto
        return scoredPlans.reduce((best, current) =>
            current.score > best.score ? current : best
        );
    }

    /**
     * Calcolo metriche del piano
     */
    calculatePlanMetrics(plan, stateAnalysis) {
        const metrics = {
            estimatedTime: 0,
            successProbability: 1,
            riskLevel: 0,
            resourceUtilization: 0,
            adaptability: 0
        };

        // Stima tempo totale
        metrics.estimatedTime = plan.steps.reduce((total, step) =>
            total + (step.estimatedTime || 0), 0
        );

        // Calcola probabilità di successo
        metrics.successProbability = plan.steps.reduce((prob, step) =>
            prob * (step.successProbability || 0.8), 1
        );

        // Valuta livello di rischio
        metrics.riskLevel = this.calculateRiskLevel(plan, stateAnalysis);

        // Calcola utilizzo risorse
        metrics.resourceUtilization = this.calculateResourceUtilization(plan);

        // Valuta adattabilità
        metrics.adaptability = this.calculateAdaptability(plan);

        return metrics;
    }

    // Metodi di supporto per analisi stato
    async identifyGaps(currentState, goal) {
        const gaps = [];

        // Gap basati su conoscenza
        const requiredCapabilities = await this.getRequiredCapabilities(goal);
        const currentCapabilities = this.extractCapabilities(currentState);

        for (const required of requiredCapabilities) {
            if (!currentCapabilities.includes(required)) {
                gaps.push({
                    type: 'capability',
                    description: `Manca capacità: ${required}`,
                    severity: 'high',
                    fixable: true
                });
            }
        }

        // Gap temporali
        if (goal.deadline && currentState.currentTime) {
            const timeToDeadline = goal.deadline - currentState.currentTime;
            if (timeToDeadline < 0) {
                gaps.push({
                    type: 'temporal',
                    description: 'Scadenza già passata',
                    severity: 'critical',
                    fixable: false
                });
            }
        }

        return gaps;
    }

    async assessAvailableResources(currentState) {
        const resources = [];

        // Risorse tecniche
        if (currentState.systemCapabilities) {
            resources.push(...currentState.systemCapabilities);
        }

        // Risorse umane/conoscenze
        if (currentState.userSkills) {
            resources.push(...currentState.userSkills);
        }

        // Risorse contestuali
        if (currentState.environment) {
            resources.push(...this.extractEnvironmentalResources(currentState.environment));
        }

        return resources;
    }

    async identifyObstacles(currentState, goal) {
        const obstacles = [];

        // Ostacoli basati su memoria passata
        const historicalObstacles = await this.memorySystem.search({
            type: 'obstacle',
            relatedGoal: goal.description
        });

        for (const obstacle of historicalObstacles) {
            obstacles.push({
                type: 'historical',
                description: obstacle.description,
                probability: obstacle.frequency || 0.5,
                mitigation: obstacle.mitigation
            });
        }

        // Ostacoli attuali
        if (currentState.constraints) {
            obstacles.push(...currentState.constraints.map(c => ({
                type: 'current',
                description: c.description,
                probability: 1,
                mitigation: c.mitigation
            })));
        }

        return obstacles;
    }

    async identifyOpportunities(currentState, goal) {
        const opportunities = [];

        // Opportunità basate su trend
        const trends = await this.analyzeTrends(goal.domain);
        for (const trend of trends) {
            if (trend.opportunity) {
                opportunities.push({
                    type: 'trend',
                    description: trend.description,
                    potential: trend.potential,
                    timeframe: trend.timeframe
                });
            }
        }

        // Opportunità contestuali
        if (currentState.marketConditions) {
            opportunities.push(...this.extractMarketOpportunities(currentState.marketConditions));
        }

        return opportunities;
    }

    calculateReadiness(analysis) {
        const gapScore = analysis.gaps.length * 0.2;
        const resourceScore = Math.max(0, 1 - (analysis.resources.length * 0.1));
        const obstacleScore = analysis.obstacles.length * 0.15;

        return Math.max(0, 1 - gapScore - resourceScore - obstacleScore);
    }

    estimateComplexity(goal, analysis) {
        let complexity = 1;

        // Complessità basata su numero di sottogoal
        complexity *= Math.max(1, analysis.subgoals?.length || 1);

        // Complessità basata su interdipendenze
        const dependencies = analysis.subgoals?.reduce((sum, sg) =>
            sum + (sg.dependencies?.length || 0), 0) || 0;
        complexity *= Math.max(1, dependencies * 0.5);

        // Complessità basata su incertezza
        complexity *= Math.max(1, analysis.obstacles?.length || 0);

        return Math.min(complexity, 10); // Cap a 10
    }

    // Metodi per decomposizione goal
    async performGoalDecomposition(goal, constraints) {
        const decomposition = {
            subgoals: [],
            dependencies: [],
            constraints: constraints
        };

        // Decomposizione basata su conoscenza del dominio
        const domainKnowledge = await this.knowledgeBase.findRelevant(goal.description);

        for (const knowledge of domainKnowledge) {
            if (knowledge.subgoals) {
                decomposition.subgoals.push(...knowledge.subgoals);
            }
        }

        // Decomposizione euristica se non disponibile conoscenza specifica
        if (decomposition.subgoals.length === 0) {
            decomposition.subgoals = await this.heuristicGoalDecomposition(goal);
        }

        // Identifica dipendenze
        decomposition.dependencies = this.identifyDependencies(decomposition.subgoals);

        return decomposition;
    }

    async analyzeSubGoal(subGoal, stateAnalysis) {
        return {
            estimatedEffort: await this.estimateSubGoalEffort(subGoal, stateAnalysis),
            successProbability: await this.estimateSubGoalSuccess(subGoal, stateAnalysis),
            requiredResources: await this.identifyRequiredResources(subGoal, stateAnalysis)
        };
    }

    orderSubGoals(subgoals) {
        // Ordinamento topologico basato su dipendenze
        const ordered = [];
        const processed = new Set();

        const processSubGoal = (subgoal) => {
            if (processed.has(subgoal.id)) return;

            // Processa dipendenze prima
            for (const depId of subgoal.dependencies) {
                const dep = subgoals.find(sg => sg.id === depId);
                if (dep) processSubGoal(dep);
            }

            ordered.push(subgoal);
            processed.add(subgoal.id);
        };

        // Ordina per priorità prima di processare dipendenze
        const priorityOrdered = subgoals.sort((a, b) => b.priority - a.priority);

        for (const subgoal of priorityOrdered) {
            processSubGoal(subgoal);
        }

        return ordered;
    }

    // Metodi per generazione piani
    async generateMainPlan(goal, currentState, constraints) {
        const steps = [];
        const subgoals = await this.decomposeGoal(goal, await this.analyzeCurrentState(currentState, goal), constraints);

        for (const subgoal of subgoals) {
            const step = await this.generateStepFromSubGoal(subgoal, currentState);
            if (step) steps.push(step);
        }

        return {
            steps,
            strategy: 'balanced',
            depth: this.calculatePlanDepth(steps),
            metadata: { type: 'main' }
        };
    }

    async generateAlternativeStrategies(goal, currentState) {
        const strategies = [];

        // Strategia veloce (minimo tempo)
        strategies.push({
            name: 'fast',
            priority: 'speed',
            riskTolerance: 0.8,
            resourceAllocation: 'minimal'
        });

        // Strategia thorough (massima qualità)
        strategies.push({
            name: 'thorough',
            priority: 'quality',
            riskTolerance: 0.3,
            resourceAllocation: 'maximum'
        });

        // Strategia economica
        strategies.push({
            name: 'economic',
            priority: 'cost',
            riskTolerance: 0.5,
            resourceAllocation: 'optimal'
        });

        return strategies;
    }

    async generatePlanFromStrategy(strategy, goal, currentState, constraints) {
        // Adatta la generazione del piano basata sulla strategia
        const adaptedConstraints = {
            ...constraints,
            priority: strategy.priority,
            riskTolerance: strategy.riskTolerance
        };

        return await this.generateMainPlan(goal, currentState, adaptedConstraints);
    }

    async generateConservativePlan(goal, currentState, constraints) {
        // Piano con minimo rischio
        const conservativeConstraints = {
            ...constraints,
            riskTolerance: 0.2,
            maxParallelSteps: 1
        };

        return await this.generateMainPlan(goal, currentState, conservativeConstraints);
    }

    async generateAggressivePlan(goal, currentState, constraints) {
        // Piano con massimo guadagno potenziale
        const aggressiveConstraints = {
            ...constraints,
            riskTolerance: 0.9,
            maxParallelSteps: 5,
            timeLimit: constraints.timeLimit * 0.5
        };

        return await this.generateMainPlan(goal, currentState, aggressiveConstraints);
    }

    // Metodi di ottimizzazione
    async optimizeSinglePlan(plan, constraints) {
        let optimized = { ...plan };

        // Ottimizzazione sequenza passi
        optimized.steps = await this.optimizeStepSequence(optimized.steps, constraints);

        // Ottimizzazione risorse
        optimized = await this.optimizeResourceAllocation(optimized, constraints);

        // Ottimizzazione temporale
        optimized = await this.optimizeTiming(optimized, constraints);

        return optimized;
    }

    async optimizeStepSequence(steps, constraints) {
        // Algoritmo di ottimizzazione sequenza (es. critical path)
        const optimized = [...steps];

        // Identifica passi che possono essere parallelizzati
        const parallelizable = this.identifyParallelizableSteps(steps);

        // Riordina per efficienza
        return optimized.sort((a, b) => {
            if (parallelizable.includes(a.id) && parallelizable.includes(b.id)) {
                return (a.estimatedTime || 0) - (b.estimatedTime || 0); // Più corti prima
            }
            return 0; // Mantieni ordine per passi sequenziali
        });
    }

    async optimizeResourceAllocation(plan, constraints) {
        // Ottimizza allocazione risorse
        const optimized = { ...plan };

        // Calcola utilizzo risorse per ogni passo
        for (const step of optimized.steps) {
            step.resourceAllocation = await this.calculateOptimalResourceAllocation(step, constraints);
        }

        return optimized;
    }

    async optimizeTiming(plan, constraints) {
        // Ottimizza timing e scheduling
        const optimized = { ...plan };

        let currentTime = 0;
        for (const step of optimized.steps) {
            step.scheduledStart = currentTime;
            step.scheduledEnd = currentTime + (step.estimatedTime || 0);
            currentTime = step.scheduledEnd;
        }

        return optimized;
    }

    // Metodi di calcolo metriche
    calculatePlanScore(plan) {
        const weights = {
            successProbability: 0.4,
            timeEfficiency: 0.3,
            resourceEfficiency: 0.2,
            adaptability: 0.1
        };

        const successProbability = plan.successProbability || 0;
        const timeEfficiency = this.calculateTimeEfficiency(plan);
        const resourceEfficiency = this.calculateResourceEfficiency(plan);
        const adaptability = plan.adaptability || 0.5;

        return (
            successProbability * weights.successProbability +
            timeEfficiency * weights.timeEfficiency +
            resourceEfficiency * weights.resourceEfficiency +
            adaptability * weights.adaptability
        );
    }

    calculateRiskLevel(plan, stateAnalysis) {
        let risk = 0;

        // Rischio basato su probabilità di successo
        risk += (1 - (plan.successProbability || 0)) * 0.4;

        // Rischio basato su ostacoli
        risk += (stateAnalysis.obstacles?.length || 0) * 0.1;

        // Rischio basato su complessità
        risk += Math.min((plan.steps?.length || 0) * 0.05, 0.3);

        return Math.min(risk, 1);
    }

    calculateResourceUtilization(plan) {
        if (!plan.steps || plan.steps.length === 0) return 0;

        const totalResources = plan.steps.reduce((sum, step) =>
            sum + (step.resourceAllocation?.total || 1), 0);

        const averageUtilization = plan.steps.reduce((sum, step) =>
            sum + (step.resourceAllocation?.utilization || 0.5), 0) / plan.steps.length;

        return averageUtilization;
    }

    calculateAdaptability(plan) {
        // Valuta quanto il piano può adattarsi a cambiamenti
        let adaptability = 0.5; // Base

        // Più alternative = più adattabilità
        if (plan.alternatives) {
            adaptability += Math.min(plan.alternatives.length * 0.1, 0.3);
        }

        // Passi modulari = più adattabilità
        const modularSteps = plan.steps?.filter(step => step.modular)?.length || 0;
        adaptability += (modularSteps / (plan.steps?.length || 1)) * 0.2;

        return Math.min(adaptability, 1);
    }

    // Metodi di supporto vari
    generatePlanId(goal, currentState) {
        const goalHash = this.hashString(JSON.stringify(goal));
        const stateHash = this.hashString(JSON.stringify(currentState));
        return `plan_${goalHash}_${stateHash}`;
    }

    generateSubGoalId() {
        return `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    generateFallbackPlan(goal, currentState) {
        return {
            id: `fallback_${Date.now()}`,
            goal,
            steps: [{
                id: 'fallback_step',
                description: `Tentare di raggiungere: ${goal.description}`,
                estimatedTime: 3600000, // 1 ora
                successProbability: 0.5,
                type: 'fallback'
            }],
            estimatedTime: 3600000,
            successProbability: 0.5,
            alternatives: [],
            metadata: {
                planningTime: 0,
                depth: 1,
                branches: 0,
                fallback: true
            }
        };
    }

    enhanceCachedPlan(cached, constraints) {
        // Migliora piano cached con nuove constraints
        return {
            ...cached,
            metadata: {
                ...cached.metadata,
                enhanced: true,
                newConstraints: constraints
            }
        };
    }

    recordPlanningPerformance(plan, metrics) {
        this.performanceHistory.push({
            planId: plan.id,
            metrics,
            timestamp: Date.now(),
            success: metrics.successProbability > 0.7
        });

        // Mantieni solo ultime 100 entries
        if (this.performanceHistory.length > 100) {
            this.performanceHistory.shift();
        }
    }

    // Metodi euristici e di supporto
    async heuristicGoalDecomposition(goal) {
        // Decomposizione euristica basata su pattern comuni
        const subgoals = [];

        if (goal.description.includes('sviluppare') || goal.description.includes('creare')) {
            subgoals.push(
                { description: 'Analizzare requisiti', type: 'analysis', priority: 10 },
                { description: 'Progettare soluzione', type: 'design', priority: 8 },
                { description: 'Implementare funzionalità', type: 'implementation', priority: 6 },
                { description: 'Testare soluzione', type: 'testing', priority: 4 }
            );
        } else if (goal.description.includes('imparare') || goal.description.includes('studiare')) {
            subgoals.push(
                { description: 'Raccogliere risorse', type: 'research', priority: 10 },
                { description: 'Studiare materiali', type: 'study', priority: 8 },
                { description: 'Praticare concetti', type: 'practice', priority: 6 },
                { description: 'Valutare apprendimento', type: 'assessment', priority: 4 }
            );
        }

        return subgoals;
    }

    identifyDependencies(subgoals) {
        const dependencies = [];

        // Identifica dipendenze logiche
        for (let i = 0; i < subgoals.length; i++) {
            for (let j = i + 1; j < subgoals.length; j++) {
                if (this.hasDependency(subgoals[i], subgoals[j])) {
                    dependencies.push({
                        from: subgoals[i].id,
                        to: subgoals[j].id,
                        type: 'logical'
                    });
                }
            }
        }

        return dependencies;
    }

    hasDependency(subgoal1, subgoal2) {
        // Logica semplice per identificare dipendenze
        const dependentPairs = [
            ['analysis', 'design'],
            ['design', 'implementation'],
            ['implementation', 'testing'],
            ['research', 'study'],
            ['study', 'practice']
        ];

        return dependentPairs.some(([dep, next]) =>
            subgoal1.type === dep && subgoal2.type === next
        );
    }

    async generateStepFromSubGoal(subgoal, currentState) {
        return {
            id: `step_${subgoal.id}`,
            description: subgoal.description,
            type: subgoal.type,
            estimatedTime: subgoal.estimatedEffort || 1800000, // 30 min default
            successProbability: subgoal.successProbability || 0.8,
            requiredResources: subgoal.requiredResources || [],
            dependencies: subgoal.dependencies || []
        };
    }

    calculatePlanDepth(steps) {
        if (!steps || steps.length === 0) return 0;

        // Calcola profondità basata su dipendenze
        let maxDepth = 1;
        const stepDepths = new Map();

        const calculateDepth = (step) => {
            if (stepDepths.has(step.id)) return stepDepths.get(step.id);

            let depth = 1;
            if (step.dependencies && step.dependencies.length > 0) {
                for (const depId of step.dependencies) {
                    const depStep = steps.find(s => s.id === depId);
                    if (depStep) {
                        depth = Math.max(depth, calculateDepth(depStep) + 1);
                    }
                }
            }

            stepDepths.set(step.id, depth);
            maxDepth = Math.max(maxDepth, depth);
            return depth;
        };

        for (const step of steps) {
            calculateDepth(step);
        }

        return maxDepth;
    }

    identifyParallelizableSteps(steps) {
        // Identifica passi che possono essere eseguiti in parallelo
        const parallelizable = [];

        for (const step of steps) {
            if (!step.dependencies || step.dependencies.length === 0) {
                parallelizable.push(step.id);
            }
        }

        return parallelizable;
    }

    // Metodi di calcolo per ottimizzazione
    calculateTimeEfficiency(plan) {
        if (!plan.estimatedTime || !plan.steps) return 0.5;

        const totalStepTime = plan.steps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
        const parallelizableTime = this.calculateParallelizableTime(plan.steps);

        // Efficienza basata su quanto tempo si può salvare con parallelizzazione
        const efficiency = parallelizableTime > 0 ?
            (totalStepTime - parallelizableTime) / totalStepTime : 0.5;

        return Math.max(0.1, Math.min(1, efficiency));
    }

    calculateResourceEfficiency(plan) {
        if (!plan.steps) return 0.5;

        const totalResources = plan.steps.reduce((sum, step) =>
            sum + (step.requiredResources?.length || 1), 0);

        const uniqueResources = new Set();
        for (const step of plan.steps) {
            if (step.requiredResources) {
                step.requiredResources.forEach(res => uniqueResources.add(res));
            }
        }

        // Efficienza basata su riuso risorse
        const efficiency = uniqueResources.size / totalResources;
        return Math.max(0.1, Math.min(1, efficiency));
    }

    calculateParallelizableTime(steps) {
        const parallelizable = this.identifyParallelizableSteps(steps);
        return parallelizable.reduce((sum, stepId) => {
            const step = steps.find(s => s.id === stepId);
            return sum + (step?.estimatedTime || 0);
        }, 0);
    }

    async calculateOptimalResourceAllocation(step, constraints) {
        // Calcola allocazione ottimale risorse per un passo
        return {
            total: step.requiredResources?.length || 1,
            utilization: 0.8, // Placeholder
            allocation: step.requiredResources || []
        };
    }

    // Metodi di supporto per analisi
    async getRequiredCapabilities(goal) {
        // Ottiene capacità richieste per il goal
        const knowledge = await this.knowledgeBase.findRelevant(goal.description);
        const capabilities = new Set();

        for (const item of knowledge) {
            if (item.requiredCapabilities) {
                item.requiredCapabilities.forEach(cap => capabilities.add(cap));
            }
        }

        return Array.from(capabilities);
    }

    extractCapabilities(state) {
        // Estrae capacità disponibili dallo stato
        const capabilities = [];

        if (state.userSkills) capabilities.push(...state.userSkills);
        if (state.systemCapabilities) capabilities.push(...state.systemCapabilities);

        return capabilities;
    }

    extractEnvironmentalResources(environment) {
        // Estrae risorse ambientali
        return environment.resources || [];
    }

    async analyzeTrends(domain) {
        // Analizza trend per il dominio
        return await this.memorySystem.search({
            type: 'trend',
            domain: domain,
            limit: 5
        });
    }

    extractMarketOpportunities(conditions) {
        // Estrae opportunità di mercato
        return conditions.opportunities || [];
    }

    async estimateSubGoalEffort(subGoal, stateAnalysis) {
        // Stima sforzo per sottogoal
        const baseEffort = 1800000; // 30 minuti base
        const complexityMultiplier = stateAnalysis.complexity || 1;

        return baseEffort * complexityMultiplier;
    }

    async estimateSubGoalSuccess(subGoal, stateAnalysis) {
        // Stima probabilità di successo
        let probability = 0.8; // Base

        // Riduci basata su gap
        probability -= (stateAnalysis.gaps?.length || 0) * 0.1;

        // Aumenta basata su risorse
        probability += Math.min((stateAnalysis.resources?.length || 0) * 0.05, 0.2);

        return Math.max(0.1, Math.min(1, probability));
    }

    async identifyRequiredResources(subGoal, stateAnalysis) {
        // Identifica risorse richieste
        const resources = [];

        if (subGoal.type === 'implementation') {
            resources.push('technical_skills', 'development_tools');
        } else if (subGoal.type === 'analysis') {
            resources.push('analytical_skills', 'information_sources');
        }

        return resources;
    }

    /**
     * Configurazione e controllo
     */
    configure(options) {
        if (options.maxPlanningDepth) this.config.maxPlanningDepth = options.maxPlanningDepth;
        if (options.maxAlternatives) this.config.maxAlternatives = options.maxAlternatives;
        if (options.timeLimit) this.config.timeLimit = options.timeLimit;
        if (options.riskTolerance) this.config.riskTolerance = options.riskTolerance;
        if (typeof options.optimizationEnabled === 'boolean') this.config.optimizationEnabled = options.optimizationEnabled;
        if (typeof options.learningEnabled === 'boolean') this.config.learningEnabled = options.learningEnabled;
    }

    clearCache() {
        this.planCache.clear();
    }

    getStatus() {
        return {
            cachedPlans: this.planCache.size,
            performanceHistory: this.performanceHistory.length,
            config: { ...this.config }
        };
    }
}