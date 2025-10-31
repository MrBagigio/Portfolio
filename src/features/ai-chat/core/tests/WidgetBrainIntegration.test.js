// src/features/ai-chat/core/tests/WidgetBrainIntegration.test.js

import { AIChatWidget } from '../AIChatWidget.js';
import { GlitchyBrainSimplified } from '../GlitchyBrainSimplified.js';

// Mock di tutte le dipendenze di basso livello per isolare l'integrazione Widget <-> Brain
jest.mock('../ConversationManager.js');
jest.mock('../NLU.js');
jest.mock('../siteActions.js');
jest.mock('../ConfigManager.js');
jest.mock('../OptimizedStorage.js');

// Mock del DOM minimo richiesto dal widget
document.body.innerHTML = `
  <div id="ai-chat-widget">
    <div id="chat-messages"></div>
    <input id="chat-input" />
    <button id="send-message"></button>
  </div>
`;

describe('Integration Test: AIChatWidget <-> GlitchyBrainSimplified', () => {

  // Questo test fallirà con l'implementazione attuale, provando l'esistenza del bug
  test('should fail to call generatePersonalizedResponse if brain is not correctly instantiated', async () => {
    const widget = new AIChatWidget();
    
    // L'init fallirà perché GlitchyBrainSimplified non riceve le dipendenze
    await expect(widget.init()).rejects.toThrow("GlitchyBrainSimplified: Missing critical dependencies on initialization.");
  });

  // Questo test servirà a validare la nostra correzione
  test('should successfully call generatePersonalizedResponse after proper instantiation', async () => {
    // Per questo test, modifichiamo temporaneamente il widget per simulare la correzione
    // e dimostrare come dovrebbe funzionare.
    
    // --- INIZIO SIMULAZIONE DELLA CORREZIONE ---
    // Nella correzione reale, questa logica sarà DENTRO il widget
    const { ConversationManager } = await import('../ConversationManager.js');
    const { NLU } = await import('../NLU.js');
    const { SiteActionsManager } = await import('../siteActions.js');
    const { ConfigManager } = await import('../ConfigManager.js');
    const { OptimizedStorage } = await import('../OptimizedStorage.js');

    const brainDependencies = {
        conversationManager: new ConversationManager(),
        nlu: new NLU(),
        siteActions: new SiteActionsManager(),
        configManager: new ConfigManager(),
        memoryStorage: new OptimizedStorage()
    };
    const correctlyInitializedBrain = new GlitchyBrainSimplified(brainDependencies);
    // --- FINE SIMULAZIONE DELLA CORREZIONE ---

    // Verifichiamo che il cervello CORRETTO abbia la funzione
    expect(typeof correctlyInitializedBrain.generatePersonalizedResponse).toBe('function');

    // Ora, verifichiamo che una chiamata simulata funzioni
    const response = await correctlyInitializedBrain.generatePersonalizedResponse('greeting');
    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
  });
});
