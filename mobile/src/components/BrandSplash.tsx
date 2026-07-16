import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { BRAND } from '../brand';

const { width } = Dimensions.get('window');

// useNativeDriver is not supported on web — fall back to JS-driven animations
const nativeDriven = Platform.OS !== 'web';

// Dark premium palette — separate from the main light theme
const D = {
  bg: '#0D0F0E',
  surface: '#141817',
  accent: '#4CAF7D',       // muted neon green
  accentGlow: '#2D6B4A',
  text: '#E8EDE9',
  muted: '#7A8A7C',
  faint: '#3D4A3F',
};

type Props = {
  onFinished: () => void;
};

export function BrandSplash({ onFinished }: Props) {
  // Animation values
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0.78)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(14)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.85)).current;
  const sweepWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seq = Animated.sequence([
      // 1. Background fades in instantly
      Animated.timing(bgOpacity, {
        toValue: 1, duration: 200, useNativeDriver: nativeDriven,
      }),
      // 2. Mark scales in + fades (0.0s → 0.7s)
      Animated.parallel([
        Animated.timing(markOpacity, {
          toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriven,
        }),
        Animated.spring(markScale, {
          toValue: 1, friction: 7, tension: 60, useNativeDriver: nativeDriven,
        }),
      ]),
      // 3. Line sweep under the mark
      Animated.timing(sweepWidth, {
        toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: false,
      }),
      // 4. App name slides up + fades in
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1, duration: 380, useNativeDriver: nativeDriven,
        }),
        Animated.timing(nameTranslateY, {
          toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriven,
        }),
      ]),
      // 5. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1, duration: 360, useNativeDriver: nativeDriven,
      }),
      // 6. Glow pulse
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriven,
        }),
        Animated.timing(glowScale, {
          toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriven,
        }),
      ]),
      // 7. Hold briefly then call onFinished
      Animated.delay(300),
    ]);

    seq.start(() => onFinished());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sweepInterpolated = sweepWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
      {/* Radial glow behind mark */}
      <Animated.View
        style={[styles.glow, { transform: [{ scale: glowScale }] }]}
        pointerEvents="none"
      />

      {/* Mark — geometric "S" symbol made from RN shapes */}
      <Animated.View
        style={[
          styles.markWrapper,
          { opacity: markOpacity, transform: [{ scale: markScale }] },
        ]}
      >
        <View style={styles.markOuter}>
          <View style={styles.markInner} />
          <View style={styles.markDot} />
        </View>
      </Animated.View>

      {/* Sweep line */}
      <Animated.View style={[styles.sweep, { width: sweepInterpolated }]} />

      {/* App name */}
      <Animated.Text
        style={[
          styles.name,
          { opacity: nameOpacity, transform: [{ translateY: nameTranslateY }] },
        ]}
        accessibilityRole="header"
      >
        {BRAND.name.toUpperCase()}
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Track quietly. Improve consistently.
      </Animated.Text>

      {/* Footer */}
      <Text style={styles.footer} accessibilityElementsHidden>
        v0.5
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: D.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: D.accentGlow,
    opacity: 0.12,
    alignSelf: 'center',
    top: '50%',
    marginTop: -210,
  },
  markWrapper: {
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOuter: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: D.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markInner: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: D.accentGlow,
    backgroundColor: D.surface,
  },
  markDot: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: D.accent,
  },
  sweep: {
    height: 1,
    backgroundColor: D.accent,
    opacity: 0.55,
    marginBottom: 20,
    borderRadius: 1,
  },
  name: {
    color: D.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  tagline: {
    color: D.muted,
    fontSize: 14,
    marginTop: 10,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 42,
    color: D.faint,
    fontSize: 11,
    letterSpacing: 1,
  },
});
