import React from 'react';
import { Text, Button } from '@react-navigation/elements';
import { View } from 'react-native';
import tw from "twrnc";

export function NotFound() {
  return (
    <View style={tw`flex-1 justify-center items-center gap-10`}>
      <Text>404</Text>
      <Button params={{}} screen="HomeTabs">Go to Home</Button>
    </View>
  );
}
