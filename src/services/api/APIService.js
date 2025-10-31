// APIService.js - Handles all external API calls
export class APIService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }

    async getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key); // Remove expired
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
            // Use serverless proxy
            const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            const data = await response.json();
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch weather: ${error.message}`);
        }
    }

    async getGeneralKnowledge(query) {
        const cacheKey = `knowledge_${query}`;
        const cached = await this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(
                `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
            );
            if (response.ok) {
                const data = await response.json();
                this.setCachedData(cacheKey, data);
                return data;
            }
            throw new Error('Knowledge not found');
        } catch (error) {
            throw new Error(`Failed to fetch knowledge: ${error.message}`);
        }
    }

    async getNewsHeadlines(category = 'technology', limit = 3) {
        const cacheKey = `news_${category}_${limit}`;
        const cached = await this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`/api/news?category=${category}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`News API error: ${response.status}`);
            }
            const data = await response.json();
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch news: ${error.message}`);
        }
    }

    async previewMultimedia(url) {
        try {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return await this.previewYouTube(url);
            } else if (url.includes('github.com')) {
                return await this.previewGitHub(url);
            } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
                return { type: 'image', url, title: 'Immagine' };
            } else if (/\.(mp4|webm|ogg)$/i.test(url)) {
                return { type: 'video', url, title: 'Video' };
            }
            // Use serverless proxy for webpage preview
            const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
            if (response.ok) {
                return await response.json();
            }
            return { type: 'link', url, title: url };
        } catch (error) {
            return { type: 'link', url, title: url, error: true };
        }
    }

    async previewYouTube(url) {
        const cacheKey = `youtube_${url}`;
        const cached = await this.getCachedData(cacheKey);
        if (cached) return cached;

        const videoId = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (!videoId) return { type: 'link', url, title: 'Video YouTube non valido' };

        try {
            const response = await fetch(`/api/youtube?videoId=${videoId}`);
            if (response.ok) {
                const data = await response.json();
                this.setCachedData(cacheKey, data);
                return data;
            }
            return { type: 'youtube', videoId, title: 'Video YouTube', url, fallback: true };
        } catch (error) {
            return { type: 'youtube', videoId, title: 'Video YouTube', url, fallback: true };
        }
    }

    async previewGitHub(url) {
        const cacheKey = `github_${url}`;
        const cached = await this.getCachedData(cacheKey);
        if (cached) return cached;

        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return { type: 'link', url, title: 'Repository GitHub non valido' };

        const [, owner, repo] = match;

        try {
            const response = await fetch(`/api/github?owner=${owner}&repo=${repo}`);
            if (response.ok) {
                const data = await response.json();
                this.setCachedData(cacheKey, data);
                return data;
            }
            return { type: 'github', owner, repo, title: `${owner}/${repo}`, url, fallback: true };
        } catch (error) {
            return { type: 'github', owner, repo, title: `${owner}/${repo}`, url, fallback: true };
        }
    }
}