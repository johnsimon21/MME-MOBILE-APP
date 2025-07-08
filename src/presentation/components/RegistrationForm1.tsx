import { FormData1 } from "@/src/interfaces/auth.interface";
import React, { useState } from "react";
import { TextInput, View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import tw from "twrnc";
import { Picker } from "@react-native-picker/picker";
import { Gender } from "@/src/interfaces/index.interface";

interface Form1Props {
    onChange: (field: keyof FormData1, value: any) => void;
    formData: FormData1;
}

export default function Form1({ formData, onChange }: Form1Props) {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const genderOptions = [
        { label: "Masculino", value: Gender.MALE },
        { label: "Feminino", value: Gender.FEMALE },
    ];

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string) => {
        const phoneRegex = /^[0-9]{9,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const handleInputChange = (field: keyof FormData1, value: any) => {
        onChange(field, value);
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleEmailChange = (email: string) => {
        handleInputChange('email', email);
        if (email && !validateEmail(email)) {
            setErrors(prev => ({ ...prev, email: 'Email inválido' }));
        }
    };

    const handlePhoneChange = (phone: string) => {
        // Format phone number
        const formattedPhone = phone.replace(/\D/g, '');
        handleInputChange('cellphone', formattedPhone);
        if (phone && !validatePhone(formattedPhone)) {
            setErrors(prev => ({ ...prev, cellphone: 'Número de telefone inválido' }));
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR');
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            handleInputChange('birth', selectedDate);
        }
    };

    const getInputStyle = (fieldName: string) => [
        tw`flex-row items-center bg-white rounded-xl px-4 ${fieldName === 'birth' ? 'py-4' : fieldName === 'gender' ? 'py-1' : 'py-2'} border`,
        errors[fieldName] ? tw`border-red-300` : tw`border-gray-200`
    ];

    return (
        <View style={tw`w-full`}>
            {/* Nome Completo */}
            <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 font-medium mb-2`}>Nome Completo *</Text>
                <View style={getInputStyle('fullName')}>
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={tw`flex-1 ml-3 text-gray-900 text-base`}
                        placeholder="Digite seu nome completo"
                        value={formData.fullName}
                        onChangeText={(text) => handleInputChange('fullName', text)}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                {errors.fullName && (
                    <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                        {errors.fullName}
                    </Text>
                )}
            </View>

            {/* Gênero */}
            <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 font-medium mb-2`}>Gênero *</Text>
                <View style={getInputStyle('gender')}>
                    <Ionicons name="person-circle-outline" size={20} color="#9CA3AF" />
                    <View style={tw`flex-1 ml-3`}>
                        <Picker
                            selectedValue={formData.gender}
                            style={tw`text-gray-900`}
                            onValueChange={(itemValue: Gender) => handleInputChange('gender', itemValue)}
                        >
                            <Picker.Item label="Selecione o gênero" value="" color="#9CA3AF" />
                            {genderOptions.map((option) => (
                                <Picker.Item 
                                    key={option.value} 
                                    label={option.label} 
                                    value={option.value}
                                    color="#374151"
                                />
                            ))}
                        </Picker>
                    </View>
                </View>
                {errors.gender && (
                    <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                        {errors.gender}
                    </Text>
                )}
            </View>

            {/* Data de Nascimento */}
            <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 font-medium mb-2`}>Data de Nascimento *</Text>
                <TouchableOpacity
                    style={getInputStyle('birth')}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                    <Text style={[
                        tw`flex-1 ml-3 text-base py-1`,
                        formData.birth ? tw`text-gray-900` : tw`text-gray-400`
                    ]}>
                        {formData.birth ? formatDate(formData.birth) : 'Selecione a data'}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {errors.birth && (
                    <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                        {errors.birth}
                    </Text>
                )}
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={formData.birth || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1950, 0, 1)}
                />
            )}

            {/* Telefone */}
            <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 font-medium mb-2`}>Telefone *</Text>
                <View style={getInputStyle('cellphone')}>
                    <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={tw`flex-1 ml-3 text-gray-900 text-base`}
                        placeholder="Digite seu telefone"
                        value={formData.cellphone}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                {errors.cellphone && (
                    <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                        {errors.cellphone}
                    </Text>
                )}
            </View>

            {/* E-mail */}
            <View style={tw`mb-4`}>
                <Text style={tw`text-gray-700 font-medium mb-2`}>E-mail *</Text>
                <View style={getInputStyle('email')}>
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={tw`flex-1 ml-3 text-gray-900 text-base`}
                        placeholder="Digite seu e-mail"
                        value={formData.email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                {errors.email && (
                    <Text style={tw`text-red-500 text-sm mt-1 ml-1`}>
                        {errors.email}
                    </Text>
                )}
            </View>

            {/* Info Box */}
            <View style={tw`bg-blue-50 rounded-xl p-4 flex-row items-start`}>
                <Ionicons name="information-circle-outline" size={20} color="#3B82F6" style={tw`mr-3 mt-0.5`} />
                <Text style={tw`text-blue-800 text-sm leading-5 flex-1`}>
                    Todos os campos marcados com * são obrigatórios. Seus dados estão seguros e protegidos.
                </Text>
            </View>
        </View>
    );
}
