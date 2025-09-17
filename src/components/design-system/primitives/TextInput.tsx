import React from 'react';
import { Input, Label, XStack, YStack, styled, Text } from 'tamagui';
import { TextInputProps as RNTextInputProps } from 'react-native';

type Mode = 'flat' | 'outlined';

export interface TextInputProps extends Omit<RNTextInputProps, 'onChange'> {
  label?: string;
  mode?: Mode;
  helperText?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  error?: boolean;
}

const Container = styled(YStack, {
  gap: '$2',
});

const Field = styled(XStack, {
  alignItems: 'center',
  borderRadius: 6,
  backgroundColor: '$surface',
  borderWidth: 1,
  borderColor: 'transparent',
  paddingHorizontal: '$3',
});

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
  const borderColor = error
    ? '$error'
    : mode === 'outlined'
    ? '$outline'
    : 'transparent';
  const bg = mode === 'flat' ? 'transparent' : '$surface';
  const opacity = editable ? 1 : 0.6;

  return (
    <Container>
      {label ? <Label>{label}</Label> : null}
      <Field
        backgroundColor={bg}
        borderColor={borderColor}
        style={[{ opacity }, style]}
      >
        {left}
        <Input
          unstyled
          flex={1}
          paddingVertical={'$3'}
          {...(inputProps as any)}
        />
        {right}
      </Field>
      {helperText ? (
        <Text color={error ? '$error' : '$outline'} fontSize={12}>
          {helperText}
        </Text>
      ) : null}
    </Container>
  );
};

export default TextInput;
