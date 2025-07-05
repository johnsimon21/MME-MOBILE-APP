import React, { useState, useEffect, use } from "react";
import { Modal, FlatList, Dimensions } from "react-native";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import tw from "twrnc";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Navbar } from "@/src/presentation/components/ui/navbar";
import { useAuth } from "@/src/context/AuthContext";
import { useAuthState } from "@/src/hooks/useAuthState";

interface Relationship {
    id: string;
    status: 'paired' | 'blocked' | 'pending' | 'rejected';
    date: string | Date;
}

interface UserProfileData {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    image: string;
    portfolio: string;
    role: string;
    status: 'online' | 'offline' | 'away';
    lastActive: string;
    joinedDate: string;
    totalHours: number;
    completionRate: number;
    averageRating: number;
    sessionsCount: number;
    difficulties: string[];
    skills: string[];
    emotions: string[];
    programs: string[];
    monthlyProgress: number[];
    recentSessions: {
        date: string;
        duration: number;
        type: string;
        rating: number;
        description: string;
    }[];
    connections: {
        id: string;
        name: string;
        country: string;
        province: string;
        role: "Mentor" | "Mentorado";
        avatar: string;
    }[];
}

export const UserProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { userId } = route.params as { userId: string };
    const { isCoordinator } = useAuthState();

    const [userData, setUserData] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'connections'>('overview');
    const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
    const allUsersData: UserProfileData[] = [
        {
            id: "1",
            name: "Lukombo Afonso",
            email: "lukombo@example.com",
            phone: "+244 942 032 806",
            address: "Cazenga, Luanda, Angola",
            image: "https://randomuser.me/api/portraits/men/1.jpg",
            portfolio: "https://lukomiron.vercel.app",
            role: "Mentorado",
            status: "online",
            lastActive: "Agora",
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            sessionsCount: 15,
            difficulties: ["Gestão de tempo", "Organização"],
            skills: ["Empatia", "Ouvir", "Análise"],
            emotions: ["Nenhum"],
            programs: ["Programação", "Plano de Carreira", "Empreendedorismo", "Educação Financeira", "Comunicação Eficiente"],
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                {
                    date: "2025-01-15",
                    duration: 60,
                    type: "Mentoria",
                    rating: 5,
                    description: "Sessão focada em desenvolvimento de carreira"
                },
                {
                    date: "2025-01-12",
                    duration: 45,
                    type: "Coaching",
                    rating: 4,
                    description: "Trabalho em habilidades de comunicação"
                },
                {
                    date: "2025-01-10",
                    duration: 30,
                    type: "Feedback",
                    rating: 4,
                    description: "Revisão de progresso mensal"
                }
            ],
            connections: [
                { id: '1', name: 'Ana Silva', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
                { id: '2', name: 'Carlos Mendes', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
                { id: '3', name: 'Maria Luísa', role: 'Mentorado', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/3.jpg' }
            ]
        },
        {
            id: "2",
            name: "Lucy Script",
            email: "lucy@example.com",
            phone: "+244 923 456 789",
            address: "Maianga, Luanda, Angola",
            image: "https://randomuser.me/api/portraits/women/2.jpg",
            portfolio: "https://lucyscript.dev",
            role: "Admin",
            status: "online",
            lastActive: "Agora",
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            sessionsCount: 16,
            difficulties: ["Liderança", "Delegação"],
            skills: ["Gestão", "Comunicação", "Resolução de problemas"],
            emotions: ["Confiante"],
            programs: ["Liderança", "Gestão de Equipes", "Desenvolvimento Pessoal"],
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                {
                    date: "2025-01-15",
                    duration: 60,
                    type: "Mentoria",
                    rating: 5,
                    description: "Sessão de liderança e gestão de equipes"
                },
                {
                    date: "2025-01-12",
                    duration: 45,
                    type: "Coaching",
                    rating: 4,
                    description: "Desenvolvimento de habilidades administrativas"
                },
                {
                    date: "2025-01-10",
                    duration: 30,
                    type: "Feedback",
                    rating: 4,
                    description: "Avaliação de performance da equipe"
                }
            ],
            connections: [
                { id: '4', name: 'Pedro Santos', role: 'Mentorado', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
                { id: '5', name: 'Sofia Costa', role: 'Mentor', country: "Angola", province: "Benguela", avatar: 'https://randomuser.me/api/portraits/women/5.jpg' }
            ]
        },
        {
            id: "3",
            name: "Java Simon",
            email: "java@example.com",
            phone: "+244 934 567 890",
            address: "Ingombota, Luanda, Angola",
            image: "https://randomuser.me/api/portraits/men/3.jpg",
            portfolio: "https://javasimon.tech",
            role: "Desenvolvedor",
            status: "online",
            lastActive: "Agora",
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            sessionsCount: 14,
            difficulties: ["Algoritmos complexos", "Arquitetura de software"],
            skills: ["Java", "Spring Boot", "Resolução de problemas"],
            emotions: ["Focado"],
            programs: ["Programação Avançada", "Arquitetura de Software", "DevOps"],
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                {
                    date: "2025-01-15",
                    duration: 60,
                    type: "Mentoria",
                    rating: 5,
                    description: "Sessão sobre padrões de design em Java"
                },
                {
                    date: "2025-01-12",
                    duration: 45,
                    type: "Coaching",
                    rating: 4,
                    description: "Revisão de código e boas práticas"
                },
                {
                    date: "2025-01-10",
                    duration: 30,
                    type: "Feedback",
                    rating: 4,
                    description: "Avaliação de projeto pessoal"
                }
            ],
            connections: [
                { id: '6', name: 'Tech Mentor', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/6.jpg' },
                { id: '7', name: 'Code Buddy', role: 'Mentorado', country: "Angola", province: "Huíla", avatar: 'https://randomuser.me/api/portraits/men/7.jpg' }
            ]
        },
        {
            id: "4",
            name: "Jocy Simon",
            email: "jocy@example.com",
            phone: "+244 945 678 901",
            address: "Viana, Luanda, Angola",
            image: "https://randomuser.me/api/portraits/women/4.jpg",
            portfolio: "https://jocysimon.portfolio.com",
            role: "Designer",
            status: "offline",
            lastActive: "2 horas atrás",
            joinedDate: "2024-03-15",
            totalHours: 45.5,
            completionRate: 87,
            averageRating: 4.2,
            sessionsCount: 14,
            difficulties: ["Criatividade sob pressão", "Gestão de clientes"],
            skills: ["Design gráfico", "UI/UX", "Criatividade"],
            emotions: ["Inspirada"],
            programs: ["Design Thinking", "UX/UI Design", "Marketing Visual"],
            monthlyProgress: [12, 8, 15, 10, 18, 14, 20],
            recentSessions: [
                {
                    date: "2025-01-15",
                    duration: 60,
                    type: "Mentoria",
                    rating: 5,
                    description: "Sessão sobre tendências de design 2025"
                },
                {
                    date: "2025-01-12",
                    duration: 45,
                    type: "Coaching",
                    rating: 4,
                    description: "Desenvolvimento de portfólio criativo"
                },
                {
                    date: "2025-01-10",
                    duration: 30,
                    type: "Feedback",
                    rating: 4,
                    description: "Revisão de projetos de UI/UX"
                }
            ],
            connections: [
                { id: '8', name: 'Design Guru', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/women/8.jpg' },
                { id: '9', name: 'Creative Mind', role: 'Mentorado', country: "Angola", province: "Benguela", avatar: 'https://randomuser.me/api/portraits/women/9.jpg' }
            ]
        },
        {
            id: "5",
            name: "Cardoso Manuel",
            email: "cardoso@example.com",
            phone: "+244 956 789 012",
            address: "Kilamba, Luanda, Angola",
            image: "https://randomuser.me/api/portraits/men/5.jpg",
            portfolio: "https://cardosomanuel.biz",
            role: "Empreendedor",
            status: "away",
            lastActive: "5 min atrás",
            joinedDate: "2024-05-20",
            totalHours: 24.0,
            completionRate: 92,
            averageRating: 4.5,
            sessionsCount: 8,
            difficulties: ["Gestão financeira", "Escalabilidade do negócio"],
            skills: ["Liderança", "Visão estratégica", "Networking"],
            emotions: ["Determinado"],
            programs: ["Empreendedorismo", "Gestão Financeira", "Liderança Empresarial"],
            monthlyProgress: [5, 3, 8, 6, 12, 9, 15],
            recentSessions: [
                {
                    date: "2025-01-14",
                    duration: 50,
                    type: "Mentoria",
                    rating: 5,
                    description: "Estratégias de crescimento empresarial"
                },
                {
                    date: "2025-01-11",
                    duration: 40,
                    type: "Coaching",
                    rating: 4,
                    description: "Planejamento financeiro para startups"
                }
            ],
            connections: [
                { id: '10', name: 'Business Mentor', role: 'Mentor', country: "Angola", province: "Luanda", avatar: 'https://randomuser.me/api/portraits/men/10.jpg' },
                { id: '11', name: 'Startup Friend', role: 'Mentorado', country: "Angola", province: "Huambo", avatar: 'https://randomuser.me/api/portraits/men/11.jpg' }
            ]
        }
    ];

    const relationships: Relationship[] = [
        {
            id: "1",
            status: "paired",
            date: new Date("2025-04-15"),
        },
        {
            id: "2",
            status: "blocked",
            date: new Date("2025-05-15"),
        },
        {
            id: "2",
            status: "paired",
            date: new Date("2025-05-15"),
        },
        {
            id: "3",
            status: "pending",
            date: new Date("2025-02-15"),
        },
        {
            id: "4",
            status: "rejected",
            date: new Date("2025-01-15"),
        },
    ]

    useEffect(() => {
        loadUserProfile(userId);
    }, [userId]);

    const handleViewProfile = (userId: string) => {
        // @ts-ignore
        navigation.navigate('UserProfile', { userId });
    };

    const pairingStatusColor = {
        paired: '#10B981',
        blocked: '#EF4444',
        pending: '#F59E0B',
        rejected: '#6B7280'
    }
    const pairingStatusText = {
        paired: 'Emparelhado',
        blocked: 'Bloqueado',
        pending: 'Pendente',
        rejected: 'Rejeitado'
    }

    const pairingStatus = (userId: string): { isConnected: boolean, status: string } => {
        if (!relationships) return { isConnected: false, status: 'none' };

        const isConnected = relationships.some(relationship => relationship.id === userId);
        return { isConnected, status: relationships.find(relationship => relationship.id === userId)?.status || 'none' };
    }

    const simulatePairingResponse = async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (!userData) return false;

        relationships.find(relationship => relationship.id === userData.id)!.status = 'paired';


        setUserData(prev => ({
            ...prev!,
            connections: [...prev!.connections, {
                id: userData.id,
                name: userData.name,
                country: "Angola",
                province: "Luanda",
                role: userData.role as "Mentor" | "Mentorado",
                avatar: userData.image
            }]
        }));

        pairingStatus(userId);
    }

    const pairingRequest = (userId: string) => {
        if (!userData) return;

        relationships.push({
            id: userData.id,
            status: 'pending',
            date: new Date().toISOString()
        });

        Alert.alert(
            "Emparelhar Usuário",
            `Você deseja emparelhar com ${userData.name}?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Emparelhar",
                    onPress: () => {
                        simulatePairingResponse();
                    }
                }
            ]
        );
    }

    const handleRemoveUser = () => {
        if (!userData) return;

        Alert.alert(
            "Remover Usuário",
            `Tem certeza que deseja remover ${userData.name}? Esta ação não pode ser desfeita.`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Remover",
                    style: "destructive",
                    onPress: () => {
                        // Here you would typically make an API call to remove the user
                        // For now, we'll just show a success message and navigate back
                        Alert.alert(
                            "Sucesso",
                            `${userData.name} foi removido com sucesso.`,
                            [
                                {
                                    text: "OK",
                                    onPress: () => navigation.goBack()
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const loadUserProfile = async (userId: string) => {
        try {
            setIsLoading(true);
            // Simulate API call - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Find user by ID
            const foundUser = allUsersData.find(user => user.id === userId);

            if (foundUser) {
                setUserData(foundUser);
                console.log("User found:", foundUser.id);
            } else {
                console.error("User not found with ID:", userId);
            }

        } catch (error) {
            console.error("Error loading user profile:", error);
            Alert.alert("Error", "Failed to load user profile");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#10B981';
            case 'away': return '#F59E0B';
            case 'offline': return '#6B7280';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online': return 'Online';
            case 'away': return 'Ausente';
            case 'offline': return 'Offline';
            default: return 'Desconhecido';
        }
    };

    const ProgressBar = ({ progress, color = "#4F46E5" }: { progress: number; color?: string }) => (
        <View style={tw`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
            <View
                style={[
                    tw`h-full rounded-full`,
                    { width: `${progress}%`, backgroundColor: color }
                ]}
            />
        </View>
    );

    const MiniChart = ({ data }: { data: number[] }) => {
        const maxValue = Math.max(...data);
        return (
            <View style={tw`flex-row items-end h-16 bg-gray-50 rounded-lg p-2`}>
                {data.map((value, index) => (
                    <View key={index} style={tw`flex-1 items-center mx-0.5`}>
                        <View
                            style={[
                                tw`bg-blue-500 rounded-t-sm w-full`,
                                { height: (value / maxValue) * 40 }
                            ]}
                        />
                        <Text style={tw`text-xs text-gray-500 mt-1`}>
                            {['J', 'F', 'M', 'A', 'M', 'J', 'J'][index]}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    // Photo Viewer Modal Component
    const PhotoViewerModal = () => {
        if (!userData) return null;

        return (
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
                        <Text style={tw`text-white text-xl font-bold`}>{userData.name}</Text>
                        <Text style={tw`text-gray-300 text-sm`}>{userData.role}</Text>
                    </View>

                    {/* Full screen image */}
                    <TouchableOpacity
                        style={tw`flex-1 justify-center items-center w-full`}
                        onPress={() => setPhotoViewerVisible(false)}
                        activeOpacity={1}
                    >
                        <Image
                            source={{ uri: userData.image }}
                            style={tw`w-full h-full`}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    {/* Bottom info */}
                    <View style={tw`absolute bottom-12 left-4 right-4 bg-black bg-opacity-50 rounded-xl p-4`}>
                        <View style={tw`flex-row items-center justify-between`}>
                            <View>
                                <Text style={tw`text-white font-medium`}>Status: {getStatusText(userData.status)}</Text>
                                <Text style={tw`text-gray-300 text-sm`}>Último acesso: {userData.lastActive}</Text>
                            </View>
                            <View
                                style={[
                                    tw`w-4 h-4 rounded-full`,
                                    { backgroundColor: getStatusColor(userData.status) }
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-white`}>
                <Navbar title="Perfil do Usuário" showBackButton={true} theme="light" />
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={tw`flex-1 bg-white`}>
                <Navbar title="Perfil do Usuário" showBackButton={true} theme="light" />
                <View style={tw`flex-1 justify-center items-center`}>
                    <Text style={tw`text-gray-500 text-lg`}>Perfil indisponível, tenta mais tarde!</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            <Navbar title={userData.name ?? "Perfil"} showBackButton={true} theme="light" />

            <ScrollView style={tw`h-full pt-2`}>

                {/* Profile Header */}
                <View style={tw`relative px-2 `}>
                    <View style={tw`bg-[#75A5F5] h-24 rounded-t-4`} />
                    <View style={tw`bg-white h-36 rounded-b-4`} />

                    <View style={tw`absolute top-12 left-0 right-0 items-center`}>
                        <TouchableOpacity
                            onPress={() => setPhotoViewerVisible(true)}
                            style={[
                                tw`rounded-full`,
                                { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }
                            ]}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={{ uri: userData?.image }}
                                style={tw`w-20 h-20 rounded-full border-4 border-white`}
                            />
                            <View
                                style={[
                                    tw`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white`,
                                    { backgroundColor: getStatusColor(userData?.status || 'offline') }
                                ]}
                            />
                            {/* Add camera icon overlay to indicate it's clickable */}
                            <View style={tw`absolute inset-0 rounded-full bg-black bg-opacity-20 items-center justify-center`}>
                                <MaterialIcons name="zoom-in" size={20} color="white" style={tw`opacity-70`} />
                            </View>
                        </TouchableOpacity>
                        <Text style={tw`mt-2 font-bold text-base`}>{userData?.name}</Text>
                        <Text style={tw`text-xs text-gray-500`}>{userData?.role}</Text>
                        <Text style={tw`text-xs text-gray-400`}>
                            {getStatusText(userData?.status || 'offline')} • {userData?.lastActive}
                        </Text>
                    </View>

                    {!isCoordinator && ( // This section need more atention to be more dynamic
                        <TouchableOpacity
                            onPress={pairingRequest.bind(null, userData?.id)}
                            style={tw`flex-row ${pairingStatus(userData?.id).status === 'paired' ? `bg-[${pairingStatus(userData?.id).status}]` : 'bg-[#75A5F5]'} rounded-3 px-3 py-3 absolute bottom-2 right-4 shadow-lg`}
                        >
                            <Feather name={pairingStatus(userData?.id).status === 'paired' ? 'user-check' : 'user-plus'} size={14} color="white" />
                            <Text style={tw`text-white text-xs font-medium ml-2`}>{pairingStatus(userData?.id).status === 'paired' ? 'Desvincular' : 'Emparelhar'}</Text>
                        </TouchableOpacity>
                    )}
                </View>


                {/* Stats Cards */}
                <View style={tw`px-4 py-4`}>
                    <View style={tw`flex-row justify-between mb-4`}>
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm flex-1 mx-1 items-center`}>
                            <Text style={tw`text-2xl font-bold text-blue-600`}>{userData.totalHours}h</Text>
                            <Text style={tw`text-xs text-gray-500`}>Total Horas</Text>
                        </View>
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm flex-1 mx-1 items-center`}>
                            <Text style={tw`text-2xl font-bold text-green-600`}>{userData.completionRate}%</Text>
                            <Text style={tw`text-xs text-gray-500`}>Conclusão</Text>
                        </View>
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm flex-1 mx-1 items-center`}>
                            <View style={tw`flex-row items-center`}>
                                <Text style={tw`text-2xl font-bold text-yellow-600`}>{userData.averageRating}</Text>
                                <MaterialIcons name="star" size={16} color="#EAB308" />
                            </View>
                            <Text style={tw`text-xs text-gray-500`}>Avaliação</Text>
                        </View>
                    </View>
                </View>

                {/* Tab Navigation */}
                <View style={tw`px-4 mb-4`}>
                    <View style={tw`flex-row bg-white rounded-xl p-1`}>
                        {[
                            { key: 'overview', label: 'Visão Geral' },
                            { key: 'sessions', label: 'Sessões' },
                            { key: 'connections', label: 'Conexões' }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={tw`flex-1 py-3 rounded-lg ${activeTab === tab.key ? 'bg-blue-500' : ''}`}
                                onPress={() => setActiveTab(tab.key as any)}
                            >
                                <Text style={tw`text-center font-medium ${activeTab === tab.key ? 'text-white' : 'text-gray-600'}`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <View style={tw`px-4`}>
                        {/* Personal Information */}
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-4`}>
                            <Text style={tw`font-bold text-gray-800 mb-3`}>Informações Pessoais</Text>
                            <View style={tw`space-y-2`}>
                                <View style={tw`flex-row justify-between py-2 border-b border-gray-100`}>
                                    <Text style={tw`text-gray-600`}>Email:</Text>
                                    <Text style={tw`font-medium`}>{userData.email}</Text>
                                </View>
                                <View style={tw`flex-row justify-between py-2 border-b border-gray-100`}>
                                    <Text style={tw`text-gray-600`}>Telefone:</Text>
                                    <Text style={tw`font-medium`}>{userData.phone}</Text>
                                </View>
                                <View style={tw`flex-row justify-between py-2 border-b border-gray-100`}>
                                    <Text style={tw`text-gray-600`}>Endereço:</Text>
                                    <Text style={tw`font-medium flex-1 text-right`}>{userData.address}</Text>
                                </View>
                                <View style={tw`flex-row justify-between py-2`}>
                                    <Text style={tw`text-gray-600`}>Portfólio:</Text>
                                    <Text style={tw`font-medium text-blue-500`}>{userData.portfolio}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Skills & Difficulties */}
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-4`}>
                            <Text style={tw`font-bold text-gray-800 mb-3`}>Habilidades e Dificuldades</Text>

                            <Text style={tw`text-sm text-gray-600 mb-2`}>Habilidades:</Text>
                            <View style={tw`flex-row flex-wrap mb-4`}>
                                {userData.skills.map((skill, index) => (
                                    <View key={index} style={tw`bg-green-100 px-3 py-1 rounded-full mr-2 mb-2`}>
                                        <Text style={tw`text-green-800 text-sm`}>{skill}</Text>
                                    </View>
                                ))}
                            </View>

                            <Text style={tw`text-sm text-gray-600 mb-2`}>Dificuldades:</Text>
                            <View style={tw`flex-row flex-wrap`}>
                                {userData.difficulties.map((difficulty, index) => (
                                    <View key={index} style={tw`bg-red-100 px-3 py-1 rounded-full mr-2 mb-2`}>
                                        <Text style={tw`text-red-800 text-sm`}>{difficulty}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Programs */}
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-4`}>
                            <Text style={tw`font-bold text-gray-800 mb-3`}>Programas</Text>
                            <View style={tw`flex-row flex-wrap`}>
                                {userData.programs.map((program, index) => (
                                    <View key={index} style={tw`bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2`}>
                                        <Text style={tw`text-blue-800 text-sm`}>{program}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Monthly Progress */}
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-4`}>
                            <Text style={tw`font-bold text-gray-800 mb-3`}>Progresso Mensal</Text>
                            <MiniChart data={userData.monthlyProgress} />
                        </View>
                    </View>
                )}

                {activeTab === 'sessions' && (
                    <View style={tw`px-4`}>
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-4`}>
                            <Text style={tw`font-bold text-gray-800 mb-3`}>Sessões Recentes</Text>
                            {userData.recentSessions.map((session, index) => (
                                <View key={index} style={tw`border-b border-gray-100 py-3 ${index === userData.recentSessions.length - 1 ? 'border-b-0' : ''}`}>
                                    <View style={tw`flex-row justify-between items-start mb-2`}>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`font-medium text-gray-800`}>{session.type}</Text>
                                            <Text style={tw`text-sm text-gray-500`}>
                                                {new Date(session.date).toLocaleDateString('pt-BR')} • {session.duration} min
                                            </Text>
                                        </View>
                                        <View style={tw`flex-row items-center bg-yellow-50 px-2 py-1 rounded-full`}>
                                            <MaterialIcons name="star" size={16} color="#EAB308" />
                                            <Text style={tw`text-sm font-medium text-yellow-800 ml-1`}>{session.rating}</Text>
                                        </View>
                                    </View>
                                    <Text style={tw`text-sm text-gray-600`}>{session.description}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'connections' && (
                    <View style={tw`px-4`}>
                        <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-4`}>
                            <Text style={tw`font-bold text-gray-800 mb-3`}>Conexões ({userData.connections.length})</Text>
                            {userData.connections.map((connection, index) => (
                                <TouchableOpacity onPress={() => handleViewProfile(connection.id)} key={connection.id} style={tw`flex-row items-center py-3 ${index !== userData.connections.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <Image
                                        source={{ uri: connection.avatar }}
                                        style={tw`w-12 h-12 rounded-full mr-3`}
                                    />
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`font-medium text-gray-800`}>{connection.name}</Text>
                                        <Text style={tw`text-sm text-gray-500`}>{connection.province}, {connection.country}</Text>
                                    </View>
                                    <View style={tw`bg-${connection.role === 'Mentor' ? 'purple' : 'blue'}-100 px-2 py-1 rounded-full`}>
                                        <Text style={tw`text-${connection.role === 'Mentor' ? 'purple' : 'blue'}-800 text-xs font-medium`}>
                                            {connection.role}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                {isCoordinator && (
                    <View style={tw`px-4 pb-6`}>
                        <View style={tw`flex-row justify-between`}>
                            <TouchableOpacity
                                style={tw`bg-red-200 px-6 py-3 rounded-xl flex-1 ml-2`}
                                onPress={handleRemoveUser}
                            >
                                <Text style={tw`text-red-800 text-center font-medium`}>Remover</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Photo Viewer Modal */}
                <PhotoViewerModal />
            </ScrollView>
        </View>
    );
};
