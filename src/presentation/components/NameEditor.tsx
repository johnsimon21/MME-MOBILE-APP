import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export const NameEditor = React.memo(({ 
    visible, 
    initialName, 
    onClose, 
    onSave 
}: {
    visible: boolean;
    initialName: string;
    onClose: () => void;
    onSave: (name: string) => void;
}) => {
    const [localName, setLocalName] = useState(initialName);

    useEffect(() => {
        if (visible) {
            setLocalName(initialName);
        }
    }, [visible, initialName]);

    const handleSave = () => {
        if (!localName.trim()) {
            Alert.alert("Erro", "O nome não pode estar vazio");
            return;
        }
        onSave(localName.trim());
    };

    const handleClose = () => {
        setLocalName(initialName); // Reset to original
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView 
                style={tw`flex-1`} 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center px-4`}>
                    <View style={tw`bg-white rounded-xl p-6 w-full max-w-sm`}>
                        <Text style={tw`text-lg font-bold mb-4 text-center`}>Editar Nome</Text>
                        
                        <TextInput
                            style={tw`border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base`}
                            value={localName}
                            onChangeText={setLocalName}
                            placeholder="Digite seu nome"
                            autoFocus={true}
                            maxLength={50}
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                        />
                        
                        <View style={tw`flex-row justify-between`}>
                            <TouchableOpacity
                                style={tw`bg-gray-200 px-6 py-3 rounded-lg flex-1 mr-2`}
                                onPress={handleClose}
                            >
                                <Text style={tw`text-gray-700 text-center font-medium`}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={tw`bg-blue-500 px-6 py-3 rounded-lg flex-1 ml-2 ${!localName.trim() ? 'opacity-50' : ''}`}
                                onPress={handleSave}
                                disabled={!localName.trim()}
                            >
                                <Text style={tw`text-white text-center font-medium`}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
});