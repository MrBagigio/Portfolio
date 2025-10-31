# GlitchyBrain Modular AI System - API Documentation

## Overview

GlitchyBrain is a comprehensive, enterprise-grade modular AI system that replaces the original monolithic 3427-line class with a clean, scalable architecture. The system consists of 11 specialized modules coordinated by a central orchestrator.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GlitchyBrain Orchestrator                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                Module Coordination Layer            │    │
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐ │    │
│  │  │ Config  │ Storage │ Memory  │Semantic │Reasoning│ │    │
│  │  └─────────┴─────────┴─────────┴─────────┴─────────┘ │    │
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐ │    │
│  │  │Planning │ State   │ Search  │ Error   │ Perf    │ │    │
│  │  └─────────┴─────────┴─────────┴─────────┴─────────┘ │    │
│  │  ┌─────────────────────────────────────────────────┐ │    │
│  │  │          Continuous Learning Engine             │ │    │
│  │  └─────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. ConfigManager
**Purpose**: Centralized configuration management with validation and type safety.

#### API
```javascript
const config = new ConfigManager(options);

// Set configuration value
await config.set(key, value);

// Get configuration value
const value = await config.get(key);

// Validate configuration
const isValid = await config.validate();

// Get all configuration
const allConfig = await config.getAll();

// Reset to defaults
await config.reset();
```

#### Configuration Schema
```javascript
{
  enableLearning: boolean,
  enablePerformanceMonitoring: boolean,
  maxConcurrentOperations: number,
  storage: {
    enableCompression: boolean,
    maxMemorySize: number,
    enableIndexing: boolean
  },
  reasoning: {
    maxHypothesisDepth: number,
    confidenceThreshold: number
  },
  semantic: {
    enableSentimentAnalysis: boolean,
    enableEntityExtraction: boolean
  }
}
```

### 2. OptimizedStorage
**Purpose**: High-performance persistent storage with IndexedDB, compression, and intelligent caching.

#### API
```javascript
const storage = new OptimizedStorage(options);

// Store data
await storage.store(key, data, options);

// Retrieve data
const data = await storage.retrieve(key);

// Search with filters
const results = await storage.search(query, filters);

// Delete data
await storage.delete(key);

// Get storage statistics
const stats = await storage.getStats();

// Optimize storage
await storage.optimize();
```

#### Features
- **Compression**: Automatic data compression for efficient storage
- **Indexing**: Sub-linear search algorithms with multiple indexes
- **Caching**: LRU/LFU/FIFO cache strategies
- **Transactions**: ACID-compliant operations

### 3. MemorySystem
**Purpose**: Unified memory management with episodic, semantic, and working memory.

#### API
```javascript
const memory = new MemorySystem(options);

// Store memory item
await memory.store(memoryItem);

// Retrieve by ID
const item = await memory.retrieve(id);

// Search memories
const results = await memory.search(query, filters);

// Update memory
await memory.update(id, updates);

// Consolidate memories
await memory.consolidate();

// Get memory statistics
const stats = await memory.getStats();
```

#### Memory Item Structure
```javascript
{
  id: string,
  content: string,
  type: 'episodic' | 'semantic' | 'working',
  tags: string[],
  importance: number, // 0-1
  timestamp: number,
  context: object,
  associations: string[] // IDs of related memories
}
```

### 4. SemanticAnalyzer
**Purpose**: Advanced natural language processing with tokenization, entity extraction, and sentiment analysis.

#### API
```javascript
const semantic = new SemanticAnalyzer(options);

// Analyze text
const analysis = await semantic.analyze(text);

// Extract entities
const entities = await semantic.extractEntities(text);

// Analyze sentiment
const sentiment = await semantic.analyzeSentiment(text);

// Get text summary
const summary = await semantic.summarize(text, maxLength);

// Detect language
const language = await semantic.detectLanguage(text);
```

#### Analysis Result Structure
```javascript
{
  tokens: string[],
  entities: Array<{
    text: string,
    type: string,
    confidence: number,
    start: number,
    end: number
  }>,
  sentiment: {
    score: number, // -1 to 1
    magnitude: number,
    label: 'positive' | 'negative' | 'neutral'
  },
  language: string,
  summary: string,
  keywords: string[],
  complexity: number
}
```

