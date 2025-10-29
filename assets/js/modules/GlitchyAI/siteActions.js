// Accessibilità: cambia dimensione testo e contrasto
export function setAccessibility(option) {
    const body = document.body;
    if (!body) return { ok: false, msg: 'Impossibile modificare accessibilità.' };
    // Gestione dimensione testo
    if (option === 'text-large') {
        body.classList.add('access-text-large');
        localStorage.setItem('access_text_size', 'large');
        return { ok: true, msg: 'Testo ingrandito.' };
    } else if (option === 'text-normal') {
        body.classList.remove('access-text-large');
        localStorage.setItem('access_text_size', 'normal');
        return { ok: true, msg: 'Testo normale.' };
    }
    // Gestione contrasto
    if (option === 'contrast-high') {
        body.classList.add('access-contrast-high');
        localStorage.setItem('access_contrast', 'high');
        return { ok: true, msg: 'Contrasto alto attivato.' };
    } else if (option === 'contrast-normal') {
        body.classList.remove('access-contrast-high');
        localStorage.setItem('access_contrast', 'normal');
        return { ok: true, msg: 'Contrasto normale.' };
    }
    return { ok: false, msg: 'Opzione accessibilità non riconosciuta.' };
}
// Cambia il tema del sito (scuro/chiaro)
export function setTheme(theme) {
    const body = document.body;
    if (!body) return { ok: false, msg: 'Impossibile cambiare tema.' };
    if (theme === 'scuro' || theme === 'dark') {
        body.classList.add('theme-dark');
        body.classList.remove('theme-light');
        localStorage.setItem('site_theme', 'dark');
        return { ok: true, msg: 'Tema scuro attivato.' };
    } else if (theme === 'chiaro' || theme === 'light') {
        body.classList.add('theme-light');
        body.classList.remove('theme-dark');
        localStorage.setItem('site_theme', 'light');
        return { ok: true, msg: 'Tema chiaro attivato.' };
    }
    return { ok: false, msg: 'Tema non riconosciuto.' };
}
/* siteActions.js
   Espone funzioni che il widget può richiamare per controllare parti del sito.
   - Le funzioni devono essere sicure e usare selettori già presenti nel sito.
   - Estendere secondo necessità.
*/

let _currentCursor = 'default';

export function getCurrentCursor() {
    return _currentCursor;
}

// Cambia il tipo di cursore di gioco (usa canvas id presenti nel progetto)
export function setGameCursor(type){
    // tipi supportati: 'pacman', 'asteroids', 'default'
    const pacmanCanvas = document.getElementById('pacman-cursor-canvas');
    const asteroidsCanvas = document.getElementById('asteroids-cursor-canvas');
    if(!pacmanCanvas || !asteroidsCanvas) return {ok:false, msg:'Cursori non trovati'};

    _currentCursor = type;

    switch(type){
        case 'pacman':
            _lastCursor = 'pacman';
            pacmanCanvas.style.display='block';
            asteroidsCanvas.style.display='none';
            _auditLog.push({action:'setGameCursor', at:Date.now(), cursor:'pacman'});
            return {ok:true, msg:'Cursore impostato su Pacman'};
        case 'asteroids':
            _lastCursor = 'asteroids';
            pacmanCanvas.style.display='none';
            asteroidsCanvas.style.display='block';
            _auditLog.push({action:'setGameCursor', at:Date.now(), cursor:'asteroids'});
            return {ok:true, msg:'Cursore impostato su Asteroids'};
        default:
            _lastCursor = 'default';
            pacmanCanvas.style.display='none';
            asteroidsCanvas.style.display='none';
            _auditLog.push({action:'setGameCursor', at:Date.now(), cursor:'default'});
            return {ok:true, msg:'Cursore impostato su Default'};
    }
}

// Apri il case-history di un progetto (usa id convention nel tuo sito)
let _cachedProjects = null;
let _lastCursor = null;
let _auditLog = [];

