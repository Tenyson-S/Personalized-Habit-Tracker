import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TodayScreen } from '../features/today/TodayScreen';
import { VillageScreen } from '../features/village/VillageScreen';
import { JourneyScreen } from '../features/journey/JourneyScreen';
import { ProfileNavigator } from '../features/profile/ProfileNavigator';
import { ActivityComposer } from '../features/today/ActivityComposer';
import { useComposerStore } from '../store/composerStore';
import { useTheme } from '../theme/ThemeContext';
import { TabIcon } from './TabIcon';
import { useResponsive } from '../hooks/useResponsive';
import { UpdateBanner } from '../components/UpdateBanner';

const TABS = [
  { name: 'Today', component: TodayScreen, path: '/today' },
  { name: 'Village', component: VillageScreen, path: '/village' },
  { name: 'Journey', component: JourneyScreen, path: '/journey' },
  { name: 'You', component: ProfileNavigator, path: '/you' },
] as const;

/** Map URL pathname → tab index (web only) */
function pathToIndex(pathname: string): number {
  const match = TABS.findIndex((t) => pathname.startsWith(t.path));
  // Root path '/' or '/today' both map to Today
  if (match !== -1) return match;
  return 0; // default: Today
}

const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 0.45;
const nativeDriven = Platform.OS !== 'web';

