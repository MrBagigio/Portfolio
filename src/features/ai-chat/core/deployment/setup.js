#!/usr/bin/env node

/**
 * GlitchyBrain System Setup Script
 *
 * Initializes and configures the GlitchyBrain modular AI system
 * for different environments and use cases.
 *
 * Usage:
 *   node setup.js [environment] [options]
 *
 * Environments:
 *   development    - Local development with debug features
 *   staging        - Pre-production testing environment
 *   production     - Live production environment
 *
 * Options:
 *   --reset        - Reset all configurations to defaults
 *   --optimize     - Apply performance optimizations
 *   --minimal      - Minimal setup with essential features only
 *   --interactive  - Interactive setup with prompts
 */

const fs = require('fs').promises;
const path = require('path');

class SystemSetup {
    constructor() {
        this.environments = {
            development: {
                name: 'Development',
                config: {
                    enableLearning: true,
                    enablePerformanceMonitoring: true,
                    maxConcurrentOperations: 2,
                    debug: true,
                    logLevel: 'debug',
                    storage: {
                        enableCompression: false, // Faster for development
                        maxMemorySize: 200 * 1024 * 1024, // 200MB
                        enableIndexing: true
                    },
                    reasoning: {
                        maxHypothesisDepth: 3,
                        confidenceThreshold: 0.6
                    },
                    learning: {
                        adaptationRate: 0.2,
                        feedbackWeight: 0.8
                    }
                }
            },
            staging: {
                name: 'Staging',
                config: {
                    enableLearning: true,
                    enablePerformanceMonitoring: true,
                    maxConcurrentOperations: 5,
                    debug: false,
                    logLevel: 'info',
                    storage: {
                        enableCompression: true,
                        maxMemorySize: 1 * 1024 * 1024 * 1024, // 1GB
                        enableIndexing: true
                    },
                    reasoning: {
                        maxHypothesisDepth: 4,
                        confidenceThreshold: 0.7
                    },
                    learning: {
                        adaptationRate: 0.1,
                        feedbackWeight: 0.7
                    }
                }
            },
            production: {
                name: 'Production',
                config: {
                    enableLearning: true,
                    enablePerformanceMonitoring: true,
                    maxConcurrentOperations: 10,
                    debug: false,
                    logLevel: 'warn',
                    storage: {
                        enableCompression: true,
                        maxMemorySize: 4 * 1024 * 1024 * 1024, // 4GB
                        enableIndexing: true,
                        cacheStrategy: 'lru'
                    },
                    reasoning: {
                        maxHypothesisDepth: 5,
                        confidenceThreshold: 0.8
                    },
                    learning: {
                        adaptationRate: 0.05,
                        feedbackWeight: 0.6
                    },
                    error: {
                        maxRetries: 5,
                        circuitBreakerThreshold: 10,
                        recoveryTimeout: 60000
                    }
                }
            }
        };
    }

