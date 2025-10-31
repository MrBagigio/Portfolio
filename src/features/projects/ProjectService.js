// ProjectService.js - Handles project loading, caching, and searching
export class ProjectService {
    constructor(apiService) {
        this.apiService = apiService;
        this.cachedProjects = null;
    }

    async getProjects() {
        if (this.cachedProjects) return this.cachedProjects;
        try {
            const res = await fetch('assets/projects.json');
            if (!res.ok) throw new Error(`Failed to load projects: ${res.statusText}`);
            const data = await res.json();
            this.cachedProjects = data;
            return data;
        } catch (err) {
            throw new Error(`Project loading error: ${err.message}`);
        }
    }

    findProject(projects, query) {
        if (!query) return null;
        const key = query.toString().toLowerCase();

        // Exact match by id or title
        let found = projects.find(p => p.id.toLowerCase() === key || p.title.toLowerCase() === key);
        if (found) return found;

        // Contains match
        found = projects.find(p => p.id.toLowerCase().includes(key) || p.title.toLowerCase().includes(key));
        if (found) return found;

        // Split and match any word
        const parts = key.split(/[-_\s]+/).filter(Boolean);
        found = projects.find(p => {
            const combined = (p.title + ' ' + p.id).toLowerCase();
            return parts.every(part => combined.includes(part));
        });
        return found || null;
    }

    async searchProjectsByTechnology(technology) {
        const projects = await this.getProjects();
        if (!projects || projects.length === 0) {
            throw new Error('No project data available');
        }

        const lowerTech = technology.toLowerCase();
        const foundProjects = projects.filter(p => {
            const inTools = p.tools && p.tools.some(t => t.toLowerCase().includes(lowerTech));
            const inDescription = p.description && p.description.toLowerCase().includes(lowerTech);
            return inTools || inDescription;
        });

        return foundProjects;
    }
}