export async function getProjects(){
    if(_cachedProjects) return _cachedProjects;
    try{
        const res = await fetch('assets/projects.json', {cache: 'no-store'});
        if(!res.ok) throw new Error('Impossibile caricare projects.json');
        const data = await res.json();
        _cachedProjects = data;
        return data;
    }catch(err){ console.warn('[siteActions] getProjects error', err); return []; }
}

// Apri il case-history di un progetto cercando per id o title (case-insensitive)
export async function openProjectCase(projectKey){
    const caseView = document.getElementById('case-history-view');
    const title = document.getElementById('case-history-title');
    const subtitle = document.getElementById('case-history-subtitle');
    const content = document.getElementById('case-history-content');
    if(!caseView || !title || !content) return {ok:false, msg:'View progetto non trovata'};

    const projects = await getProjects();
    if(!projects || projects.length===0){
        title.textContent = projectKey || 'Progetto';
        subtitle.textContent = 'Dati progetto non disponibili';
        content.innerHTML = `<p>Impossibile caricare i dettagli del progetto. (projects.json mancante)</p>`;
        caseView.style.display='block';
        return {ok:false, msg:'Dati progetto non disponibili'};
    }

    const key = (projectKey||'').toString().toLowerCase();
    // try match by id or title token
    let found = projects.find(p=> p.id.toLowerCase() === key || p.title.toLowerCase() === key);
    if(!found){
        // try fuzzy find: look for token contained
        found = projects.find(p=> p.id.toLowerCase().includes(key) || p.title.toLowerCase().includes(key));
    }
    if(!found){
        // try splitting words in key and match any
        const parts = key.split(/[-_\s]+/).filter(Boolean);
        for(const p of projects){
            const t = (p.title+' '+p.id).toLowerCase();
            if(parts.every(part=> t.includes(part))){ found = p; break; }
        }
    }

    if(!found){
        return {ok:false, msg:`Progetto '${projectKey}' non trovato.`};
    }

    // populate view with real data (poster, description, tools, videos)
    title.textContent = found.title || found.id;
    subtitle.textContent = `${found.date || ''} • ${found.fileSize || ''}`;
    const tools = (found.tools||[]).map(t=> `<span class="toolkit-item small">${t}</span>`).join(' ');
    let videosHtml = '';
    try{
        if(found.videos){
            if(found.videos.before && found.videos.before.mp4) videosHtml += `<div class="project-video"><h4>Before</h4><video controls src="${found.videos.before.mp4}" style="width:100%;max-height:220px;border-radius:6px"></video></div>`;
            if(found.videos.after && found.videos.after.mp4) videosHtml += `<div class="project-video"><h4>After</h4><video controls src="${found.videos.after.mp4}" style="width:100%;max-height:220px;border-radius:6px"></video></div>`;
        }
    }catch(e){ videosHtml=''; }
    content.innerHTML = `
        <div class="project-case">
            <img src="${found.poster}" alt="${found.title} poster" style="max-width:100%;border-radius:6px;margin-bottom:8px;" />
            <p>${found.description || ''}</p>
            <p><strong>Tools:</strong> ${tools}</p>
            <p><strong>File size:</strong> ${found.fileSize || '—'}</p>
            ${videosHtml}
        </div>
    `;
    caseView.style.display = 'block'; caseView.scrollTop = 0;
    return {ok:true, msg:`Aperto progetto ${found.title}`};
}

export function undoCursor(){
    if(!_lastCursor) return {ok:false, msg:'Nessun cursore precedente'};
    const prev = _lastCursor; _lastCursor = null;
    // reuse setGameCursor logic by directly setting canvases
    const pacmanCanvas = document.getElementById('pacman-cursor-canvas');
    const asteroidsCanvas = document.getElementById('asteroids-cursor-canvas');
    if(prev === 'pacman'){ if(pacmanCanvas) pacmanCanvas.style.display='block'; if(asteroidsCanvas) asteroidsCanvas.style.display='none'; }
    else if(prev === 'asteroids'){ if(pacmanCanvas) pacmanCanvas.style.display='none'; if(asteroidsCanvas) asteroidsCanvas.style.display='block'; }
    else { if(pacmanCanvas) pacmanCanvas.style.display='none'; if(asteroidsCanvas) asteroidsCanvas.style.display='none'; }
    _auditLog.push({action:'undoCursor', at: Date.now(), prev});
    return {ok:true, msg:`Cursore ripristinato a ${prev}`};
}

