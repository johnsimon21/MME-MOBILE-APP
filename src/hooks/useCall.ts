import { useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
    ICallOffer,
    ICallAnswer,
    ICallSignal,
    IIceCandidate
} from '../interfaces/chat.interface';

export interface CallState {
    isInCall: boolean;
    isIncomingCall: boolean;
    isOutgoingCall: boolean;
    callId: string | null;
    chatId: string | null;
    callerId: string | null;
    callerName: string | null;
    isVideoCall: boolean;
    isMuted: boolean;
    isVideoEnabled: boolean;
    callDuration: number;
}

export const useCall = () => {
    const { user } = useAuth();
    const { socket, isConnected, on, off, emit } = useSocket();

    const [callState, setCallState] = useState<CallState>({
        isInCall: false,
        isIncomingCall: false,
        isOutgoingCall: false,
        callId: null,
        chatId: null,
        callerId: null,
        callerName: null,
        isVideoCall: false,
        isMuted: false,
        isVideoEnabled: true,
        callDuration: 0,
    });

    const [error, setError] = useState<string | null>(null);
    const callTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteStream = useRef<MediaStream | null>(null);

    // WebRTC Configuration
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    // Initialize peer connection
    const initializePeerConnection = useCallback(() => {
        if (peerConnection.current) return peerConnection.current;

        const pc = new RTCPeerConnection(rtcConfig);

        pc.onicecandidate = (event) => {
            if (event.candidate && callState.callId) {
                emit('ice-candidate', {
                    callId: callState.callId,
                    targetUserId: callState.callerId || '',
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            remoteStream.current = event.streams[0];
            // Update UI with remote stream
        };

        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'failed') {
                endCall();
            }
        };

        peerConnection.current = pc;
        return pc;
    }, [callState.callId, callState.callerId]);

    // Get user media
    const getUserMedia = useCallback(async (video: boolean = true): Promise<MediaStream> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: video,
                audio: true,
            });
            localStream.current = stream;
            return stream;
        } catch (error: any) {
            setError('Erro ao acessar câmera/microfone: ' + error.message);
            throw error;
        }
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

    // Start outgoing call
    const startCall = useCallback(async (
        chatId: string,
        targetUserId: string,
        isVideo: boolean = true
    ) => {
        try {
            setError(null);
            const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            setCallState(prev => ({
                ...prev,
                isOutgoingCall: true,
                callId,
                chatId,
                isVideoCall: isVideo,
                isVideoEnabled: isVideo,
            }));

            // Get user media
            const stream = await getUserMedia(isVideo);

            // Initialize peer connection
            const pc = initializePeerConnection();

            // Add local stream to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send call offer via socket
            emit('call-offer', {
                callId,
                chatId,
                targetUserId,
                callerName: user?.firebaseClaims?.name || 'Usuário',
                offer,
            });

        } catch (error: any) {
            setError('Erro ao iniciar chamada: ' + error.message);
            endCall();
        }
    }, [user, getUserMedia, initializePeerConnection]);

    // Answer incoming call
    const answerCall = useCallback(async (callData: ICallOffer) => {
        try {
            setError(null);

            setCallState(prev => ({
                ...prev,
                isInCall: true,
                isIncomingCall: false,
                callId: callData.callId,
                chatId: callData.chatId,
                callerId: callData.targetUserId,
                callerName: callData.callerName,
                isVideoCall: true, // Assume video for now
                isVideoEnabled: true,
            }));

            // Get user media
            const stream = await getUserMedia(true);

            // Initialize peer connection
            const pc = initializePeerConnection();

            // Add local stream
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Set remote description
            await pc.setRemoteDescription(callData.offer);

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer
            emit('call-answer', {
                callId: callData.callId,
                callerId: callData.targetUserId,
                answerName: user?.firebaseClaims?.name || 'Usuário',
                answer,
            });

            startCallTimer();

        } catch (error: any) {
            setError('Erro ao atender chamada: ' + error.message);
            rejectCall(callData.callId, 'Erro técnico');
        }
    }, [user, getUserMedia, initializePeerConnection, startCallTimer]);

    // Reject incoming call
    const rejectCall = useCallback((callId: string, reason: string = 'Chamada rejeitada') => {
        emit('call-rejected', {
            callId,
            rejectedBy: user?.uid || '',
            reason,
        });

        setCallState(prev => ({
            ...prev,
            isIncomingCall: false,
            callId: null,
            chatId: null,
            callerId: null,
            callerName: null,
        }));
    }, [user]);

    // End call
    const endCall = useCallback(() => {
        // Send end call signal
        if (callState.callId) {
            emit('call-ended', {
                callId: callState.callId,
                endedBy: user?.uid || '',
            });
        }

        // Stop media streams
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }

        // Close peer connection
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

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
            isVideoCall: false,
            isMuted: false,
            isVideoEnabled: true,
            callDuration: 0,
        });

        setError(null);
    }, [callState.callId, user, stopCallTimer]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
            }
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
            }
        }
    }, []);

    // Setup socket listeners
    const setupSocketListeners = useCallback(() => {
        if (!isConnected) return;

        // Incoming call
        on('incoming-call', (data) => {
            setCallState(prev => ({
                ...prev,
                isIncomingCall: true,
                callId: data.callId,
                chatId: data.chatId,
                callerId: data.callerId,
                callerName: data.callerName,
            }));
        });

        // Call answered
        on('call-answered', async (data) => {
            if (callState.callId === data.callId && peerConnection.current) {
                try {
                    await peerConnection.current.setRemoteDescription(data.answer);

                    setCallState(prev => ({
                        ...prev,
                        isInCall: true,
                        isOutgoingCall: false,
                    }));

                    startCallTimer();
                } catch (error: any) {
                    setError('Erro ao processar resposta da chamada: ' + error.message);
                    endCall();
                }
            }
        });

        // Call rejected
        on('call-rejected', (data) => {
            if (callState.callId === data.callId) {
                setError(`Chamada rejeitada: ${data.reason}`);
                endCall();
            }
        });

        // Call ended
        on('call-ended', (data) => {
            if (callState.callId === data.callId) {
                endCall();
            }
        });

        // ICE candidate
        on('ice-candidate', async (data) => {
            if (callState.callId === data.callId && peerConnection.current) {
                try {
                    await peerConnection.current.addIceCandidate(data.candidate);
                } catch (error: any) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        });

        return () => {
            off('incoming-call');
            off('call-answered');
            off('call-rejected');
            off('call-ended');
            off('ice-candidate');
        };
    }, [isConnected, callState.callId, startCallTimer, endCall]);

    // Format call duration
    const formatCallDuration = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Get call status text
    const getCallStatusText = useCallback((): string => {
        if (callState.isIncomingCall) return 'Chamada recebida...';
        if (callState.isOutgoingCall) return 'Chamando...';
        if (callState.isInCall) return formatCallDuration(callState.callDuration);
        return '';
    }, [callState, formatCallDuration]);

    // Check if user can make calls
    const canMakeCall = useCallback((): boolean => {
        return isConnected && !callState.isInCall && !callState.isIncomingCall && !callState.isOutgoingCall;
    }, [isConnected, callState]);

    return {
        // State
        callState,
        error,
        localStream: localStream.current,
        remoteStream: remoteStream.current,

        // Actions
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,

        // Utilities
        formatCallDuration,
        getCallStatusText,
        canMakeCall,
        setupSocketListeners,

        // Clear error
        clearError: () => setError(null),
    };
};