### 5. ReasoningEngine
**Purpose**: Deterministic reasoning with multiple patterns: deductive, inductive, abductive.

#### API
```javascript
const reasoning = new ReasoningEngine(options);

// Perform reasoning
const result = await reasoning.reason(context);

// Validate hypothesis
const validation = await reasoning.validateHypothesis(hypothesis, evidence);

// Generate explanations
const explanation = await reasoning.explain(conclusion, premises);

// Chain reasoning steps
const chain = await reasoning.chainReasoning(initialFacts, goal);
```

#### Reasoning Context
```javascript
{
  facts: string[],
  rules: Array<{ premise: string[], conclusion: string }>,
  question: string,
  constraints: object,
  maxDepth: number
}
```

#### Reasoning Result
```javascript
{
  conclusion: string,
  confidence: number, // 0-1
  reasoningPath: string[],
  evidence: string[],
  alternatives: Array<{
    conclusion: string,
    confidence: number
  }>,
  explanation: string
}
```

### 6. PlanningSystem
**Purpose**: Strategic planning with goal decomposition, optimization, and risk assessment.

#### API
```javascript
const planning = new PlanningSystem(options);

// Create plan
const plan = await planning.createPlan(goal, constraints);

// Optimize plan
const optimized = await planning.optimizePlan(plan, criteria);

// Execute plan step
const result = await planning.executeStep(planId, stepId);

// Monitor plan progress
const progress = await planning.getProgress(planId);

// Adapt plan to changes
const adapted = await planning.adaptPlan(planId, changes);
```

#### Plan Structure
```javascript
{
  id: string,
  goal: string,
  steps: Array<{
    id: string,
    description: string,
    dependencies: string[],
    estimatedDuration: number,
    priority: number,
    status: 'pending' | 'in-progress' | 'completed' | 'failed'
  }>,
  constraints: object,
  timeline: {
    start: Date,
    end: Date,
    milestones: Date[]
  },
  riskAssessment: {
    overall: number,
    factors: string[]
  }
}
```

### 7. StateManager
**Purpose**: Controlled state management with middleware, history, and snapshots.

#### API
```javascript
const state = new StateManager(options);

// Save state
await state.saveState(sessionId, stateData);

// Load state
const stateData = await state.loadState(sessionId);

// Update state
await state.updateState(sessionId, updates);

// Create snapshot
const snapshotId = await state.createSnapshot(sessionId);

// Restore from snapshot
await state.restoreFromSnapshot(snapshotId);

// Get state history
const history = await state.getHistory(sessionId);
```

#### State Data Structure
```javascript
{
  sessionId: string,
  userId: string,
  conversation: Array<{
    role: 'user' | 'assistant',
    content: string,
    timestamp: number,
    metadata: object
  }>,
  preferences: object,
  context: object,
  lastActivity: number
}
```

### 8. SearchEngine
**Purpose**: Advanced search capabilities with vector similarity, fuzzy search, and ranking.

#### API
```javascript
const search = new SearchEngine(options);

// Index document
await search.index(documentId, content, metadata);

// Search documents
const results = await search.search(query, options);

// Remove from index
await search.remove(documentId);

// Update index
await search.update(documentId, newContent, newMetadata);

// Get search statistics
const stats = await search.getStats();
```

#### Search Options
```javascript
{
  limit: number,
  offset: number,
  filters: object,
  sortBy: 'relevance' | 'date' | 'importance',
  fuzzy: boolean,
  semantic: boolean
}
```

#### Search Results
```javascript
{
  query: string,
  total: number,
  results: Array<{
    id: string,
    content: string,
    score: number,
    metadata: object,
    highlights: string[]
  }>,
  facets: object,
  took: number // milliseconds
}
```

### 9. ErrorHandler
**Purpose**: Enterprise-grade error handling with circuit breaker, retry logic, and recovery.

#### API
```javascript
const errorHandler = new ErrorHandler(options);

// Handle error
const result = await errorHandler.handle(error, context);

// Check circuit breaker status
const status = await errorHandler.getCircuitStatus(operation);

// Reset circuit breaker
await errorHandler.resetCircuit(operation);

// Get error statistics
const stats = await errorHandler.getStats();
```

