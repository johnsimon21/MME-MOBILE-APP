# MME Mobile App - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
1. **EAS CLI**: Install globally with `npm install -g @expo/eas-cli`
2. **Expo Account**: Create account at [expo.dev](https://expo.dev)
3. **EAS Login**: Run `eas login` and sign in

### 📱 Build Options

#### 1. Android APK (Testing)
```bash
npm run build:preview
# or
node scripts/build-production.js android-apk
```

#### 2. Android AAB (Play Store)
```bash
npm run build:android
# or
node scripts/build-production.js android-aab
```

#### 3. iOS IPA (App Store)
```bash
npm run build:ios
# or
node scripts/build-production.js ios
```

#### 4. Both Platforms
```bash
npm run build:production
# or
node scripts/build-production.js all
```

## 🔧 Configuration Files

### Environment Variables
- **Development**: `.env.development`
- **Production**: `.env.production`

### Build Profiles
- **development**: Internal testing (APK with debug)
- **preview**: Internal testing (APK with release optimizations)
- **production**: Store deployment (AAB/IPA with full optimizations)

## 📦 Build Artifacts

### Android
- **APK**: For direct installation and testing
- **AAB** (Android App Bundle): For Google Play Store

### iOS
- **IPA**: For App Store deployment

## 🚀 Deployment Steps

### 1. Pre-deployment Checklist
- [ ] Update version in `app.json` and `package.json`
- [ ] Verify production API URL in `.env.production`
- [ ] Test all features in development
- [ ] Run `npm run type-check` and `npm run lint`
- [ ] Update app icons and splash screen
- [ ] Verify Firebase configuration

### 2. Build for Testing (Android APK)
```bash
npm run build:preview
```

### 3. Build for Production
```bash
# Android (Play Store)
npm run build:android

# iOS (App Store)
npm run build:ios

# Both platforms
npm run build:production
```

### 4. Submit to Stores
```bash
# Android (Play Store)
npm run deploy:android

# iOS (App Store)
npm run deploy:ios

# Both stores
npm run deploy
```

## 🔐 Environment Configuration

### Production API Configuration
The app is configured to use:
- **API URL**: `https://mme-api.onrender.com/api`
- **Firebase**: Production Firebase project
- **Debug Mode**: Disabled
- **Logging**: Disabled

### Development API Configuration
- **API URL**: `http://192.168.1.103:3000/api`
- **Firebase**: Same as production (can be separated if needed)
- **Debug Mode**: Enabled
- **Logging**: Enabled

## 📋 Build Status

Check build status at: https://expo.dev/accounts/[your-username]/projects/mme-mentor-eiffel/builds

## 🔄 Continuous Deployment

For automated builds, you can set up GitHub Actions or similar CI/CD:

1. Add EAS token to secrets
2. Configure build triggers
3. Automate store submissions

## 📱 App Store Preparation

### Google Play Store
1. Create developer account
2. Upload AAB file
3. Fill app details and screenshots
4. Submit for review

### Apple App Store
1. Create Apple Developer account
2. Use EAS Submit or manual upload
3. Fill app metadata in App Store Connect
4. Submit for review

## 🐛 Troubleshooting

### Common Issues
1. **Build fails**: Check TypeScript errors with `npm run type-check`
2. **Asset missing**: Verify all required images are in `assets/images/`
3. **Environment variables**: Ensure `.env.production` is properly configured
4. **Firebase errors**: Verify Firebase configuration and project settings

### Debug Commands
```bash
# Check EAS configuration
eas config

# View build logs
eas build:list

# Cancel build
eas build:cancel [build-id]
```

## 📞 Support

For deployment issues:
1. Check Expo documentation: https://docs.expo.dev/
2. EAS Build documentation: https://docs.expo.dev/build/introduction/
3. Contact: [your-support-email]
