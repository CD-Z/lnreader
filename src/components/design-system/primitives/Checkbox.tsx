import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'tamagui';

export interface CheckboxProps {
  status?: 'checked' | 'unchecked' | 'indeterminate';
  disabled?: boolean;
  onPress?: () => void;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  status = 'unchecked',
  disabled,
  onPress,
  label,
}) => {
  const theme = useTheme();

  const checked = status === 'checked';
  const indeterminate = status === 'indeterminate';

  const getBorderColor = () => {
    if (disabled) return theme.color02; // Disabled/muted color
    return checked || indeterminate
      ? theme.color9 // Primary color
      : theme.borderColor;
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.color02; // Disabled background
    return checked || indeterminate ? theme.color9 : 'transparent'; // Primary color
  };

  const getCheckmarkColor = () => {
    if (disabled) return theme.color02; // Disabled text
    return theme.background; // Light color on primary background
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
        gap: 8,
      }}
    >
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={{
          width: 20,
          height: 20,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: getCheckmarkColor(),
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          {indeterminate ? '−' : checked ? '✓' : ''}
        </Text>
      </Pressable>
      {label ? (
        <Text
          style={{
            color: disabled ? theme.color02 : theme.color,
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
};

export default Checkbox;
