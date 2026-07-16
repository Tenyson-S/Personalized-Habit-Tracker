import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from '../ui/AppText';
import { radius, spacing } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { extractLocalTimeForApi, formatLocalTime } from '../../utils/date';
import { parseISO } from 'date-fns';

interface TimePickerFieldProps {
  label: string;
  value?: string | null; // ISO string or HH:mm:ss
  onChange: (timeStr: string) => void;
  allowClear?: boolean;
}

export function TimePickerField({ label, value, onChange, allowClear }: TimePickerFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const [show, setShow] = useState(false);
  
  // Try to parse the time. If it's just HH:mm:ss, append it to today's date for the picker
  let dateValue = new Date();
  if (value) {
    if (value.includes('T')) {
      dateValue = parseISO(value);
    } else {
      const [h, m, s = '00'] = value.split(':');
      dateValue.setHours(parseInt(h, 10), parseInt(m, 10), parseInt(s, 10));
    }
  }

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(extractLocalTimeForApi(selectedDate));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="bodySm" weight="semiBold">{label}</AppText>
        {allowClear && value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={8}>
            <AppText variant="caption" color={colors.primary}>Clear</AppText>
          </TouchableOpacity>
        ) : null}
      </View>
      {Platform.OS === 'web' ? (
        React.createElement('input', {
          type: 'time',
          value: value || '',
          onChange: (e: any) => {
            const val = e.target.value;
            if (val) onChange(val.length === 5 ? `${val}:00` : val);
          },
          style: {
            backgroundColor: colors.surface,
            borderWidth: '1px',
            borderColor: colors.border,
            borderStyle: 'solid',
            borderRadius: radius.md,
            paddingLeft: spacing.md,
            paddingRight: spacing.md,
            height: '48px',
            fontFamily: 'Manrope_600SemiBold',
            fontSize: '14px',
            color: value ? colors.textPrimary : colors.textMuted,
            outline: 'none',
          }
        })
      ) : (
        <>
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShow(true)}
            activeOpacity={0.7}
          >
            <AppText color={value ? colors.textPrimary : colors.textMuted}>
              {value ? formatLocalTime(dateValue.toISOString()) : 'Select Time'}
            </AppText>
          </TouchableOpacity>
          
          {show && (
            <DateTimePicker
              value={dateValue}
              mode="time"
              display="default"
              onChange={handleChange}
            />
          )}
        </>
      )}
    </View>
  );
}

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pickerButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    height: 48,
  }
});
