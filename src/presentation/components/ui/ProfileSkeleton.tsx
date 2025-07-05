import React from 'react';
import { View, Animated, Dimensions } from 'react-native';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

const SkeletonItem: React.FC<{ width: number; height: number; style?: any }> = ({ 
  width, 
  height, 
  style 
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={tw`flex-1 bg-[#F7F7F7]`}>
      {/* Header Section */}
      <View style={tw`relative px-2`}>
        {/* Two-color background */}
        <View style={tw`bg-[#75A5F5] h-24 rounded-t-4`} />
        <View style={tw`bg-white h-32 rounded-b-4`} />
        
        {/* Profile image skeleton */}
        <View style={tw`absolute top-12 left-0 right-0 items-center`}>
          <SkeletonItem 
            width={80} 
            height={80} 
            style={tw`rounded-full mb-2`} 
          />
          <SkeletonItem 
            width={120} 
            height={16} 
            style={tw`rounded mb-1`} 
          />
          <SkeletonItem 
            width={80} 
            height={12} 
            style={tw`rounded`} 
          />
        </View>
      </View>

      {/* Questões Pendentes Skeleton */}
      <View style={tw`p-4 bg-white mt-4 rounded-xl mx-2`}>
        <SkeletonItem 
          width={150} 
          height={18} 
          style={tw`rounded mb-4`} 
        />
        
        {/* Question 1 */}
        <SkeletonItem 
          width={200} 
          height={12} 
          style={tw`rounded mb-2`} 
        />
        <SkeletonItem 
          width={width - 80} 
          height={32} 
          style={tw`rounded mb-4`} 
        />
        
        {/* Question 2 */}
        <SkeletonItem 
          width={180} 
          height={12} 
          style={tw`rounded mb-2`} 
        />
        <SkeletonItem 
          width={width - 80} 
          height={32} 
          style={tw`rounded mb-4`} 
        />
        
        {/* Question 3 */}
        <SkeletonItem 
          width={160} 
          height={12} 
          style={tw`rounded mb-2`} 
        />
        <SkeletonItem 
          width={width - 80} 
          height={32} 
          style={tw`rounded`} 
        />
      </View>

      {/* Informações Skeleton */}
      <View style={tw`p-4 bg-white mt-4 rounded-xl mx-2`}>
        <SkeletonItem 
          width={100} 
          height={18} 
          style={tw`rounded mb-4`} 
        />
        
        {/* Info items */}
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={tw`flex-row justify-between items-center mb-3`}>
            <SkeletonItem 
              width={80} 
              height={12} 
              style={tw`rounded`} 
            />
            <SkeletonItem 
              width={120} 
              height={12} 
              style={tw`rounded`} 
            />
          </View>
        ))}
      </View>

      {/* Conexões Skeleton */}
      <View style={tw`p-4 bg-white my-4 rounded-xl mx-2`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <SkeletonItem 
            width={100} 
            height={18} 
            style={tw`rounded`} 
          />
          <SkeletonItem 
            width={60} 
            height={16} 
            style={tw`rounded`} 
          />
        </View>
        
        {/* Connection items */}
        {[1, 2, 3].map((item) => (
          <View key={item} style={tw`flex-row items-center py-3`}>
            <SkeletonItem 
              width={40} 
              height={40} 
              style={tw`rounded-full mr-3`} 
            />
            <View style={tw`flex-1`}>
              <SkeletonItem 
                width={120} 
                height={14} 
                style={tw`rounded mb-1`} 
              />
              <SkeletonItem 
                width={80} 
                height={12} 
                style={tw`rounded`} 
              />
            </View>
            <SkeletonItem 
              width={60} 
              height={12} 
              style={tw`rounded`} 
            />
          </View>
        ))}
      </View>
    </View>
  );
};