#### Error Context
```javascript
{
  operation: string,
  userId: string,
  sessionId: string,
  input: any,
  timestamp: number,
  metadata: object
}
```

#### Error Result
```javascript
{
  handled: boolean,
  recovery: {
    strategy: string,
    executed: boolean,
    success: boolean
  },
  fallback: any,
  logId: string,
  shouldRetry: boolean,
  retryAfter: number
}
```

### 10. PerformanceMonitor
**Purpose**: Real-time performance monitoring with intelligent caching and metrics collection.

#### API
```javascript
const perf = new PerformanceMonitor(options);

// Record metric
perf.recordMetric(name, value, tags);

// Start timing
const timer = perf.startTimer(operation);

// End timing
const duration = timer.end();

// Get metrics
const metrics = perf.getMetrics(filter);

// Get cache statistics
const cacheStats = perf.getCacheStats();

// Optimize performance
await perf.optimize();
```

#### Metrics Structure
```javascript
{
  operation: {
    count: number,
    totalTime: number,
    averageTime: number,
    minTime: number,
    maxTime: number,
    p95: number,
    p99: number
  }
}
```

### 11. ContinuousLearningEngine
**Purpose**: Adaptive learning with reinforcement learning, transfer learning, and model optimization.

#### API
```javascript
const learning = new ContinuousLearningEngine(options);

// Learn from interaction
await learning.learnFromInteraction(interaction);

// Update models
await learning.updateModel();

// Get insights
const insights = await learning.getInsights();

// Predict user preferences
const prediction = await learning.predict(context);

// Adapt to feedback
await learning.adapt(feedback);
```

#### Interaction Data
```javascript
{
  input: string | object,
  response: string | object,
  feedback: {
    rating: number, // 0-1
    helpful: boolean,
    accuracy: number,
    completeness: number
  },
  context: object,
  outcome: 'success' | 'partial' | 'failure'
}
```

## GlitchyBrain Orchestrator

### Main API

```javascript
const brain = new GlitchyBrain(config);

// Initialize system
await brain.initialize();

// Process request
const result = await brain.processRequest(request);

// Get system health
const health = await brain.healthCheck();

// Shutdown system
await brain.shutdown();

// Export system state
const state = await brain.exportState();

// Import system state
await brain.importState(state);
```

### Request Structure
```javascript
{
  text: string,
  context: {
    userId: string,
    sessionId: string,
    conversationHistory: Array<{
      role: string,
      content: string,
      timestamp: number
    }>
  },
  metadata: {
    source: string,
    priority: 'low' | 'normal' | 'high',
    timeout: number
  }
}
```

### Response Structure
```javascript
{
  response: {
    text: string,
    actions: Array<{
      type: string,
      data: any
    }>,
    suggestions: string[]
  },
  confidence: number, // 0-1
  metadata: {
    sessionId: string,
    processingTime: number,
    modulesUsed: string[],
    cacheHit: boolean
  },
  error: {
    code: string,
    message: string,
    recoverable: boolean
  } | null
}
```

## Configuration

### Default Configuration
```javascript
const defaultConfig = {
  // Core settings
  enableLearning: true,
  enablePerformanceMonitoring: true,
  maxConcurrentOperations: 5,

  // Storage settings
  storage: {
    enableCompression: true,
    maxMemorySize: 500 * 1024 * 1024, // 500MB
    enableIndexing: true,
    cacheStrategy: 'lru'
  },

  // Reasoning settings
  reasoning: {
    maxHypothesisDepth: 5,
    confidenceThreshold: 0.7,
    enableAbductive: true
  },

  // Semantic analysis settings
  semantic: {
    enableSentimentAnalysis: true,
    enableEntityExtraction: true,
    maxTokens: 1000
  },

  // Learning settings
  learning: {
    adaptationRate: 0.1,
    memoryRetention: 0.8,
    feedbackWeight: 0.6
  },

  // Error handling settings
  error: {
    maxRetries: 3,
    circuitBreakerThreshold: 5,
    recoveryTimeout: 30000
  }
};
```

## Usage Examples

