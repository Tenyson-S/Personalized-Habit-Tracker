import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

type StartReminderArgs = {
  title: string;
  startsAt: Date;
  minutesBefore?: number;
};

type WeeklyReminderArgs = {
  title: string;
  time: string;
  days: readonly string[];
  minutesBefore?: number;
};

type RecurringTaskReminderArgs = WeeklyReminderArgs & {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dayOfMonth?: number;
};

const WEEKDAY: Record<string, number> = {
  sunday: 1,
  monday: 2,
  tuesday: 3,
  wednesday: 4,
  thursday: 5,
  friday: 6,
  saturday: 7,
};

function parseTime(time: string, minutesBefore = 0) {
  const [hourValue, minuteValue] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hourValue || 0, (minuteValue || 0) - minutesBefore, 0, 0);
  return { hour: date.getHours(), minute: date.getMinutes() };
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#85A67F',
  });
}

export async function ensureNotificationPermission() {
  if (Platform.OS === 'web') return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    await ensureAndroidChannel();
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  const granted = requested.granted || requested.status === Notifications.PermissionStatus.GRANTED;
  if (granted) await ensureAndroidChannel();
  return granted;
}

export async function scheduleStartReminder({ title, startsAt, minutesBefore = 0 }: StartReminderArgs) {
  if (!(await ensureNotificationPermission())) return null;

  const triggerDate = new Date(startsAt);
  triggerDate.setMinutes(triggerDate.getMinutes() - minutesBefore);
  if (triggerDate.getTime() <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Stealth Track',
      body: title,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: 'reminders',
    } as any,
  });
}

export async function cancelReminder(identifier?: string | null) {
  if (!identifier || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function scheduleWeeklyActivityReminders({
  title,
  time,
  days,
  minutesBefore = 0,
}: WeeklyReminderArgs) {
  if (!(await ensureNotificationPermission())) return [];

  const { hour, minute } = parseTime(time, minutesBefore);
  return Promise.all(
    days
      .map((day) => WEEKDAY[day.toLowerCase()])
      .filter(Boolean)
      .map((weekday) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Stealth Track',
            body: title,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
            channelId: 'reminders',
          } as any,
        }),
      ),
  );
}

export async function scheduleRecurringTaskReminder({
  title,
  time,
  days,
  frequency,
  dayOfMonth,
  minutesBefore = 0,
}: RecurringTaskReminderArgs) {
  if (!(await ensureNotificationPermission())) return [];

  const { hour, minute } = parseTime(time, minutesBefore);

  if (frequency === 'DAILY') {
    return [
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Stealth Track', body: title, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'reminders',
        } as any,
      }),
    ];
  }

  if (frequency === 'MONTHLY') {
    return [
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Stealth Track', body: title, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: Math.min(Math.max(dayOfMonth || 1, 1), 31),
          hour,
          minute,
          channelId: 'reminders',
        } as any,
      }),
    ];
  }

  return scheduleWeeklyActivityReminders({ title, time, days, minutesBefore });
}
