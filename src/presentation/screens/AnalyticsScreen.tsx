import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

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
  const [selectedFilter, setSelectedFilter] = useState<"Todas" | "Concluídas" | "Pendente">("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = selectedFilter === "Todas" || task.status === selectedFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={tw`flex-1 bg-gray-100`}>

      {/* Search Bar */}
      <View style={tw`px-4 mt-4`}>
        <View style={tw`flex-row items-center bg-white px-4 py-3 rounded-full shadow-md`}>
          <TextInput
            placeholder="Pesquisar tarefa..."
            style={tw`flex-1 text-gray-700`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </Pressable>
          ) : (
            <Ionicons name="search" size={20} color="gray" />
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={tw`flex-row justify-around mt-4 px-4`}>
        {["Todas", "Concluído", "Pendente"].map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setSelectedFilter(filter as any)}
            style={tw`px-4 py-2 rounded-full ${selectedFilter === filter ? "bg-blue-500" : "bg-gray-200"}`}
          >
            <Text style={tw`${selectedFilter === filter ? "text-white" : "text-gray-700"} text-sm`}>
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Task List */}
      <ScrollView style={tw`mt-4 px-4`}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task.id} style={tw`bg-white p-4 rounded-lg shadow-md mb-4`}>
              {/* Task Title & Status */}
              <View style={tw`flex-row justify-between`}>
                <Text style={tw`text-lg font-semibold`}>#{task.title}</Text>
                <Text
                  style={tw`px-2 py-1 text-xs rounded-full ${
                    task.status === "Concluído" ? "bg-green-200 text-green-700" : "bg-yellow-200 text-yellow-700"
                  }`}
                >
                  {task.status}
                </Text>
              </View>

              {/* Task Description */}
              <Text style={tw`text-gray-600 mt-2`}>{task.description}</Text>

              {/* Task Dates */}
              <View style={tw`flex-row justify-between mt-4`}>
                <View>
                  <Text style={tw`text-gray-400 text-xs`}>Data de início</Text>
                  <Text style={tw`bg-gray-200 px-2 py-1 rounded-full text-sm`}>{task.startDate}</Text>
                </View>
                <View>
                  <Text style={tw`text-gray-400 text-xs`}>Data de vencimento</Text>
                  <Text style={tw`bg-gray-200 px-2 py-1 rounded-full text-sm`}>{task.endDate}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={tw`text-center text-gray-500 mt-10`}>Nenhuma tarefa encontrada.</Text>
        )}
      </ScrollView>
    </View>
  );
}

