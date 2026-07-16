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
import { useWindowDimensions } from 'react-native';
import { GUIDE_SLIDES } from '../../constants/guideSlides';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

const nativeDriven = Platform.OS !== 'web';

// ─── Pagination Dots ────────────────────────────────────────────────────────

function PaginationDots({ count, activeIndex, styles }: { count: number; activeIndex: number; styles: any }) {
  return (
    <View style={styles.dotRow} accessibilityLabel={`Slide ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Illustration ────────────────────────────────────────────────────────────

function SlideIllustration({ icon, label, styles }: { icon: string; label: string; styles: any }) {
  return (
    <View style={styles.illusContainer}>
      <View style={styles.illusIconBox}>
        <Text style={styles.illusIcon}>{icon}</Text>
      </View>
      <View style={styles.illusLabelBadge}>
        <Text style={styles.illusLabelText}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Props = {
  onComplete: () => void;
};

export function GuideScreen({ onComplete }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const { width } = useWindowDimensions();
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
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.stepLabel}>
          {activeIndex + 1} / {GUIDE_SLIDES.length}
        </Text>
        {!isLast && (
          <Pressable onPress={handleComplete} hitSlop={16} accessibilityLabel="Skip guide" accessibilityRole="button">
            <Text style={styles.skipText}>Skip</Text>
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
          <View key={slide.id} style={[styles.slideContainer, { width }]}>
            <SlideIllustration icon={slide.accentIcon} label={slide.accentLabel} styles={styles} />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.footer}>
        <PaginationDots count={GUIDE_SLIDES.length} activeIndex={activeIndex} styles={styles} />

        <View style={styles.btnRow}>
          {/* Back */}
          <Pressable
            onPress={goBack}
            style={[styles.backBtn, activeIndex === 0 && { opacity: 0 }]}
            disabled={activeIndex === 0}
            accessibilityLabel="Previous slide"
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          {/* Next / Get Started */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={goNext}
              style={styles.nextBtn}
              accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
              accessibilityRole="button"
            >
              <Text style={styles.nextText}>
                {isLast ? 'Get Started →' : 'Next →'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  dotRow: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: { borderRadius: 99 },
  dotActive: { width: 22, height: 4, backgroundColor: colors.primary },
  dotInactive: { width: 6, height: 4, backgroundColor: colors.surfaceMuted },
  illusContainer: { alignItems: 'center', gap: 16 },
  illusIconBox: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illusIcon: { fontSize: 52, color: colors.primary },
  illusLabelBadge: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  illusLabelText: { color: colors.textMuted, fontSize: 12, letterSpacing: 0.5 },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 36,
    paddingVertical: 24,
  },
  textBlock: { gap: 14, alignItems: 'center' },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  stepLabel: { color: colors.surfaceMuted, fontSize: 12, letterSpacing: 1 },
  skipText: { color: colors.textMuted, fontSize: 14, letterSpacing: 0.3 },
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
  backText: { color: colors.textMuted, fontSize: 15 },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    minWidth: 148,
    alignItems: 'center',
  },
  nextText: { color: colors.background, fontWeight: '700', fontSize: 15 },
});
