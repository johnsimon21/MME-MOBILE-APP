#!/usr/bin/env node

/**
 * Simple Call System Validation Script
 * Checks if the implementation is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Simple Call System Setup...\n');

const files = [
    {
        path: 'src/hooks/useSimpleCall.ts',
        name: 'Simple Call Hook',
        required: true
    },
    {
        path: 'src/presentation/screens/ChatScreen.tsx',
        name: 'Chat Screen',
        required: true,
        checkContent: 'useSimpleCall'
    },
    {
        path: 'app/normal-call.tsx',
        name: 'Call Screen',
        required: true,
        checkContent: 'useSimpleCall'
    },
    {
        path: 'app.json',
        name: 'App Configuration',
        required: true,
        checkContent: '@config-plugins/react-native-webrtc'
    },
    {
        path: 'package.json',
        name: 'Package Configuration',
        required: true,
        checkContent: 'react-native-webrtc'
    }
];

let allValid = true;

files.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file.name}: Found`);
        
        if (file.checkContent) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(file.checkContent)) {
                console.log(`   ✅ Contains: ${file.checkContent}`);
            } else {
                console.log(`   ❌ Missing: ${file.checkContent}`);
                allValid = false;
            }
        }
    } else {
        console.log(`❌ ${file.name}: Missing`);
        if (file.required) allValid = false;
    }
});

console.log('\n🎯 Configuration Check:');

// Check useWebRTC setting in ChatScreen
try {
    const chatScreenContent = fs.readFileSync(path.join(__dirname, 'src/presentation/screens/ChatScreen.tsx'), 'utf8');
    if (chatScreenContent.includes('useWebRTC = false')) {
        console.log('✅ ChatScreen: Using Simple Call (useWebRTC = false)');
    } else if (chatScreenContent.includes('useWebRTC = true')) {
        console.log('⚠️  ChatScreen: Using WebRTC (useWebRTC = true) - Requires development build');
    }
} catch (e) {
    console.log('❌ Could not check ChatScreen configuration');
}

// Check useWebRTC setting in normal-call
try {
    const callScreenContent = fs.readFileSync(path.join(__dirname, 'app/normal-call.tsx'), 'utf8');
    if (callScreenContent.includes('useWebRTC = false')) {
        console.log('✅ CallScreen: Using Simple Call (useWebRTC = false)');
    } else if (callScreenContent.includes('useWebRTC = true')) {
        console.log('⚠️  CallScreen: Using WebRTC (useWebRTC = true) - Requires development build');
    }
} catch (e) {
    console.log('❌ Could not check CallScreen configuration');
}

console.log('\n📋 Summary:');
if (allValid) {
    console.log('✅ Simple Call System is properly configured!');
    console.log('🚀 Ready to test with Expo Go');
    console.log('\nNext steps:');
    console.log('1. Run: npx expo start --port 8084');
    console.log('2. Open Expo Go on your device');
    console.log('3. Test call functionality');
} else {
    console.log('❌ Some issues found in configuration');
    console.log('🔧 Please review the missing files/content above');
}

console.log('\n📖 For detailed testing instructions, see: TEST_SIMPLE_CALL.md');
