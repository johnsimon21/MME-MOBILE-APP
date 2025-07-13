import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from 'twrnc';

interface DashboardSettingsProps {
  visible: boolean;
  onClose: () => void;
  onSettingsChange: (settings: DashboardSettings) => void;
  currentSettings: DashboardSettings;
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number; // in minutes
  showRealTimeStats: boolean;
  showSystemHealth: boolean;
  enableNotifications: boolean;
  compactView: boolean;
}

export const DashboardSettings: React.FC<DashboardSettingsProps> = ({
  visible,
  onClose,
  onSettingsChange,
  currentSettings,
}) => {
  const [settings, setSettings] = useState<DashboardSettings>(currentSettings);

  const updateSetting = <K extends keyof DashboardSettings>(
    key: K,
    value: DashboardSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const refreshIntervalOptions = [
    { label: '30 segundos', value: 0.5 },
    { label: '1 minuto', value: 1 },
    { label: '2 minutos', value: 2 },
    { label: '5 minutos', value: 5 },
    { label: '10 minutos', value: 10 },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-gray-50`}>
        {/* Header */}
        <View style={tw`bg-white px-4 py-4 border-b border-gray-200`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Text style={tw`text-xl font-bold text-gray-800`}>
              Configurações do Dashboard
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`flex-1 p-4`}>
          {/* Auto Refresh */}
          <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}>
            <Text style={tw`font-semibold text-gray-800 mb-3`}>Atualização Automática</Text>
            
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-gray-600`}>Ativar atualização automática</Text>
              <Switch
                value={settings.autoRefresh}
                onValueChange={(value) => updateSetting('autoRefresh', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={settings.autoRefresh ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>

            {settings.autoRefresh && (
              <View>
                <Text style={tw`text-gray-600 mb-2`}>Intervalo de atualização</Text>
                {refreshIntervalOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateSetting('refreshInterval', option.value)}
                    style={tw`flex-row items-center py-2`}
                  >
                    <View style={tw`w-5 h-5 rounded-full border-2 border-gray-300 mr-3 items-center justify-center ${
                      settings.refreshInterval === option.value ? 'border-blue-500' : ''
                    }`}>
                      {settings.refreshInterval === option.value && (
                        <View style={tw`w-2.5 h-2.5 rounded-full bg-blue-500`} />
                      )}
                    </View>
                    <Text style={tw`text-gray-700`}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Display Options */}
          <View style={tw`bg-white rounded-xl p-4 mb-4 shadow-sm`}>
            <Text style={tw`font-semibold text-gray-800 mb-3`}>Opções de Exibição</Text>
            
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-gray-600`}>Mostrar estatísticas em tempo real</Text>
              <Switch
                value={settings.showRealTimeStats}
                onValueChange={(value) => updateSetting('showRealTimeStats', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={settings.showRealTimeStats ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>

            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-gray-600`}>Mostrar saúde do sistema</Text>
              <Switch
                value={settings.showSystemHealth}
                onValueChange={(value) => updateSetting('showSystemHealth', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={settings.showSystemHealth ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>

            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-gray-600`}>Visualização compacta</Text>
              <Switch
                value={settings.compactView}
                onValueChange={(value) => updateSetting('compactView', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={settings.compactView ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Notifications */}
          <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
            <Text style={tw`font-semibold text-gray-800 mb-3`}>Notificações</Text>
            
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-1 mr-3`}>
                <Text style={tw`text-gray-600`}>Notificações do dashboard</Text>
                <Text style={tw`text-gray-400 text-sm`}>
                  Receber alertas sobre problemas do sistema
                </Text>
              </View>
              <Switch
                value={settings.enableNotifications}
                onValueChange={(value) => updateSetting('enableNotifications', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={settings.enableNotifications ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};