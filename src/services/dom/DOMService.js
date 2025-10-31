// DOMService.js - Handles all DOM manipulations
export class DOMService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for UI events from siteActions
        this.eventBus.on('ui:openProject', (data) => this.openProjectCase(data));
        this.eventBus.on('ui:setGameCursor', (data) => this.setGameCursor(data));
        this.eventBus.on('ui:toggleClass', (data) => this.toggleClassOnBody(data.classToAdd, data.classToRemove));
        this.eventBus.on('ui:navigateTo', (data) => this.navigateTo(data.section));
        this.eventBus.on('ui:playSound', (data) => this.playSound(data.name));
    }

    toggleClassOnBody(classToAdd, classToRemove) {
        const body = document.body;
        if (!body) return false;
        if (classToRemove) body.classList.remove(classToRemove);
        if (classToAdd) body.classList.add(classToAdd);
        return true;
    }

    setGameCursor(type) {
    const pacmanCanvas = document.getElementById('pacman-cursor-canvas');
    const asteroidsCanvas = document.getElementById('asteroids-cursor-canvas');
    const simpleCanvas = document.getElementById('simple-cursor-canvas');
    const glitchCanvas = document.getElementById('glitch-cursor-canvas');
    if (!pacmanCanvas || !asteroidsCanvas || !glitchCanvas || !simpleCanvas) return false;

        switch (type) {
            case 'pacman':
                pacmanCanvas.style.display = 'block';
                asteroidsCanvas.style.display = 'none';
                simpleCanvas.style.display = 'none';
                glitchCanvas.style.display = 'none';
                break;
            case 'asteroids':
                pacmanCanvas.style.display = 'none';
                asteroidsCanvas.style.display = 'block';
                simpleCanvas.style.display = 'none';
                glitchCanvas.style.display = 'none';
                break;
            case 'simple':
                pacmanCanvas.style.display = 'none';
                asteroidsCanvas.style.display = 'none';
                simpleCanvas.style.display = 'block';
                glitchCanvas.style.display = 'none';
                break;
            case 'glitch':
                pacmanCanvas.style.display = 'none';
                asteroidsCanvas.style.display = 'none';
                simpleCanvas.style.display = 'none';
                glitchCanvas.style.display = 'block';
                break;
            default:
                pacmanCanvas.style.display = 'none';
                asteroidsCanvas.style.display = 'none';
                simpleCanvas.style.display = 'none';
                glitchCanvas.style.display = 'none';
        }
        return true;
    }

    openProjectCase(projectData) {
        const caseView = document.getElementById('case-history-view');
        const title = document.getElementById('case-history-title');
        const subtitle = document.getElementById('case-history-subtitle');
        const content = document.getElementById('case-history-content');
        if (!caseView || !title || !content) return false;

        // Safe HTML construction using DOM methods
        title.textContent = projectData.title || projectData.id;
        subtitle.textContent = `${projectData.date || ''} • ${projectData.fileSize || ''}`;

        // Clear previous content
        content.innerHTML = '';

        // Create project case div
        const projectCase = document.createElement('div');
        projectCase.className = 'project-case';

        // Poster image
        const img = document.createElement('img');
        img.src = projectData.poster;
        img.alt = `${projectData.title} poster`;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '6px';
        img.style.marginBottom = '8px';
        projectCase.appendChild(img);

        // Description
        const desc = document.createElement('p');
        desc.textContent = projectData.description || '';
        projectCase.appendChild(desc);

        // Tools
        if (projectData.tools && projectData.tools.length > 0) {
            const toolsP = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = 'Tools: ';
            toolsP.appendChild(strong);

            projectData.tools.forEach(tool => {
                const span = document.createElement('span');
                span.className = 'toolkit-item small';
                span.textContent = tool;
                toolsP.appendChild(span);
                toolsP.appendChild(document.createTextNode(' ')); // Aggiunge uno spazio tra gli span
            });
            projectCase.appendChild(toolsP);
        }

        // File size
        const sizeP = document.createElement('p');
        const strongSize = document.createElement('strong');
        strongSize.textContent = 'File size: ';
        sizeP.appendChild(strongSize);
        sizeP.appendChild(document.createTextNode(projectData.fileSize || '—'));
        projectCase.appendChild(sizeP);

        // Videos
        if (projectData.videos) {
            if (projectData.videos.before && projectData.videos.before.mp4) {
                const videoDiv = document.createElement('div');
                videoDiv.className = 'project-video';
                const h4 = document.createElement('h4');
                h4.textContent = 'Before';
                const video = document.createElement('video');
                video.controls = true;
                video.src = projectData.videos.before.mp4;
                video.style.width = '100%';
                video.style.maxHeight = '220px';
                video.style.borderRadius = '6px';
                videoDiv.appendChild(h4);
                videoDiv.appendChild(video);
                projectCase.appendChild(videoDiv);
            }
            if (projectData.videos.after && projectData.videos.after.mp4) {
                const videoDiv = document.createElement('div');
                videoDiv.className = 'project-video';
                const h4 = document.createElement('h4');
                h4.textContent = 'After';
                const video = document.createElement('video');
                video.controls = true;
                video.src = projectData.videos.after.mp4;
                video.style.width = '100%';
                video.style.maxHeight = '220px';
                video.style.borderRadius = '6px';
                videoDiv.appendChild(h4);
                videoDiv.appendChild(video);
                projectCase.appendChild(videoDiv);
            }
        }

        content.appendChild(projectCase);
        caseView.style.display = 'block';
        caseView.scrollTop = 0;
        return true;
    }

    navigateTo(section) {
        const el = document.querySelector(section.startsWith('#') ? section : `#${section}`);
        if (!el) return false;
        el.scrollIntoView({ behavior: 'smooth' });
        return true;
    }

    playSound(name) {
        // This will be handled by AudioManager, but for now delegate
        this.eventBus.emit('audio:play', { name });
    }
}