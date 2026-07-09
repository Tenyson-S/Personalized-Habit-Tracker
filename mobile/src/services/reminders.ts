// Notifications have been stubbed out because Expo Go on Android
// no longer supports expo-notifications natively (SDK 53+).
// To use real notifications, a Development Build (custom APK) is required.

export async function ensureNotificationPermission() {
  return false;
}

export async function scheduleStartReminder(args: any) {
  return null;
}

export async function cancelReminder(identifier?: string | null) {
  // Stub
}

export async function scheduleWeeklyActivityReminders(args: any) {
  return [];
}

export async function scheduleRecurringTaskReminder(args: any) {
  return [];
}
