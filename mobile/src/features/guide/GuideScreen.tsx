import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GUIDE_SLIDES } from '../../constants/guideSlides';

const { width } = Dimensions.get('window');
const nativeDriven = Platform.OS !== 'web';

// Dark premium palette
const D = {
  bg: '#0D0F0E',
  surface: '#141817',
  surfaceElevated: '#1C211E',
  accent: '#4CAF7D',
  accentSoft: '#1A3327',
  text: '#E8EDE9',
  muted: '#7A8A7C',
  faint: '#3D4A3F',
  border: '#252C27',
};

// ─── Pagination Dots ────────────────────────────────────────────────────────

function PaginationDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={dotStyles.row} accessibilityLabel={`Slide ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === activeIndex ? dotStyles.dotActive : dotStyles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: { borderRadius: 99 },
  dotActive: { width: 22, height: 4, backgroundColor: D.accent },
  dotInactive: { width: 6, height: 4, backgroundColor: D.faint },
});

// ─── Illustration ────────────────────────────────────────────────────────────

function SlideIllustration({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={illusStyles.container}>
      <View style={illusStyles.iconBox}>
        <Text style={illusStyles.icon}>{icon}</Text>
      </View>
      <View style={illusStyles.labelBadge}>
        <Text style={illusStyles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

const illusStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: D.accentSoft,
    borderWidth: 1,
    borderColor: D.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 52, color: D.accent },
  labelBadge: {
    backgroundColor: D.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: D.border,
  },
  labelText: { color: D.muted, fontSize: 12, letterSpacing: 0.5 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Props = {
  onComplete: () => void;
};

export function GuideScreen({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const isLast = activeIndex === GUIDE_SLIDES.length - 1;

  function scrollToIndex(index: number) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  }

  function goNext() {
    if (isLast) {
      handleComplete();
      return;
    }
    scrollToIndex(activeIndex + 1);
  }

  function goBack() {
    if (activeIndex === 0) return;
    scrollToIndex(activeIndex - 1);
  }

  function handleComplete() {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.94, duration: 80, useNativeDriver: nativeDriven, easing: Easing.out(Easing.quad) }),
      Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: nativeDriven, easing: Easing.out(Easing.quad) }),
    ]).start(() => onComplete());
  }

  return (
    <SafeAreaView style={screen.safe}>
      {/* Top bar */}
      <View style={screen.topBar}>
        <Text style={screen.stepLabel}>
          {activeIndex + 1} / {GUIDE_SLIDES.length}
        </Text>
        {!isLast && (
          <Pressable onPress={handleComplete} hitSlop={16} accessibilityLabel="Skip guide" accessibilityRole="button">
            <Text style={screen.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides — horizontal ScrollView, works reliably on web */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}   // navigation is button-driven; no accidental swipes
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {GUIDE_SLIDES.map((slide) => (
          <View key={slide.id} style={slideStyles.container}>
            <SlideIllustration icon={slide.accentIcon} label={slide.accentLabel} />
            <View style={slideStyles.textBlock}>
              <Text style={slideStyles.title}>{slide.title}</Text>
              <Text style={slideStyles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={screen.footer}>
        <PaginationDots count={GUIDE_SLIDES.length} activeIndex={activeIndex} />

        <View style={screen.btnRow}>
          {/* Back */}
          <Pressable
            onPress={goBack}
            style={[screen.backBtn, activeIndex === 0 && { opacity: 0 }]}
            disabled={activeIndex === 0}
            accessibilityLabel="Previous slide"
          >
            <Text style={screen.backText}>← Back</Text>
          </Pressable>

          {/* Next / Get Started */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={goNext}
              style={screen.nextBtn}
              accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
              accessibilityRole="button"
            >
              <Text style={screen.nextText}>
                {isLast ? 'Get Started →' : 'Next →'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const slideStyles = StyleSheet.create({
  container: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 36,
    paddingVertical: 24,
  },
  textBlock: { gap: 14, alignItems: 'center' },
  title: {
    color: D.text,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    color: D.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});

const screen = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  stepLabel: { color: D.faint, fontSize: 12, letterSpacing: 1 },
  skipText: { color: D.muted, fontSize: 14, letterSpacing: 0.3 },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    gap: 20,
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 4, minWidth: 80 },
  backText: { color: D.muted, fontSize: 15 },
  nextBtn: {
    backgroundColor: D.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    minWidth: 148,
    alignItems: 'center',
  },
  nextText: { color: '#0D0F0E', fontWeight: '700', fontSize: 15 },
});
