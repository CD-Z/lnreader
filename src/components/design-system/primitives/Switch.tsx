import React from 'react';
import { Switch as RNSwitch, View, Text } from 'react-native';

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
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
      {label ? <Text style={{ marginLeft: 8 }}>{label}</Text> : null}
    </View>
  );
};

export default Switch;
