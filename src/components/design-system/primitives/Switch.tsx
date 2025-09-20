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
          false: theme.color02 as unknown as string,
          true: theme.color9 as unknown as string,
        }}
        thumbColor={
          value
            ? (theme.background as unknown as string)
            : (theme.borderColor as unknown as string)
        }
      />
      {label ? (
        <Text
          style={{
            color: disabled
              ? (theme.color02 as unknown as string)
              : (theme.color as unknown as string),
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
};

export default Switch;
