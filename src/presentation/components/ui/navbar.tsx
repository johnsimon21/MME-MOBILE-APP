import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import tw from "twrnc";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={tw`bg-white pb-4 flex-row justify-between items-center min-h-20 pt-10 pb-6`}>
      <Text style={tw`text-lg font-semibold px-4`}>{title}</Text>

      {/* Profile Section */}
      <Pressable onPress={() => setMenuVisible(!menuVisible)}>
        <View style={tw`flex-col items-center px-4`}>
          <View style={tw`w-8 h-8 bg-gray-300 rounded-full`} />
          <Text style={tw``}>John Simon</Text>
        </View>
      </Pressable>

      {/* Dropdown Menu */}
      {menuVisible && (
        <View style={tw`absolute right-4 top-16 z-50 bg-white p-2 shadow-md rounded-lg`}>
          <Pressable onPress={() => { }}>
            <Text style={tw`py-1 px-2 hover:bg-slate-100`}>Ver perfil</Text>
          </Pressable>
          <Pressable onPress={() => { }}>
            <Text style={tw`py-1 px-2`}>Sair</Text>
          </Pressable>
        </View>
      )}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-[#F7F7F7] w-full h-4 rounded-t-4`}></View>
    </View>
  );
}
