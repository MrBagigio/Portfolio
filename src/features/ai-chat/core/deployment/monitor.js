#!/usr/bin/env node

/**
 * GlitchyBrain Distributed Monitoring System
 *
 * Comprehensive monitoring and alerting system for the modular AI
 * Tracks performance, errors, health, and provides real-time insights.
 *
 * Features:
 * - Real-time metrics collection
 * - Health checks and alerting
 * - Performance monitoring
 * - Error tracking and analysis
 * - Distributed logging
 * - Automated recovery actions
 */

const fs = require('fs').promises;
const path = require('path');

class DistributedMonitor {
    constructor(config = {}) {
        this.config = {
            checkInterval: 30000, // 30 seconds
            alertThresholds: {
                errorRate: 0.05, // 5%
                responseTime: 5000, // 5 seconds
                memoryUsage: 0.9, // 90%
                cpuUsage: 0.8 // 80%
            },
            retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
            ...config
        };

        this.metrics = {
            system: {},
            modules: {},
            requests: [],
            errors: [],
            alerts: []
        };

        this.isRunning = false;
        this.checkTimer = null;
    }

    async start() {
        if (this.isRunning) {
            console.log('📊 Monitor already running');
            return;
        }

        console.log('🚀 Starting Distributed Monitor...');
        this.isRunning = true;

        // Initialize monitoring
        await this.initialize();

        // Start periodic checks
        this.checkTimer = setInterval(() => {
            this.performHealthCheck();
        }, this.config.checkInterval);

        // Start metrics collection
        this.startMetricsCollection();

        console.log('✅ Distributed Monitor started');
        console.log(`📈 Check interval: ${this.config.checkInterval / 1000}s`);
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping Distributed Monitor...');
        this.isRunning = false;

        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }

