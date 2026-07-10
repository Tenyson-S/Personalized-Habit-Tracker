import React from 'react';
import { StyleSheet, View } from 'react-native';

export function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const opacity = focused ? 1 : 0.72;
  
  if (name === 'Today') {
    // Focus / Target
    return (
      <View style={[styles.icon, { opacity }]}>
        <View style={[styles.targetOuter, { borderColor: color }]} />
        <View style={[styles.targetInner, { backgroundColor: color }]} />
      </View>
    );
  }
  
  if (name === 'Village') {
    // Community / Structure
    return (
      <View style={[styles.icon, { opacity }]}>
        <View style={[styles.villageRoof, { borderColor: color }]} />
        <View style={[styles.villageHouse, { borderColor: color }]} />
      </View>
    );
  }
  
  if (name === 'Journey') {
    // Ascent / Mountain
    return (
      <View style={[styles.icon, { opacity }]}>
        <View style={[styles.mountainOuter, { borderColor: color }]} />
        <View style={[styles.mountainInner, { borderColor: color }]} />
      </View>
    );
  }
  
  // You (Diamond / Core Identity)
  return (
    <View style={[styles.icon, { opacity }]}>
      <View style={[styles.diamondOuter, { borderColor: color }]} />
      <View style={[styles.diamondInner, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  
  // Today (Target)
  targetOuter: { width: 17, height: 17, borderRadius: 99, borderWidth: 1.5, position: 'absolute' },
  targetInner: { width: 5, height: 5, borderRadius: 99, position: 'absolute' },
  
  // Village (House)
  villageRoof: { position: 'absolute', width: 12, height: 12, borderWidth: 1.5, borderBottomWidth: 0, borderRightWidth: 0, transform: [{ rotate: '45deg' }], top: 4, borderRadius: 1.5 },
  villageHouse: { position: 'absolute', width: 15, height: 10, borderWidth: 1.5, borderTopWidth: 0, borderBottomLeftRadius: 1.5, borderBottomRightRadius: 1.5, bottom: 4 },

  // Journey (Mountain)
  mountainOuter: { position: 'absolute', width: 17, height: 17, borderWidth: 1.5, borderBottomWidth: 0, borderRightWidth: 0, transform: [{ rotate: '45deg' }], top: 8, borderRadius: 1.5 },
  mountainInner: { position: 'absolute', width: 7, height: 7, borderWidth: 1.5, borderBottomWidth: 0, borderRightWidth: 0, transform: [{ rotate: '45deg' }], top: 15, borderRadius: 1 },

  // You (Diamond)
  diamondOuter: { width: 14, height: 14, borderWidth: 1.5, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  diamondInner: { position: 'absolute', width: 3, height: 3, transform: [{ rotate: '45deg' }], borderRadius: 1 },
});
