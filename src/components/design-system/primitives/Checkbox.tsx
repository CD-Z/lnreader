import React from 'react';
import { View, Text } from 'react-native';

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
  const checked = status === 'checked';
  const indeterminate = status === 'indeterminate';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        onTouchEnd={onPress}
        style={{
          width: 20,
          height: 20,
          borderRadius: 3,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text>{indeterminate ? '–' : checked ? '✓' : ''}</Text>
      </View>
      {label ? <Text style={{ marginLeft: 8 }}>{label}</Text> : null}
    </View>
  );
};

export default Checkbox;
