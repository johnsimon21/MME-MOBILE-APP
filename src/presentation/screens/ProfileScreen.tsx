import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Navbar } from "../components/ui/navbar";
import { Feather } from "@expo/vector-icons";

interface UserData {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    portfolio?: string;
    role?: string;
    difficulties?: string[];
    skills?: string[];
    emotions?: string[];
}


export const ProfileScreen = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editedData, setEditedData] = useState<UserData | null>(null);
    const navigation = useNavigation();

    const difficultyOptions = ["Gestão de tempo", "Organização", "Cálculos", "Línguas", "Teoria", "Outro"];
    const skillOptions = ["Informática", "Cálculos", "Línguas", "Teoria", "Empatia", "Ouvir", "Análise"];
    const emotionOptions = ["Ansiedade", "Depressão", "Estresse", "Nenhum", "Outro"];
    const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["Nenhum"]);

    // Add these state variables to your component
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["Gestão de tempo", "Organização"]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(["Empatia", "Ouvir", "Análise"]);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setIsLoading(true);
            // For demo purposes, create some mock data if none exists
            const userDataString = await AsyncStorage.getItem('user');
            if (userDataString) {
                const parsedData = JSON.parse(userDataString);
                setUserData(parsedData);
                setEditedData(parsedData);
            } else {
                // Mock data for demonstration
                const mockData = {
                    name: "Lukombo Afonso",
                    email: "johnmiradojr@gmail.com",
                    phone: "+244 942 032 806",
                    address: "Cazenga, Luanda, Angola",
                    portfolio: "https://lukomiron.vercel.app",
                    role: "Mentorado"
                };
                setUserData(mockData);
                setEditedData(mockData);
                await AsyncStorage.setItem('user', JSON.stringify(mockData));
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            Alert.alert("Error", "Failed to load profile data");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEditMode = async () => {
        if (isEditing) {
            // If currently editing, save changes
            if (!editedData) return;

            try {
                setIsLoading(true);
                await AsyncStorage.setItem('user', JSON.stringify({
                    ...editedData,
                    difficulties: selectedDifficulties,
                    skills: selectedSkills,
                    emotions: selectedEmotions  // Add this line
                }));
                setUserData({
                    ...editedData,
                    difficulties: selectedDifficulties,
                    skills: selectedSkills,
                    emotions: selectedEmotions  // Add this line
                });
                setIsEditing(false);
                Alert.alert("Success", "Profile updated successfully");
            } catch (error) {
                console.error("Error saving user data:", error);
                Alert.alert("Error", "Failed to save profile data");
            } finally {
                setIsLoading(false);
            }
        } else {
            // If not editing, enter edit mode
            setIsEditing(true);
        }
    };

    const handleSaveChanges = async () => {
        if (!editedData) return;

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
        setEditedData(userData);
        setIsEditing(false);
    };

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

    return (
        <ScrollView style={tw`bg-gray-200 h-full`}>
            <Navbar title="Meu Perfil" showBackButton={true} theme="light" />

            <View style={tw`relative px-4`}>
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
                    <View style={[
                        tw`rounded-full`,
                        { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }
                    ]}>
                        <Image
                            source={{ uri: 'https://randomuser.me/api/portraits/men/75.jpg' }}
                            style={tw`w-20 h-20 rounded-full border-4 border-white`}
                        />
                    </View>
                    <Text style={tw`mt-2 font-bold text-base`}>{userData?.name}</Text>
                    <Text style={tw`text-xs text-gray-500`}>{userData?.role || "Mentorado"}</Text>
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
                    maxLength={125}
                    multiline
                />
                <Text style={tw`text-right text-xs text-gray-400`}>0/125</Text>
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
                            onChangeText={(text) => setEditedData({ ...editedData, portfolio: text })}
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
                    <View style={tw`flex-row flex-wrap gap-2`}>
                        {['Programação', 'Plano de Carreira', 'Empreendedorismo', 'Educação Financeira', 'Comunicação Eficiente'].map((tag, index) => (
                            <Text key={index} style={tw`px-2 py-1 bg-[#EDF1F8] border-[0.6px] border-[#D8D8D8] text-xs rounded-md text-gray-700`}>{tag}</Text>
                        ))}
                    </View>
                </View>
            </View>


            {/* Conexões */}
            <View style={tw`p-4 bg-white my-4 rounded-xl mx-2`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`font-semibold`}>Conexões 102</Text>
                    <TouchableOpacity>
                        <Feather name="filter" size={16} color="gray" />
                    </TouchableOpacity>
                </View>

                {[1, 2, 3, 4, 5].map((_, i) => (
                    <View key={i} style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`w-10 h-10 bg-gray-300 rounded-full mr-3`} />
                            <View>
                                <Text style={tw`text-sm`}>Nome do Mentor</Text>
                                <Text style={tw`text-xs text-blue-500`}>Mentor</Text>
                            </View>
                        </View>
                        <TouchableOpacity>
                            <Feather name="more-vertical" size={16} color="gray" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

export default ProfileScreen;
