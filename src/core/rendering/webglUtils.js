// assets/js/core/webglUtils.js
// Utility minimo per gestire in modo coerente la perdita / il ripristino del contesto WebGL

export function attachContextGuards(rendererOrCanvas, { onLost, onRestored } = {}) {
    // Accept either a renderer (with .domElement) or a canvas element
    const canvas = rendererOrCanvas && rendererOrCanvas.domElement ? rendererOrCanvas.domElement : rendererOrCanvas;
    if (!canvas || !canvas.addEventListener) return () => {};

    const _onLost = (e) => { try { e.preventDefault(); } catch (err) {};
        console.warn('webglUtils: context lost on canvas', canvas);
        if (typeof onLost === 'function') try { onLost(e); } catch (err) { console.warn(err); }
    };
    const _onRestored = (e) => {
        console.info('webglUtils: context restored on canvas', canvas);
        if (typeof onRestored === 'function') try { onRestored(e); } catch (err) { console.warn(err); }
    };

    canvas.addEventListener('webglcontextlost', _onLost, false);
    canvas.addEventListener('webglcontextrestored', _onRestored, false);

    return () => {
        try { canvas.removeEventListener('webglcontextlost', _onLost); } catch (e) {}
        try { canvas.removeEventListener('webglcontextrestored', _onRestored); } catch (e) {}
    };
}

export function safeDisposeComposer(composer) {
    if (!composer || !Array.isArray(composer.passes)) return;
    composer.passes.forEach(p => { try { if (p && p.dispose) p.dispose(); } catch (e) {} });
}

export function safeDisposeRenderer(renderer) {
    try { if (renderer && renderer.dispose) renderer.dispose(); } catch (e) {}
}
