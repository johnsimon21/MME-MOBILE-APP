import React from 'react';
import { Text } from '@react-navigation/elements';
import { StaticScreenProps } from '@react-navigation/native';
import { View } from 'react-native';
import tw from "twrnc";

type Props = StaticScreenProps<{
  user: string;
}>;

export function ProfileScreen() {
  return (
    <View style={tw`flex-1 justify-center items-center gap-10`}>
      <Text>John Simon's Profile</Text>
    </View>
  );
}
