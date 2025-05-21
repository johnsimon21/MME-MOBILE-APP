import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import tw from "twrnc";

import { Navbar } from "../components/ui/navbar";

interface Task {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "Concluído" | "Pendente";
}

const tasks: Task[] = [
  { id: 1, title: "Tarefa 1", description: "Nesta seção é onde será descrito as minhas tarefas concluídas.", startDate: "16 de Janeiro, 2025", endDate: "16 de Março, 2025", status: "Pendente" },
  { id: 2, title: "Tarefa 2", description: "Nesta seção é onde será descrito as minhas tarefas concluídas.", startDate: "16 de Janeiro, 2025", endDate: "16 de Março, 2025", status: "Pendente" },
  { id: 3, title: "Tarefa 3", description: "Nesta seção é onde será descrito as minhas tarefas concluídas.", startDate: "16 de Janeiro, 2025", endDate: "16 de Março, 2025", status: "Pendente" },
  { id: 4, title: "Tarefa 4", description: "Nesta seção é onde será descrito as minhas tarefas concluídas.", startDate: "16 de Janeiro, 2025", endDate: "16 de Março, 2025", status: "Concluído" },
  { id: 5, title: "Tarefa 5", description: "Nesta seção é onde será descrito as minhas tarefas concluídas.", startDate: "16 de Janeiro, 2025", endDate: "16 de Março, 2025", status: "Concluído" },
];

export function AnalyticsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<"Todas" | "Concluído" | "Pendente">("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = selectedFilter === "Todas" || task.status === selectedFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Reset filters
  const resetFilters = () => {
    setSelectedFilter("Todas");
    setSearchQuery("");
  };

  return (
    <View style={tw`flex-1 bg-[#F7F7F7]`}>
      {/* Navbar */}
      <Navbar title="Análise de Tarefas" />

      {/* Search Bar */}
      <View style={tw`px-4 mt-1 flex-row items-center`}>
        <TextInput
          placeholder="Pesquisar tarefa..."
          style={tw`bg-white px-5 py-3 rounded-full text-gray-400 flex-1 mr-2`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={tw`absolute right-10`}>
            <Ionicons name="close-circle" size={20} color="gray" />
          </Pressable>
        )}
        <Pressable>
          <Feather name="sliders" size={20} color="#4A4852" />
        </Pressable>
      </View>

      {/* Filter Buttons */}
      <View style={tw`flex-row px-4 mt-3`}>
        {(["Todas", "Concluído", "Pendente"] as const).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={tw`px-4 py-2 rounded-full mr-2 ${
              selectedFilter === filter 
                ? "bg-blue-500" 
                : "bg-white border border-[#E9E9E9]"
            }`}
          >
            <Text 
              style={tw`${
                selectedFilter === filter 
                  ? "text-white" 
                  : "text-gray-700"
              } text-sm`}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
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

      {/* Task List */}
      <ScrollView style={tw`mt-2 px-4`}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task.id} style={tw`bg-white p-4 rounded-3xl mb-4`}>
              {/* Task Title & Status */}
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-lg font-semibold`}>#{task.title}</Text>
                <Text
                  style={tw`px-[6px] py-[3px] text-[10px] border border-[0.6px] rounded-1 ${
                    task.status === "Concluído" 
                      ? "bg-[#D5FFE0] text-[#3CA458] border-[#3CA458]" 
                      : "bg-[#FFF8E0] text-[#E6A700] border-[#E6A700]"
                  }`}
                >
                  {task.status}
                </Text>
              </View>

              {/* Task Description */}
              <Text style={tw`text-[#4A4852] mt-2`}>{task.description}</Text>

              {/* Task Dates */}
              <View style={tw`flex-row justify-between mt-4`}>
                <View>
                  <Text style={tw`text-gray-500 text-xs`}>Data de início</Text>
                  <Text style={tw`bg-[#F8F9FA] px-3 py-1 rounded-full text-sm mt-1`}>{task.startDate}</Text>
                </View>
                <View>
                  <Text style={tw`text-gray-500 text-xs`}>Data de vencimento</Text>
                  <Text style={tw`bg-[#F8F9FA] px-3 py-1 rounded-full text-sm mt-1`}>{task.endDate}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row justify-between mt-4`}>
                <Pressable
                  style={tw`flex-1 border border-[#E9E9E9] py-2 rounded-full`}
                >
                  <Text style={tw`text-center`}>Editar</Text>
                </Pressable>

                <View style={tw`w-4`} />

                <Pressable
                  style={tw`flex-1 ${
                    task.status === "Concluído" 
                      ? "bg-red-500" 
                      : "bg-green-500"
                  } py-2 rounded-full`}
                >
                  <Text style={tw`text-center text-white`}>
                    {task.status === "Concluído" ? "Reabrir" : "Concluir"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={tw`flex-1 items-center justify-center py-10`}>
            <Text style={tw`text-gray-500 text-lg`}>Nenhuma tarefa encontrada</Text>
            <Text style={tw`text-gray-400 text-sm mt-1`}>Tente ajustar seus filtros</Text>
            <Pressable
              style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-full`}
              onPress={resetFilters}
            >
              <Text style={tw`text-white`}>Limpar filtros</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}