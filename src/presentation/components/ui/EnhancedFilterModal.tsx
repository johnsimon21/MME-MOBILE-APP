import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Platform,
    ScrollView,
    Dimensions,
    Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: {
        userType: "Mentor" | "Mentorado" | null;
        status: "Disponível" | "Indisponível" | null;
        location: string | null;
    };
    setFilters: (filters: any) => void;
    onApply: () => void;
    onReset: () => void;
}

export const EnhancedFilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    filters,
    setFilters,
    onApply,
    onReset,
}) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const slideAnim = new Animated.Value(SCREEN_WIDTH);

    React.useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_WIDTH,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleApply = () => {
        setFilters(localFilters);
        onApply();
        onClose();
    };

    const handleReset = () => {
        const resetFilters = {
            userType: null,
            status: null,
            location: null,
        };
        setLocalFilters(resetFilters);
        setFilters(resetFilters); // Apply reset immediately
        onReset();
        onClose(); // Close modal after reset
    };

    const userTypeOptions = [
        { value: null, label: 'Todos', icon: 'users' },
        { value: 'Mentor', label: 'Mentores', icon: 'user-check' },
        { value: 'Mentee', label: 'Mentees', icon: 'user' },
    ];

    const statusOptions = [
        { value: null, label: 'Todos', icon: 'circle' },
        { value: 'Disponível', label: 'Disponível', icon: 'check-circle' },
        { value: 'Indisponível', label: 'Indisponível', icon: 'x-circle' },
    ];

    const locationOptions = [
        { value: null, label: 'Todas as localizações', icon: 'map-pin' },
        { value: 'Luanda', label: 'Luanda', icon: 'map-pin' },
        { value: 'Bengo', label: 'Bengo', icon: 'map-pin' },
        { value: 'Benguela', label: 'Benguela', icon: 'map-pin' },
        { value: 'Huíla', label: 'Huíla', icon: 'map-pin' },
        { value: 'Malanje', label: 'Malanje', icon: 'map-pin' },
    ];

    const renderFilterSection = (
        title: string,
        options: any[],
        selectedValue: any,
        onSelect: (value: any) => void,
        keyPath: string
    ) => (
        <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{title}</Text>
            <View style={styles.optionsContainer}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.value || 'all'}
                        style={[
                            styles.optionButton,
                            selectedValue === option.value && styles.optionButtonActive,
                        ]}
                        onPress={() => onSelect(option.value)}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name={option.icon}
                            size={16}
                            color={selectedValue === option.value ? '#4F46E5' : '#6B7280'}
                        />
                        <Text style={[
                            styles.optionText,
                            selectedValue === option.value && styles.optionTextActive,
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity 
                    style={styles.modalBackground} 
                    activeOpacity={1}
                    onPress={onClose}
                />
                
                <Animated.View 
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ translateX: slideAnim }],
                        }
                    ]}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalHeader}
                    >
                        <Text style={styles.modalTitle}>Filtros</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Feather name="x" size={20} color="white" />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Content */}
                    <ScrollView 
                        style={styles.modalContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderFilterSection(
                            'Tipo de Usuário',
                            userTypeOptions,
                            localFilters.userType,
                            (value) => setLocalFilters(prev => ({ ...prev, userType: value })),
                            'userType'
                        )}

                        {renderFilterSection(
                            'Status',
                            statusOptions,
                            localFilters.status,
                            (value) => setLocalFilters(prev => ({ ...prev, status: value })),
                            'status'
                        )}

                        {renderFilterSection(
                            'Localização',
                            locationOptions,
                            localFilters.location,
                            (value) => setLocalFilters(prev => ({ ...prev, location: value })),
                            'location'
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={handleReset}
                        >
                            <Feather name="rotate-ccw" size={16} color="#6B7280" />
                            <Text style={styles.resetButtonText}>Limpar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={handleApply}
                        >
                            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'white',
        width: '85%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    optionsContainer: {
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FAFAFA',
    },
    optionButtonActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#F0F7FF',
    },
    optionText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
        fontWeight: '500',
    },
    optionTextActive: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 6,
    },
    applyButton: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
});
