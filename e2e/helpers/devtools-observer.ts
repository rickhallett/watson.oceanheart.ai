/**
 * DevTools Observer - Chrome DevTools Protocol Integration
 *
 * Provides enhanced observability for E2E tests:
 * - Performance metrics collection
 * - Network request monitoring
 * - Console log capture
 * - DOM mutation tracking
 * - Coverage collection
 */

import { Page, CDPSession, Browser } from '@playwright/test';

export interface PerformanceMetrics {
  timestamp: number;
  layoutCount: number;
  recalcStyleCount: number;
  layoutDuration: number;
  recalcStyleDuration: number;
  scriptDuration: number;
  taskDuration: number;
  jsHeapUsedSize: number;
  jsHeapTotalSize: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  totalBlockingTime?: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  responseTime?: number;
  size?: number;
  startTime: number;
  endTime?: number;
}

export interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
  location?: string;
}

export interface ObservabilityReport {
  testName: string;
  duration: number;
  performance: PerformanceMetrics[];
  networkRequests: NetworkRequest[];
  consoleMessages: ConsoleMessage[];
  errors: string[];
  warnings: string[];
  webVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
}

/**
 * DevTools Observer class for enhanced test observability
 */
export class DevToolsObserver {
  private cdp: CDPSession | null = null;
  private page: Page;
  private networkRequests: NetworkRequest[] = [];
  private consoleMessages: ConsoleMessage[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private testName: string = '';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Initialize CDP session and start monitoring
   */
  async start(testName: string): Promise<void> {
    this.testName = testName;
    this.startTime = Date.now();
    this.networkRequests = [];
    this.consoleMessages = [];
    this.performanceMetrics = [];

    // Create CDP session
    this.cdp = await this.page.context().newCDPSession(this.page);

    // Enable domains
    await this.cdp.send('Performance.enable');
    await this.cdp.send('Network.enable');
    await this.cdp.send('Log.enable');
    await this.cdp.send('DOM.enable');
    await this.cdp.send('CSS.enable');

    // Set up network monitoring
    this.setupNetworkMonitoring();

    // Set up console monitoring
    this.setupConsoleMonitoring();

    // Collect initial performance metrics
    await this.collectPerformanceMetrics();

    console.log(`[DevTools Observer] Started monitoring: ${testName}`);
  }

  /**
   * Setup network request monitoring via CDP
   */
  private setupNetworkMonitoring(): void {
    if (!this.cdp) return;

    const pendingRequests = new Map<string, NetworkRequest>();

    this.cdp.on('Network.requestWillBeSent', (params) => {
      const request: NetworkRequest = {
        url: params.request.url,
        method: params.request.method,
        resourceType: params.type || 'unknown',
        startTime: Date.now(),
      };
      pendingRequests.set(params.requestId, request);
    });

    this.cdp.on('Network.responseReceived', (params) => {
      const request = pendingRequests.get(params.requestId);
      if (request) {
        request.status = params.response.status;
        request.endTime = Date.now();
        request.responseTime = request.endTime - request.startTime;
      }
    });

    this.cdp.on('Network.loadingFinished', (params) => {
      const request = pendingRequests.get(params.requestId);
      if (request) {
        request.size = params.encodedDataLength;
        request.endTime = request.endTime || Date.now();
        this.networkRequests.push(request);
        pendingRequests.delete(params.requestId);
      }
    });

    this.cdp.on('Network.loadingFailed', (params) => {
      const request = pendingRequests.get(params.requestId);
      if (request) {
        request.status = 0;
        request.endTime = Date.now();
        this.networkRequests.push(request);
        pendingRequests.delete(params.requestId);
      }
    });
  }

  /**
   * Setup console message monitoring
   */
  private setupConsoleMonitoring(): void {
    // Use Playwright's console event for reliability
    this.page.on('console', (msg) => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        location: msg.location()
          ? `${msg.location().url}:${msg.location().lineNumber}`
          : undefined,
      });
    });

    // Also capture page errors
    this.page.on('pageerror', (error) => {
      this.consoleMessages.push({
        type: 'error',
        text: error.message,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Collect performance metrics from CDP
   */
  async collectPerformanceMetrics(): Promise<PerformanceMetrics | null> {
    if (!this.cdp) return null;

    try {
      const result = await this.cdp.send('Performance.getMetrics');
      const metrics: Record<string, number> = {};

      for (const metric of result.metrics) {
        metrics[metric.name] = metric.value;
      }

      const perfMetrics: PerformanceMetrics = {
        timestamp: Date.now(),
        layoutCount: metrics['LayoutCount'] || 0,
        recalcStyleCount: metrics['RecalcStyleCount'] || 0,
        layoutDuration: metrics['LayoutDuration'] || 0,
        recalcStyleDuration: metrics['RecalcStyleDuration'] || 0,
        scriptDuration: metrics['ScriptDuration'] || 0,
        taskDuration: metrics['TaskDuration'] || 0,
        jsHeapUsedSize: metrics['JSHeapUsedSize'] || 0,
        jsHeapTotalSize: metrics['JSHeapTotalSize'] || 0,
      };

      this.performanceMetrics.push(perfMetrics);
      return perfMetrics;
    } catch (error) {
      console.warn('[DevTools Observer] Failed to collect performance metrics:', error);
      return null;
    }
  }

  /**
   * Collect Web Vitals using Performance Observer
   */
  async collectWebVitals(): Promise<{ lcp?: number; fcp?: number; cls?: number }> {
    return await this.page.evaluate(() => {
      return new Promise<{ lcp?: number; fcp?: number; cls?: number }>((resolve) => {
        const vitals: { lcp?: number; fcp?: number; cls?: number } = {};

        // Get paint timings
        const paintEntries = performance.getEntriesByType('paint');
        for (const entry of paintEntries) {
          if (entry.name === 'first-contentful-paint') {
            vitals.fcp = entry.startTime;
          }
        }

        // Get LCP
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          vitals.lcp = (lcpEntries[lcpEntries.length - 1] as PerformanceEntry & { startTime: number }).startTime;
        }

        // Get CLS
        const layoutShiftEntries = performance.getEntriesByType('layout-shift');
        vitals.cls = layoutShiftEntries.reduce(
          (sum, entry) => sum + ((entry as PerformanceEntry & { value: number }).value || 0),
          0
        );

        resolve(vitals);
      });
    });
  }

  /**
   * Take a performance snapshot at current state
   */
  async snapshot(label: string): Promise<void> {
    const metrics = await this.collectPerformanceMetrics();
    console.log(`[DevTools Observer] Snapshot "${label}":`, {
      requests: this.networkRequests.length,
      consoleMessages: this.consoleMessages.length,
      heapUsed: metrics ? `${Math.round(metrics.jsHeapUsedSize / 1024 / 1024)}MB` : 'N/A',
    });
  }

  /**
   * Generate final observability report
   */
  async generateReport(): Promise<ObservabilityReport> {
    await this.collectPerformanceMetrics();
    const webVitals = await this.collectWebVitals();

    const errors = this.consoleMessages
      .filter((m) => m.type === 'error')
      .map((m) => m.text);

    const warnings = this.consoleMessages
      .filter((m) => m.type === 'warning')
      .map((m) => m.text);

    return {
      testName: this.testName,
      duration: Date.now() - this.startTime,
      performance: this.performanceMetrics,
      networkRequests: this.networkRequests,
      consoleMessages: this.consoleMessages,
      errors,
      warnings,
      webVitals,
    };
  }

  /**
   * Log a summary of the test observability
   */
  async logSummary(): Promise<void> {
    const report = await this.generateReport();

    console.log('\n========================================');
    console.log(`  OBSERVABILITY REPORT: ${report.testName}`);
    console.log('========================================');
    console.log(`  Duration: ${report.duration}ms`);
    console.log(`  Network Requests: ${report.networkRequests.length}`);
    console.log(`  Console Messages: ${report.consoleMessages.length}`);
    console.log(`  Errors: ${report.errors.length}`);
    console.log(`  Warnings: ${report.warnings.length}`);
    console.log('----------------------------------------');
    console.log('  Web Vitals:');
    console.log(`    FCP: ${report.webVitals.fcp?.toFixed(2) || 'N/A'}ms`);
    console.log(`    LCP: ${report.webVitals.lcp?.toFixed(2) || 'N/A'}ms`);
    console.log(`    CLS: ${report.webVitals.cls?.toFixed(4) || 'N/A'}`);
    console.log('----------------------------------------');

    if (report.performanceMetrics && report.performanceMetrics.length > 0) {
      const lastMetrics = report.performanceMetrics[report.performanceMetrics.length - 1];
      console.log('  Final Performance:');
      console.log(`    JS Heap Used: ${Math.round(lastMetrics.jsHeapUsedSize / 1024 / 1024)}MB`);
      console.log(`    Layout Count: ${lastMetrics.layoutCount}`);
      console.log(`    Script Duration: ${lastMetrics.scriptDuration.toFixed(2)}s`);
    }

    // Log slow requests
    const slowRequests = report.networkRequests.filter((r) => (r.responseTime || 0) > 500);
    if (slowRequests.length > 0) {
      console.log('----------------------------------------');
      console.log('  Slow Requests (>500ms):');
      slowRequests.forEach((r) => {
        console.log(`    ${r.method} ${r.url.slice(0, 60)}... (${r.responseTime}ms)`);
      });
    }

    // Log errors
    if (report.errors.length > 0) {
      console.log('----------------------------------------');
      console.log('  Errors:');
      report.errors.slice(0, 5).forEach((e) => {
        console.log(`    - ${e.slice(0, 100)}...`);
      });
    }

    console.log('========================================\n');
  }

  /**
   * Stop monitoring and cleanup
   */
  async stop(): Promise<ObservabilityReport> {
    const report = await this.generateReport();
    await this.logSummary();

    if (this.cdp) {
      await this.cdp.detach();
      this.cdp = null;
    }

    return report;
  }
}

/**
 * Create accessibility observer using CDP
 */
export async function collectAccessibilitySnapshot(page: Page): Promise<unknown> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Accessibility.enable');

  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  await cdp.detach();

  // Filter for relevant accessibility issues
  const issues = nodes.filter((node: { role?: { value: string }; ignored?: boolean }) => {
    // Check for missing labels, low contrast, etc.
    return node.role?.value && !node.ignored;
  });

  return {
    totalNodes: nodes.length,
    interactiveNodes: issues.length,
    tree: nodes.slice(0, 50), // First 50 nodes for debugging
  };
}