// Naviga verso una sezione della pagina (#hero, #projects, #about, #contact)
export function navigateTo(section){
    if(!section) return {ok:false, msg:'Sezione non specificata'};
    const el = document.querySelector(section.startsWith('#')? section : `#${section}`);
    if(!el) return {ok:false, msg:'Sezione non trovata'};
    el.scrollIntoView({behavior:'smooth'});
    return {ok:true, msg:`Navigato a ${section}`};
}

// Riproduci audio di sistema (es. coin, transition) se presente
export function playSound(name){
    try{
        const id = {
            coin: 'coin-audio',
            transition: 'transition-audio',
            hover: 'preloader-hover-sound',
            notify: 'preloader-click-sound'
        }[name];
        if(!id) return {ok:false, msg:'Suono non riconosciuto'};
        const a = document.getElementById(id);
        if(!a) return {ok:false, msg:'Audio non trovato'};
        a.currentTime = 0; a.play();
        return {ok:true, msg:`Riprodotto ${name}`};
    }catch(err){ return {ok:false, msg:'Errore riproduzione audio'} }
}

export async function searchProjectsByTechnology(technology) {
    const projects = await getProjects();
    if (!projects || projects.length === 0) {
        return { ok: false, msg: 'Dati progetto non disponibili.' };
    }

    const lowerTech = technology.toLowerCase();
    const foundProjects = projects.filter(p => {
        const inTools = p.tools && p.tools.some(t => t.toLowerCase().includes(lowerTech));
        const inDescription = p.description && p.description.toLowerCase().includes(lowerTech);
        return inTools || inDescription;
    });

    if (foundProjects.length === 0) {
        return { ok: false, msg: `Nessun progetto trovato che menziona ${technology}.` };
    }

    const message = foundProjects.length > 1 
        ? `Ho trovato ${foundProjects.length} progetti correlati a ${technology}. Quale ti interessa?`
        : `Ho trovato questo progetto correlato a ${technology}:`;

    return { 
        ok: true, 
        msg: message,
        options: {
            html: true,
            quickReplies: foundProjects.map(p => ({
                label: p.title,
                action: 'open-project',
                payload: p.id
            }))
        }
    };
}

export function suggestNextAction() {
    const suggestions = [
        { label: 'Apri "Biosphaera"', action: 'open-project', payload: 'biosphaera' },
        { label: 'Cambia cursore', action: 'set-cursor', payload: 'pacman' },
        { label: 'Cerca progetti in WebGL', action: 'search-projects', payload: 'webgl' },
        { label: 'Vai alla sezione contatti', action: 'navigate', payload: 'contact' }
    ];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    return {
        ok: true,
        msg: 'Che ne dici di provare uno di questi?',
        options: {
            quickReplies: [randomSuggestion]
        }
    };
}

// Esporre un helper per loggare azioni (per debugging e audit)
export function logAction(action, payload){
    console.log('[siteAction]', action, payload||'');
    // in futuro potremmo inviare a telemetry
}

// === NUOVE FUNZIONI AVANZATE ===

// Analizza il codice del progetto
export function analyzeCode() {
    try {
        const scripts = document.querySelectorAll('script[src]');
        const totalScripts = scripts.length;
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        const totalCSS = cssLinks.length;

        // Analizza elementi interattivi
        const buttons = document.querySelectorAll('button').length;
        const links = document.querySelectorAll('a').length;
        const images = document.querySelectorAll('img').length;

        const analysis = {
            scripts: totalScripts,
            stylesheets: totalCSS,
            buttons,
            links,
            images,
            totalElements: document.querySelectorAll('*').length
        };

        return {
            ok: true,
            msg: `Analisi completata: ${totalScripts} script, ${totalCSS} CSS, ${buttons} pulsanti, ${links} link, ${images} immagini. Totale elementi: ${analysis.totalElements}`,
            data: analysis
        };
    } catch (error) {
        return { ok: false, msg: 'Errore durante l\'analisi del codice.' };
    }
}