export function SwipeTabShell() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const styles = useMemo(() => getStyles(colors, isMobile, isTablet, isDesktop), [colors, isMobile, isTablet, isDesktop]);
  const insets = useSafeAreaInsets();

  // Initialise tab from URL on web
  const initialIndex = Platform.OS === 'web' && typeof window !== 'undefined'
    ? pathToIndex(window.location.pathname)
    : 0;

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const translateX = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(activeIndex);

  // On desktop, the nav rail has a fixed width; content takes remaining space
  const RAIL_WIDTH = isDesktop ? 220 : 0;
  const layoutWidth = isDesktop
    ? width - RAIL_WIDTH
    : width;

  useEffect(() => { indexRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => {
    translateX.setValue(-activeIndex * layoutWidth);
  }, [activeIndex, translateX, layoutWidth]);

  const goTo = (nextIndex: number) => {
    const index = Math.max(0, Math.min(TABS.length - 1, nextIndex));
    indexRef.current = index;
    setActiveIndex(index);
    // Sync URL on web so AppifyWeb24 bottom nav paths work
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.pushState(null, '', TABS[index].path);
    }
    Animated.spring(translateX, {
      toValue: -index * layoutWidth,
      useNativeDriver: nativeDriven,
      friction: 9,
      tension: 85,
    }).start();
  };

  // Listen for browser back/forward navigation
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onPopState = () => {
      const idx = pathToIndex(window.location.pathname);
      const clamped = Math.max(0, Math.min(TABS.length - 1, idx));
      indexRef.current = clamped;
      setActiveIndex(clamped);
      translateX.setValue(-clamped * layoutWidth);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [layoutWidth]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => {
      // Disable swipe on desktop (use rail clicks instead)
      if (isDesktop) return false;
      const horizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.45;
      return horizontal && Math.abs(gesture.dx) > 12;
    },
    onPanResponderGrant: () => {
      translateX.stopAnimation();
    },
    onPanResponderMove: (_event, gesture) => {
      const base = -indexRef.current * layoutWidth;
      const atStart = indexRef.current === 0 && gesture.dx > 0;
      const atEnd = indexRef.current === TABS.length - 1 && gesture.dx < 0;
      const movement = atStart || atEnd ? gesture.dx * 0.24 : gesture.dx;
      translateX.setValue(base + movement);
    },
    onPanResponderRelease: (_event, gesture) => {
      const shouldAdvance = gesture.dx < -SWIPE_DISTANCE || gesture.vx < -SWIPE_VELOCITY;
      const shouldReturn = gesture.dx > SWIPE_DISTANCE || gesture.vx > SWIPE_VELOCITY;
      if (shouldAdvance) goTo(indexRef.current + 1);
      else if (shouldReturn) goTo(indexRef.current - 1);
      else goTo(indexRef.current);
    },
    onPanResponderTerminate: () => goTo(indexRef.current),
  }), [translateX, layoutWidth, isDesktop]);

  // ─── Desktop: side rail layout ────────────────────────────────────────────
  if (isDesktop) {
    const ActiveComponent = TABS[activeIndex].component;
    return (
      <View style={styles.desktopRoot}>
        {/* Left nav rail */}
        <View style={[styles.rail, { borderRightColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.railBrand}>
            <Text style={[styles.railBrandText, { color: colors.primary }]}>ST</Text>
          </View>
          {TABS.map((tab, index) => {
            const active = index === activeIndex;
            return (
              <Pressable
                key={tab.name}
                onPress={() => goTo(index)}
                style={[styles.railItem, active && { backgroundColor: colors.primarySoft }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <TabIcon name={tab.name} color={active ? colors.primary : colors.textMuted} focused={active} />
                <Text style={[styles.railLabel, { color: active ? colors.primary : colors.textMuted }, active && styles.railLabelActive]}>
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
          {/* Compose button in rail */}
          <View style={styles.railSpacer} />
          <Pressable
            onPress={() => useComposerStore.getState().open()}
            style={[styles.railCompose, { backgroundColor: colors.textPrimary }]}
          >
            <Text style={[styles.railComposeText, { color: colors.background }]}>+ New</Text>
          </Pressable>
        </View>
        {/* Content area */}
        <View style={styles.desktopContent}>
          <ActiveComponent />
        </View>
        <ActivityComposer />
      </View>
    );
  }

  // ─── Mobile / Tablet: bottom tab bar layout ───────────────────────────────
  const ActiveComponent = TABS[activeIndex].component;
  return (
    <View style={styles.root}>
      <UpdateBanner />
      <View style={styles.pager}>
        <ActiveComponent />
      </View>

      <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, isTablet ? 8 : 12), borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        {TABS.map((tab, index) => {
          const active = index === activeIndex;
          const color = active ? colors.textPrimary : colors.textMuted;
          const tabButton = (
            <Pressable key={tab.name} onPress={() => goTo(index)} style={styles.navItem} accessibilityRole="tab" accessibilityState={{ selected: active }}>
              <TabIcon name={tab.name} color={color} focused={active} />
              <Text style={[styles.label, { color: colors.textMuted }, active && { color: colors.textPrimary, fontWeight: '800' }]}>{tab.name}</Text>
              <View style={[styles.indicator, active && { backgroundColor: colors.textPrimary }]} />
            </Pressable>
          );

          if (index === 1) {
            return (
              <React.Fragment key={tab.name}>
                {tabButton}
                <Pressable onPress={() => useComposerStore.getState().open()} style={styles.navItemAdd}>
                  <View style={[styles.addCircle, { backgroundColor: colors.textPrimary }]}>
                    <Text style={[styles.addText, { color: colors.background }]}>+</Text>
                  </View>
                </Pressable>
              </React.Fragment>
            );
          }
          return tabButton;
        })}
      </View>
      <ActivityComposer />
    </View>
  );
}

const getStyles = (colors: any, isMobile: boolean, isTablet: boolean, isDesktop: boolean) => {
  const navHeight = isTablet ? 62 : 54;
  const labelSize = isTablet ? 11 : 10;
  const addCircleSize = isTablet ? 56 : 50;

  return StyleSheet.create({
    // ── Mobile / Tablet ──────────────────────────────────────────────────────
    root: { flex: 1, backgroundColor: colors.background },
    pager: { flex: 1, overflow: 'hidden' },
    row: { flex: 1, flexDirection: 'row' },
    nav: {
      flexDirection: 'row',
      borderTopWidth: 1,
      paddingHorizontal: isTablet ? 16 : 8,
      paddingTop: isTablet ? 10 : 8,
    },
    navItem: {
      flex: 1,
      height: navHeight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    navItemAdd: {
      flex: 1.2,
      height: navHeight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: isTablet ? -18 : -15,
    },
    addCircle: {
      width: addCircleSize,
      height: addCircleSize,
      borderRadius: 99,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    addText: { fontSize: 32, lineHeight: 36, textAlign: 'center' },
    label: { fontSize: labelSize, fontWeight: '600' },
    indicator: { width: 20, height: 2, borderRadius: 99, backgroundColor: 'transparent', marginTop: 2 },

    // ── Desktop rail ──────────────────────────────────────────────────────────
    desktopRoot: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
    rail: {
      width: 220,
      paddingTop: 24,
      paddingBottom: 24,
      paddingHorizontal: 12,
      borderRightWidth: 1,
      alignItems: 'stretch',
      gap: 4,
    },
    railBrand: {
      marginBottom: 24,
      marginLeft: 8,
    },
    railBrandText: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 2,
    },
    railItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    railLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
    railLabelActive: {
      fontWeight: '800',
    },
    railSpacer: { flex: 1 },
    railCompose: {
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginTop: 8,
    },
    railComposeText: {
      fontWeight: '700',
      fontSize: 15,
    },
    desktopContent: {
      flex: 1,
      overflow: 'hidden',
    },
  });
};
