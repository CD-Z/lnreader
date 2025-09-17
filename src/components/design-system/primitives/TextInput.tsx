import React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Text,
} from 'react-native';

type Mode = 'flat' | 'outlined';

export interface TextInputProps extends Omit<RNTextInputProps, 'onChange'> {
  label?: string;
  mode?: Mode;
  helperText?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  error?: boolean;
}

const Container = View as any;
const Field = View as any;

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
    ? '#B00020'
    : mode === 'outlined'
    ? '#9E9E9E'
    : 'transparent';
  const bg = mode === 'flat' ? 'transparent' : 'transparent';
  const opacity = editable ? 1 : 0.6;

  return (
    <Container style={{ gap: 8 }}>
      {label ? <Text>{label}</Text> : null}
      <Field
        style={[
          {
            opacity,
            backgroundColor: bg,
            borderColor,
            borderWidth: 1,
            borderRadius: 6,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
          },
          style,
        ]}
      >
        {left}
        <RNTextInput
          style={{ flex: 1, paddingVertical: 12 }}
          {...(inputProps as any)}
        />
        {right}
      </Field>
      {helperText ? (
        <Text style={{ color: error ? '#B00020' : '#9E9E9E', fontSize: 12 }}>
          {helperText}
        </Text>
      ) : null}
    </Container>
  );
};

export default TextInput;
