import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = {
  onFinished: () => void;
};

export function BrandSplash({ onFinished }: Props) {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in the icon
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Wait a few milliseconds
      Animated.delay(800),
      // Fade out the entire splash screen to reveal the app underneath
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => onFinished());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.Image 
        source={require('../../assets/icon.png')} 
        style={[styles.icon, { opacity: iconOpacity }]} 
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F2EA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999, // Ensure it sits on top of the app
  },
  icon: {
    width: 160,
    height: 160,
    borderRadius: 36,
    overflow: 'hidden',
  }
});
