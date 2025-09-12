#!/usr/bin/env node

// Watson Build Validation Script
// Validates build artifacts for deployment readiness

import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`)
};

console.log(`${colors.bright}🔍 Watson Build Validation${colors.reset}`);
console.log('━'.repeat(60));

let validationErrors = 0;
let validationWarnings = 0;
const validationResults = [];

// Helper function to check if file exists and get stats
function checkFile(filePath, description) {
  try {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    validationResults.push({
      type: 'file',
      path: filePath,
      description,
      size,
      exists: true
    });
    return { exists: true, size, stats };
  } catch (err) {
    validationResults.push({
      type: 'file',
      path: filePath,
      description,
      exists: false,
      error: err.message
    });
    return { exists: false, error: err.message };
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

// Validation tests
log.header('\n📁 Build Directory Structure');

// Check main build directories
const requiredDirs = [
  { path: 'dist', desc: 'Main build output directory' },
  { path: 'dist/static', desc: 'Frontend static assets' },
  { path: 'backend/staticfiles', desc: 'Django static files' }
];

requiredDirs.forEach(({ path: dirPath, desc }) => {
  try {
    const stats = fs.statSync(dirPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(dirPath).length;
      log.success(`${desc}: ${dirPath} (${files} items)`);
    } else {
      log.error(`${desc}: ${dirPath} is not a directory`);
      validationErrors++;
    }
  } catch (err) {
    log.error(`${desc}: ${dirPath} - ${err.message}`);
    validationErrors++;
  }
});

log.header('\n📄 Critical Build Files');

// Check critical files
const criticalFiles = [
  { path: 'dist/index.html', desc: 'Main HTML template', maxSize: 10 * 1024 },
  { path: 'dist/static/main.js', desc: 'Main JavaScript bundle', maxSize: 2 * 1024 * 1024 },
  { path: 'dist/static/main.css', desc: 'Main CSS bundle', maxSize: 100 * 1024 },
  { path: 'dist/build-manifest.json', desc: 'Build manifest', maxSize: 10 * 1024 }
];

criticalFiles.forEach(({ path: filePath, desc, maxSize }) => {
  const result = checkFile(filePath, desc);
  if (result.exists) {
    const sizeFormatted = formatBytes(result.size);
    if (result.size > maxSize) {
      log.warning(`${desc}: ${sizeFormatted} (larger than expected ${formatBytes(maxSize)})`);
      validationWarnings++;
    } else if (result.size === 0) {
      log.error(`${desc}: File is empty`);
      validationErrors++;
    } else {
      log.success(`${desc}: ${sizeFormatted}`);
    }
  } else {
    log.error(`${desc}: Missing - ${result.error}`);
    validationErrors++;
  }
});

log.header('\n📋 Build Manifest Validation');

// Validate build manifest
try {
  const manifest = JSON.parse(fs.readFileSync('dist/build-manifest.json', 'utf8'));
  
  const requiredFields = ['buildTime', 'version', 'environment', 'assets', 'buildConfig'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      log.success(`Build manifest has ${field}`);
    } else {
      log.error(`Build manifest missing ${field}`);
      validationErrors++;
    }
  });
  
  // Validate build time is recent (within last hour)
  const buildTime = new Date(manifest.buildTime);
  const now = new Date();
  const timeDiff = Math.abs(now - buildTime) / (1000 * 60); // minutes
  
  if (timeDiff > 60) {
    log.warning(`Build is ${Math.round(timeDiff)} minutes old`);
    validationWarnings++;
  } else {
    log.success(`Build is recent (${Math.round(timeDiff)} minutes ago)`);
  }
  
} catch (err) {
  log.error(`Build manifest validation failed: ${err.message}`);
  validationErrors++;
}

log.header('\n🎯 JavaScript Bundle Analysis');

// Analyze JavaScript bundle
try {
  const jsContent = fs.readFileSync('dist/static/main.js', 'utf8');
  
  // Check for development artifacts
  const devChecks = [
    { pattern: /console\.log/, desc: 'console.log statements' },
    { pattern: /debugger/, desc: 'debugger statements' },
    { pattern: /development/i, desc: 'development references' }
  ];
  
  devChecks.forEach(({ pattern, desc }) => {
    if (pattern.test(jsContent)) {
      log.warning(`JavaScript bundle contains ${desc}`);
      validationWarnings++;
    } else {
      log.success(`No ${desc} found`);
    }
  });
  
  // Check for minification indicators
  const minificationChecks = [
    { test: jsContent.includes('\n\n'), desc: 'Code appears to be minified', shouldBeFalse: true },
    { test: jsContent.length < 500000, desc: 'Bundle size is reasonable', shouldBeFalse: false }
  ];
  
  minificationChecks.forEach(({ test, desc, shouldBeFalse }) => {
    if (shouldBeFalse ? !test : test) {
      log.success(desc);
    } else {
      log.warning(`${desc} - check failed`);
      validationWarnings++;
    }
  });
  
} catch (err) {
  log.error(`JavaScript analysis failed: ${err.message}`);
  validationErrors++;
}

log.header('\n🗂️  Django Static Files');

// Check Django static files
try {
  const staticFiles = fs.readdirSync('backend/staticfiles');
  const jsFiles = staticFiles.filter(f => f.endsWith('.js'));
  const cssFiles = staticFiles.filter(f => f.endsWith('.css'));
  
  log.success(`Django static files: ${staticFiles.length} total`);
  log.info(`JavaScript files: ${jsFiles.length}`);
  log.info(`CSS files: ${cssFiles.length}`);
  
  if (jsFiles.length === 0) {
    log.error('No JavaScript files found in Django static files');
    validationErrors++;
  }
  
} catch (err) {
  log.error(`Django static files check failed: ${err.message}`);
  validationErrors++;
}

log.header('\n🔒 Security Validation');

// Security checks
const securityChecks = [
  {
    name: 'Source maps in production',
    check: () => {
      try {
        fs.statSync('dist/static/main.js.map');
        return { pass: false, message: 'Source maps should not be deployed to production' };
      } catch {
        return { pass: true, message: 'No source maps found in production build' };
      }
    }
  },
  {
    name: 'Environment variables',
    check: () => {
      try {
        const jsContent = fs.readFileSync('dist/static/main.js', 'utf8');
        const hasSecrets = /(?:password|secret|key|token)[\s]*[:=][\s]*["'][^"']+["']/i.test(jsContent);
        return { 
          pass: !hasSecrets, 
          message: hasSecrets ? 'Potential secrets found in bundle' : 'No obvious secrets in bundle'
        };
      } catch {
        return { pass: false, message: 'Could not analyze bundle for secrets' };
      }
    }
  }
];

securityChecks.forEach(({ name, check }) => {
  try {
    const result = check();
    if (result.pass) {
      log.success(`${name}: ${result.message}`);
    } else {
      log.warning(`${name}: ${result.message}`);
      validationWarnings++;
    }
  } catch (err) {
    log.error(`${name}: Check failed - ${err.message}`);
    validationErrors++;
  }
});

// Final validation summary
log.header('\n📊 Validation Summary');

console.log(`Total files validated: ${validationResults.length}`);
console.log(`Validation errors: ${validationErrors}`);
console.log(`Validation warnings: ${validationWarnings}`);

if (validationErrors === 0 && validationWarnings === 0) {
  log.success('🎉 All validations passed! Build is ready for deployment.');
  process.exit(0);
} else if (validationErrors === 0) {
  log.warning(`⚠️  Build passed with ${validationWarnings} warnings. Review before deployment.`);
  process.exit(0);
} else {
  log.error(`❌ Build validation failed with ${validationErrors} errors and ${validationWarnings} warnings.`);
  process.exit(1);
}