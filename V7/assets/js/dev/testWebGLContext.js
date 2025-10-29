/*
  Test rapido per simulare la perdita e il ripristino del contesto WebGL su tutti i canvas presenti nella pagina.
  Copia-incolla questo script nella Console di DevTools e premilo.

  Funzionalità:
  - Cicla tutti i <canvas> trovati
  - Per ogni canvas prova ad ottenere l'estensione WEBGL_lose_context
  - Se disponibile: esegue loseContext() e poi restoreContext() dopo pochi secondi
  - Logga i risultati in console
*/
(function runWebGLContextTest(opts){
    opts = Object.assign({ delayBetween: 1000, restoreDelay: 2000 }, opts || {});
    const canvases = Array.from(document.querySelectorAll('canvas'));
    if (canvases.length === 0) { console.warn('Nessun canvas trovato nella pagina.'); return; }
    console.info('WebGL context test: trovati', canvases.length, 'canvas.');

    canvases.forEach((canvas, idx) => {
        const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!ctx) { console.warn('Canvas', idx, 'non espone un contesto WebGL.'); return; }
        const ext = ctx.getExtension && ctx.getExtension('WEBGL_lose_context');
        if (!ext) { console.warn('Canvas', idx, 'non espone WEBGL_lose_context. Impossibile simulare lose/restore.'); return; }

        const startDelay = opts.delayBetween * idx;
        // console.log(`Canvas ${idx}: scheduling loseContext in ${startDelay}ms`);
        setTimeout(() => {
            try {
                ext.loseContext();
                // console.log(`Canvas ${idx}: lost context.`);
            } catch (e) { console.warn(`Canvas ${idx}: errore during loseContext`, e); }

            setTimeout(() => {
                try {
                    ext.restoreContext();
                    // console.log(`Canvas ${idx}: restored context.`);
                } catch (e) { console.warn(`Canvas ${idx}: errore during restoreContext`, e); }
            }, opts.restoreDelay + (idx * 200));

        }, startDelay);
    });
})( { delayBetween: 1000, restoreDelay: 1800 } );
