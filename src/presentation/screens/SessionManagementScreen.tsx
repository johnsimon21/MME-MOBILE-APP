import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

interface Session {
    id: string;
    name: string;
    description: string;
    status: "Nova" | "Concluída";
    scheduledDate: string;
    completedDate?: string;
}

export function SessionManagementScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<"Todas" | "Nova" | "Concluída">("Todas");
    const [sessions, setSessions] = useState<Session[]>([
        { id: "1", name: "Sessão 1", description: "Detalhes da sessão 1", status: "Nova", scheduledDate: "16 de Janeiro, 2025" },
        { id: "2", name: "Sessão 2", description: "Detalhes da sessão 2", status: "Concluída", scheduledDate: "16 de Janeiro, 2025", completedDate: "01 de Janeiro, 2025" },
        { id: "3", name: "Sessão 3", description: "Detalhes da sessão 3", status: "Concluída", scheduledDate: "16 de Janeiro, 2025", completedDate: "01 de Janeiro, 2025" }
    ]);

    // Filtrar sessões com base no nome e status
    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedFilter === "Todas" || session.status === selectedFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <View style={tw`flex-1 bg-white px-4 py-4`}>
            {/* Header */}
            <View style={tw`flex-row items-center justify-between`}>
                <Pressable>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </Pressable>
                <Text style={tw`text-lg font-bold`}>Gerenciamento de Sessões</Text>
                <Image source={{ uri: "https://via.placeholder.com/40" }} style={tw`w-10 h-10 rounded-full`} />
            </View>

            {/* Search Bar */}
            <View style={tw`flex-row bg-gray-100 px-3 py-2 rounded-full mt-4 items-center`}>
                <Ionicons name="search" size={20} color="gray" />
                <TextInput
                    placeholder="Buscar sessão..."
                    style={tw`flex-1 ml-2 text-gray-700`}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <View style={tw`flex-row justify-between bg-gray-100 px-2 py-2 mt-3 rounded-full`}>
                {["Todas", "Nova", "Concluída"].map(filter => (
                    <TouchableOpacity 
                        key={filter} 
                        onPress={() => setSelectedFilter(filter as "Todas" | "Nova" | "Concluída")} 
                        style={tw`flex-1 items-center py-2 rounded-full ${selectedFilter === filter ? "bg-white shadow" : ""}`}
                    >
                        <Text style={tw`${selectedFilter === filter ? "font-semibold text-black" : "text-gray-500"}`}>{filter}</Text>
                    </TouchableOpacity>
                ))}
                {/* Add Session Button */}
                <Pressable style={tw`bg-blue-500 p-3 rounded-full ml-2`}>
                    <Ionicons name="add" size={20} color="white" />
                </Pressable>
            </View>

            {/* Sessions List */}
            <FlatList
                data={filteredSessions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={tw`bg-gray-100 p-4 mt-4 rounded-lg`}>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-lg font-semibold`}>{item.name}</Text>
                            <Text style={tw`px-2 py-1 text-xs rounded-full ${item.status === "Nova" ? "bg-blue-100 text-blue-500" : "bg-green-100 text-green-500"}`}>
                                {item.status}
                            </Text>
                        </View>
                        <Text style={tw`text-gray-600 mt-1`}>{item.description}</Text>
                        <View style={tw`mt-2 flex-row`}>
                            <Text style={tw`text-xs text-gray-500 mr-2`}>Agendada: {item.scheduledDate}</Text>
                            {item.completedDate && (
                                <Text style={tw`text-xs text-gray-500`}>Concluída: {item.completedDate}</Text>
                            )}
                        </View>
                    </View>
                )}
            />

            {/* Floating Add Button */}
            <Pressable style={tw`absolute bottom-6 right-6 bg-blue-500 p-4 rounded-full shadow-lg`}>
                <Ionicons name="add" size={24} color="white" />
            </Pressable>
        </View>
    );
}
