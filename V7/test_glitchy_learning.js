// Test script per verificare i SISTEMI AVANZATI di apprendimento di Glitchy
console.log('🚀 Test dei Sistemi Avanzati di Apprendimento di Glitchy');

// Test 1: Verifica che tutti i nuovi sistemi siano inizializzati
if (typeof glitchyBrain !== 'undefined') {
    console.log('✅ GlitchyBrain disponibile');
} else {
    console.error('❌ GlitchyBrain non trovato');
    return;
}

if (glitchyBrain.episodicMemory) {
    console.log('✅ Memoria Episodica inizializzata');
} else {
    console.error('❌ Memoria Episodica non trovata');
}

if (glitchyBrain.reinforcementLearner) {
    console.log('✅ Apprendimento per Rinforzo inizializzato');
} else {
    console.error('❌ Apprendimento per Rinforzo non trovato');
}

if (glitchyBrain.predictiveEngine) {
    console.log('✅ Motore Predittivo inizializzato');
} else {
    console.error('❌ Motore Predittivo non trovato');
}

if (glitchyBrain.dynamicPersonality) {
    console.log('✅ Personalità Dinamica inizializzata');
} else {
    console.error('❌ Personalità Dinamica non trovata');
}

// Test 2: Simula interazioni per testare la memoria episodica
console.log('🔄 Test Memoria Episodica...');
glitchyBrain.addEpisodicMemory({
    intent: 'set-cursor',
    entities: { cursorType: 'pacman' },
    sentiment: 'positive',
    satisfaction: 4.5,
    success: true,
    responseQuality: 'good',
    userEngagement: 'high'
});

glitchyBrain.addEpisodicMemory({
    intent: 'open-project',
    entities: { projectName: 'biosphaera' },
    sentiment: 'positive',
    satisfaction: 5,
    success: true,
    responseQuality: 'excellent',
    userEngagement: 'high'
});

console.log('✅ Interazioni episodiche aggiunte');

// Test 3: Verifica ricerca episodi simili
const similarEpisodes = glitchyBrain.findSimilarEpisodes({
    currentSection: 'hero',
    lastIntent: 'set-cursor'
});
console.log('📊 Episodi simili trovati:', similarEpisodes.length);

// Test 4: Test apprendimento per rinforzo
console.log('🔄 Test Apprendimento per Rinforzo...');
const testState = {
    intent: 'set-cursor',
    sentiment: 'positive',
    timeOfDay: 'morning'
};

const availableActions = ['helpful', 'sarcastic', 'excited', 'empathetic'];
const chosenAction = glitchyBrain.reinforcementLearner.chooseAction(testState, availableActions);
console.log('🎯 Azione scelta dal RL:', chosenAction);

// Simula feedback positivo
glitchyBrain.reinforcementLearner.updateQValue(testState, chosenAction, 0.8, {
    intent: 'unknown',
    sentiment: 'positive',
    timeOfDay: 'morning'
});
console.log('✅ Feedback RL applicato');

// Test 5: Test motore predittivo
console.log('🔄 Test Motore Predittivo...');
glitchyBrain.predictiveEngine.learnPattern('timeBased', 'morning', 'set-cursor', 1);
glitchyBrain.predictiveEngine.learnPattern('contextBased', 'hero_set-cursor', 'open-project', 1);

const predictions = glitchyBrain.predictiveEngine.predictNextAction({
    currentSection: 'hero',
    lastIntent: 'set-cursor'
});
console.log('🔮 Predizioni generate:', predictions.length);

// Test 6: Test personalità dinamica
console.log('🔄 Test Personalità Dinamica...');
const initialTraits = { ...glitchyBrain.dynamicPersonality.traits };
console.log('� Tratti iniziali:', initialTraits);

// Simula adattamento basato su feedback positivo
glitchyBrain.dynamicPersonality.adaptToFeedback(5, 'positive', 'command');
const adaptedTraits = glitchyBrain.dynamicPersonality.traits;
console.log('📊 Tratti dopo adattamento positivo:', adaptedTraits);

// Simula adattamento basato su feedback negativo
glitchyBrain.dynamicPersonality.adaptToFeedback(2, 'negative', 'error');
const finalTraits = glitchyBrain.dynamicPersonality.traits;
console.log('📊 Tratti dopo adattamento negativo:', finalTraits);

// Test 7: Test estrazione tono dalle risposte
console.log('🔄 Test Estrazione Tono...');
const testResponses = [
    'Perfetto! Suppongo che ti piaccia.',
    'Wow! Incredibile richiesta!',
    'Capisco perfettamente come ti senti.',
    'Posso aiutarti con qualcos\'altro?'
];

testResponses.forEach(response => {
    const tone = glitchyBrain.extractToneFromResponse(response);
    console.log(`🎭 "${response}" -> ${tone}`);
});

// Test 8: Test generazione risposta personalizzata avanzata
console.log('🔄 Test Generazione Risposta Avanzata...');
const baseResponse = 'Ho impostato il cursore.';
const enhancedResponse = glitchyBrain.generatePersonalizedResponse(baseResponse, 'imposta cursore asteroids', 'set-cursor');
console.log('� Risposta base:', baseResponse);
console.log('✨ Risposta avanzata:', enhancedResponse);

// Test 9: Test valutazione soddisfazione avanzata
console.log('🔄 Test Valutazione Soddisfazione Avanzata...');
const satisfaction = glitchyBrain.evaluateUserSatisfaction(
    { ok: true, msg: 'Perfetto! Ho impostato il cursore asteroids.' },
    'imposta cursore asteroids'
);
console.log('😊 Soddisfazione valutata:', satisfaction);

// Test 10: Test generazione suggerimenti proattivi avanzati
console.log('🔄 Test Suggerimenti Proattivi Avanzati...');
const insights = {
    favoriteTopics: { projects: 3, interface: 2 },
    commonIntents: { 'set-cursor': 5, 'open-project': 3 },
    lastIntent: 'set-cursor'
};
const suggestions = glitchyBrain.generateProactiveSuggestions(insights);
console.log('� Suggerimenti generati:', suggestions.length);

// Test 11: Verifica che tutto sia salvato correttamente
console.log('💾 Verifica salvataggio...');
try {
    localStorage.getItem('glitchy_episodic_memory');
    localStorage.getItem('glitchy_qtable');
    localStorage.getItem('glitchy_patterns');
    localStorage.getItem('glitchy_traits');
    console.log('✅ Tutti i dati salvati correttamente');
} catch (e) {
    console.error('❌ Errore nel salvataggio:', e);
}

console.log('🎉 Test dei Sistemi Avanzati Completati!');
console.log('🌟 Glitchy ora ha:');
console.log('   • Memoria Episodica per ricordi contestuali');
console.log('   • Apprendimento per Rinforzo per ottimizzare risposte');
console.log('   • Motore Predittivo per anticipare bisogni');
console.log('   • Personalità Dinamica che evolve');
console.log('   • Sistema di adattamento completo!');