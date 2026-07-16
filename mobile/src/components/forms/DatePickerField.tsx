import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from '../ui/AppText';
import { colors, radius, spacing } from '../../theme/tokens';
import { formatLocalDate } from '../../utils/date';
import { parseISO } from 'date-fns';

interface DatePickerFieldProps {
  label: string;
  value?: string | null; // ISO string or YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

export function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const [show, setShow] = useState(false);
  const dateValue = value ? parseISO(value) : new Date();

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      // Just emit YYYY-MM-DD
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="bodySm" weight="semiBold" style={styles.label}>{label}</AppText>
      
      {Platform.OS === 'web' ? (
        React.createElement('input', {
          type: 'date',
          value: value || '',
          onChange: (e: any) => {
            if (e.target.value) onChange(e.target.value);
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
              {value ? formatLocalDate(value) : 'Select Date'}
            </AppText>
          </TouchableOpacity>
          
          {show && (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="default"
              onChange={handleChange}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
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
