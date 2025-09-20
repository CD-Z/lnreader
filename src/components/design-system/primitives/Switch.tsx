import React from 'react';
import { Switch as RNSwitch, View } from 'react-native';
import { Text, useTheme } from 'tamagui';

export interface SwitchProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled,
  label,
}) => {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
        gap: 8,
      }}
    >
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.color02,
          true: theme.color9,
        }}
        thumbColor={value ? theme.background : theme.borderColor}
      />
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

export default Switch;
