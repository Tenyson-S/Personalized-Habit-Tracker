import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { TodayScreen } from '../features/today/TodayScreen';
import { VillageScreen } from '../features/village/VillageScreen';
import { JourneyScreen } from '../features/journey/JourneyScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ActivityComposer } from '../features/today/ActivityComposer';
import { useComposerStore } from '../store/composerStore';
import { colors } from '../theme/tokens';
import { TabIcon } from './TabIcon';

const TABS = [
  { name: 'Today', component: TodayScreen },
  { name: 'Village', component: VillageScreen },
  { name: 'Journey', component: JourneyScreen },
  { name: 'You', component: ProfileScreen },
] as const;

const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 0.45;
const nativeDriven = Platform.OS !== 'web';

export function SwipeTabShell() {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(activeIndex);

  useEffect(() => { indexRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => {
    translateX.setValue(-activeIndex * width);
  }, [activeIndex, translateX, width]);

  const goTo = (nextIndex: number) => {
    const index = Math.max(0, Math.min(TABS.length - 1, nextIndex));
    indexRef.current = index;
    setActiveIndex(index);
    Animated.spring(translateX, {
      toValue: -index * width,
      useNativeDriver: nativeDriven,
      friction: 9,
      tension: 85,
    }).start();
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => {
      const horizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.45;
      return horizontal && Math.abs(gesture.dx) > 12;
    },
    onPanResponderGrant: () => {
      translateX.stopAnimation();
    },
    onPanResponderMove: (_event, gesture) => {
      const base = -indexRef.current * width;
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
  }), [translateX, width]);

  return (
    <View style={styles.root}>
      <View style={styles.pager} {...panResponder.panHandlers}>
        <Animated.View style={[styles.row, { width: width * TABS.length, transform: [{ translateX }] }]}>
          {TABS.map(({ name, component: Component }) => (
            <View key={name} style={{ width, flex: 1 }}>
              <Component />
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.nav}>
        {TABS.map((tab, index) => {
          const active = index === activeIndex;
          const color = active ? colors.ink : colors.textMuted;
          const tabButton = (
            <Pressable key={tab.name} onPress={() => goTo(index)} style={styles.navItem} accessibilityRole="tab" accessibilityState={{ selected: active }}>
              <TabIcon name={tab.name} color={color} focused={active} />
              <Text style={[styles.label, active && styles.labelActive]}>{tab.name}</Text>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
          
          if (index === 1) {
            return (
              <React.Fragment key={tab.name}>
                {tabButton}
                <Pressable onPress={() => useComposerStore.getState().open()} style={styles.navItemAdd}>
                  <View style={styles.addCircle}>
                    <Text style={styles.addText}>+</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1, overflow: 'hidden' },
  row: { flex: 1, flexDirection: 'row' },
  nav: { height: 76, flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 5 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navItemAdd: { flex: 1.2, alignItems: 'center', justifyContent: 'center', marginTop: -15 },
  addCircle: { width: 50, height: 50, borderRadius: 99, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  addText: { color: 'white', fontSize: 32, fontWeight: '300', lineHeight: 34 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  labelActive: { color: colors.ink, fontWeight: '800' },
  indicator: { width: 20, height: 2, borderRadius: 99, backgroundColor: 'transparent', marginTop: 2 },
  indicatorActive: { backgroundColor: colors.ink },
});
