import React from 'react';
import { View, Text } from 'react-native';

export interface RadioButtonProps {
  value: string;
  label?: string;
  disabled?: boolean;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  value,
  label,
  disabled,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 10, height: 10, borderRadius: 5 }} />
      </View>
      {label ? <Text style={{ marginLeft: 8 }}>{label}</Text> : null}
    </View>
  );
};

export interface RadioButtonGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({
  value,
  onValueChange,
  children,
}) => {
  return <View>{children}</View>;
};

export default RadioButton;