### Basic Usage
```javascript
import { GlitchyBrain } from './GlitchyBrain.js';

// Initialize
const brain = new GlitchyBrain({
  enableLearning: true,
  maxConcurrentOperations: 3
});

await brain.initialize();

// Process a request
const result = await brain.processRequest({
  text: 'Explain machine learning',
  context: { userId: 'user123' }
});

console.log(result.response.text);
```

### Advanced Usage with Custom Modules
```javascript
import { GlitchyBrain } from './GlitchyBrain.js';
import { CustomReasoningEngine } from './CustomReasoningEngine.js';

// Custom configuration
const config = {
  enableLearning: true,
  modules: {
    reasoning: CustomReasoningEngine
  }
};

const brain = new GlitchyBrain(config);
await brain.initialize();

// Use custom reasoning
const result = await brain.processRequest({
  text: 'Complex reasoning task',
  context: { userId: 'advanced_user' }
});
```

### Error Handling
```javascript
try {
  const result = await brain.processRequest(request);

  if (result.error) {
    console.error('Processing error:', result.error);
    // Handle error appropriately
  } else {
    console.log('Response:', result.response.text);
  }
} catch (error) {
  console.error('System error:', error);
  // Fallback handling
}
```

### Monitoring and Metrics
```javascript
// Get system health
const health = await brain.healthCheck();
console.log('System health:', health.overall);

// Get performance metrics
const metrics = brain.modules.performance.getMetrics();
console.log('Performance:', metrics);

// Monitor specific operations
brain.modules.performance.recordMetric('custom_operation', 150, {
  userId: 'user123',
  operationType: 'analysis'
});
```

## Migration Guide

### From Monolithic GlitchyBrain

1. **Replace imports**:
   ```javascript
   // Old
   import { GlitchyBrain } from './old/GlitchyBrain.js';

   // New
   import { GlitchyBrain } from './GlitchyBrain.js';
   ```

2. **Update configuration**:
   ```javascript
   // Old monolithic config
   const config = { /* large config object */ };

   // New modular config
   const config = {
     enableLearning: true,
     maxConcurrentOperations: 3,
     // ... other options
   };
   ```

3. **Update API calls**:
   ```javascript
   // Old
   const result = brain.processInput(text, context);

   // New
   const result = await brain.processRequest({
     text,
     context
   });
   ```

## Performance Optimization

### Recommended Settings for Production
```javascript
const productionConfig = {
  enableLearning: true,
  enablePerformanceMonitoring: true,
  maxConcurrentOperations: 10,

  storage: {
    enableCompression: true,
    maxMemorySize: 2 * 1024 * 1024 * 1024, // 2GB
    enableIndexing: true,
    cacheStrategy: 'lru'
  },

  reasoning: {
    maxHypothesisDepth: 3, // Reduced for speed
    confidenceThreshold: 0.8
  },

  learning: {
    adaptationRate: 0.05, // Slower adaptation
    memoryRetention: 0.9
  }
};
```

### Monitoring Best Practices
- Monitor memory usage regularly
- Set up alerts for error rates > 5%
- Track response times with P95/P99 percentiles
- Implement log aggregation for debugging
- Use health checks in load balancers

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all module files are in the correct directory
   - Check import paths in GlitchyBrain.js

2. **Performance degradation**
   - Check memory usage with `brain.healthCheck()`
   - Clear caches with `brain.modules.storage.optimize()`
   - Reduce `maxConcurrentOperations`

3. **Low confidence scores**
   - Check semantic analysis with test inputs
   - Verify reasoning engine configuration
   - Review learning feedback quality

4. **Storage errors**
   - Check IndexedDB availability
   - Verify storage quota
   - Clear old data with `storage.optimize()`

### Debug Mode
```javascript
const brain = new GlitchyBrain({
  debug: true,
  logLevel: 'verbose'
});
```

## Contributing

### Adding New Modules
1. Create module class extending `BaseModule`
2. Implement required interface methods
3. Add to GlitchyBrain module registry
4. Update configuration schema
5. Add comprehensive tests

### Testing
- Run integration tests: `integration_test.html`
- Unit tests for individual modules
- Performance benchmarks
- Memory leak tests

## License

This system is part of the GlitchyAI project. See project license for details.