import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ISessionResponse, SessionStatus } from '@/src/interfaces/sessions.interface';



 export const RenderSessionItem = ({ item: session }: { item: ISessionResponse }) => {
  const canStart = session.status === SessionStatus.SCHEDULED;
  const canEnd = session.status === SessionStatus.ACTIVE;
  const isActive = session.status === SessionStatus.ACTIVE;
  const scheduledDate =
    session.scheduledAt && typeof (session.scheduledAt as any).toDate === 'function'
      ? (session.scheduledAt as any).toDate()
      : new Date(session.scheduledAt);
  const participantNames = session.participants.map(p => p.fullName).join(', ') || 'Nenhum participante';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => Alert.alert('Ação', `Você clicou em: ${session.title}`)}
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: Platform.OS === 'android' ? 6 : 0,
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}
    >
      {/* Título e status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
            {session.title}
          </Text>
          {session.metadata?.subject && (
            <Text style={{ color: '#6B7280', marginTop: 4 }}>📚 {session.metadata.subject}</Text>
          )}
          <Text style={{ color: '#6B7280', marginTop: 4 }}>👥 {participantNames}</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>
            🕒 {scheduledDate.toLocaleDateString()} às {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Status */}
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{
            backgroundColor: '#EEF2FF',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 9999,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6366F1' }}>
              {session.status}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
            {session.duration} min
          </Text>
        </View>
      </View>

      {/* Descrição */}
      {session.description && (
        <Text style={{ color: '#4B5563', fontSize: 14, marginVertical: 8 }} numberOfLines={2}>
          {session.description}
        </Text>
      )}

      {/* Indicador de sessão ativa */}
      {isActive && (
        <View style={{
          backgroundColor: '#D1FAE5',
          padding: 10,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <Text style={{ color: '#065F46', fontWeight: '600' }}>🟢 Sessão ativa</Text>
        </View>
      )}

      {/* Ações principais */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        {canStart && (
          <TouchableOpacity
            onPress={() => Alert.alert('Iniciar sessão')}
            style={{
              flex: 1,
              marginRight: 8,
              backgroundColor: '#10B981',
              padding: 12,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="play-circle" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Iniciar</Text>
          </TouchableOpacity>
        )}

        {canEnd && (
          <TouchableOpacity
            onPress={() => Alert.alert('Finalizar sessão')}
            style={{
              flex: 1,
              marginRight: 8,
              backgroundColor: '#EF4444',
              padding: 12,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="stop-circle" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Finalizar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => Alert.alert('Ver chat')}
          style={{
            flex: 1,
            backgroundColor: '#3B82F6',
            padding: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="white" />
          <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Chat</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
