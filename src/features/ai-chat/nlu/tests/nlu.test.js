// src/features/ai-chat/nlu/tests/nlu.test.js

import { recognizeIntent } from '../nlu_config.js';

describe('NLU System - Intent Recognition', () => {
  // Test Case 1: Test di precisione per intent chiari
  test('should correctly identify clear user intents', () => {
    const testCases = {
      'mostra i progetti': 'show_projects',
      'chi sei?': 'who_are_you',
      'ciao mondo': 'greeting',
      'cosa sai fare?': 'what_do_you_do',
    };

    Object.entries(testCases).forEach(([phrase, expectedIntent]) => {
      const result = recognizeIntent(phrase);
      expect(result.intent).toBe(expectedIntent);
      expect(result.confidence).toBeGreaterThan(0.9); // Ci aspettiamo alta confidenza
    });
  });

  // Test Case 2: Gestione di input ambigui o sconosciuti
  test('should return "unknown" for ambiguous or out-of-scope phrases', () => {
    const unknownPhrases = [
      'che tempo fa domani?',
      'raccontami una barzelletta',
      'questa frase non ha senso',
      'il cielo è blu',
    ];

    unknownPhrases.forEach(phrase => {
      const result = recognizeIntent(phrase);
      expect(result.intent).toBe('unknown');
    });
  });

  // Test Case 3: Test di robustezza con punteggiatura e maiuscole/minuscole
  test('should be robust to punctuation and case variations', () => {
    const variations = {
      'Mostra i progetti!!!': 'show_projects',
      'CHI SEI': 'who_are_you',
      'ciao...': 'greeting',
    };

    Object.entries(variations).forEach(([phrase, expectedIntent]) => {
      const result = recognizeIntent(phrase);
      expect(result.intent).toBe(expectedIntent);
    });
  });

  // Test Case 4: Verifica che la confidenza sia un numero valido
  test('should always return a valid confidence score between 0 and 1', () => {
    const phrase = 'un test a caso';
    const result = recognizeIntent(phrase);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
