import React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
} from 'react-native';
import { Text, useTheme, YStack } from 'tamagui';

type Mode = 'flat' | 'outlined';

export interface TextInputProps extends Omit<RNTextInputProps, 'onChange'> {
  label?: string;
  mode?: Mode;
  helperText?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  error?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  mode = 'outlined',
  helperText,
  left,
  right,
  error,
  editable = true,
  style,
  ...inputProps
}) => {
  const theme = useTheme();

  const getBorderColor = () => {
    if (error) return theme.error?.toString() || '#B00020';
    if (mode === 'outlined') return theme.outline?.toString() || '#9E9E9E';
    return 'transparent';
  };

  const getHelperTextColor = () => {
    return error
      ? theme.error?.toString() || '#B00020'
      : theme.onSurfaceVariant?.toString() || '#9E9E9E';
  };

  const containerOpacity = editable ? 1 : 0.6;

  return (
    <YStack style={{ gap: 8, opacity: containerOpacity }}>
      {label ? (
        <Text
          style={{ color: theme.onSurface?.toString() }}
          fontSize={16}
          fontWeight="400"
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          {
            backgroundColor: 'transparent',
            borderColor: getBorderColor(),
            borderWidth: mode === 'outlined' ? 1 : 0,
            borderRadius: 6,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 48,
          },
          style,
        ]}
      >
        {left}
        <RNTextInput
          style={{
            flex: 1,
            paddingVertical: 12,
            color: theme.onSurface?.toString(),
            fontSize: 16,
          }}
          placeholderTextColor={theme.onSurfaceVariant?.toString()}
          {...(inputProps as any)}
        />
        {right}
      </View>
      {helperText ? (
        <Text style={{ color: getHelperTextColor() }} fontSize={12}>
          {helperText}
        </Text>
      ) : null}
    </YStack>
  );
};

export default TextInput;
