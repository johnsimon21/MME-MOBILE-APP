import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export interface SimpleCallState {
    isInCall: boolean;
    isIncomingCall: boolean;
    isOutgoingCall: boolean;
    callId: string | null;
    chatId: string | null;
    callerId: string | null;
    callerName: string | null;
    targetUserId: string | null;
    targetUserName: string | null;
    isMuted: boolean;
    callDuration: number;
    callStatus: 'idle' | 'connecting' | 'ringing' | 'active' | 'ended';
}

export const useSimpleCall = () => {
    const { user } = useAuth();
    const { socket, isConnected, on, off, emit } = useSocket();

    const [callState, setCallState] = useState<SimpleCallState>({
        isInCall: false,
        isIncomingCall: false,
        isOutgoingCall: false,
        callId: null,
        chatId: null,
        callerId: null,
        callerName: null,
        targetUserId: null,
        targetUserName: null,
        isMuted: false,
        callDuration: 0,
        callStatus: 'idle',
    });

    const [error, setError] = useState<string | null>(null);
    const callTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const recording = useRef<Audio.Recording | null>(null);

    // Configure audio session
    const configureAudioSession = useCallback(async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        } catch (error) {
            console.error('Failed to configure audio session:', error);
        }
    }, []);

    // Generate unique call ID
    const generateCallId = useCallback(() => {
        return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Start call timer
    const startCallTimer = useCallback(() => {
        if (callTimer.current) clearInterval(callTimer.current);

        let duration = 0;
        callTimer.current = setInterval(() => {
            duration += 1;
            setCallState(prev => ({ ...prev, callDuration: duration }));
        }, 1000);
    }, []);

    // Stop call timer
    const stopCallTimer = useCallback(() => {
        if (callTimer.current) {
            clearInterval(callTimer.current);
            callTimer.current = null;
        }
        setCallState(prev => ({ ...prev, callDuration: 0 }));
    }, []);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                throw new Error('Microphone permission denied');
            }

            await configureAudioSession();
            
            const recordingInstance = new Audio.Recording();
            await recordingInstance.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await recordingInstance.startAsync();
            
            recording.current = recordingInstance;
        } catch (error) {
            console.error('Failed to start recording:', error);
            setError('Erro ao iniciar gravação de áudio');
        }
    }, [configureAudioSession]);

    // Stop recording
    const stopRecording = useCallback(async () => {
        if (recording.current) {
            try {
                await recording.current.stopAndUnloadAsync();
                recording.current = null;
            } catch (error) {
                console.error('Failed to stop recording:', error);
            }
        }
    }, []);

    // Start outgoing call
    const startCall = useCallback(async (
        chatId: string,
        targetUserId: string,
        targetUserName: string
    ) => {
        try {
            setError(null);

            const callId = generateCallId();

            setCallState(prev => ({
                ...prev,
                isOutgoingCall: true,
                callId,
                chatId,
                targetUserId,
                targetUserName,
                callStatus: 'connecting',
            }));

            await configureAudioSession();

            // Send call offer via socket (simplified)
            emit('call-offer', {
                callId,
                chatId,
                targetUserId,
                callerName: user?.firebaseClaims?.name || 'Usuário',
                type: 'audio-simple'
            });

            // Simulate connecting for demo
            setTimeout(() => {
                setCallState(prev => ({ ...prev, callStatus: 'ringing' }));
            }, 1000);

            console.log('📞 Simple call offer sent:', { callId, targetUserId });

        } catch (error: any) {
            console.error('Error starting call:', error);
            setError('Erro ao iniciar chamada: ' + error.message);
            endCall();
        }
    }, [user, generateCallId, configureAudioSession, emit]);

    // Answer incoming call
    const answerCall = useCallback(async (callData: any) => {
        try {
            setError(null);

            setCallState(prev => ({
                ...prev,
                isInCall: true,
                isIncomingCall: false,
                callId: callData.callId,
                chatId: callData.chatId,
                callerId: callData.callerId,
                callerName: callData.callerName,
                callStatus: 'connecting',
            }));

            await configureAudioSession();
            await startRecording();

            // Send answer
            emit('call-answer', {
                callId: callData.callId,
                callerId: callData.callerId,
                answerName: user?.firebaseClaims?.name || 'Usuário',
                type: 'audio-simple'
            });

            // Simulate connected state
            setTimeout(() => {
                setCallState(prev => ({ ...prev, callStatus: 'active', isInCall: true }));
                startCallTimer();
            }, 1000);

            console.log('📞 Simple call answered:', callData.callId);

        } catch (error: any) {
            console.error('Error answering call:', error);
            setError('Erro ao atender chamada: ' + error.message);
            endCall();
        }
    }, [user, configureAudioSession, startRecording, emit, startCallTimer]);

    // End call
    const endCall = useCallback(async () => {
        // Send end call signal
        if (callState.callId) {
            emit('call-end', {
                callId: callState.callId,
                duration: callState.callDuration,
            });

            console.log('📞 Simple call ended:', { 
                callId: callState.callId, 
                duration: callState.callDuration 
            });
        }

        // Stop recording
        await stopRecording();

        // Stop timer
        stopCallTimer();

        // Reset state
        setCallState({
            isInCall: false,
            isIncomingCall: false,
            isOutgoingCall: false,
            callId: null,
            chatId: null,
            callerId: null,
            callerName: null,
            targetUserId: null,
            targetUserName: null,
            isMuted: false,
            callDuration: 0,
            callStatus: 'idle',
        });

        setError(null);
    }, [callState.callId, callState.callDuration, stopRecording, stopCallTimer, emit]);

    // Toggle mute
    const toggleMute = useCallback(async () => {
        if (recording.current) {
            try {
                if (callState.isMuted) {
                    // Resume recording
                    await recording.current.startAsync();
                } else {
                    // Pause recording
                    await recording.current.pauseAsync();
                }
                setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
            } catch (error) {
                console.error('Failed to toggle mute:', error);
            }
        }
    }, [callState.isMuted]);

    // Format call duration
    const formatCallDuration = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Get call status text
    const getCallStatusText = useCallback((): string => {
        switch (callState.callStatus) {
            case 'connecting':
                return 'Conectando...';
            case 'ringing':
                if (callState.isIncomingCall) return 'Chamada recebida...';
                if (callState.isOutgoingCall) return 'Chamando...';
                return 'Tocando...';
            case 'active':
                return formatCallDuration(callState.callDuration);
            case 'ended':
                return 'Chamada finalizada';
            default:
                return '';
        }
    }, [callState, formatCallDuration]);

    // Setup socket listeners (simplified)
    useEffect(() => {
        if (!isConnected) return;

        const handleIncomingCall = (data: any) => {
            console.log('📞 Simple incoming call received:', data);
            setCallState(prev => ({
                ...prev,
                isIncomingCall: true,
                callId: data.callId,
                chatId: data.chatId,
                callerId: data.callerId,
                callerName: data.callerName,
                callStatus: 'ringing',
            }));
        };

        const handleCallAnswered = (data: any) => {
            console.log('📞 Simple call answered:', data);
            if (callState.callId === data.callId) {
                setCallState(prev => ({
                    ...prev,
                    isInCall: true,
                    isOutgoingCall: false,
                    callStatus: 'active',
                }));
                startCallTimer();
                startRecording();
            }
        };

        const handleCallEnded = (data: any) => {
            console.log('📞 Simple call ended by peer:', data);
            if (callState.callId === data.callId) {
                endCall();
            }
        };

        on('incoming-call', handleIncomingCall);
        on('call-answered', handleCallAnswered);
        on('call-ended', handleCallEnded);

        return () => {
            off('incoming-call', handleIncomingCall);
            off('call-answered', handleCallAnswered);
            off('call-ended', handleCallEnded);
        };
    }, [isConnected, callState.callId, startCallTimer, startRecording, endCall, on, off]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
            stopCallTimer();
        };
    }, [stopRecording, stopCallTimer]);

    return {
        // State
        callState,
        error,

        // Actions
        startCall,
        answerCall,
        endCall,
        toggleMute,

        // Utilities
        formatCallDuration,
        getCallStatusText,
        clearError: () => setError(null),
    };
};
