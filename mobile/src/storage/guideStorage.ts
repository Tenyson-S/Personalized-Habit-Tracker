import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'stealth_track.guide_completed';

export async function markGuideCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function isGuideCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === 'true';
}

/** Dev helper — call this to reset and see the guide again */
export async function resetGuide(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
