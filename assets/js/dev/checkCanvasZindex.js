(function checkCanvasZindex(){
  const selectors = [
    'canvas','#global-background-canvas','#hero-background-canvas','#title-3d-canvas','#pacman-cursor-canvas','#asteroids-cursor-canvas','#transition-canvas','#preloader','#page-transition-overlay','#global-score','.title-3d','.project-grid'
  ];
  const out = [];
  selectors.forEach(sel=>{
    const el = document.querySelector(sel);
    if (!el) { out.push({sel, found:false}); return; }
    const style = getComputedStyle(el);
    out.push({ sel, found:true, z: style.zIndex, display: style.display, opacity: style.opacity, pointerEvents: style.pointerEvents });
  });
  console.table(out);
})();
