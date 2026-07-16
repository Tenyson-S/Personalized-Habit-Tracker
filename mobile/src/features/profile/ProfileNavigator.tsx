import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './ProfileScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { EditInterestsScreen } from './EditInterestsScreen';
import { SettingsScreen } from './SettingsScreen';
import { ChangePasswordScreen } from './ChangePasswordScreen';

export type ProfileStackParamList = {
  ProfileHub: undefined;
  EditProfile: undefined;
  EditInterests: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHub" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EditInterests" component={EditInterestsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}
