import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'tamagui';

export interface RadioButtonProps {
  value: string;
  label?: string;
  disabled?: boolean;
  selected?: boolean;
  onPress?: () => void;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  value: _value,
  label,
  disabled,
  selected = false,
  onPress,
}) => {
  const theme = useTheme();

  const getBorderColor = () => {
    if (disabled) return theme.color02 as unknown as string;
    return selected ? theme.color9 as unknown as string : theme.borderColor as unknown as string;
  };

  const getDotColor = () => {
    if (disabled) return theme.color02 as unknown as string;
    return selected ? theme.color9 as unknown as string : 'transparent';
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
        paddingVertical: 4,
        gap: 8,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: getBorderColor(),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: getDotColor(),
          }}
        />
      </View>
      {label ? (
        <Text
          style={{
            color: disabled ? theme.color02 as unknown as string : theme.color as unknown as string,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
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
  // Clone children and add selected/onPress props
  const enhancedChildren = React.Children.map(children, child => {
    if (
      React.isValidElement<RadioButtonProps>(child) &&
      child.type === RadioButton
    ) {
      return React.cloneElement(child, {
        selected: child.props.value === value,
        onPress: () => onValueChange(child.props.value),
      } as Partial<RadioButtonProps>);
    }
    return child;
  });

  return <View>{enhancedChildren}</View>;
};

export default RadioButton;
