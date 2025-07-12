import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { Navbar } from '@/src/presentation/components/ui/navbar';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useFloatingButton } from '@/src/context/FloatingButtonContext';
import { useAuthState } from '@/src/hooks/useAuthState';
import { useSettingsContext } from '@/src/context/SettingsContext';
import { IUserSettings } from '@/src/interfaces/settings.interface';
import { UserRole } from '@/src/interfaces/index.interface';

export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const { isAuthenticated, isCoordinator, isMentee, isMentor, isLoading: authLoading } = useAuthState();
    const { position: floatingButtonPosition, setPosition: setFloatingButtonPosition } = useFloatingButton();
    const router = useRouter();
    
    // Settings context
    const {
        settings,
        isLoading: settingsLoading,
        isUpdating,
        error,
        updateSettingByKey,
        resetSettings,
        exportSettings,
        importSettings,
        clearError,
        getSettingValue
    } = useSettingsContext();

    // Loading state for the entire screen
    const isPageLoading = authLoading || settingsLoading;

    // Helper functions to get dynamic setting values
    const getSettingValueSafe = useCallback((keyPath: string, defaultValue: any = false) => {
        if (!settings) return defaultValue;
        return getSettingValue(keyPath) ?? defaultValue;
    }, [settings, getSettingValue]);

    // Setting handlers
    const handleSettingChange = useCallback(async (keyPath: string, value: any) => {
        try {
            await updateSettingByKey(keyPath, value);
        } catch (error) {
            Alert.alert("Erro", "Falha ao atualizar configuração. Tente novamente.");
        }
    }, [updateSettingByKey]);

    // Role-based visibility helpers
    const isSettingVisible = useCallback((requiredRoles: UserRole[] = []) => {
        if (requiredRoles.length === 0) return true;
        if (!user?.role) return false;
        return requiredRoles.includes(user.role);
    }, [user?.role]);

    // Memoized setting values to prevent unnecessary re-renders
    const settingValues = useMemo(() => ({
        autoStartSession: getSettingValueSafe('sessions.autoStartSession', false),
        saveSessionHistory: getSettingValueSafe('sessions.saveSessionHistory', true),
        pushNotifications: getSettingValueSafe('notifications.pushNotifications', true),
        emailNotifications: getSettingValueSafe('notifications.emailNotifications', true),
        sessionNotifications: getSettingValueSafe('notifications.categories.session.enabled', true),
        messageNotifications: getSettingValueSafe('notifications.categories.message.enabled', true),
        callNotifications: getSettingValueSafe('notifications.categories.call.enabled', true),
        autoBackup: getSettingValueSafe('dataStorage.autoBackup', false),
        theme: getSettingValueSafe('appearance.theme', 'system'),
        fontSize: getSettingValueSafe('appearance.fontSize', 'medium'),
        colorScheme: getSettingValueSafe('appearance.colorScheme', 'blue'),
        floatingButtonPosition: getSettingValueSafe('appearance.floatingButtonPosition', floatingButtonPosition),
        highContrast: getSettingValueSafe('accessibility.highContrast', false),
        largeText: getSettingValueSafe('accessibility.largeText', false),
        reduceMotion: getSettingValueSafe('accessibility.reduceMotion', false),
        developerMode: getSettingValueSafe('advanced.developerMode', false),
        debugLogs: getSettingValueSafe('advanced.debugLogs', false),
        analyticsEnabled: getSettingValueSafe('advanced.analyticsEnabled', true),
    }), [getSettingValueSafe, floatingButtonPosition]);

    const handleResetSettings = async () => {
        Alert.alert(
            "Resetar Configurações",
            "Tem certeza que deseja restaurar todas as configurações para os valores padrão?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Resetar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await resetSettings();
                            Alert.alert("Sucesso", "Configurações resetadas com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Falha ao resetar configurações. Tente novamente.");
                        }
                    }
                }
            ]
        );
    };

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

    const handleExportData = async () => {
        Alert.alert(
            "Exportar Dados",
            "Deseja exportar suas configurações e dados?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Exportar",
                    onPress: async () => {
                        try {
                            await exportSettings();
                            Alert.alert("Sucesso", "Dados exportados com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Falha ao exportar dados. Tente novamente.");
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            "Sair",
            "Tem certeza que deseja sair?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        router.replace('/auth/LoginScreen');
                        await logout();
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

    const getPositionText = (position: string) => {
        switch (position) {
            case 'left-top': return 'Superior Esquerdo';
            case 'left-bottom': return 'Inferior Esquerdo';
            case 'right-top': return 'Superior Direito';
            case 'right-bottom': return 'Inferior Direito';
            default: return 'Inferior Direito';
        }
    };

    const showPositionSelector = () => {
        Alert.alert(
            "Posição do Botão Flutuante",
            "Escolha onde deseja posicionar o botão de opções:",
            [
                { 
                    text: "Superior Esquerdo", 
                    onPress: async () => {
                        setFloatingButtonPosition('left-top');
                        await handleSettingChange('appearance.floatingButtonPosition', 'left-top');
                    }
                },
                { 
                    text: "Inferior Esquerdo", 
                    onPress: async () => {
                        setFloatingButtonPosition('left-bottom');
                        await handleSettingChange('appearance.floatingButtonPosition', 'left-bottom');
                    }
                },
                { 
                    text: "Superior Direito", 
                    onPress: async () => {
                        setFloatingButtonPosition('right-top');
                        await handleSettingChange('appearance.floatingButtonPosition', 'right-top');
                    }
                },
                { 
                    text: "Inferior Direito", 
                    onPress: async () => {
                        setFloatingButtonPosition('right-bottom');
                        await handleSettingChange('appearance.floatingButtonPosition', 'right-bottom');
                    }
                },
                { text: "Cancelar", style: "cancel" }
            ]
        );
    };

    // Loading component
    const LoadingOverlay = () => (
        <View style={tw`absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50`}>
            <View style={tw`bg-white p-6 rounded-xl items-center`}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={tw`text-gray-600 mt-3`}>
                    {isUpdating ? 'Atualizando...' : 'Carregando...'}
                </Text>
            </View>
        </View>
    );

    // Error display component
    const ErrorDisplay = () => {
        if (!error) return null;
        
        return (
            <View style={tw`bg-red-50 border border-red-200 rounded-xl p-4 mx-4 mb-4`}>
                <View style={tw`flex-row items-center`}>
                    <Feather name="alert-circle" size={20} color="#DC2626" />
                    <Text style={tw`text-red-800 font-medium ml-2 flex-1`}>Erro</Text>
                    <TouchableOpacity onPress={clearError}>
                        <Feather name="x" size={20} color="#DC2626" />
                    </TouchableOpacity>
                </View>
                <Text style={tw`text-red-700 mt-2`}>{error}</Text>
            </View>
        );
    };

    // Show loading screen if still loading
    if (isPageLoading) {
        return (
            <View style={tw`flex-1 bg-[#F7F7F7]`}>
                <Navbar title="Configurações" showBackButton={true} />
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={tw`text-gray-600 mt-4`}>Carregando configurações...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title="Configurações" showBackButton={true} />
            
            {/* Error Display */}
            <ErrorDisplay />

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
                    switchValue={settingValues.autoStartSession}
                    onSwitchChange={(value) => handleSettingChange('sessions.autoStartSession', value)}
                    showArrow={false}
                />
                <SettingItem
                    icon="save"
                    title="Salvar Histórico de Sessões"
                    subtitle="Manter registro de todas as sessões"
                    showSwitch={true}
                    switchValue={settingValues.saveSessionHistory}
                    onSwitchChange={(value) => handleSettingChange('sessions.saveSessionHistory', value)}
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
                    title="Notificações Push"
                    subtitle="Ativar/desativar notificações push"
                    showSwitch={true}
                    switchValue={settingValues.pushNotifications}
                    onSwitchChange={(value) => handleSettingChange('notifications.pushNotifications', value)}
                    showArrow={false}
                />
                <SettingItem
                    icon="mail"
                    title="Notificações por Email"
                    subtitle="Receber notificações por email"
                    showSwitch={true}
                    switchValue={settingValues.emailNotifications}
                    onSwitchChange={(value) => handleSettingChange('notifications.emailNotifications', value)}
                    showArrow={false}
                />
                <SettingItem
                    icon="users"
                    title="Notificações de Sessão"
                    subtitle="Alertas sobre início e fim de sessões"
                    showSwitch={true}
                    switchValue={settingValues.sessionNotifications}
                    onSwitchChange={(value) => handleSettingChange('notifications.categories.session.enabled', value)}
                    showArrow={false}
                />
                <SettingItem
                    icon="message-square"
                    title="Notificações de Mensagens"
                    subtitle="Alertas de novas mensagens"
                    showSwitch={true}
                    switchValue={settingValues.messageNotifications}
                    onSwitchChange={(value) => handleSettingChange('notifications.categories.message.enabled', value)}
                    showArrow={false}
                />
                <SettingItem
                    icon="phone-call"
                    title="Notificações de Chamadas"
                    subtitle="Alertas de chamadas recebidas"
                    showSwitch={true}
                    switchValue={settingValues.callNotifications}
                    onSwitchChange={(value) => handleSettingChange('notifications.categories.call.enabled', value)}
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
                    switchValue={getSettingValueSafe('dataStorage.autoBackup', false)}
                    onSwitchChange={(value) => handleSettingChange('dataStorage.autoBackup', value)}
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
                    title="Tema"
                    subtitle={`Atual: ${getSettingValueSafe('appearance.theme', 'system') === 'dark' ? 'Escuro' : getSettingValueSafe('appearance.theme', 'system') === 'light' ? 'Claro' : 'Sistema'}`}
                    onPress={() => {
                        Alert.alert(
                            "Escolher Tema",
                            "Selecione o tema da interface:",
                            [
                                { text: "Claro", onPress: () => handleSettingChange('appearance.theme', 'light') },
                                { text: "Escuro", onPress: () => handleSettingChange('appearance.theme', 'dark') },
                                { text: "Sistema", onPress: () => handleSettingChange('appearance.theme', 'system') },
                                { text: "Cancelar", style: "cancel" }
                            ]
                        );
                    }}
                />
                <SettingItem
                    icon="move"
                    title="Posição do Botão Flutuante"
                    subtitle={`Atual: ${getPositionText(getSettingValueSafe('appearance.floatingButtonPosition', floatingButtonPosition))}`}
                    onPress={() => showPositionSelector()}
                />
                <SettingItem
                    icon="type"
                    title="Tamanho da Fonte"
                    subtitle={`Atual: ${getSettingValueSafe('appearance.fontSize', 'medium') === 'small' ? 'Pequena' : getSettingValueSafe('appearance.fontSize', 'medium') === 'large' ? 'Grande' : getSettingValueSafe('appearance.fontSize', 'medium') === 'extra_large' ? 'Extra Grande' : 'Média'}`}
                    onPress={() => {
                        Alert.alert(
                            "Tamanho da Fonte",
                            "Escolha o tamanho da fonte:",
                            [
                                { text: "Pequena", onPress: () => handleSettingChange('appearance.fontSize', 'small') },
                                { text: "Média", onPress: () => handleSettingChange('appearance.fontSize', 'medium') },
                                { text: "Grande", onPress: () => handleSettingChange('appearance.fontSize', 'large') },
                                { text: "Extra Grande", onPress: () => handleSettingChange('appearance.fontSize', 'extra_large') },
                                { text: "Cancelar", style: "cancel" }
                            ]
                        );
                    }}
                />
                <SettingItem
                    icon="palette"
                    title="Esquema de Cores"
                    subtitle={`Atual: ${getSettingValueSafe('appearance.colorScheme', 'blue') === 'blue' ? 'Azul' : getSettingValueSafe('appearance.colorScheme', 'blue') === 'green' ? 'Verde' : getSettingValueSafe('appearance.colorScheme', 'blue') === 'purple' ? 'Roxo' : getSettingValueSafe('appearance.colorScheme', 'blue') === 'orange' ? 'Laranja' : 'Vermelho'}`}
                    onPress={() => {
                        Alert.alert(
                            "Esquema de Cores",
                            "Escolha a cor principal:",
                            [
                                { text: "Azul", onPress: () => handleSettingChange('appearance.colorScheme', 'blue') },
                                { text: "Verde", onPress: () => handleSettingChange('appearance.colorScheme', 'green') },
                                { text: "Roxo", onPress: () => handleSettingChange('appearance.colorScheme', 'purple') },
                                { text: "Laranja", onPress: () => handleSettingChange('appearance.colorScheme', 'orange') },
                                { text: "Vermelho", onPress: () => handleSettingChange('appearance.colorScheme', 'red') },
                                { text: "Cancelar", style: "cancel" }
                            ]
                        );
                    }}
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

                {/* Role-based Settings - Coordinator Only */}
                {isSettingVisible([UserRole.COORDINATOR]) && (
                    <>
                        <SectionHeader title="Administração (Coordenador)" />
                        <SettingItem
                            icon="settings"
                            title="Configurações Avançadas"
                            subtitle="Configurações para desenvolvimento"
                            showSwitch={true}
                            switchValue={getSettingValueSafe('advanced.developerMode', false)}
                            onSwitchChange={(value) => handleSettingChange('advanced.developerMode', value)}
                            showArrow={false}
                        />
                        <SettingItem
                            icon="activity"
                            title="Logs de Debug"
                            subtitle="Ativar logs detalhados"
                            showSwitch={true}
                            switchValue={getSettingValueSafe('advanced.debugLogs', false)}
                            onSwitchChange={(value) => handleSettingChange('advanced.debugLogs', value)}
                            showArrow={false}
                        />
                        <SettingItem
                            icon="trending-up"
                            title="Analytics"
                            subtitle="Coleta de dados de uso"
                            showSwitch={true}
                            switchValue={getSettingValueSafe('advanced.analyticsEnabled', true)}
                            onSwitchChange={(value) => handleSettingChange('advanced.analyticsEnabled', value)}
                            showArrow={false}
                        />
                    </>
                )}

                {/* Accessibility Settings */}
                <SectionHeader title="Acessibilidade" />
                <SettingItem
                    icon="eye"
                    title="Alto Contraste"
                    subtitle="Melhorar visibilidade dos elementos"
                    showSwitch={true}
                    switchValue={getSettingValueSafe('accessibility.highContrast', false)}
                    onSwitchChange={(value) => handleSettingChange('accessibility.highContrast', value)}
                    showArrow={false}
                />
                <SettingItem
                    icon="type"
                    title="Texto Grande"
                    subtitle="Aumentar tamanho do texto"
                    showSwitch={true}
                    switchValue={getSettingValueSafe('accessibility.largeText', false)}
                    onSwitchChange={(value) => handleSettingChange('accessibility.largeText', value)}
                    showArrow={false}
                />
                <SettingItem
                    icon="minimize-2"
                    title="Reduzir Movimento"
                    subtitle="Diminuir animações e transições"
                    showSwitch={true}
                    switchValue={getSettingValueSafe('accessibility.reduceMotion', false)}
                    onSwitchChange={(value) => handleSettingChange('accessibility.reduceMotion', value)}
                    showArrow={false}
                />

                {/* Account Actions */}
                <SectionHeader title="Conta" />
                <SettingItem
                    icon="refresh-cw"
                    title="Resetar Configurações"
                    subtitle="Restaurar configurações padrão"
                    onPress={handleResetSettings}
                    iconColor="#F59E0B"
                />
                <SettingItem
                    icon="log-out"
                    title="Sair da Conta"
                    subtitle="Fazer logout do aplicativo"
                    onPress={handleLogout}
                    iconColor="#EF4444"
                />

                <View style={tw`h-8`} />
            </ScrollView>
            
            {/* Loading Overlay */}
            {isUpdating && <LoadingOverlay />}
        </View>
    );
}