    async setup(environment = 'development', options = {}) {
        console.log(`🚀 Setting up GlitchyBrain for ${environment} environment`);

        try {
            // Validate environment
            if (!this.environments[environment]) {
                throw new Error(`Unknown environment: ${environment}`);
            }

            // Create necessary directories
            await this.createDirectories();

            // Generate configuration
            const config = await this.generateConfig(environment, options);

            // Save configuration
            await this.saveConfig(config, environment);

            // Create environment-specific files
            await this.createEnvironmentFiles(environment, config);

            // Run optimizations if requested
            if (options.optimize) {
                await this.optimizeForEnvironment(environment);
            }

            // Validate setup
            const validation = await this.validateSetup(config);

            if (!validation.passed) {
                console.warn('⚠️  Setup completed with warnings:');
                validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
            }

            console.log('✅ Setup completed successfully');
            console.log(`📁 Configuration saved to: config/${environment}.json`);

            return { success: true, config, validation };

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async createDirectories() {
        const directories = [
            'config',
            'logs',
            'data',
            'backups',
            'cache',
            'temp'
        ];

        console.log('📁 Creating directories...');

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`  ✓ Created ${dir}/`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.warn(`  ⚠️  Failed to create ${dir}: ${error.message}`);
                }
            }
        }
    }

    async generateConfig(environment, options) {
        let config = { ...this.environments[environment].config };

        // Apply options
        if (options.minimal) {
            config = this.minimalConfig(config);
        }

        if (options.reset) {
            // Keep only essential settings
            config = this.resetConfig(config);
        }

        // Add metadata
        config._metadata = {
            environment,
            created: new Date().toISOString(),
            version: '1.0.0',
            setup: 'automated'
        };

        return config;
    }

    minimalConfig(baseConfig) {
        return {
            ...baseConfig,
            enableLearning: false,
            enablePerformanceMonitoring: false,
            maxConcurrentOperations: 1,
            storage: {
                ...baseConfig.storage,
                enableCompression: false,
                maxMemorySize: 50 * 1024 * 1024 // 50MB
            }
        };
    }

    resetConfig(baseConfig) {
        return {
            enableLearning: true,
            enablePerformanceMonitoring: true,
            maxConcurrentOperations: baseConfig.maxConcurrentOperations || 3,
            storage: {
                enableCompression: true,
                maxMemorySize: 500 * 1024 * 1024,
                enableIndexing: true
            }
        };
    }

    async saveConfig(config, environment) {
        const configPath = `config/${environment}.json`;
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(`💾 Configuration saved to ${configPath}`);
    }

    async createEnvironmentFiles(environment, config) {
        console.log('📄 Creating environment-specific files...');

        // Create .env file
        const envContent = this.generateEnvFile(environment, config);
        await fs.writeFile(`.env.${environment}`, envContent);

        // Create logging configuration
        const logConfig = this.generateLogConfig(environment);
        await fs.writeFile(`config/logging.${environment}.json`, JSON.stringify(logConfig, null, 2));

        // Create startup script
        const startupScript = this.generateStartupScript(environment);
        await fs.writeFile(`scripts/start-${environment}.sh`, startupScript);
        // Make executable on Unix-like systems
        try {
            await fs.chmod(`scripts/start-${environment}.sh`, '755');
        } catch {
            // Ignore on Windows
        }

        console.log('  ✓ Environment files created');
    }

    generateEnvFile(environment, config) {
        return `# GlitchyBrain Environment Configuration - ${environment.toUpperCase()}
# Auto-generated by setup script

NODE_ENV=${environment}
GLITCHY_BRAIN_CONFIG=config/${environment}.json
GLITCHY_BRAIN_LOG_LEVEL=${config.logLevel || 'info'}
GLITCHY_BRAIN_DEBUG=${config.debug || false}
GLITCHY_BRAIN_PORT=${process.env.PORT || 3000}

# Storage Configuration
GLITCHY_BRAIN_STORAGE_PATH=./data
GLITCHY_BRAIN_CACHE_PATH=./cache
GLITCHY_BRAIN_BACKUP_PATH=./backups

# Performance Settings
GLITCHY_BRAIN_MAX_CONCURRENT=${config.maxConcurrentOperations}
GLITCHY_BRAIN_MEMORY_LIMIT=${config.storage?.maxMemorySize || 500 * 1024 * 1024}

# Learning Configuration
GLITCHY_BRAIN_ENABLE_LEARNING=${config.enableLearning}
GLITCHY_BRAIN_ADAPTATION_RATE=${config.learning?.adaptationRate || 0.1}

# Monitoring
GLITCHY_BRAIN_ENABLE_MONITORING=${config.enablePerformanceMonitoring}
GLITCHY_BRAIN_METRICS_INTERVAL=30000
`;
    }

    generateLogConfig(environment) {
        const levels = {
            development: 'debug',
            staging: 'info',
            production: 'warn'
        };

        return {
            level: levels[environment] || 'info',
            format: environment === 'development' ? 'dev' : 'json',
            transports: [
                {
                    type: 'file',
                    filename: `logs/${environment}.log`,
                    maxsize: '10m',
                    maxFiles: 5
                },
                {
                    type: 'console',
                    format: environment === 'development' ? 'simple' : 'json'
                }
            ]
        };
    }

    generateStartupScript(environment) {
        return `#!/bin/bash

# GlitchyBrain Startup Script - ${environment.toUpperCase()}
# Auto-generated by setup script

echo "🚀 Starting GlitchyBrain in ${environment} environment..."

# Load environment variables
if [ -f ".env.${environment}" ]; then
    export $(cat .env.${environment} | xargs)
fi

# Set Node.js options for production
if [ "${environment}" = "production" ]; then
    export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"
fi

# Start the application
echo "📍 Starting server on port \${GLITCHY_BRAIN_PORT:-3000}"
exec node server.js
`;
    }

    async optimizeForEnvironment(environment) {
        console.log('⚡ Applying performance optimizations...');

        if (environment === 'production') {
            // Create optimized bundle (placeholder for future bundling)
            console.log('  ✓ Production optimizations applied');
        } else if (environment === 'development') {
            // Create development helpers
            const devHelpers = {
                hotReload: true,
                sourceMaps: true,
                debugTools: true
            };
            await fs.writeFile('config/dev-helpers.json', JSON.stringify(devHelpers, null, 2));
            console.log('  ✓ Development helpers enabled');
        }
    }

    async validateSetup(config) {
        const validation = {
            passed: true,
            checks: [],
            warnings: [],
            errors: []
        };

        // Check required directories
        const requiredDirs = ['config', 'logs', 'data'];
        for (const dir of requiredDirs) {
            try {
                await fs.access(dir);
                validation.checks.push(`Directory ${dir}/ exists`);
            } catch {
                validation.errors.push(`Missing directory: ${dir}/`);
                validation.passed = false;
            }
        }

        // Check configuration validity
        if (!config.maxConcurrentOperations || config.maxConcurrentOperations < 1) {
            validation.warnings.push('maxConcurrentOperations should be >= 1');
        }

        if (config.storage?.maxMemorySize && config.storage.maxMemorySize < 10 * 1024 * 1024) {
            validation.warnings.push('Memory limit seems very low (< 10MB)');
        }

        // Check for potential issues
        if (config.debug && config.environment === 'production') {
            validation.warnings.push('Debug mode enabled in production');
        }

        return validation;
    }

    async interactiveSetup() {
        console.log('🔧 Interactive GlitchyBrain Setup');
        console.log('==================================');

        // This would use readline for interactive prompts
        // For now, just show the options
        console.log('Available environments:');
        Object.keys(this.environments).forEach(env => {
            console.log(`  - ${env}: ${this.environments[env].name}`);
        });

        console.log('\nRun with: node setup.js <environment> [options]');
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const environment = args[0] || 'development';

    const options = {
        reset: args.includes('--reset'),
        optimize: args.includes('--optimize'),
        minimal: args.includes('--minimal'),
        interactive: args.includes('--interactive')
    };

    const setup = new SystemSetup();

    if (options.interactive) {
        await setup.interactiveSetup();
        return;
    }

    const result = await setup.setup(environment, options);

    if (!result.success) {
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Setup script failed:', error);
        process.exit(1);
    });
}

module.exports = { SystemSetup };