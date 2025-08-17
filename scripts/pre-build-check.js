#!/usr/bin/env node

/**
 * Pre-build Check Script
 * Validates the app configuration before building
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description, required = true) {
  if (!fs.existsSync(filePath)) {
    if (required) {
      log(`❌ Missing ${description}: ${filePath}`, 'red');
      return false;
    } else {
      log(`⚠️  Optional ${description} not found: ${filePath}`, 'yellow');
      return true;
    }
  }
  log(`✅ Found ${description}`, 'green');
  return true;
}

function checkJsonFile(filePath, description, requiredFields = []) {
  if (!checkFile(filePath, description)) {
    return false;
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    for (const field of requiredFields) {
      const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], content);
      if (!fieldValue) {
        log(`❌ Missing field '${field}' in ${description}`, 'red');
        return false;
      }
    }
    
    log(`✅ ${description} configuration is valid`, 'green');
    return true;
  } catch (error) {
    log(`❌ Invalid JSON in ${description}: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🔍 MME Pre-build Check', 'cyan');
  log('=========================', 'cyan');

  let allChecksPass = true;

  // Check configuration files
  log('\n📋 Checking configuration files...', 'blue');
  
  const configChecks = [
    { file: 'package.json', desc: 'Package configuration', fields: ['name', 'version'] },
    { file: 'app.json', desc: 'Expo configuration', fields: ['expo.name', 'expo.version', 'expo.android.package', 'expo.ios.bundleIdentifier'] },
    { file: 'eas.json', desc: 'EAS build configuration', fields: ['build.production'] },
    { file: 'tsconfig.json', desc: 'TypeScript configuration', fields: [] }
  ];

  for (const check of configChecks) {
    if (!checkJsonFile(check.file, check.desc, check.fields)) {
      allChecksPass = false;
    }
  }

  // Check environment files
  log('\n🌍 Checking environment files...', 'blue');
  const envChecks = [
    { file: '.env.development', desc: 'Development environment', required: false },
    { file: '.env.production', desc: 'Production environment', required: false }
  ];

  for (const check of envChecks) {
    checkFile(check.file, check.desc, check.required);
  }

  // Check source files
  log('\n📁 Checking critical source files...', 'blue');
  const sourceChecks = [
    'src/config/env.ts',
    'src/config/firebase.ts',
    'src/infrastructure/api.ts',
    'app/_layout.tsx'
  ];

  for (const file of sourceChecks) {
    if (!checkFile(file, file.replace('src/', '').replace('app/', ''))) {
      allChecksPass = false;
    }
  }

  // Check assets
  log('\n🖼️  Checking app assets...', 'blue');
  const assetChecks = [
    { file: 'assets/images/icon.png', desc: 'App icon', required: true },
    { file: 'assets/images/adaptive-icon.png', desc: 'Android adaptive icon', required: true },
    { file: 'assets/images/splash-icon.png', desc: 'Splash screen image', required: true },
    { file: 'assets/images/favicon.png', desc: 'Web favicon', required: false }
  ];

  for (const check of assetChecks) {
    if (!checkFile(check.file, check.desc, check.required)) {
      if (check.required) allChecksPass = false;
    }
  }

  // Check package.json scripts
  log('\n📦 Checking package.json scripts...', 'blue');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['build:production', 'build:android', 'build:ios', 'type-check', 'lint'];
    
    for (const script of requiredScripts) {
      if (packageJson.scripts[script]) {
        log(`✅ Script '${script}' is configured`, 'green');
      } else {
        log(`❌ Missing script '${script}'`, 'red');
        allChecksPass = false;
      }
    }
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    allChecksPass = false;
  }

  // Final result
  log('\n' + '='.repeat(40), 'cyan');
  if (allChecksPass) {
    log('🎉 All checks passed! Ready for deployment', 'green');
    log('\nNext steps:', 'blue');
    log('1. Run: npm run build:preview (for testing)', 'reset');
    log('2. Run: npm run build:production (for stores)', 'reset');
    log('3. Check EAS dashboard for build status', 'reset');
    process.exit(0);
  } else {
    log('❌ Some checks failed. Please fix the issues before deploying.', 'red');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Pre-build check failed: ${error.message}`, 'red');
  process.exit(1);
});
