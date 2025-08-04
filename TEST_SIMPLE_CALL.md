# Simple Call System Test Guide

## ✅ What's Working Now

The app has been configured with a **Simple Call System** that works in Expo Go without requiring WebRTC native modules.

### Features Available:
- ✅ **Audio Recording**: Uses Expo AV for microphone access
- ✅ **Call Signaling**: Socket-based call initiation and management
- ✅ **Call UI**: Full call interface with controls
- ✅ **Call States**: Connecting, ringing, active, ended
- ✅ **Mute/Unmute**: Audio control during calls
- ✅ **Call Duration**: Timer display
- ✅ **Error Handling**: Graceful error management

## 🎯 Testing Instructions

### 1. Start the App
```bash
# Try one of these commands:
npx expo start --port 8083 --offline
# or
npx expo start --tunnel
# or 
npx expo start --lan
```

### 2. Test Call Flow
1. **Open app in Expo Go** on your device
2. **Navigate to a chat** with another user
3. **Tap the phone icon** to initiate a call
4. **Check call screen** opens with:
   - User's name and avatar
   - "Conectando..." status
   - Call controls (mute, speaker, end call)
   - Audio wave animation

### 3. Expected Behavior
- ✅ **No WebRTC errors** (using Expo AV instead)
- ✅ **Call screen navigation** works
- ✅ **Audio permissions** requested
- ✅ **Microphone recording** starts
- ✅ **Socket signaling** sent to backend

## 🔧 Current Configuration

### Files Modified:
- `src/hooks/useSimpleCall.ts` - Simple call implementation
- `src/presentation/screens/ChatScreen.tsx` - Uses simple call
- `app/normal-call.tsx` - Adapts to simple call UI

### Key Settings:
```typescript
// In ChatScreen.tsx and normal-call.tsx
const useWebRTC = false; // Using simple call system
```

## 🚀 Next Steps

### For Immediate Testing:
1. Use Expo Go with the current Simple Call system
2. Test call initiation and UI
3. Verify no WebRTC errors

### For Full WebRTC (Later):
1. Set up Android Studio + SDK
2. Create development build: `npx expo run:android`
3. Change `useWebRTC = true` in code
4. Test full peer-to-peer audio calls

## 📱 Requirements for Testing

### Minimum:
- ✅ Expo Go app on device
- ✅ WiFi/Internet connection
- ✅ Microphone permissions

### Optional (for full WebRTC):
- Android Studio + SDK
- Physical device (recommended for audio testing)
- Development build

## 🐛 Troubleshooting

### If Expo won't start:
```bash
# Kill any running Metro processes
taskkill /f /im node.exe
# Clear Expo cache
npx expo start -c
# Try different port
npx expo start --port 8084
```

### If call fails:
1. Check microphone permissions
2. Verify backend connection
3. Check socket connection status
4. Look for error messages in console

## 💡 Tips

1. **Test on real device** for accurate audio testing
2. **Use two devices** to test full call flow
3. **Check network connection** for socket communication
4. **Monitor console logs** for debugging