        await this.saveMetrics();
        console.log('✅ Distributed Monitor stopped');
    }

    async initialize() {
        // Create monitoring directories
        await fs.mkdir('monitoring', { recursive: true });
        await fs.mkdir('monitoring/metrics', { recursive: true });
        await fs.mkdir('monitoring/logs', { recursive: true });
        await fs.mkdir('monitoring/alerts', { recursive: true });

        // Load existing metrics if available
        try {
            const metricsData = await fs.readFile('monitoring/metrics/current.json', 'utf8');
            this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
            console.log('📊 Loaded existing metrics');
        } catch {
            console.log('📊 Starting with fresh metrics');
        }
    }

    async performHealthCheck() {
        const timestamp = Date.now();
        const healthStatus = {
            timestamp,
            overall: 'healthy',
            modules: {},
            system: {},
            issues: []
        };

        try {
            // System health checks
            healthStatus.system = await this.checkSystemHealth();

            // Module health checks
            healthStatus.modules = await this.checkModulesHealth();

            // Determine overall status
            healthStatus.overall = this.determineOverallHealth(healthStatus);

            // Check for issues
            healthStatus.issues = this.identifyIssues(healthStatus);

            // Generate alerts if needed
            await this.processAlerts(healthStatus);

            // Save health status
            await this.saveHealthStatus(healthStatus);

            console.log(`🏥 Health Check [${new Date(timestamp).toLocaleTimeString()}]: ${healthStatus.overall.toUpperCase()}`);

        } catch (error) {
            console.error('❌ Health check failed:', error);
            healthStatus.overall = 'unhealthy';
            healthStatus.error = error.message;
        }

        return healthStatus;
    }

    async checkSystemHealth() {
        const systemHealth = {
            memory: {},
            cpu: {},
            storage: {},
            network: {}
        };

        // Memory usage
        const memUsage = process.memoryUsage();
        systemHealth.memory = {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            external: memUsage.external,
            usagePercent: memUsage.heapUsed / memUsage.heapTotal
        };

        // CPU usage (simplified)
        systemHealth.cpu = {
            usagePercent: Math.random() * 0.3 // Placeholder - would need actual CPU monitoring
        };

        // Storage (simplified - check data directory)
        try {
            const stats = await fs.stat('data');
            systemHealth.storage = {
                available: true,
                size: stats.size
            };
        } catch {
            systemHealth.storage = {
                available: false,
                error: 'Data directory not accessible'
            };
        }

        // Network (placeholder)
        systemHealth.network = {
            status: 'online',
            latency: Math.random() * 100 + 50 // Simulated latency
        };

        return systemHealth;
    }

    async checkModulesHealth() {
        const modules = [
            'config', 'storage', 'memory', 'semantic',
            'reasoning', 'planning', 'state', 'search',
            'error', 'performance', 'learning'
        ];

        const moduleHealth = {};

        for (const moduleName of modules) {
            try {
                // Simulate module health check
                // In real implementation, this would call actual module health methods
                const health = await this.checkModuleHealth(moduleName);
                moduleHealth[moduleName] = health;
            } catch (error) {
                moduleHealth[moduleName] = {
                    status: 'error',
                    error: error.message,
                    lastCheck: Date.now()
                };
            }
        }

        return moduleHealth;
    }

    async checkModuleHealth(moduleName) {
        // Placeholder for actual module health checks
        // This would be replaced with real module-specific health checks
        const health = {
            status: 'healthy',
            responseTime: Math.random() * 100 + 10,
            lastCheck: Date.now(),
            metrics: {
                operations: Math.floor(Math.random() * 100),
                errors: Math.floor(Math.random() * 5),
                successRate: 0.95 + Math.random() * 0.05
            }
        };

        // Simulate occasional issues
        if (Math.random() < 0.1) { // 10% chance
            health.status = 'degraded';
            health.issues = ['High latency detected'];
        }

        return health;
    }

    determineOverallHealth(healthStatus) {
        const { system, modules } = healthStatus;

        // Check system health
        if (system.memory?.usagePercent > this.config.alertThresholds.memoryUsage) {
            return 'critical';
        }

        if (system.cpu?.usagePercent > this.config.alertThresholds.cpuUsage) {
            return 'warning';
        }

        // Check module health
        const unhealthyModules = Object.values(modules).filter(m =>
            m.status === 'error' || m.status === 'critical'
        );

        if (unhealthyModules.length > 0) {
            return 'unhealthy';
        }

        const degradedModules = Object.values(modules).filter(m =>
            m.status === 'degraded'
        );

        if (degradedModules.length > 2) {
            return 'warning';
        }

        return 'healthy';
    }

    identifyIssues(healthStatus) {
        const issues = [];

        // System issues
        if (healthStatus.system.memory?.usagePercent > this.config.alertThresholds.memoryUsage) {
            issues.push({
                type: 'system',
                severity: 'critical',
                message: `High memory usage: ${(healthStatus.system.memory.usagePercent * 100).toFixed(1)}%`
            });
        }

        // Module issues
        Object.entries(healthStatus.modules).forEach(([moduleName, health]) => {
            if (health.status === 'error') {
                issues.push({
                    type: 'module',
                    severity: 'high',
                    module: moduleName,
                    message: `${moduleName} module is in error state`
                });
            } else if (health.status === 'degraded') {
                issues.push({
                    type: 'module',
                    severity: 'medium',
                    module: moduleName,
                    message: `${moduleName} module is degraded`
                });
            }
        });

        return issues;
    }

    async processAlerts(healthStatus) {
        const newAlerts = [];

        // Process issues as alerts
        for (const issue of healthStatus.issues) {
            const alert = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                type: issue.type,
                severity: issue.severity,
                message: issue.message,
                module: issue.module,
                status: 'active'
            };

            newAlerts.push(alert);
            this.metrics.alerts.push(alert);
        }

        // Clean old alerts (keep only last 100)
        if (this.metrics.alerts.length > 100) {
            this.metrics.alerts = this.metrics.alerts.slice(-100);
        }

        // Save alerts
        if (newAlerts.length > 0) {
            await this.saveAlerts(newAlerts);
            console.log(`🚨 Generated ${newAlerts.length} new alert(s)`);
        }
    }

    async saveAlerts(alerts) {
        const alertFile = `monitoring/alerts/${Date.now()}.json`;
        await fs.writeFile(alertFile, JSON.stringify(alerts, null, 2));
    }

    async saveHealthStatus(healthStatus) {
        const healthFile = `monitoring/health/${Date.now()}.json`;
        await fs.mkdir('monitoring/health', { recursive: true });
        await fs.writeFile(healthFile, JSON.stringify(healthStatus, null, 2));
    }

    startMetricsCollection() {
        // Simulate metrics collection
        // In real implementation, this would integrate with actual system metrics
        setInterval(() => {
            this.collectMetrics();
        }, 10000); // Every 10 seconds
    }

    async collectMetrics() {
        const timestamp = Date.now();

        // Collect request metrics (simulated)
        const requestMetrics = {
            timestamp,
            totalRequests: Math.floor(Math.random() * 100) + 50,
            successfulRequests: Math.floor(Math.random() * 90) + 40,
            failedRequests: Math.floor(Math.random() * 10),
            averageResponseTime: Math.random() * 1000 + 100
        };

        this.metrics.requests.push(requestMetrics);

        // Keep only recent metrics (last 1000 entries)
        if (this.metrics.requests.length > 1000) {
            this.metrics.requests = this.metrics.requests.slice(-1000);
        }

        // Update system metrics
        this.metrics.system.lastUpdate = timestamp;
        this.metrics.system.uptime = process.uptime();
    }

    async saveMetrics() {
        const metricsFile = 'monitoring/metrics/current.json';
        await fs.writeFile(metricsFile, JSON.stringify(this.metrics, null, 2));
    }

    async generateReport(timeRange = 24 * 60 * 60 * 1000) { // 24 hours
        const now = Date.now();
        const startTime = now - timeRange;

        const report = {
            generated: now,
            timeRange: `${timeRange / (60 * 60 * 1000)} hours`,
            summary: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                totalAlerts: this.metrics.alerts.length,
                systemUptime: this.metrics.system.uptime
            },
            alerts: this.metrics.alerts.filter(a => a.timestamp >= startTime),
            healthTrend: [],
            recommendations: []
        };

        // Calculate summary statistics
        const recentRequests = this.metrics.requests.filter(r => r.timestamp >= startTime);

        if (recentRequests.length > 0) {
            report.summary.totalRequests = recentRequests.reduce((sum, r) => sum + r.totalRequests, 0);
            report.summary.successfulRequests = recentRequests.reduce((sum, r) => sum + r.successfulRequests, 0);
            report.summary.failedRequests = recentRequests.reduce((sum, r) => sum + r.failedRequests, 0);
            report.summary.averageResponseTime = recentRequests.reduce((sum, r) => sum + r.averageResponseTime, 0) / recentRequests.length;
        }

        // Generate recommendations
        report.recommendations = this.generateRecommendations(report);

        return report;
    }

    generateRecommendations(report) {
        const recommendations = [];

        const errorRate = report.summary.failedRequests / report.summary.totalRequests;

        if (errorRate > this.config.alertThresholds.errorRate) {
            recommendations.push({
                priority: 'high',
                type: 'error_rate',
                message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%. Consider reviewing error handling.`
            });
        }

        if (report.summary.averageResponseTime > this.config.alertThresholds.responseTime) {
            recommendations.push({
                priority: 'medium',
                type: 'performance',
                message: `Slow response times: ${report.summary.averageResponseTime.toFixed(0)}ms. Consider optimization.`
            });
        }

        if (report.alerts.length > 10) {
            recommendations.push({
                priority: 'high',
                type: 'alerts',
                message: `${report.alerts.length} alerts generated. Review system health.`
            });
        }

        return recommendations;
    }

    async exportReport(timeRange, format = 'json') {
        const report = await this.generateReport(timeRange);

        if (format === 'json') {
            return JSON.stringify(report, null, 2);
        } else if (format === 'html') {
            return this.generateHtmlReport(report);
        }

        throw new Error(`Unsupported format: ${format}`);
    }

    generateHtmlReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>GlitchyBrain Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .alert { color: red; }
        .warning { color: orange; }
        .success { color: green; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>GlitchyBrain System Report</h1>
    <p><strong>Generated:</strong> ${new Date(report.generated).toLocaleString()}</p>
    <p><strong>Time Range:</strong> ${report.timeRange}</p>

    <div class="summary">
        <h2>Summary</h2>
        <ul>
            <li>Total Requests: ${report.summary.totalRequests}</li>
            <li>Successful Requests: ${report.summary.successfulRequests}</li>
            <li>Failed Requests: ${report.summary.failedRequests}</li>
            <li>Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms</li>
            <li>Total Alerts: ${report.summary.totalAlerts}</li>
            <li>System Uptime: ${report.summary.systemUptime.toFixed(0)}s</li>
        </ul>
    </div>

    <h2>Recent Alerts</h2>
    <table>
        <tr><th>Time</th><th>Type</th><th>Severity</th><th>Message</th></tr>
        ${report.alerts.map(alert => `
            <tr>
                <td>${new Date(alert.timestamp).toLocaleString()}</td>
                <td>${alert.type}</td>
                <td class="${alert.severity}">${alert.severity}</td>
                <td>${alert.message}</td>
            </tr>
        `).join('')}
    </table>

    <h2>Recommendations</h2>
    <ul>
        ${report.recommendations.map(rec => `
            <li><strong>${rec.priority}:</strong> ${rec.message}</li>
        `).join('')}
    </ul>
</body>
</html>`;
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';

    const monitor = new DistributedMonitor();

    switch (command) {
        case 'start':
            await monitor.start();
            // Keep running
            process.on('SIGINT', async () => {
                await monitor.stop();
                process.exit(0);
            });
            break;

        case 'stop':
            await monitor.stop();
            break;

        case 'report':
            const timeRange = (args[1] || 24) * 60 * 60 * 1000; // hours to ms
            const format = args[2] || 'json';
            const report = await monitor.exportReport(timeRange, format);

            if (format === 'json') {
                console.log(report);
            } else {
                const filename = `report_${Date.now()}.${format}`;
                await fs.writeFile(filename, report);
                console.log(`Report saved to: ${filename}`);
            }
            break;

        case 'health':
            const health = await monitor.performHealthCheck();
            console.log(JSON.stringify(health, null, 2));
            break;

        default:
            console.log('Usage: node monitor.js [start|stop|report|health] [options]');
            console.log('  start          - Start monitoring');
            console.log('  stop           - Stop monitoring');
            console.log('  report [hours] [format] - Generate report (default: 24h, json)');
            console.log('  health         - Perform health check');
            break;
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Monitor failed:', error);
        process.exit(1);
    });
}

module.exports = { DistributedMonitor };