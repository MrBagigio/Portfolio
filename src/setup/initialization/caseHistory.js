// assets/js/setup/caseHistory.js

function setupHotspots(container, hotspotsData) {
    if (!container) return;
    container.querySelectorAll('.hotspot-content').forEach(el => el.remove());
    if (!hotspotsData) return;

    Object.entries(hotspotsData).forEach(([id, data]) => {
        const hotspotContent = document.createElement('div');
        hotspotContent.className = 'hotspot-content';
        hotspotContent.id = `hotspot-content-${id}`;
        hotspotContent.innerHTML = `<h4>${data.title}</h4><p>${data.text}</p>`;
        container.appendChild(hotspotContent);
    });

    container.removeEventListener('click', handleHotspotClick);
    container.addEventListener('click', handleHotspotClick);
}

function handleHotspotClick(e) {
    const hotspot = e.target.closest('.hotspot');
    const pageView = document.getElementById('case-history-view'); // Corretto l'ID
    const visibleContents = pageView ? pageView.querySelectorAll('.hotspot-content.visible') : [];

    visibleContents.forEach(content => content.classList.remove('visible'));

    if (!hotspot) return;

    const hotspotId = hotspot.dataset.hotspot;
    const targetContent = document.getElementById(`hotspot-content-${hotspotId}`);
    if (targetContent) {
        targetContent.style.left = `${hotspot.offsetLeft + 30}px`;
        targetContent.style.top = `${hotspot.offsetTop}px`;
        targetContent.classList.add('visible');
    }
}

export function openCaseHistory(projectId, projectData) {
    // --- MODIFICA CHIAVE: Converti entrambi gli ID in stringhe per un confronto sicuro ---
    const project = projectData.find(p => String(p.id) === String(projectId));
    
    if (!project) {
        console.error("Progetto non trovato:", projectId);
        return;
    }

    const titleEl = document.getElementById('case-history-title');
    const subtitleEl = document.getElementById('case-history-subtitle');
    const contentEl = document.getElementById('case-history-content');
    const viewContainer = document.getElementById('case-history-view'); // Corretto il selettore

    if (titleEl) titleEl.textContent = project.title;
    // Ho notato che l'errore era su `subtitle`, che sta dentro `case_history`, quindi accedo in modo sicuro.
    if (subtitleEl && project.case_history) subtitleEl.textContent = project.case_history.subtitle;
    if (contentEl && project.case_history) {
        contentEl.innerHTML = window.HTMLSanitizer.sanitize(project.case_history.content_html);
        setupHotspots(contentEl, project.case_history.hotspots);
    }

    document.body.classList.add('case-history-active');
    if (viewContainer) {
        // Non serve aggiungere 'active' qui, viene gestito da switchView
        viewContainer.scrollTo(0, 0);
    }
}

export function closeCaseHistory() {
    // Questa funzione potrebbe non essere più necessaria se `switchView` gestisce tutto,
    // ma la lasciamo per coerenza.
    document.body.classList.remove('case-history-active');
}