// Simula controllo git status (mock per demo)
export function gitStatus() {
    // In un'implementazione reale, questo chiamerebbe un'API git
    const mockStatus = {
        branch: 'main',
        commits: 42,
        lastCommit: '2025-10-28',
        status: 'clean',
        files: ['index.html', 'assets/js/main.js', 'assets/css/style.css']
    };

    return {
        ok: true,
        msg: `Repository su branch '${mockStatus.branch}', ${mockStatus.commits} commit, ultimo: ${mockStatus.lastCommit}. Status: ${mockStatus.status}`,
        data: mockStatus
    };
}

// Ottieni informazioni meteo (mock)
// Servizio per integrazioni esterne
class ExternalServiceManager {
    constructor() {
        this.weatherApiKey = null; // In produzione, configurare con chiave API
        this.newsApiKey = null;
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minuti
    }

    setWeatherApiKey(key) {
        this.weatherApiKey = key;
    }

    setNewsApiKey(key) {
        this.newsApiKey = key;
    }

    async getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    async fetchWeather(location) {
        const cacheKey = `weather_${location}`;
        const cached = await this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // Usa OpenWeatherMap API (gratuita con limiti)
            const apiKey = this.weatherApiKey || 'demo_key'; // In produzione usare chiave reale
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=it`
            );

            if (!response.ok) {
                throw new Error(`API response: ${response.status}`);
            }

            const data = await response.json();
            const weatherData = {
                location: `${data.name}, ${data.sys.country}`,
                temperature: Math.round(data.main.temp),
                condition: this.translateWeatherCondition(data.weather[0].main, data.weather[0].description),
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
                icon: data.weather[0].icon,
                feelsLike: Math.round(data.main.feels_like)
            };

            this.setCachedData(cacheKey, weatherData);
            return weatherData;
        } catch (error) {
            console.warn('[ExternalService] Weather API failed:', error);
            // Fallback ai dati mock
            return {
                location: location,
                temperature: 22,
                condition: 'soleggiato',
                humidity: 65,
                windSpeed: 12,
                fallback: true
            };
        }
    }

    translateWeatherCondition(main, description) {
        const translations = {
            'Clear': 'soleggiato',
            'Clouds': 'nuvoloso',
            'Rain': 'piovoso',
            'Drizzle': 'pioggerellina',
            'Thunderstorm': 'temporale',
            'Snow': 'nevoso',
            'Mist': 'nebbioso',
            'Fog': 'nebbia'
        };
        return translations[main] || description.toLowerCase();
    }

    async getGeneralKnowledge(query) {
        const cacheKey = `knowledge_${query}`;
        const cached = await this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // Usa Wikipedia API per conoscenza generale
            const response = await fetch(
                `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
            );

