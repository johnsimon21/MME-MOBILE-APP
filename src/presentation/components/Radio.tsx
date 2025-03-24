import React from "react";
import { Pressable, Text, View } from "react-native";
import tw from "twrnc";

interface RadioProps {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}

export function Radio({ checked, onChange, children }: RadioProps) {
  return (
    <Pressable onPress={onChange} style={tw`flex-row items-center mb-2.5`}>
      <View
        style={tw`w-5 h-5 rounded-full border-[1px] border-[#82ADF5] p-2 ${
          checked ? "bg-[#4285F4]" : "bg-white"
        } mr-2`}
      />
      <Text>{children}</Text>
    </Pressable>
  );
}
