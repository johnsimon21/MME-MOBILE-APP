import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { Navbar } from '@/src/presentation/components/ui/navbar';

export default function SettingsScreen() {
    // Settings state
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [sessionNotifications, setSessionNotifications] = useState(true);
    const [messageNotifications, setMessageNotifications] = useState(true);
    const [callNotifications, setCallNotifications] = useState(true);
    const [autoStartSession, setAutoStartSession] = useState(false);
    const [saveSessionHistory, setSaveSessionHistory] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [autoBackup, setAutoBackup] = useState(false);

    const handleClearSessionHistory = () => {
        Alert.alert(
            "Limpar Histórico de Sessões",
            "Tem certeza que deseja limpar todo o histórico de sessões? Esta ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Limpar", 
                    style: "destructive",
                    onPress: () => {
                        // Implement clear session history
                        console.log("Clearing session history...");
                    }
                }
            ]
        );
    };

    const handleExportData = () => {
        Alert.alert(
            "Exportar Dados",
            "Deseja exportar seus dados de sessões e conversas?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Exportar", 
                    onPress: () => {
                        // Implement data export
                        console.log("Exporting data...");
                    }
                }
            ]
        );
    };

    const SettingItem = ({ 
        icon, 
        title, 
        subtitle, 
        onPress, 
        showSwitch = false, 
        switchValue = false, 
        onSwitchChange,
        showArrow = true,
        iconColor = "#4F46E5"
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        showSwitch?: boolean;
        switchValue?: boolean;
        onSwitchChange?: (value: boolean) => void;
        showArrow?: boolean;
        iconColor?: string;
    }) => (
        <TouchableOpacity 
            style={tw`flex-row items-center py-4 px-4 bg-white mb-2 rounded-xl`}
            onPress={onPress}
            disabled={showSwitch}
        >
            <View style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3`}>
                <Feather name={icon as any} size={20} color={iconColor} />
            </View>
            
            <View style={tw`flex-1`}>
                <Text style={tw`text-gray-800 font-medium text-base`}>{title}</Text>
                {subtitle && (
                    <Text style={tw`text-gray-500 text-sm mt-1`}>{subtitle}</Text>
                )}
            </View>

            {showSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                    thumbColor={switchValue ? '#FFFFFF' : '#FFFFFF'}
                />
            ) : showArrow ? (
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            ) : null}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={tw`text-lg font-bold text-gray-800 mb-3 mt-6 px-4`}>{title}</Text>
    );

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title="Configurações" showBackButton={true} />
            
            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <SectionHeader title="Perfil" />
                <SettingItem
                    icon="user"
                    title="Informações do Perfil"
                    subtitle="Nome, foto e informações pessoais"
                    onPress={() => console.log("Profile settings")}
                />
                <SettingItem
                    icon="shield"
                    title="Privacidade e Segurança"
                    subtitle="Controle quem pode ver suas informações"
                    onPress={() => console.log("Privacy settings")}
                />

                {/* Session Settings */}
                <SectionHeader title="Sessões" />
                <SettingItem
                    icon="play-circle"
                    title="Iniciar Sessão Automaticamente"
                    subtitle="Iniciar sessão ao abrir conversas do drawer"
                    showSwitch={true}
                    switchValue={autoStartSession}
                    onSwitchChange={setAutoStartSession}
                    showArrow={false}
                />
                <SettingItem
                    icon="save"
                    title="Salvar Histórico de Sessões"
                    subtitle="Manter registro de todas as sessões"
                    showSwitch={true}
                    switchValue={saveSessionHistory}
                    onSwitchChange={setSaveSessionHistory}
                    showArrow={false}
                />
                <SettingItem
                    icon="clock"
                    title="Duração Padrão de Sessão"
                    subtitle="Definir tempo limite para sessões"
                    onPress={() => console.log("Session duration settings")}
                />
                <SettingItem
                    icon="trash-2"
                    title="Limpar Histórico de Sessões"
                    subtitle="Remover todas as sessões salvas"
                    onPress={handleClearSessionHistory}
                    iconColor="#EF4444"
                />

                {/* Communication Settings */}
                <SectionHeader title="Comunicação" />
                <SettingItem
                    icon="message-circle"
                    title="Configurações de Chat"
                    subtitle="Emoji, anexos e formatação"
                    onPress={() => console.log("Chat settings")}
                />
                <SettingItem
                    icon="phone"
                    title="Configurações de Chamadas"
                    subtitle="Qualidade de áudio e vídeo"
                    onPress={() => console.log("Call settings")}
                />
                <SettingItem
                    icon="mic"
                    title="Gravação de Áudio"
                    subtitle="Qualidade e formato de gravação"
                    onPress={() => console.log("Audio settings")}
                />

                {/* Notifications */}
                <SectionHeader title="Notificações" />
                <SettingItem
                    icon="bell"
                    title="Notificações Gerais"
                    subtitle="Ativar/desativar todas as notificações"
                    showSwitch={true}
                    switchValue={notificationsEnabled}
                    onSwitchChange={setNotificationsEnabled}
                    showArrow={false}
                />
                <SettingItem
                    icon="users"
                    title="Notificações de Sessão"
                    subtitle="Alertas sobre início e fim de sessões"
                    showSwitch={true}
                    switchValue={sessionNotifications}
                    onSwitchChange={setSessionNotifications}
                    showArrow={false}
                />
                <SettingItem
                    icon="message-square"
                    title="Notificações de Mensagens"
                    subtitle="Alertas de novas mensagens"
                    showSwitch={true}
                    switchValue={messageNotifications}
                    onSwitchChange={setMessageNotifications}
                    showArrow={false}
                />
                <SettingItem
                    icon="phone-call"
                    title="Notificações de Chamadas"
                    subtitle="Alertas de chamadas recebidas"
                    showSwitch={true}
                    switchValue={callNotifications}
                    onSwitchChange={setCallNotifications}
                    showArrow={false}
                />

                {/* Data & Storage */}
                <SectionHeader title="Dados e Armazenamento" />
                <SettingItem
                    icon="hard-drive"
                    title="Uso de Armazenamento"
                    subtitle="Ver espaço usado por mensagens e arquivos"
                    onPress={() => console.log("Storage usage")}
                />
                <SettingItem
                    icon="cloud"
                    title="Backup Automático"
                    subtitle="Fazer backup dos dados automaticamente"
                    showSwitch={true}
                    switchValue={autoBackup}
                    onSwitchChange={setAutoBackup}
                    showArrow={false}
                />
                <SettingItem
                    icon="download"
                    title="Exportar Dados"
                    subtitle="Baixar cópia dos seus dados"
                    onPress={handleExportData}
                />
                <SettingItem
                    icon="wifi"
                    title="Uso de Dados"
                    subtitle="Controlar uso de dados móveis"
                    onPress={() => console.log("Data usage settings")}
                />

                {/* Appearance */}
                <SectionHeader title="Aparência" />
                <SettingItem
                    icon="moon"
                    title="Modo Escuro"
                    subtitle="Usar tema escuro na interface"
                    showSwitch={true}
                    switchValue={darkMode}
                    onSwitchChange={setDarkMode}
                    showArrow={false}
                />
                <SettingItem
                    icon="type"
                    title="Tamanho da Fonte"
                    subtitle="Ajustar tamanho do texto"
                    onPress={() => console.log("Font size settings")}
                />
                <SettingItem
                    icon="palette"
                    title="Tema da Interface"
                    subtitle="Personalizar cores e aparência"
                    onPress={() => console.log("Theme settings")}
                />

                {/* About & Support */}
                <SectionHeader title="Sobre e Suporte" />
                <SettingItem
                    icon="info"
                    title="Sobre o MME"
                    subtitle="Versão 1.0.0"
                    onPress={() => console.log("About app")}
                />
                <SettingItem
                    icon="help-circle"
                    title="Central de Ajuda"
                    subtitle="Tutoriais e perguntas frequentes"
                    onPress={() => console.log("Help center")}
                />
                <SettingItem
                    icon="mail"
                    title="Contatar Suporte"
                    subtitle="Enviar feedback ou reportar problemas"
                    onPress={() => console.log("Contact support")}
                />
                <SettingItem
                    icon="file-text"
                    title="Termos de Uso"
                    subtitle="Política de privacidade e termos"
                    onPress={() => console.log("Terms and privacy")}
                />

                {/* Account Actions */}
                <SectionHeader title="Conta" />
                <SettingItem
                    icon="log-out"
                    title="Sair da Conta"
                    subtitle="Fazer logout do aplicativo"
                    onPress={() => {
                        Alert.alert(
                            "Sair da Conta",
                            "Tem certeza que deseja sair?",
                            [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Sair", style: "destructive", onPress: () => console.log("Logout") }
                            ]
                        );
                    }}
                    iconColor="#EF4444"
                />

                <View style={tw`h-8`} />
            </ScrollView>
        </View>
    );
}
