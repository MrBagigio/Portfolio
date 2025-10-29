/*
  Test harness semplice per PacmanCursor / PacmanGame.
  Copia-incolla questo file nella Console di DevTools mentre la pagina è aperta.
  Funzionalità:
  - Simula movimenti del mouse circolari verso il centro per attivare game-mode
  - Simula inattività (nessun movimento) per verificare che si entri in pausa
  - Simula un boost (click) durante il movimento
  - Logga eventi e stati principali
*/
(function runPacmanHarness(options){
    options = Object.assign({ moveDuration: 1500, idleDuration: 2000, boostDelay: 1000 }, options || {});
    const canvases = Array.from(document.querySelectorAll('canvas'));
    if (canvases.length === 0) { console.warn('No canvas found. Aborting harness.'); return; }

    // Selection priority:
    // 1) explicit id used in the project: 'pacman-cursor-canvas'
    // 2) any visible canvas with a 2D context
    // 3) first canvas fallback
    let pacmanCanvas = document.getElementById('pacman-cursor-canvas') || document.getElementById('pacman-canvas');

    function isVisibleCanvas(c) {
        if (!c) return false;
        const style = getComputedStyle(c);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
        const rect = c.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return true;
    }

    if (!pacmanCanvas) {
        pacmanCanvas = canvases.find(c => {
            try {
                const has2d = !!(c.getContext && c.getContext('2d'));
                return has2d && isVisibleCanvas(c);
            } catch (e) { return false; }
        });
    }

    if (!pacmanCanvas) {
        // fallback: prefer any visible canvas, then first canvas
        pacmanCanvas = canvases.find(isVisibleCanvas) || canvases[0];
    }

    console.info('Pacman harness selected canvas:', pacmanCanvas);
    try { console.info('Canvas 2D context available:', !!(pacmanCanvas && pacmanCanvas.getContext && pacmanCanvas.getContext('2d'))); } catch(e){ console.info('Unable to check 2D context:', e); }

    function dispatchMouseMove(x,y) {
        const ev = new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true });
        window.dispatchEvent(ev);
    }
    function dispatchMouseDown() {
        const ev = new MouseEvent('mousedown', { button: 0, bubbles: true });
        window.dispatchEvent(ev);
    }
    function dispatchClick() {
        const ev = new MouseEvent('click', { button: 0, bubbles: true });
        window.dispatchEvent(ev);
    }

    const rect = pacmanCanvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let t0 = performance.now();
    console.info('Starting Pacman harness test sequence...');

    // 1) Smooth circular motion towards center (activates game-mode)
    const steps = 40;
    for (let i=0;i<steps;i++) {
        const angle = (Math.PI * 2) * (i/steps) + 0.3;
        const r = Math.max(rect.width, rect.height) * 0.4 * (1 - i/steps);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        setTimeout(() => { dispatchMouseMove(Math.round(x), Math.round(y)); }, Math.round(i * (options.moveDuration / steps)));
    }

    // 2) Wait a bit then trigger boost (mousedown)
    setTimeout(() => {
        console.info('Triggering boost (mousedown).');
        dispatchMouseDown();
    }, options.boostDelay);

    // 3) After motion, stop moving to simulate inactivity
    setTimeout(() => {
        console.info('Simulating inactivity...');
        // no mouse events for idleDuration
    }, options.moveDuration + 100);

    // 4) After idleDuration, move again to verify resume
    setTimeout(() => {
        console.info('Resuming motion to verify return from pause.');
        dispatchMouseMove(centerX + 50, centerY + 50);
        setTimeout(() => { dispatchMouseMove(centerX + 100, centerY + 100); }, 200);
    }, options.moveDuration + options.idleDuration + 200);

    // 5) Final log
    setTimeout(() => {
        console.info('Pacman harness completed. Observe console for state changes and errors.');
    }, options.moveDuration + options.idleDuration + 800);

})( { moveDuration: 1600, idleDuration: 2200, boostDelay: 900 } );
