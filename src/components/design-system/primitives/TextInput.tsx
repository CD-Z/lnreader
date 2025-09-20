import React from 'react';
import {
  GetProps,
  Input,
  SizeTokens,
  Text,
  YStack,
  createStyledContext,
  styled,
  withStaticProperties,
} from 'tamagui';
import { TextInputProps as RNTextInputProps } from 'react-native';

type Mode = 'flat' | 'outlined';

export const TextInputContext = createStyledContext({
  size: '$md' as SizeTokens,
  mode: 'outlined' as Mode,
  error: false,
  editable: true,
});

export const TextInputFrame = styled(YStack, {
  name: 'TextInput',
  context: TextInputContext,

  gap: '$2',

  variants: {
    editable: {
      true: {
        opacity: 1,
      },
      false: {
        opacity: 0.6,
      },
    },
  } as const,

  defaultVariants: {
    editable: true,
  },
});

export const TextInputLabel = styled(Text, {
  name: 'TextInputLabel',
  context: TextInputContext,

  color: '$color',
  fontWeight: '400',

  variants: {
    size: {
      '...fontSize': (name, { font }) => ({
        fontSize: font?.size[name],
      }),
    },
  } as const,

  defaultVariants: {
    size: '$md',
  },
});

export const TextInputInputFrame = styled(YStack, {
  name: 'TextInputInputFrame',
  context: TextInputContext,

  position: 'relative',

  variants: {
    mode: {
      outlined: {},
      flat: {},
    },
  } as const,

  defaultVariants: {
    mode: 'outlined',
  },
});

export const TextInputInput = styled(Input, {
  name: 'TextInputInput',
  context: TextInputContext,

  color: '$color',
  placeholderTextColor: '$color02',
  borderRadius: '$2',
  minHeight: 48,

  variants: {
    mode: {
      outlined: {
        borderWidth: 1,
        borderColor: '$borderColor',
        backgroundColor: 'transparent',
      },
      flat: {
        borderWidth: 0,
        backgroundColor: '$background',
      },
    },
    error: {
      true: {
        borderColor: '$color5',
      },
      false: {},
    },
    size: {
      '...fontSize': (name, { font }) => ({
        fontSize: font?.size[name],
      }),
    },
  } as const,

  defaultVariants: {
    mode: 'outlined',
    error: false,
    size: '$md',
  },
});

export const TextInputHelper = styled(Text, {
  name: 'TextInputHelper',
  context: TextInputContext,

  fontSize: '$3',

  variants: {
    error: {
      true: {
        color: '$color5',
      },
      false: {
        color: '$color02',
      },
    },
  } as const,

  defaultVariants: {
    error: false,
  },
});

const TextInputAdornment = styled(YStack, {
  name: 'TextInputAdornment',
  context: TextInputContext,

  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
});

type TextInputProps = GetProps<typeof TextInputFrame> & {
  label?: string;
  helperText?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

const TextInputComponent = TextInputFrame.styleable<TextInputProps>(
  (
    {
      label,
      helperText,
      left,
      right,
      mode = 'outlined',
      error = false,
      editable = true,
      ...props
    },
    ref,
  ) => {
    return (
      <TextInputFrame ref={ref} editable={editable} {...props}>
        {label && <TextInputLabel>{label}</TextInputLabel>}

        <TextInputInputFrame mode={mode as Mode}>
          {left && (
            <TextInputAdornment style={{ left: 12 }}>{left}</TextInputAdornment>
          )}

          <TextInputInput
            {...(props as any)}
            mode={mode}
            error={error}
            editable={editable}
            paddingLeft={left ? '$8' : '$3'}
            paddingRight={right ? '$8' : '$3'}
          />

          {right && (
            <TextInputAdornment style={{ right: 12 }}>
              {right}
            </TextInputAdornment>
          )}
        </TextInputInputFrame>

        {helperText && (
          <TextInputHelper error={error as boolean}>
            {helperText}
          </TextInputHelper>
        )}
      </TextInputFrame>
    );
  },
);

export const TextInput = withStaticProperties(TextInputComponent, {
  Props: TextInputContext.Provider,
  Label: TextInputLabel,
  Input: TextInputInput,
  Helper: TextInputHelper,
  Adornment: TextInputAdornment,
});

export default TextInput;
