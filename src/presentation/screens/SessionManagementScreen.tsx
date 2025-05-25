import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, FlatList, Pressable, Image, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useFocusEffect } from '@react-navigation/native';

import { Navbar } from "../components/ui/navbar";
import { UserDrawer } from "../components/ui/UserDrawer";
import { Session, getSessions } from "@/src/data/sessionService";


export function SessionManagementScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<"Todas" | "Nova" | "Concluída">("Todas");
    const [userDrawerVisible, setUserDrawerVisible] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([
        { id: "1", name: "Sessão 1", description: "Detalhes da sessão 1", status: "Nova", scheduledDate: "16 de Janeiro, 2025" },
        { id: "2", name: "Sessão 2", description: "Detalhes da sessão 2", status: "Concluída", scheduledDate: "16 de Janeiro, 2025", completedDate: "01 de Janeiro, 2025" },
        { id: "3", name: "Sessão 3", description: "Detalhes da sessão 3", status: "Concluída", scheduledDate: "16 de Janeiro, 2025", completedDate: "01 de Janeiro, 2025" }
    ]);
       const [isLoading, setIsLoading] = useState(true);

    const handleUserSelect = (user: any) => {
        console.log("Selected user:", user);
        setUserDrawerVisible(false);
        // Here you would typically add the user to the session or perform other actions
    };

    // Load sessions when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const loadSessions = async () => {
                setIsLoading(true);
                try {
                    const loadedSessions = await getSessions();
                    console.log("Loaded sessions:", loadedSessions.length);
                    setSessions(loadedSessions);
                } catch (error) {
                    console.error("Error loading sessions:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            
            loadSessions();
        }, [])
    );
    

    // Filtrar sessões com base no nome e status
    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === "Todas" || session.status === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    // Reset filters
    const resetFilters = () => {
        setSelectedFilter("Todas");
        setSearchQuery("");
    };

    return (
        <View style={tw`flex-1 bg-[#F7F7F7]`}>
            {/* Navbar */}
            <Navbar title="Gerenciamento de Sessões" />

            {/* Filters */}
            <View style={tw`flex flex-col justify-center px-4 my-1`}>
                {/* Search Bar */}
                <View style={tw`flex-row items-center`}>
                    <TextInput
                        placeholder="Buscar sessão..."
                        style={tw`bg-white px-5 py-3 rounded-full text-gray-400 flex-1 mr-2`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")} style={tw`absolute right-10`}>
                            <Ionicons name="close-circle" size={20} color="gray" />
                        </Pressable>
                    )}
                    <Pressable
                        onPress={() => setUserDrawerVisible(true)}
                    >
                        <Feather name="plus" size={20} color="#222222" style={tw`rounded-full bg-white p-2`} />
                    </Pressable>
                </View>

                <View style={tw`flex-row justify-between bg-[#F2F2F2] p-0.1 mt-4 rounded-full h-10`}>
                    {["Todas", "Nova", "Concluída"].map(filter => (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setSelectedFilter(filter as "Todas" | "Nova" | "Concluída")}
                            style={tw`flex-1 items-center py-2 rounded-full ${selectedFilter === filter ? "bg-white border border-1 border-[#D8D8D8]" : ""}`}
                        >
                            <Text style={tw`${selectedFilter === filter ? "font-semibold text-[#4A4852]" : "text-[#4A4852]"}`}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>


            {/* Filter Status Indicators */}
            {selectedFilter !== "Todas" && (
                <View style={tw`flex-row flex-wrap px-4 mt-2`}>
                    <View style={tw`bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center`}>
                        <Text style={tw`text-blue-800 text-xs`}>Status: {selectedFilter}</Text>
                        <Pressable
                            style={tw`ml-1`}
                            onPress={() => setSelectedFilter("Todas")}
                        >
                            <Text style={tw`text-blue-800 font-bold`}>×</Text>
                        </Pressable>
                    </View>

                    {(searchQuery) && (
                        <Pressable
                            style={tw`bg-gray-100 rounded-full px-3 py-1 mb-2 flex-row items-center`}
                            onPress={resetFilters}
                        >
                            <Text style={tw`text-gray-800 text-xs`}>Limpar todos</Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* Sessions List */}
            <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`px-4 py-2`}
                renderItem={({ item }) => (
                    <View style={tw`bg-white p-4 mt-4 rounded-3xl`}>
                        <View style={tw`flex-row justify-between items-center`}>
                            <Text style={tw`text-lg font-semibold`}>{item.name}</Text>
                            <Text style={tw`w-14 py-[4px] text-center text-[10px] border border-[0.6px] rounded-1 ${item.status === "Nova"
                                ? "bg-[#E0F2FF] text-[#0077FF] border-[#0077FF]"
                                : "bg-[#D5FFE0] text-[#3CA458] border-[#3CA458]"
                                }`}>
                                {item.status}
                            </Text>
                        </View>
                        <Text style={tw`text-[#4A4852] mt-2`}>{item.description}</Text>

                        <View style={tw`mt-4 flex-row  items-center self-end`}>
                            {/* <Text style={tw`text-gray-500 text-xs`}>Realizada em:</Text> */}
                            <Text style={tw`bg-[#FAFAFA]  px-3 py-1 ml-1 rounded-1 text-sm text-[#4A4852]`}>{item.scheduledDate}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={tw`flex-1 items-center justify-center py-10`}>
                        <Text style={tw`text-gray-500 text-lg`}>Nenhuma sessão encontrada</Text>
                        <Text style={tw`text-gray-400 text-sm mt-1`}>Tente ajustar seus filtros</Text>
                        <Pressable
                            style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-full`}
                            onPress={resetFilters}
                        >
                            <Text style={tw`text-white`}>Limpar filtros</Text>
                        </Pressable>
                    </View>
                )}
            />

            <UserDrawer
                visible={userDrawerVisible}
                onClose={() => setUserDrawerVisible(false)}
                onSelectUser={handleUserSelect}
            />
        </View>
    );
}