            if (response.ok) {
                const data = await response.json();
                const knowledge = {
                    title: data.title,
                    summary: data.extract,
                    url: data.content_urls?.desktop?.page || `https://it.wikipedia.org/wiki/${encodeURIComponent(query)}`,
                    source: 'Wikipedia'
                };

                this.setCachedData(cacheKey, knowledge);
                return knowledge;
            }
        } catch (error) {
            console.warn('[ExternalService] Knowledge API failed:', error);
        }

        return null;
    }

    async getNewsHeadlines(category = 'technology', limit = 3) {
        const cacheKey = `news_${category}_${limit}`;
        const cached = await this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            // Usa NewsAPI (richiede chiave API)
            const apiKey = this.newsApiKey || 'demo_key';
            const response = await fetch(
                `https://newsapi.org/v2/top-headlines?category=${category}&language=it&apiKey=${apiKey}&pageSize=${limit}`
            );

            if (response.ok) {
                const data = await response.json();
                const headlines = data.articles.map(article => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    source: article.source.name,
                    publishedAt: new Date(article.publishedAt).toLocaleDateString('it-IT')
                }));

                this.setCachedData(cacheKey, headlines);
                return headlines;
            }
        } catch (error) {
            console.warn('[ExternalService] News API failed:', error);
        }

        return null;
    }

    async previewMultimedia(url) {
        try {
            // Analizza URL per determinare il tipo di contenuto
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return await this.previewYouTube(url);
            } else if (url.includes('github.com')) {
                return await this.previewGitHub(url);
            } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
                return { type: 'image', url, title: 'Immagine' };
            } else if (/\.(mp4|webm|ogg)$/i.test(url)) {
                return { type: 'video', url, title: 'Video' };
            }

            // Fallback: prova a ottenere metadati della pagina
            return await this.previewWebpage(url);
        } catch (error) {
            console.warn('[ExternalService] Multimedia preview failed:', error);
            return { type: 'link', url, title: url, error: true };
        }
    }

    async previewYouTube(url) {
        // Estrai ID video da URL YouTube
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (!videoId) return { type: 'link', url, title: 'Video YouTube' };

        try {
            // Usa YouTube Data API v3 (richiede chiave API)
            const apiKey = 'demo_key'; // In produzione usare chiave reale
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items[0]) {
                    const video = data.items[0].snippet;
                    return {
                        type: 'youtube',
                        videoId,
                        title: video.title,
                        description: video.description.substring(0, 150) + '...',
                        thumbnail: video.thumbnails.medium.url,
                        channel: video.channelTitle,
                        url
                    };
                }
            }
        } catch (error) {
            console.warn('[ExternalService] YouTube API failed:', error);
        }

        return {
            type: 'youtube',
            videoId,
            title: 'Video YouTube',
            url
        };
    }

    async previewGitHub(url) {
        // Estrai owner/repo da URL GitHub
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return { type: 'link', url, title: 'Repository GitHub' };

        const [, owner, repo] = match;

        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

            if (response.ok) {
                const data = await response.json();
                return {
                    type: 'github',
                    owner,
                    repo,
                    title: data.name,
                    description: data.description,
                    stars: data.stargazers_count,
                    language: data.language,
                    url: data.html_url
                };
            }
        } catch (error) {
            console.warn('[ExternalService] GitHub API failed:', error);
        }

        return {
            type: 'github',
            owner,
            repo,
            title: `${owner}/${repo}`,
            url
        };
    }

    async previewWebpage(url) {
        try {
            // Nota: In un ambiente browser reale, questo potrebbe violare CORS
            // In produzione, usare un proxy server o servizio dedicato
            const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    type: 'webpage',
                    title: data.title || 'Pagina Web',
                    description: data.description,
                    image: data.image,
                    url
                };
            }
        } catch (error) {
            console.warn('[ExternalService] Webpage preview failed:', error);
        }

        return { type: 'link', url, title: url };
    }
}

// Istanza globale del servizio esterno
const externalService = new ExternalServiceManager();

export function getWeather(location = 'Milano') {
    return externalService.fetchWeather(location).then(weatherData => ({
        ok: true,
        msg: `Meteo a ${weatherData.location}: ${weatherData.temperature}°C, ${weatherData.condition}${weatherData.fallback ? ' (dati simulati)' : ''}, umidità ${weatherData.humidity}%, vento ${weatherData.windSpeed} km/h${weatherData.feelsLike ? `, sensazione di ${weatherData.feelsLike}°C` : ''}`,
        data: weatherData
    })).catch(error => ({
        ok: false,
        msg: 'Errore nel recupero dei dati meteo. Riprova più tardi.',
        error: error.message
    }));
}

export async function getGeneralKnowledge(query) {
    const knowledge = await externalService.getGeneralKnowledge(query);
    if (knowledge) {
        return {
            ok: true,
            msg: `📚 ${knowledge.title}: ${knowledge.summary.substring(0, 200)}... [Fonte: ${knowledge.source}]`,
            data: knowledge
        };
    }
    return {
        ok: false,
        msg: 'Non ho trovato informazioni su questo argomento. Prova con parole chiave diverse.'
    };
}

