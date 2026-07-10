import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { BRAND } from '../brand';
import { colors } from '../theme/tokens';

const flashAnimation = require('../../assets/flash_animation.svg');
import { Asset } from 'expo-asset';

export function BrandSplash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  // We need to resolve the local asset URI for WebView
  const [svgHtml, setSvgHtml] = React.useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(flashAnimation);
        await asset.downloadAsync();
        const response = await fetch(asset.uri);
        const text = await response.text();
        setSvgHtml(text);
      } catch (e) {
        console.error("Failed to load SVG asset", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (svgHtml) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [opacity, scale, svgHtml]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mark, { opacity, transform: [{ scale }] }]}>
        {svgHtml ? (
          <WebView
            source={{ html: `<style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:transparent;} svg{width:100%;height:100%;}</style>${svgHtml}` }}
            style={styles.webview}
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={['*']}
            containerStyle={styles.webviewContainer}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
          />
        ) : null}
      </Animated.View>
      <Animated.View style={{ opacity }}>
        <Text style={styles.name}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.shortPromise}</Text>
      </Animated.View>
      <Text style={styles.footer}>A quiet place for the life you keep building.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  mark: { marginBottom: 22, width: 250, height: 250 },
  webviewContainer: { width: 250, height: 250, backgroundColor: 'transparent' },
  webview: { backgroundColor: 'transparent' },
  name: { color: colors.ink, fontSize: 42, fontWeight: '800', letterSpacing: -1.5, textAlign: 'center' },
  tagline: { color: colors.textMuted, fontSize: 17, marginTop: 6, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 54, color: colors.textFaint, fontSize: 12, letterSpacing: 0.2 },
});

