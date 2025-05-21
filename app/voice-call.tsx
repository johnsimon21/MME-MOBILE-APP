import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, StatusBar, SafeAreaView, Alert, TextInput, Modal } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Import a function to add a session (we'll create this next)
import { addSession } from '@/src/data/sessionService';

export default function VoiceCallScreen() {
  const router = useRouter(); 
  const params = useLocalSearchParams();
  const userId = Number(params.userId);
  const userName = params.userName as string;
  const userPhoto = params.userPhoto as string | null;

  const [callStatus, setCallStatus] = useState<'connecting' | 'ongoing' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [sessionDescription, setSessionDescription] = useState('');
  const callInfoRef = useRef<{
    startTime: Date | null;
    endTime: Date | null;
    duration: number;
  }>({ startTime: null, endTime: null, duration: 0 });

  // Simulate call connecting and set start time
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('ongoing');
      setCallStartTime(new Date());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (callStatus === 'ongoing') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);
  // Format call duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for session
  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  // Handle ending the call
  const handleEndCall = () => {
    setCallStatus('ended');

    // Store call info for later use
    if (callStartTime && callDuration > 0) {
      const endTime = new Date();
      callInfoRef.current = {
        startTime: callStartTime,
        endTime,
        duration: callDuration
      };

      // Show description modal
      setShowDescriptionModal(true);
    } else {
      // If call didn't connect properly, just go back
      setTimeout(() => {
        router.back();
      }, 500);
    }
  };

  // Handle saving the session with or without description
  const handleSaveSession = (withDescription = false) => {
    if (!callInfoRef.current.startTime) return;

    // Create a new session object
    const newSession = {
      id: Date.now().toString(),
      name: `Chamada com ${userName}`,
      description: withDescription ? sessionDescription : `Chamada de voz com duração de ${formatDuration(callInfoRef.current.duration)}`,
      status: "Concluída" as const,
      scheduledDate: formatDate(callInfoRef.current.startTime),
      completedDate: formatDate(callInfoRef.current.endTime!),
      type: "call",
      participantId: userId,
      participantName: userName,
      duration: callInfoRef.current.duration
    };

    // Add the session to storage
    addSession(newSession)
      .then(() => {
        console.log("Session added successfully");
        router.back();
      })
      .catch(error => {
        console.error("Error adding session:", error);
        Alert.alert("Erro", "Não foi possível salvar a sessão");
        router.back();
      });
  };
  // Skip adding description
  const handleSkipDescription = () => {
    setShowDescriptionModal(false);
    handleSaveSession(false);
  };

  // Save with description
  const handleSaveWithDescription = () => {
    setShowDescriptionModal(false);
    handleSaveSession(true);
  };


  return (
    <SafeAreaView style={tw`flex-1 bg-[#1A1A2E]`}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Call Information */}
      <View style={tw`flex-1 items-center justify-center`}>
        {/* User Avatar */}
        <View style={tw`w-32 h-32 bg-[#2D2D44] rounded-full items-center justify-center mb-6 border-4 border-[#4D4D6D]`}>
          {userPhoto ? (
            <Image
              source={{ uri: userPhoto }}
              style={tw`w-full h-full rounded-full`}
            />
          ) : (
            <Text style={tw`text-5xl font-bold text-white`}>
              {userName.charAt(0)}
            </Text>
          )}
        </View>

        {/* User Name */}
        <Text style={tw`text-white text-3xl font-bold mb-2`}>{userName}</Text>

        {/* Call Status */}
        <Text style={tw`text-[#B3B3CC] text-lg mb-4`}>
          {callStatus === 'connecting' ? 'Chamando...' :
            callStatus === 'ongoing' ? formatDuration(callDuration) :
              'Chamada finalizada'}
        </Text>

        {/* Audio Wave Animation (simplified) */}
        {callStatus === 'ongoing' && (
          <View style={tw`flex-row items-center justify-center w-40 h-10 mb-6`}>
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <View
                key={item}
                style={{
                  backgroundColor: '#4D4D6D',
                  width: 4,
                  marginHorizontal: 3,
                  borderRadius: 2,
                  height: Math.random() * 30 + 10, // Random height between 10-40
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Call Controls */}
      <View style={tw`bg-[#2D2D44] rounded-t-3xl pt-8 pb-12 px-6`}>
        <View style={tw`flex-row justify-around items-center mb-8`}>
          {/* Mute Button */}
          <Pressable
            style={tw`items-center`}
            onPress={() => setIsMuted(!isMuted)}
          >
            <View style={tw`w-14 h-14 rounded-full ${isMuted ? 'bg-[#FF6B6B]' : 'bg-[#4D4D6D]'} items-center justify-center mb-2`}>
              <Feather name={isMuted ? "mic-off" : "mic"} size={24} color="white" />
            </View>
            <Text style={tw`text-white text-xs`}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </Pressable>

          {/* Speaker Button */}
          <Pressable
            style={tw`items-center`}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <View style={tw`w-14 h-14 rounded-full ${isSpeakerOn ? 'bg-[#4D9DE0]' : 'bg-[#4D4D6D]'} items-center justify-center mb-2`}>
              <MaterialIcons name={isSpeakerOn ? "volume-up" : "volume-down"} size={28} color="white" />
            </View>
            <Text style={tw`text-white text-xs`}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </Pressable>

          {/* Add Call Button */}
          <Pressable style={tw`items-center`}>
            <View style={tw`w-14 h-14 rounded-full bg-[#4D4D6D] items-center justify-center mb-2`}>
              <Ionicons name="person-add" size={24} color="white" />
            </View>
            <Text style={tw`text-white text-xs`}>Add Call</Text>
          </Pressable>
        </View>

        {/* End Call Button */}
        <Pressable
          style={tw`bg-[#FF3B30] h-16 rounded-full items-center justify-center mx-10`}
          onPress={handleEndCall}
        >
          <Text style={tw`text-white text-lg font-semibold`}>Desligar</Text>
        </Pressable>
      </View>

      {/* Description Modal */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSkipDescription}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center px-5`}>
          <View style={tw`bg-white w-full rounded-xl p-5`}>
            <Text style={tw`text-lg font-bold mb-2`}>Adicionar descrição</Text>
            <Text style={tw`text-gray-600 mb-4`}>
              Deseja adicionar uma descrição para esta sessão? (Opcional)
            </Text>

            <TextInput
              style={tw`border border-gray-300 rounded-lg p-3 mb-4 text-gray-800`}
              placeholder="Descreva a sessão (opcional)"
              multiline={true}
              numberOfLines={3}
              value={sessionDescription}
              onChangeText={setSessionDescription}
            />

            <View style={tw`flex-row justify-end`}>
              <Pressable
                style={tw`px-4 py-2 mr-2`}
                onPress={handleSkipDescription}
              >
                <Text style={tw`text-gray-600`}>Pular</Text>
              </Pressable>

              <Pressable
                style={tw`bg-blue-500 px-4 py-2 rounded-lg`}
                onPress={handleSaveWithDescription}
              >
                <Text style={tw`text-white font-medium`}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
