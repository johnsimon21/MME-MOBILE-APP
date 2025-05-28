import React, { useState, useEffect, useRef } from "react";
import { Modal, FlatList, Dimensions } from "react-native";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Navbar } from "../components/ui/navbar";
import { useAuth } from "@/src/context/AuthContext";
import { Feather, MaterialIcons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { NameEditor } from "../components/NameEditor";

interface UserData {
    name: string;
    email: string;
    phone: string;
    address: string;
    image: string;
    portfolio: string;
    role: string;
    difficulties: string[];
    skills: string[];
    emotions: string[];
    programs: string[];
}

interface Connection {
    id: string;
    name: string;
    country: string;
    province: string;
    role: "Mentor" | "Mentorado";
    avatar: string;
}

const defaultUserData: UserData = {
    name: "",
    email: "",
    phone: "",
    address: "",
    image: "",
    portfolio: "",
    role: "Mentorado",
    difficulties: ["Gestão de tempo", "Organização"],
    skills: ["Empatia", "Ouvir", "Análise"],
    emotions: ["Nenhum"],
    programs: ["Programação", "Plano de Carreira", "Empreendedorismo", "Educação Financeira", "Comunicação Eficiente"]
};


export const ProfileScreen = () => {
    const { user } = useAuth();
    defaultUserData.name = user?.fullName || "";
    defaultUserData.name = user?.fullName || "";

    // Initialize state with default values
    const [userData, setUserData] = useState<UserData>(defaultUserData);
    const [editedData, setEditedData] = useState<UserData>(defaultUserData);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"Todos" | "Mentor" | "Mentorado">("Todos");
    const [imagePickerVisible, setImagePickerVisible] = useState(false);
    const [nameEditVisible, setNameEditVisible] = useState(false);
    const [tempName, setTempName] = useState("");


    const difficultyOptions = ["Gestão de tempo", "Organização", "Cálculos", "Línguas", "Teoria", "Outro"];
    const skillOptions = ["Informática", "Cálculos", "Línguas", "Teoria", "Empatia", "Ouvir", "Análise"];
    const emotionOptions = ["Ansiedade", "Depressão", "Estresse", "Nenhum", "Outro"];
    const programsOptions = ["Programação", "Plano de Carreira", "Empreendedorismo", "Educação Financeira", "Comunicação Eficiente"];
    const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["Nenhum"]);

    // State variables
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["Gestão de tempo", "Organização"]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(["Empatia", "Ouvir", "Análise"]);
    const [selectedPrograms, setSelectedPrograms] = useState<string[]>(["Programação", "Plano de Carreira"]);
    const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

    const loadMockConnections = () => {
        const mockConnections: Connection[] = [
            { id: '1', name: 'Ana Silva', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
            { id: '2', name: 'Carlos Mendes', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
            { id: '3', name: 'Maria Luísa', role: 'Mentorado', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
            { id: '4', name: 'João Paulo', role: 'Mentorado', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
            { id: '5', name: 'Sofia Costa', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/5.jpg' },
            { id: '6', name: 'Pedro Santos', role: 'Mentorado', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/6.jpg' },
            { id: '7', name: 'Luísa Ferreira', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/7.jpg' },
            { id: '8', name: 'Miguel Oliveira', role: 'Mentorado', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/8.jpg' },
            { id: '9', name: 'Catarina Alves', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/9.jpg' },
            { id: '10', name: 'Ricardo Nunes', role: 'Mentorado', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/10.jpg' },
        ];
        setConnections(mockConnections);
        setFilteredConnections(mockConnections);
    };

    // Function to apply filters
    const applyFilter = (filter: "Todos" | "Mentor" | "Mentorado") => {
        setActiveFilter(filter);
        if (filter === "Todos") {
            setFilteredConnections(connections);
        } else {
            setFilteredConnections(connections.filter(conn => conn.role === filter));
        }
        setFilterModalVisible(false);
    };

    // Load connections when the component mounts
    useEffect(() => {
        loadUserData();
        loadMockConnections();
    }, []);

    const loadUserData = async () => {
        try {
            setIsLoading(true);
            const userDataString = await AsyncStorage.getItem('user');
            if (userDataString) {
                const parsedData = JSON.parse(userDataString);
                // Ensure all required fields exist by merging with default data
                const completeData = { ...defaultUserData, ...parsedData };
                setUserData(completeData);
                setEditedData(completeData);
            } else {
                // Mock data for demonstration
                const mockData: UserData = {
                    name: "Lukombo Afonso",
                    email: "johnmiradojr@gmail.com",
                    image: "https://randomuser.me/api/portraits/men/1.jpg",
                    phone: "+244 942 032 806",
                    address: "Cazenga, Luanda, Angola",
                    portfolio: "https://lukomiron.vercel.app",
                    role: "Mentorado",
                    difficulties: ["Gestão de tempo", "Organização"],
                    skills: ["Empatia", "Ouvir", "Análise"],
                    emotions: ["Nenhum"],
                    programs: ["Programação", "Plano de Carreira", "Empreendedorismo", "Educação Financeira", "Comunicação Eficiente"]
                };
                setUserData(mockData);
                setEditedData(mockData);
                await AsyncStorage.setItem('user', JSON.stringify(mockData));
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            Alert.alert("Error", "Failed to load profile data");
            // Even on error, set default data to prevent null values
            setUserData(defaultUserData);
            setEditedData(defaultUserData);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEditMode = async () => {
        if (isEditing) {
            try {
                setIsLoading(true);
                const updatedUserData: UserData = {
                    ...editedData,
                    difficulties: selectedDifficulties,
                    skills: selectedSkills,
                    emotions: selectedEmotions,
                    programs: editedData.programs
                };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
                setUserData(updatedUserData);
                setIsEditing(false);
                Alert.alert("Success", "Profile updated successfully");
            } catch (error) {
                console.error("Error saving user data:", error);
                Alert.alert("Error", "Failed to save profile data");
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsEditing(true);
        }
    };

    const handleSaveChanges = async () => {
        try {
            setIsLoading(true);
            await AsyncStorage.setItem('user', JSON.stringify(editedData));
            setUserData(editedData);
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully");
        } catch (error) {
            console.error("Error saving user data:", error);
            Alert.alert("Error", "Failed to save profile data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setEditedData({ ...userData });
        setIsEditing(false);
    };

    // Photo Viewer Modal
    const PhotoViewerModal = () => (
        <Modal
            visible={photoViewerVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setPhotoViewerVisible(false)}
        >
            <View style={tw`flex-1 bg-black bg-opacity-90 justify-center items-center`}>
                {/* Close button */}
                <TouchableOpacity
                    style={tw`absolute top-12 right-4 z-10 bg-black bg-opacity-50 rounded-full p-3`}
                    onPress={() => setPhotoViewerVisible(false)}
                >
                    <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>

                {/* User info overlay */}
                <View style={tw`absolute top-12 left-4 z-10`}>
                    <Text style={tw`text-white text-xl font-bold`}>{userData?.name}</Text>
                    <Text style={tw`text-gray-300 text-sm`}>{userData?.role || "Mentorado"}</Text>
                </View>

                {/* Edit button overlay */}
                <TouchableOpacity
                    style={tw`absolute top-12 right-16 z-10 bg-blue-500 rounded-full p-3 mr-2`}
                    onPress={() => {
                        setPhotoViewerVisible(false);
                        setTimeout(() => showImagePickerOptions(), 100);
                    }}
                >
                    <Feather name="edit-2" size={20} color="white" />
                </TouchableOpacity>

                {/* Full screen image */}
                <TouchableOpacity
                    style={tw`flex-1 justify-center items-center w-full`}
                    onPress={() => setPhotoViewerVisible(false)}
                    activeOpacity={1}
                >
                    <Image
                        source={{ uri: userData?.image || 'https://randomuser.me/api/portraits/men/75.jpg' }}
                        style={tw`w-full h-full`}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                {/* Bottom action buttons */}
                <View style={tw`absolute bottom-12 left-4 right-4`}>
                    <View style={tw`bg-black bg-opacity-50 rounded-xl p-4 flex-row justify-around`}>
                        <TouchableOpacity
                            style={tw`bg-blue-500 px-6 py-3 rounded-lg flex-1 mr-2`}
                            onPress={() => {
                                setPhotoViewerVisible(false);
                                setTimeout(() => showImagePickerOptions(), 100);
                            }}
                        >
                            <Text style={tw`text-white text-center font-medium`}>Alterar Foto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`bg-gray-600 px-6 py-3 rounded-lg flex-1 ml-2`}
                            onPress={() => setPhotoViewerVisible(false)}
                        >
                            <Text style={tw`text-white text-center font-medium`}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );


    // Image picker functions
    const showImagePickerOptions = () => {
        Alert.alert(
            "Atualizar Foto de Perfil",
            "Escolha uma opção:",
            [
                { text: "Câmera", onPress: () => openCamera() },
                { text: "Galeria", onPress: () => openImageLibrary() },
                { text: "Cancelar", style: "cancel" }
            ]
        );
    };

    const openCamera = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert("Permissão necessária", "É necessário permitir o acesso à câmera.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await updateProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error opening camera:", error);
            Alert.alert("Erro", "Falha ao abrir a câmera");
        }
    };

    const openImageLibrary = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert("Permissão necessária", "É necessário permitir o acesso à galeria.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await updateProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error opening image library:", error);
            Alert.alert("Erro", "Falha ao abrir a galeria");
        }
    };

    const updateProfileImage = async (imageUri: string) => {
        try {
            setIsLoading(true);

            // Update the user data with new image
            const updatedUserData = {
                ...userData,
                image: imageUri
            };

            await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
            setUserData(updatedUserData);
            setEditedData(updatedUserData);

            Alert.alert("Sucesso", "Foto de perfil atualizada com sucesso!");
        } catch (error) {
            console.error("Error updating profile image:", error);
            Alert.alert("Erro", "Falha ao atualizar a foto de perfil");
        } finally {
            setIsLoading(false);
        }
    };

    // Name editing functions
    const showNameEditor = () => {
        setTempName(userData?.name || "");
        setNameEditVisible(true);
    };

    const updateUserName = async () => {
        if (!tempName.trim()) {
            Alert.alert("Erro", "O nome não pode estar vazio");
            return;
        }

        try {
            setIsLoading(true);

            const updatedUserData = {
                ...userData,
                name: tempName.trim()
            };

            await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
            setUserData(updatedUserData);
            setEditedData(updatedUserData);
            setNameEditVisible(false);

            Alert.alert("Sucesso", "Nome atualizado com sucesso!");
        } catch (error) {
            console.error("Error updating name:", error);
            Alert.alert("Erro", "Falha ao atualizar o nome");
        } finally {
            setIsLoading(false);
        }
    };

    // Name Editor Modal
    const NameEditorModal = () => (
        <Modal
            visible={nameEditVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setNameEditVisible(false)}
        >
            <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center px-4`}>
                <View style={tw`bg-white rounded-xl p-6 w-full max-w-sm`}>
                    <Text style={tw`text-lg font-bold mb-4 text-center`}>Editar Nome</Text>

                    <TextInput
                        style={tw`border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base`}
                        value={tempName}
                        onChangeText={setTempName}
                        placeholder="Digite seu nome"
                        autoFocus={true}
                        maxLength={50}
                    />

                    <View style={tw`flex-row justify-between`}>
                        <TouchableOpacity
                            style={tw`bg-gray-200 px-6 py-3 rounded-lg flex-1 mr-2`}
                            onPress={() => setNameEditVisible(false)}
                        >
                            <Text style={tw`text-gray-700 text-center font-medium`}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={tw`bg-blue-500 px-6 py-3 rounded-lg flex-1 ml-2`}
                            onPress={updateUserName}
                        >
                            <Text style={tw`text-white text-center font-medium`}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );


    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-white`}>
                <Navbar title="Perfil" showBackButton={true} theme="light" />
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            </View>
        );
    }

    const windowHeight = Dimensions.get('window').height;
    const maxConnectionsHeight = windowHeight * 0.82; // 82% of screen height

    return (
        <ScrollView style={tw`bg-[#F7F7F7] h-full`}>
            <Navbar title="Meu Perfil" showBackButton={true} theme="light" />

            <View style={tw`relative px-2`}>
                {/* Two-color background */}
                <View style={tw`bg-[#75A5F5] h-24 rounded-t-4`} />
                <View style={tw`bg-white h-32 rounded-b-4`} />
                <TouchableOpacity
                    style={tw`absolute top-4 right-7 bg-white rounded-full p-2 shadow-md`}
                    onPress={toggleEditMode}
                >
                    <Feather name={isEditing ? "check" : "edit"} size={20} color="#4F46E5" />
                </TouchableOpacity>

                {/* Profile image positioned in the middle */}
                <View style={tw`absolute top-12 left-0 right-0 items-center`}>
                    <View style={tw`relative`}>
                        <TouchableOpacity
                            onPress={() => setPhotoViewerVisible(true)}
                            onLongPress={showImagePickerOptions}
                            style={[
                                tw`rounded-full relative`,
                                { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }
                            ]}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={{ uri: userData?.image || 'https://randomuser.me/api/portraits/men/75.jpg' }}
                                style={tw`w-20 h-20 rounded-full border-4 border-white`}
                            />
                            {/* View icon overlay */}
                            <View style={tw`absolute inset-0 rounded-full bg-black bg-opacity-20 items-center justify-center`}>
                                <MaterialIcons name="zoom-in" size={20} color="white" style={tw`opacity-70`} />
                            </View>
                        </TouchableOpacity>

                        {/* Separate edit button */}
                        <TouchableOpacity
                            onPress={showImagePickerOptions}
                            style={tw`absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-2 border-white`}
                        >
                            <Feather name="camera" size={12} color="white" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={showNameEditor} style={tw`mt-2 flex-row items-center`}>
                        <Text style={tw`font-bold text-base mr-1`}>{userData?.name}</Text>
                        <Feather name="edit-2" size={14} color="#6B7280" />
                    </TouchableOpacity>

                    <Text style={tw`text-xs text-gray-500`}>{userData?.role || "Mentorado"}</Text>

                    {/* Instruction text */}
                    <Text style={tw`text-xs text-gray-400 mt-1 text-center px-4`}>
                        Toque para visualizar • Mantenha pressionado para editar
                    </Text>
                </View>
            </View>


            {/* Questões Pendentes */}
            <View style={tw`p-4 bg-white mt-4 rounded-xl mx-2`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`font-semibold`}>Questões pendentes</Text>
                    {isEditing && (
                        <TouchableOpacity
                            style={tw`p-2  ml-2`}
                            onPress={() => {
                                setEditedData(userData);
                                setSelectedDifficulties(userData?.difficulties || ["Gestão de tempo", "Organização"]);
                                setSelectedSkills(userData?.skills || ["Empatia", "Ouvir", "Análise"]);
                                setSelectedEmotions(userData?.emotions || ["Nenhum"]);
                                setIsEditing(false);
                            }}
                        >
                            <Feather name="x" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>


                {/* Difficulty multiselect */}
                <Text style={tw`text-xs text-gray-500 mb-1`}>1. Qual é a sua dificuldade?</Text>
                {isEditing ? (
                    <View style={tw`mb-2`}>
                        <View style={tw`flex-row flex-wrap`}>
                            {difficultyOptions.map((difficulty) => (
                                <TouchableOpacity
                                    key={difficulty}
                                    style={tw`mr-2 mb-2 px-2 py-1 rounded-md ${selectedDifficulties.includes(difficulty) ? 'bg-blue-500' : 'bg-gray-200'
                                        }`}
                                    onPress={() => {
                                        if (selectedDifficulties.includes(difficulty)) {
                                            setSelectedDifficulties(selectedDifficulties.filter(item => item !== difficulty));
                                        } else {
                                            setSelectedDifficulties([...selectedDifficulties, difficulty]);
                                        }
                                    }}
                                >
                                    <Text
                                        style={tw`text-xs ${selectedDifficulties.includes(difficulty) ? 'text-white' : 'text-gray-800'
                                            }`}
                                    >
                                        {difficulty}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={tw`bg-white border border-gray-200 p-2 rounded-md mb-2`}>
                        <Text style={tw`text-xs text-gray-800`}>
                            {selectedDifficulties.join(', ')}
                        </Text>
                    </View>
                )}

                {/* Skills multiselect */}
                <Text style={tw`text-xs text-gray-500 mb-1`}>2. Quais são as suas habilidades?</Text>
                {isEditing ? (
                    <View style={tw`mb-2`}>
                        <View style={tw`flex-row flex-wrap`}>
                            {skillOptions.map((skill) => (
                                <TouchableOpacity
                                    key={skill}
                                    style={tw`mr-2 mb-2 px-2 py-1 rounded-md ${selectedSkills.includes(skill) ? 'bg-blue-500' : 'bg-gray-200'
                                        }`}
                                    onPress={() => {
                                        if (selectedSkills.includes(skill)) {
                                            setSelectedSkills(selectedSkills.filter(item => item !== skill));
                                        } else {
                                            setSelectedSkills([...selectedSkills, skill]);
                                        }
                                    }}
                                >
                                    <Text
                                        style={tw`text-xs ${selectedSkills.includes(skill) ? 'text-white' : 'text-gray-800'
                                            }`}
                                    >
                                        {skill}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={tw`bg-white border border-gray-200 p-2 rounded-md mb-2`}>
                        <Text style={tw`text-xs text-gray-800`}>
                            {selectedSkills.join(', ')}
                        </Text>
                    </View>
                )}

                {/* Emotion multiselect */}
                <Text style={tw`text-xs text-gray-500 mb-1`}>3. Emoções ou humor</Text>
                {isEditing ? (
                    <View style={tw`mb-2`}>
                        <View style={tw`flex-row flex-wrap`}>
                            {emotionOptions.map((emotion) => (
                                <TouchableOpacity
                                    key={emotion}
                                    style={tw`mr-2 mb-2 px-2 py-1 rounded-md ${selectedEmotions.includes(emotion) ? 'bg-blue-500' : 'bg-gray-200'
                                        }`}
                                    onPress={() => {
                                        if (selectedEmotions.includes(emotion)) {
                                            setSelectedEmotions(selectedEmotions.filter(item => item !== emotion));
                                        } else {
                                            setSelectedEmotions([...selectedEmotions, emotion]);
                                        }
                                    }}
                                >
                                    <Text
                                        style={tw`text-xs ${selectedEmotions.includes(emotion) ? 'text-white' : 'text-gray-800'
                                            }`}
                                    >
                                        {emotion}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={tw`bg-white border border-gray-200 p-2 rounded-md mb-2`}>
                        <Text style={tw`text-xs text-gray-800`}>
                            {selectedEmotions.join(', ')}
                        </Text>
                    </View>
                )}

                <Text style={tw`text-xs text-gray-500 mb-1`}>3. Vícios ou hábitos tóxicos</Text>
                <TextInput
                    style={tw`bg-white border border-gray-200 p-2 rounded-md text-xs`}
                    placeholder="Descreva aqui..."
                    maxLength={25}
                    multiline
                />
                <Text style={tw`text-right text-xs text-gray-400`}>0/25</Text>
            </View>

            {/* Informações */}
            <View style={tw`p-4 bg-white mt-4 rounded-xl mx-2`}>
                <Text style={tw`font-semibold mb-4`}>Informações</Text>

                <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-xs text-[#999CA1]`}>🔗 Portfólio</Text>
                    {isEditing ? (
                        <TextInput
                            style={tw`text-xs text-blue-500 border-b border-gray-300 p-1 w-1/2 text-right`}
                            value={editedData?.portfolio || ""}
                            onChangeText={(text: string) => setEditedData({ ...editedData, portfolio: text })}
                            placeholder="Seu portfólio"
                        />
                    ) : (
                        <Text style={tw`text-xs text-blue-500`}>{userData?.portfolio || "Não fornecido"}</Text>
                    )}
                </View>

                <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-xs text-[#999CA1]`}>✉️ Email</Text>
                    {isEditing ? (
                        <TextInput
                            style={tw`text-xs text-gray-800 border-b border-gray-300 p-1 w-1/2 text-right`}
                            value={editedData?.email || ""}
                            onChangeText={(text) => setEditedData({ ...editedData, email: text })}
                            placeholder="Seu email"
                            keyboardType="email-address"
                        />
                    ) : (
                        <Text style={tw`text-xs text-gray-800 mb-2`}>{userData?.email}</Text>
                    )}
                </View>

                <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-xs text-[#999CA1]`}>📞 Telefone</Text>
                    {isEditing ? (
                        <TextInput
                            style={tw`text-xs text-gray-800 border-b border-gray-300 p-1 w-1/2 text-right`}
                            value={editedData?.phone || ""}
                            onChangeText={(text) => setEditedData({ ...editedData, phone: text })}
                            placeholder="Seu telefone"
                            keyboardType="phone-pad"
                        />
                    ) : (
                        <Text style={tw`text-xs text-gray-800 mb-2`}>{userData?.phone}</Text>
                    )}
                </View>

                <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-xs text-[#999CA1]`}>📍 Endereço</Text>
                    {isEditing ? (
                        <TextInput
                            style={tw`text-xs text-gray-800 border-b border-gray-300 p-1 w-1/2 text-right`}
                            value={editedData?.address || ""}
                            onChangeText={(text) => setEditedData({ ...editedData, address: text })}
                            placeholder="Seu endereço"
                        />
                    ) : (
                        <Text style={tw`text-xs text-gray-800`}>{userData?.address}</Text>
                    )}
                </View>

                {/* Programas */}
                <View style={tw`mt-4 mx-2 border-t border-gray-200 pt-4`}>
                    <Text style={tw`font-semibold mb-2`}>Programas</Text>

                    {isEditing && (
                        <View style={tw`flex-row items-center mb-2`}>
                            <TextInput
                                style={tw`flex-1 px-2 py-1 border border-gray-300 rounded-md text-xs`}
                                placeholder="Adicionar novo programa..."
                                onSubmitEditing={(e) => {
                                    if (editedData) {  // Check if editedData is not null
                                        const newProgram = e.nativeEvent.text.trim();
                                        if (newProgram && !editedData.programs?.includes(newProgram)) {
                                            const updatedPrograms = [...(editedData.programs || []), newProgram];
                                            setEditedData({
                                                ...editedData,  // This preserves name, email and other required fields
                                                programs: updatedPrograms
                                            });
                                            e.currentTarget.setNativeProps({ text: '' });
                                        }
                                    }
                                }}
                                returnKeyType="done"
                            />
                        </View>
                    )}

                    <View style={tw`flex-row flex-wrap gap-2`}>
                        {(isEditing ? (editedData?.programs || programsOptions) :
                            (userData?.programs || programsOptions))
                            .map((tag, index) => (
                                <View key={index} style={tw`flex-row items-center px-2 py-1 bg-[#EDF1F8] border-[0.6px] border-[#D8D8D8] rounded-md`}>
                                    <Text style={tw`text-xs text-gray-700`}>{tag}</Text>
                                    {isEditing && (
                                        <TouchableOpacity
                                            style={tw`ml-1`}
                                            onPress={() => {
                                                if (editedData) {  // Check if editedData is not null
                                                    const defaultPrograms = programsOptions;
                                                    const currentPrograms = editedData.programs || defaultPrograms;
                                                    const updatedPrograms = currentPrograms.filter((_, i) => i !== index);
                                                    setEditedData({
                                                        ...editedData,  // This preserves name, email and other required fields
                                                        programs: updatedPrograms
                                                    });
                                                }
                                            }}
                                        >
                                            <Feather name="x" size={12} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))
                        }
                    </View>
                </View>
            </View>


            {/* Conexões */}
            <View style={tw`p-4 bg-white my-4 rounded-xl mx-2`}>
                <View style={tw`flex-row justify-between items-center mb-4 shadow-sm`}>
                    <Text style={tw`font-semibold`}>Conexões {filteredConnections.length}</Text>
                    <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`text-xs text-gray-500 mr-1`}>{activeFilter}</Text>
                            <Feather name="filter" size={16} color="gray" />
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={[tw``, { maxHeight: maxConnectionsHeight, }]}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                >
                    {filteredConnections.map((connection, i) => (
                        <View key={connection.id} style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}>
                            <View style={tw`flex-row items-center`}>
                                <Image
                                    source={{ uri: connection.avatar }}
                                    style={tw`w-10 h-10 rounded-full mr-3`}
                                />
                                <View>
                                    <Text style={tw`text-sm`}>{connection.name}</Text>
                                    <Text style={tw`text-sm text-gray-500 `}>{connection.country}, {connection.province}</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={tw`text-xs ${connection.role === 'Mentor' ? 'text-blue-500' : 'text-green-500'}`}>
                                    {connection.role}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Filter Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={filterModalVisible}
                    onRequestClose={() => setFilterModalVisible(false)}
                >
                    <TouchableOpacity
                        style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}
                        activeOpacity={1}
                        onPress={() => setFilterModalVisible(false)}
                    >
                        <View style={tw`bg-white rounded-xl p-4 w-3/4 mx-4`}>
                            <Text style={tw`text-lg font-bold mb-4 text-center`}>Filtrar Conexões</Text>

                            <TouchableOpacity
                                style={tw`py-3 px-4 ${activeFilter === 'Todos' ? 'bg-blue-100' : ''} rounded-md mb-2`}
                                onPress={() => applyFilter('Todos')}
                            >
                                <Text style={tw`${activeFilter === 'Todos' ? 'text-blue-500 font-bold' : 'text-gray-700'}`}>
                                    Todos
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={tw`py-3 px-4 ${activeFilter === 'Mentor' ? 'bg-blue-100' : ''} rounded-md mb-2`}
                                onPress={() => applyFilter('Mentor')}
                            >
                                <Text style={tw`${activeFilter === 'Mentor' ? 'text-blue-500 font-bold' : 'text-gray-700'}`}>
                                    Mentores
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={tw`py-3 px-4 ${activeFilter === 'Mentorado' ? 'bg-blue-100' : ''} rounded-md mb-2`}
                                onPress={() => applyFilter('Mentorado')}
                            >
                                <Text style={tw`${activeFilter === 'Mentorado' ? 'text-blue-500 font-bold' : 'text-gray-700'}`}>
                                    Mentorados
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={tw`mt-4 py-2 bg-gray-200 rounded-md`}
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <Text style={tw`text-center font-semibold`}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>

            {/* Photo Viewer Modal */}
            <PhotoViewerModal />

            {/* Name Editor Modal */}
            <NameEditor
                visible={nameEditVisible}
                initialName={userData?.name || ""}
                onClose={() => setNameEditVisible(false)}
                onSave={async (newName) => {
                    try {
                        setIsLoading(true);
                        const updatedUserData = { ...userData, name: newName };
                        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
                        setUserData(updatedUserData);
                        setEditedData(updatedUserData);
                        setNameEditVisible(false);
                        Alert.alert("Sucesso", "Nome atualizado com sucesso!");
                    } catch (error) {
                        console.error("Error updating name:", error);
                        Alert.alert("Erro", "Falha ao atualizar o nome");
                    } finally {
                        setIsLoading(false);
                    }
                }}
            />
        </ScrollView>
    );
};

export default ProfileScreen;
