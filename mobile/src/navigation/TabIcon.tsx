import React from 'react';
import { StyleSheet, View } from 'react-native';

export function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const opacity = focused ? 1 : 0.72;
  if (name === 'Today') {
    return (
      <View style={[styles.icon, { opacity }]}>
        <View style={[styles.sunCore, { borderColor: color }]} />
        <View style={[styles.ray, styles.rayTop, { backgroundColor: color }]} />
        <View style={[styles.ray, styles.rayBottom, { backgroundColor: color }]} />
        <View style={[styles.ray, styles.rayLeft, { backgroundColor: color }]} />
        <View style={[styles.ray, styles.rayRight, { backgroundColor: color }]} />
      </View>
    );
  }
  if (name === 'Village') {
    return (
      <View style={[styles.icon, { opacity }]}>
        <View style={[styles.treeCanopy, styles.treeCanopyLeft, { backgroundColor: color }]} />
        <View style={[styles.treeCanopy, styles.treeCanopyRight, { backgroundColor: color }]} />
        <View style={[styles.treeCanopy, styles.treeCanopyTop, { backgroundColor: color }]} />
        <View style={[styles.treeTrunk, { backgroundColor: color }]} />
      </View>
    );
  }
  if (name === 'Journey') {
    return (
      <View style={[styles.icon, { opacity }]}>
        <View style={[styles.journeyLine, { backgroundColor: color }]} />
        <View style={[styles.journeyDot, styles.journeyDotTop, { backgroundColor: color }]} />
        <View style={[styles.journeyDot, styles.journeyDotMiddle, { backgroundColor: color }]} />
        <View style={[styles.journeyDot, styles.journeyDotBottom, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={[styles.icon, { opacity }]}>
      <View style={[styles.userHead, { borderColor: color }]} />
      <View style={[styles.userBody, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  sunCore: { width: 10, height: 10, borderRadius: 99, borderWidth: 2 },
  ray: { position: 'absolute', borderRadius: 99 },
  rayTop: { width: 2, height: 4, top: 1 },
  rayBottom: { width: 2, height: 4, bottom: 1 },
  rayLeft: { width: 4, height: 2, left: 1 },
  rayRight: { width: 4, height: 2, right: 1 },
  treeCanopy: { position: 'absolute', borderRadius: 99 },
  treeCanopyLeft: { width: 10, height: 10, left: 3, top: 7 },
  treeCanopyRight: { width: 11, height: 11, right: 3, top: 6 },
  treeCanopyTop: { width: 12, height: 12, top: 2 },
  treeTrunk: { position: 'absolute', width: 3, height: 9, bottom: 2, borderRadius: 2 },
  journeyLine: { position: 'absolute', width: 2, height: 18, borderRadius: 99 },
  journeyDot: { position: 'absolute', width: 6, height: 6, borderRadius: 99, borderWidth: 1, borderColor: '#F4F1E8' },
  journeyDotTop: { top: 1, left: 6 },
  journeyDotMiddle: { top: 9, right: 5 },
  journeyDotBottom: { bottom: 0, left: 7 },
  userHead: { position: 'absolute', top: 2, width: 8, height: 8, borderRadius: 99, borderWidth: 2 },
  userBody: { position: 'absolute', bottom: 1, width: 16, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 2, borderBottomWidth: 0 },
});
