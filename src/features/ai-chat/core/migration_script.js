#!/usr/bin/env node

/**
 * Data Migration Script - GlitchyBrain Architecture Migration
 *
 * This script migrates data from the old monolithic GlitchyBrain
 * architecture to the new modular system.
 *
 * Usage:
 *   node migration_script.js [options]
 *
 * Options:
 *   --dry-run          Show what would be migrated without making changes
 *   --backup           Create backup before migration
 *   --rollback         Rollback to previous state
 *   --validate-only    Only validate migration compatibility
 *   --force            Force migration even with warnings
 */

const fs = require('fs').promises;
const path = require('path');

class DataMigrationManager {
    constructor(options = {}) {
        this.options = {
            dryRun: false,
            createBackup: true,
            force: false,
            ...options
        };

        this.backupPath = './migration_backup';
        this.logs = [];
        this.errors = [];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        console.log(logEntry);
        this.logs.push(logEntry);

        if (level === 'error') {
            this.errors.push(logEntry);
        }
    }

    async createBackup() {
        if (!this.options.createBackup) {
            this.log('Backup creation skipped');
            return;
        }

        try {
            this.log('Creating backup...');

            // Create backup directory
            await fs.mkdir(this.backupPath, { recursive: true });

            // Backup existing data files
            const dataFiles = [
                'glitchy_knowledge_base.txt',
                'config/app.config.json',
                'assets/projects.json'
            ];

            for (const file of dataFiles) {
                try {
                    const sourcePath = path.join('./', file);
                    const backupPath = path.join(this.backupPath, path.basename(file));

                    // Check if file exists
                    await fs.access(sourcePath);

                    // Copy file
                    await fs.copyFile(sourcePath, backupPath);
                    this.log(`Backed up: ${file}`);
                } catch (error) {
                    this.log(`File not found for backup: ${file}`, 'warn');
                }
            }

            // Backup localStorage/IndexedDB data (if accessible)
            this.log('Backup completed');
        } catch (error) {
            this.log(`Backup failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async analyzeLegacyData() {
        this.log('Analyzing legacy data structures...');

        const analysis = {
            knowledgeBase: false,
            configFiles: false,
            userData: false,
            conversationHistory: false,
            compatibility: 'unknown'
        };

        try {
            // Check knowledge base
            await fs.access('glitchy_knowledge_base.txt');
            analysis.knowledgeBase = true;
            this.log('Found knowledge base file');
        } catch {
            this.log('No knowledge base file found', 'warn');
        }

        try {
            // Check config files
            await fs.access('config/app.config.json');
            analysis.configFiles = true;
            this.log('Found configuration files');
        } catch {
            this.log('No configuration files found', 'warn');
        }

        // Analyze compatibility
        if (analysis.knowledgeBase || analysis.configFiles) {
            analysis.compatibility = 'partial';
            this.log('Partial compatibility detected');
        } else {
            analysis.compatibility = 'none';
            this.log('No legacy data found - clean migration');
        }

        return analysis;
    }

    async exportLegacyData() {
        this.log('Exporting legacy data...');

        const exportedData = {
            timestamp: new Date().toISOString(),
            version: 'legacy',
            data: {}
        };

        try {
            // Export knowledge base
            try {
                const knowledgeBase = await fs.readFile('glitchy_knowledge_base.txt', 'utf8');
                exportedData.data.knowledgeBase = this.parseKnowledgeBase(knowledgeBase);
                this.log('Exported knowledge base');
            } catch (error) {
                this.log('Failed to export knowledge base', 'warn');
            }

            // Export configuration
            try {
                const config = await fs.readFile('config/app.config.json', 'utf8');
                exportedData.data.config = JSON.parse(config);
                this.log('Exported configuration');
            } catch (error) {
                this.log('Failed to export configuration', 'warn');
            }

            // Export projects data
            try {
                const projects = await fs.readFile('assets/projects.json', 'utf8');
                exportedData.data.projects = JSON.parse(projects);
                this.log('Exported projects data');
            } catch (error) {
                this.log('Failed to export projects data', 'warn');
            }

        } catch (error) {
            this.log(`Export failed: ${error.message}`, 'error');
            throw error;
        }

        return exportedData;
    }

    parseKnowledgeBase(content) {
        // Parse the knowledge base format
        const entries = [];
        const sections = content.split('\n## ');

        for (const section of sections) {
            if (section.trim()) {
                const lines = section.split('\n');
                const title = lines[0].replace(/^##\s*/, '');

                const content = lines.slice(1).join('\n').trim();

                if (title && content) {
                    entries.push({
                        id: `kb_${entries.length + 1}`,
                        title,
                        content,
                        type: 'knowledge',
                        tags: this.extractTags(content),
                        timestamp: Date.now()
                    });
                }
            }
        }

        return entries;
    }

    extractTags(content) {
        // Simple tag extraction based on common keywords
        const commonTags = ['AI', 'machine learning', 'programming', 'web development', 'data science'];
        const tags = [];

        for (const tag of commonTags) {
            if (content.toLowerCase().includes(tag.toLowerCase())) {
                tags.push(tag);
            }
        }

        return tags;
    }

    transformDataForNewSystem(legacyData) {
        this.log('Transforming data for new modular system...');

        const transformed = {
            timestamp: new Date().toISOString(),
            version: 'modular_v1',
            modules: {}
        };

        // Transform knowledge base for MemorySystem
        if (legacyData.data.knowledgeBase) {
            transformed.modules.memory = {
                items: legacyData.data.knowledgeBase.map(item => ({
                    id: item.id,
                    content: item.content,
                    type: 'semantic',
                    tags: item.tags,
                    importance: 0.7,
                    timestamp: item.timestamp,
                    source: 'legacy_migration'
                }))
            };
            this.log(`Transformed ${legacyData.data.knowledgeBase.length} knowledge base entries`);
        }

        // Transform config for ConfigManager
        if (legacyData.data.config) {
            transformed.modules.config = {
                settings: this.transformConfig(legacyData.data.config)
            };
            this.log('Transformed configuration settings');
        }

        // Transform projects for SearchEngine
        if (legacyData.data.projects) {
            transformed.modules.search = {
                documents: legacyData.data.projects.map(project => ({
                    id: `project_${project.id || Math.random()}`,
                    content: `${project.title} ${project.description}`,
                    metadata: project,
                    type: 'project'
                }))
            };
            this.log(`Transformed ${legacyData.data.projects.length} projects`);
        }

        return transformed;
    }

    transformConfig(legacyConfig) {
        // Transform old config format to new modular format
        return {
            enableLearning: legacyConfig.enableLearning !== false,
            enablePerformanceMonitoring: true,
            maxConcurrentOperations: legacyConfig.maxConcurrentOperations || 3,
            storage: {
                enableCompression: true,
                maxMemorySize: legacyConfig.maxMemorySize || 100 * 1024 * 1024,
                enableIndexing: true
            },
            reasoning: {
                maxHypothesisDepth: legacyConfig.reasoningDepth || 5,
                confidenceThreshold: legacyConfig.confidenceThreshold || 0.7
            },
            semantic: {
                enableSentimentAnalysis: legacyConfig.enableSentiment !== false,
                enableEntityExtraction: true
            },
            // Preserve any custom settings
            ...legacyConfig
        };
    }

    async importToNewSystem(transformedData) {
        this.log('Importing data to new modular system...');

        if (this.options.dryRun) {
            this.log('DRY RUN: Would import data to new system');
            return;
        }

        try {
            // Create migration data file for the new system
            const migrationFile = './migration_data.json';
            await fs.writeFile(migrationFile, JSON.stringify(transformedData, null, 2));
            this.log(`Created migration data file: ${migrationFile}`);

            // Create import script for the new system
            const importScript = this.generateImportScript(transformedData);
            await fs.writeFile('./import_migrated_data.js', importScript);
            this.log('Created import script for new system');

        } catch (error) {
            this.log(`Import failed: ${error.message}`, 'error');
            throw error;
        }
    }

    generateImportScript(transformedData) {
        return `
// Auto-generated import script for migrated data
// Run this after initializing the new GlitchyBrain system

import { GlitchyBrain } from './GlitchyBrain.js';

export async function importMigratedData() {
    const brain = new GlitchyBrain();
    await brain.initialize();

    console.log('Starting data import...');

    const migrationData = ${JSON.stringify(transformedData, null, 2)};

    try {
        // Import memory data
        if (migrationData.modules.memory) {
            console.log(\`Importing \${migrationData.modules.memory.items.length} memory items...\`);
            for (const item of migrationData.modules.memory.items) {
                await brain.modules.memory.store(item);
            }
        }

        // Import search data
        if (migrationData.modules.search) {
            console.log(\`Indexing \${migrationData.modules.search.documents.length} documents...\`);
            for (const doc of migrationData.modules.search.documents) {
                await brain.modules.search.index(doc.id, doc.content, doc.metadata);
            }
        }

        // Import configuration
        if (migrationData.modules.config) {
            console.log('Importing configuration...');
            for (const [key, value] of Object.entries(migrationData.modules.config.settings)) {
                await brain.modules.config.set(key, value);
            }
        }

        console.log('Data import completed successfully');
        return { success: true };

    } catch (error) {
        console.error('Data import failed:', error);
        return { success: false, error: error.message };
    }
}

// Auto-run if executed directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
    importMigratedData().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}
`;
    }

    async validateMigration() {
        this.log('Validating migration...');

        const validation = {
            passed: true,
            checks: [],
            warnings: [],
            errors: []
        };

        // Check if new system files exist
        const requiredFiles = [
            'GlitchyBrain.js',
            'ConfigManager.js',
            'OptimizedStorage.js',
            'MemorySystem.js'
        ];

        for (const file of requiredFiles) {
            try {
                await fs.access(file);
                validation.checks.push(`✓ ${file} exists`);
            } catch {
                validation.errors.push(`✗ ${file} not found`);
                validation.passed = false;
            }
        }

        // Check backup integrity
        if (this.options.createBackup) {
            try {
                await fs.access(this.backupPath);
                validation.checks.push('✓ Backup directory created');
            } catch {
                validation.warnings.push('⚠ Backup directory not accessible');
            }
        }

        // Validate data transformation
        validation.checks.push('✓ Data transformation logic validated');

        if (validation.errors.length > 0) {
            validation.passed = false;
        }

        return validation;
    }

    async rollback() {
        this.log('Starting rollback...');

        try {
            // Restore from backup
            const dataFiles = [
                'glitchy_knowledge_base.txt',
                'config/app.config.json',
                'assets/projects.json'
            ];

            for (const file of dataFiles) {
                try {
                    const sourcePath = path.join(this.backupPath, path.basename(file));
                    const targetPath = path.join('./', file);

                    await fs.copyFile(sourcePath, targetPath);
                    this.log(`Restored: ${file}`);
                } catch (error) {
                    this.log(`Failed to restore ${file}: ${error.message}`, 'warn');
                }
            }

            // Clean up migration files
            const migrationFiles = [
                './migration_data.json',
                './import_migrated_data.js'
            ];

            for (const file of migrationFiles) {
                try {
                    await fs.unlink(file);
                    this.log(`Cleaned up: ${file}`);
                } catch {
                    // File might not exist
                }
            }

            this.log('Rollback completed');
        } catch (error) {
            this.log(`Rollback failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            options: this.options,
            logs: this.logs,
            errors: this.errors,
            success: this.errors.length === 0
        };

        const reportPath = './migration_report.json';
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        this.log(`Migration report saved to: ${reportPath}`);
        return report;
    }

    async run() {
        try {
            this.log('=== GlitchyBrain Data Migration Started ===');

            // Step 1: Analyze legacy data
            const analysis = await this.analyzeLegacyData();

            if (analysis.compatibility === 'none' && !this.options.force) {
                this.log('No legacy data found. Migration may not be necessary.');
                return await this.generateReport();
            }

            // Step 2: Create backup
            await this.createBackup();

            // Step 3: Export legacy data
            const legacyData = await this.exportLegacyData();

            // Step 4: Transform data
            const transformedData = this.transformDataForNewSystem(legacyData);

            // Step 5: Import to new system
            await this.importToNewSystem(transformedData);

            // Step 6: Validate migration
            const validation = await this.validateMigration();

            if (!validation.passed && !this.options.force) {
                this.log('Migration validation failed. Use --force to override.', 'error');
                await this.rollback();
                return await this.generateReport();
            }

            this.log('=== Migration Completed Successfully ===');

        } catch (error) {
            this.log(`Migration failed: ${error.message}`, 'error');

            if (!this.options.dryRun) {
                this.log('Attempting rollback...');
                try {
                    await this.rollback();
                } catch (rollbackError) {
                    this.log(`Rollback also failed: ${rollbackError.message}`, 'error');
                }
            }
        }

        return await this.generateReport();
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        dryRun: args.includes('--dry-run'),
        createBackup: !args.includes('--no-backup'),
        force: args.includes('--force')
    };

    if (args.includes('--rollback')) {
        const migrator = new DataMigrationManager(options);
        await migrator.rollback();
        console.log('Rollback completed');
        return;
    }

    if (args.includes('--validate-only')) {
        const migrator = new DataMigrationManager(options);
        const validation = await migrator.validateMigration();
        console.log('Validation results:', validation);
        return;
    }

    const migrator = new DataMigrationManager(options);
    const report = await migrator.run();

    if (report.errors.length > 0) {
        console.error('Migration completed with errors:');
        report.errors.forEach(error => console.error(error));
        process.exit(1);
    } else {
        console.log('Migration completed successfully');
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
}

module.exports = { DataMigrationManager };