export async function getNewsHeadlines(category = 'technology') {
    const headlines = await externalService.getNewsHeadlines(category);
    if (headlines && headlines.length > 0) {
        let msg = `📰 Ultime notizie su ${category}:\n`;
        headlines.forEach((news, index) => {
            msg += `${index + 1}. ${news.title}\n`;
        });
        return {
            ok: true,
            msg: msg,
            data: headlines
        };
    }
    return {
        ok: false,
        msg: 'Non riesco a recuperare le notizie al momento.'
    };
}

export async function previewMultimedia(url) {
    const preview = await externalService.previewMultimedia(url);
    
    let msg = '';
    switch (preview.type) {
        case 'youtube':
            msg = `🎥 Video YouTube: "${preview.title}"${preview.channel ? ` di ${preview.channel}` : ''}`;
            break;
        case 'github':
            msg = `📁 Repository GitHub: ${preview.title}${preview.description ? ` - ${preview.description.substring(0, 100)}...` : ''}${preview.stars ? ` ⭐ ${preview.stars} stelle` : ''}`;
            break;
        case 'image':
            msg = `🖼️ Immagine: ${preview.title}`;
            break;
        case 'video':
            msg = `🎬 Video: ${preview.title}`;
            break;
        default:
            msg = `🔗 Link: ${preview.title}`;
    }
    
    return {
        ok: true,
        msg: msg,
        data: preview
    };
}

// Funzione per configurare le chiavi API (da chiamare dall'esterno se necessario)
export function configureExternalServices(config) {
    if (config.weatherApiKey) {
        externalService.setWeatherApiKey(config.weatherApiKey);
    }
    if (config.newsApiKey) {
        externalService.setNewsApiKey(config.newsApiKey);
    }
}

// Ottieni informazioni di sistema
export function systemInfo() {
    const info = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        memory: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        } : 'N/A'
    };

    return {
        ok: true,
        msg: `Sistema: ${info.platform}, Risoluzione: ${info.screenResolution}, Memoria: ${info.memory.used || 'N/A'}MB usati`,
        data: info
    };
}

// Impara preferenze utente
export function learnPreference(preference) {
    // Salva la preferenza nel cervello di Glitchy
    if (window.glitchyBrain) {
        window.glitchyBrain.learnPreference('user_preference', preference);
    }

    return {
        ok: true,
        msg: `Ho imparato la tua preferenza: ${preference}. La ricorderò per il futuro!`
    };
}

// Mostra snippet di codice
export function codeSnippet(topic) {
    const snippets = {
        'javascript': '```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```',
        'html': '```html\n<div class="container">\n  <h1>Hello World</h1>\n</div>\n```',
        'css': '```css\n.container {\n  display: flex;\n  justify-content: center;\n}\n```',
        'react': '```jsx\nfunction App() {\n  return <h1>Hello React!</h1>;\n}\n```',
        'webgl': '```javascript\nconst canvas = document.getElementById(\'gl-canvas\');\nconst gl = canvas.getContext(\'webgl\');\n```'
    };

    const snippet = snippets[topic.toLowerCase()] || snippets['javascript'];

    return {
        ok: true,
        msg: `Ecco un esempio di ${topic}:\n${snippet}`,
        options: {
            html: true
        }
    };
}

// Calcolatrice semplice
export function calculate(expression) {
    try {
        // Rimuovi caratteri pericolosi e valuta l'espressione
        const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = eval(safeExpression);

        if (isNaN(result) || !isFinite(result)) {
            return { ok: false, msg: 'Espressione matematica non valida.' };
        }

        return {
            ok: true,
            msg: `${expression} = ${result}`
        };
    } catch (error) {
        return { ok: false, msg: 'Errore nel calcolo. Prova con un\'espressione più semplice.' };
    }
}

// Default export con tutte le funzioni per comodità
export default { setGameCursor, openProjectCase, navigateTo, playSound, logAction, searchProjectsByTechnology, suggestNextAction, getCurrentCursor, setTheme, setAccessibility, analyzeCode, gitStatus, getWeather, systemInfo, learnPreference, codeSnippet, calculate };
