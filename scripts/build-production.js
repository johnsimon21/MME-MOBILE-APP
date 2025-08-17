#!/usr/bin/env node

/**
 * Production Build Script
 * Prepares the app for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    console.error(error.message);
    process.exit(1);
  }
}

function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Missing ${description}: ${filePath}`, 'red');
    return false;
  }
  log(`✅ Found ${description}`, 'green');
  return true;
}

async function main() {
  log('\n🚀 MME Production Build Script', 'cyan');
  log('=====================================', 'cyan');

  // Check required files
  log('\n📋 Checking required files...', 'yellow');
  const requiredFiles = [
    { path: '.env.production', desc: 'Production environment file' },
    { path: 'app.json', desc: 'Expo configuration' },
    { path: 'eas.json', desc: 'EAS build configuration' },
    { path: 'assets/images/icon.png', desc: 'App icon' },
    { path: 'assets/images/adaptive-icon.png', desc: 'Android adaptive icon' },
    { path: 'assets/images/splash-icon.png', desc: 'Splash screen image' }
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    log('\n❌ Some required files are missing. Please add them before building.', 'red');
    process.exit(1);
  }

  // Set production environment
  process.env.EXPO_PUBLIC_ENVIRONMENT = 'production';
  
  // Pre-build checks
  executeCommand('npm run type-check', 'TypeScript type checking');
  executeCommand('npm run lint', 'ESLint code quality check');

  // Install EAS CLI if not present
  try {
    execSync('eas --version', { stdio: 'ignore' });
    log('✅ EAS CLI is already installed', 'green');
  } catch (error) {
    executeCommand('npm install -g @expo/eas-cli', 'Installing EAS CLI');
  }

  // Login to EAS (if not already logged in)
  try {
    execSync('eas whoami', { stdio: 'ignore' });
    log('✅ Already logged in to EAS', 'green');
  } catch (error) {
    log('\n🔐 Please login to EAS...', 'yellow');
    executeCommand('eas login', 'EAS login');
  }

  // Build options
  log('\n🏗️  Choose build type:', 'yellow');
  log('1. Android APK (for testing)', 'bright');
  log('2. Android AAB (for Play Store)', 'bright');
  log('3. iOS IPA (for App Store)', 'bright');
  log('4. Both platforms (production)', 'bright');

  const buildType = process.argv[2] || 'preview';
  
  switch (buildType) {
    case 'android-apk':
    case '1':
      executeCommand('eas build --profile preview --platform android', 'Building Android APK');
      break;
    case 'android-aab':
    case '2':
      executeCommand('eas build --profile production --platform android', 'Building Android AAB');
      break;
    case 'ios':
    case '3':
      executeCommand('eas build --profile production --platform ios', 'Building iOS IPA');
      break;
    case 'all':
    case '4':
      executeCommand('eas build --profile production --platform all', 'Building for all platforms');
      break;
    default:
      executeCommand('eas build --profile preview --platform android', 'Building Android APK (default)');
  }

  log('\n🎉 Build process completed!', 'green');
  log('\n📱 Next steps:', 'yellow');
  log('• Check your EAS dashboard for build status: https://expo.dev/', 'bright');
  log('• Download your builds when ready', 'bright');
  log('• For Play Store: Upload the AAB file', 'bright');
  log('• For App Store: Use EAS Submit or upload manually', 'bright');
}

main().catch((error) => {
  log(`\n❌ Build script failed: ${error.message}`, 'red');
  process.exit(1);
});
