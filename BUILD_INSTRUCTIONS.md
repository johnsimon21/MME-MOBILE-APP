# 📱 MME Mobile App - Build Instructions

## 🚀 Ready for Deployment!

Your MME Mobile App is now properly configured for production deployment. Here's how to build and deploy:

## ✅ Configuration Summary

### Environment Setup
- ✅ Production environment variables configured
- ✅ Development environment variables configured  
- ✅ Firebase configuration updated
- ✅ API endpoints configured
- ✅ EAS build profiles configured

### App Configuration
- **App Name**: MME - Meu Mentor Eiffel
- **Package**: com.johnsimon.mme
- **Version**: 1.0.0
- **API URL (Prod)**: https://mme-api.onrender.com/api
- **API URL (Dev)**: http://192.168.1.103:3000/api

## 🏗️ Build Commands

### 1. Pre-build Check
```bash
node scripts/pre-build-check.js
```

### 2. Development Build (Testing)
```bash
npm run build:development
```

### 3. Preview Build (APK for Testing)
```bash
npm run build:preview
```

### 4. Production Build
```bash
# Android App Bundle (for Play Store)
npm run build:android

# iOS IPA (for App Store)  
npm run build:ios

# Both platforms
npm run build:production
```

## 📲 Step-by-Step Deployment

### Step 1: Login to EAS
```bash
eas login
```

### Step 2: Build Android APK (for testing)
```bash
eas build --profile preview --platform android
```

### Step 3: Build for Production
```bash
# For Google Play Store (AAB)
eas build --profile production --platform android

# For Apple App Store (IPA)
eas build --profile production --platform ios
```

### Step 4: Monitor Build
- Visit: https://expo.dev/accounts/[your-username]/projects/MME/builds
- Download completed builds
- Test APK on Android devices

### Step 5: Deploy to Stores
```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

## 🔧 Build Profiles

### Development
- **Purpose**: Local testing
- **Output**: APK (debug)
- **Features**: Debug logging, development API

### Preview  
- **Purpose**: Internal testing
- **Output**: APK (release)
- **Features**: Production optimizations, test distribution

### Production
- **Purpose**: Store deployment
- **Output**: AAB (Android), IPA (iOS)
- **Features**: Full optimizations, store submission ready

## 📋 Pre-deployment Checklist

- [ ] All features tested in development
- [ ] Backend API is deployed and accessible
- [ ] Firebase project is properly configured
- [ ] App icons and splash screen are set
- [ ] Version numbers are updated
- [ ] Environment variables are configured
- [ ] TypeScript errors are resolved
- [ ] ESLint warnings are addressed

## 🎯 Production URLs

### Backend API
- **Production**: https://mme-api.onrender.com/api
- **Health Check**: https://mme-api.onrender.com/api/health

### Firebase
- **Project**: meu-mentor-eiffel
- **Console**: https://console.firebase.google.com/project/meu-mentor-eiffel

### EAS Dashboard
- **Builds**: https://expo.dev/accounts/[your-username]/projects/MME/builds
- **Submissions**: https://expo.dev/accounts/[your-username]/projects/MME/submissions

## 🐛 Troubleshooting

### Common Issues

1. **EAS Login Required**
   ```bash
   eas login
   ```

2. **Keystore Generation (First Android Build)**
   - EAS will guide you through keystore creation
   - Choose "Generate new keystore" for first build

3. **iOS Code Signing**
   - Requires Apple Developer account
   - EAS will handle certificates automatically

4. **Build Failures**
   ```bash
   # Check build logs in EAS dashboard
   eas build:list
   ```

## 📞 Support

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Expo Forums**: https://forums.expo.dev/
- **Discord**: https://discord.gg/expo

## 🎉 Success!

Your app is ready for deployment! Run the build commands above to generate your production executables.
