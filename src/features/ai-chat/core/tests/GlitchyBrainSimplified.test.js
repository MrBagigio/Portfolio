// src/features/ai-chat/core/tests/GlitchyBrainSimplified.test.js (Versione Corretta)

import { GlitchyBrainSimplified } from '../GlitchyBrainSimplified.js';
import { MemorySystem } from '../MemorySystem.js';
import { OptimizedStorage } from '../OptimizedStorage.js';

// Mock delle dipendenze
jest.mock('../ConversationManager.js');
jest.mock('../NLU.js');
jest.mock('../siteActions.js');
jest.mock('../ConfigManager.js');
jest.mock('../OptimizedStorage.js');

describe('GlitchyBrainSimplified - Refactored Architecture Validation', () => {
  
  const mockDependencies = {
    conversationManager: { getStaticResponse: jest.fn(intent => `Risposta per ${intent}`) },
    nlu: {},
    siteActions: {},
    configManager: {},
    memoryStorage: new OptimizedStorage(), // Ora iniettiamo il mock
  };

  // Test 1: L'inizializzazione deve avere successo con le dipendenze
  test('should initialize successfully when all dependencies are injected', () => {
    const brain = new GlitchyBrainSimplified(mockDependencies);
    expect(brain).toBeInstanceOf(GlitchyBrainSimplified);
    expect(brain.memory).toBeInstanceOf(MemorySystem);
  });

  // Test 2: Deve lanciare un errore se le dipendenze mancano
  test('should throw an error if critical dependencies are missing', () => {
    expect(() => new GlitchyBrainSimplified()).toThrow("GlitchyBrainSimplified: Missing critical dependencies on initialization.");
  });

  // Test 3: Deve avere la funzione richiesta dall'UI
  test('should have the generatePersonalizedResponse function', async () => {
    const brain = new GlitchyBrainSimplified(mockDependencies);
    expect(typeof brain.generatePersonalizedResponse).toBe('function');

    // Testiamo anche che la funzione ritorni una risposta valida
    const response = await brain.generatePersonalizedResponse('greeting');
    expect(response.content).toBe('Risposta per greeting');
    expect(response.intent).toBe('greeting');
  });
});
